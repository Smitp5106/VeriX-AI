"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, Eye, EyeOff, ArrowRight, Github, Chrome, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";


const features = [
  "99.2% detection accuracy",
  "100 free analyses per month",
  "Real-time results",
  "Multi-language support",
];

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Load Google Client SDK
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      // Clean up script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Listen to OAuth popups messages (retained for GitHub mock-oauth)
  useEffect(() => {
    const handleOAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "OAUTH_SUCCESS") {
        const { email, firstName, lastName, provider } = event.data;
        setIsLoading(true);

        try {
          const res = await fetch(`${API_URL}/api/auth/social-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, firstName, lastName, provider })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || "Failed to log in with social account");

          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          toast.success(`Successfully signed in with ${provider === "google" ? "Google" : "GitHub"}!`);
          router.push("/");
        } catch (err: any) {
          toast.error(err.message || "Social login failed");
        } finally {
          setIsLoading(false);
        }
      }
    };

    window.addEventListener("message", handleOAuthMessage);
    return () => window.removeEventListener("message", handleOAuthMessage);
  }, [router]);

  const handleSocialAuth = (provider: "google" | "github") => {
    if (!agreed) {
      toast.warning("Please agree to the Terms and Privacy Policy first");
      return;
    }

    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const isGoogleConfigured = googleClientId && googleClientId !== "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";

    if (provider === "google" && isGoogleConfigured) {
      if (typeof window !== "undefined" && (window as any).google) {
        setIsLoading(true);
        try {
          const client = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: googleClientId,
            scope: "openid email profile",
            callback: async (tokenResponse: any) => {
              if (tokenResponse && tokenResponse.access_token) {
                try {
                  const res = await fetch(`${API_URL}/api/auth/google-login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ accessToken: tokenResponse.access_token })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || "Failed to authenticate with Google");

                  localStorage.setItem("token", data.token);
                  localStorage.setItem("user", JSON.stringify(data.user));

                  toast.success("Successfully logged in with Google!");
                  router.push("/");
                } catch (err: any) {
                  toast.error(err.message || "Google login failed");
                } finally {
                  setIsLoading(false);
                }
              } else {
                setIsLoading(false);
                toast.error("Google authentication cancelled or failed");
              }
            },
            error_callback: (err: any) => {
              setIsLoading(false);
              toast.error("Google login error: " + (err.message || "Unknown error"));
            }
          });
          client.requestAccessToken();
        } catch (err: any) {
          setIsLoading(false);
          toast.error("Failed to initialize Google login client");
        }
      } else {
        toast.error("Google Identity Services script not loaded. Please wait a moment and try again.");
      }
    } else {
      const width = 500;
      const height = 650;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;
      window.open(
        `/auth/mock-oauth?provider=${provider}`,
        "oauth_popup",
        `width=${width},height=${height},top=${top},left=${left}`
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Signup failed");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Account created successfully!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center">
            {/* Light Mode container (renders on dark background) -> logo-icon-dark */}
            <Image
              src="/logo-icon-dark-v2.png"
              alt="VeriX AI Logo"
              width={69}
              height={56}
              className="w-[69px] h-[56px] object-contain dark:hidden"
            />
            {/* Dark Mode container (renders on light background) -> logo-icon-light */}
            <Image
              src="/logo-icon-light-v2.png"
              alt="VeriX AI Logo"
              width={69}
              height={56}
              className="w-[69px] h-[56px] object-contain hidden dark:block"
            />
          </Link>
          
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl font-bold text-background leading-tight">
                Start verifying content today
              </h1>
              <p className="text-xl text-background/70">
                Create your free account and get instant access to our AI-powered detection tools.
              </p>
            </div>
            
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-background/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-background" />
                  </div>
                  <span className="text-background/90">{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
          
          <div className="text-background/50 text-sm">
            Trusted by researchers, journalists, and millions of users worldwide.
          </div>
        </div>
      </div>
      
      {/* Right side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center mb-8">
            {/* Light Mode (renders on light background) -> logo-icon-light */}
            <Image
              src="/logo-icon-light-v2.png"
              alt="VeriX AI Logo"
              width={49}
              height={40}
              className="w-[49px] h-[40px] object-contain dark:hidden"
            />
            {/* Dark Mode (renders on dark background) -> logo-icon-dark */}
            <Image
              src="/logo-icon-dark-v2.png"
              alt="VeriX AI Logo"
              width={49}
              height={40}
              className="w-[49px] h-[40px] object-contain hidden dark:block"
            />
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Create an account</h2>
              <p className="text-muted-foreground">
                Get started with your free account
              </p>
            </div>
            
            {/* Social Login */}
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline" 
                onClick={() => handleSocialAuth("github")}
                className="h-12 rounded-xl"
              >
                <Github className="w-5 h-5 mr-2" />
                GitHub
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleSocialAuth("google")}
                className="h-12 rounded-xl"
              >
                <Chrome className="w-5 h-5 mr-2" />
                Google
              </Button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">
                  or continue with email
                </span>
              </div>
            </div>
            
            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First name</Label>
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last name</Label>
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="h-12 rounded-xl"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 rounded-xl pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Must be at least 8 characters.
                </p>
              </div>
              
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  className="mt-1"
                />
                <Label htmlFor="terms" className="text-sm text-muted-foreground leading-relaxed cursor-pointer">
                  I agree to the{" "}
                  <Link href="/terms" className="text-foreground hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-foreground hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>
              
              <Button
                type="submit"
                disabled={isLoading || !agreed}
                className="w-full h-12 rounded-xl bg-foreground hover:bg-foreground/90 text-background disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
            
            <p className="text-center text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-foreground hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
