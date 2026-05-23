"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Eye, EyeOff, ArrowRight, Github, Chrome } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { API_URL } from "@/lib/utils";


export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
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
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Invalid credentials");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      toast.success("Successfully logged in!");
      router.push("/");
    } catch (err: any) {
      toast.error(err.message || "Incorrect email or password");
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
          <Link href="/" className="flex items-center gap-2">
            <Shield className="w-8 h-8 text-background" />
            <span className="text-2xl font-bold text-background">
              VeriX<span className="text-background/70 font-normal">AI</span>
            </span>
          </Link>
          
          <div className="space-y-6">
            <h1 className="text-5xl font-bold text-background leading-tight">
              Protect yourself from misinformation
            </h1>
            <p className="text-xl text-background/70">
              Join millions of users who trust VeriX AI to verify information and stay informed.
            </p>
          </div>
          
          <div className="flex items-center gap-8">
            <div>
              <div className="text-3xl font-bold text-background">99.2%</div>
              <div className="text-background/60">Accuracy</div>
            </div>
            <div className="w-px h-12 bg-background/20" />
            <div>
              <div className="text-3xl font-bold text-background">50M+</div>
              <div className="text-background/60">Analyses</div>
            </div>
            <div className="w-px h-12 bg-background/20" />
            <div>
              <div className="text-3xl font-bold text-background">2M+</div>
              <div className="text-background/60">Users</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Shield className="w-8 h-8" />
            <span className="text-2xl font-bold">
              VeriX<span className="text-muted-foreground font-normal">AI</span>
            </span>
          </div>
          
          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
              <p className="text-muted-foreground">
                Sign in to your account to continue
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
            
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
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
              </div>
              
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-xl bg-foreground hover:bg-foreground/90 text-background"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
            
            <p className="text-center text-muted-foreground">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-foreground hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
