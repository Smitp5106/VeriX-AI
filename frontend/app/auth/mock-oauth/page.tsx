"use client";

import { useSearchParams } from "next/navigation";
import { Shield, Github, Chrome, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Suspense, useState } from "react";

function MockOAuthContent() {
  const searchParams = useSearchParams();
  const provider = searchParams.get("provider") || "google";
  const isGoogle = provider === "google";
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const handleSelectMockUser = (mockEmail: string, mockName: string) => {
    const [firstName, lastName] = mockName.split(" ");
    if (window.opener) {
      window.opener.postMessage(
        {
          type: "OAUTH_SUCCESS",
          email: mockEmail,
          firstName,
          lastName,
          provider
        },
        window.location.origin
      );
      window.close();
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !name) {
      setError("Please fill out all fields");
      return;
    }
    const [firstName, lastName] = name.split(" ");
    handleSelectMockUser(email, lastName ? name : `${firstName} User`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col justify-between p-6">
      {/* Header */}
      <div className="flex flex-col items-center gap-4 text-center mt-4">
        {isGoogle ? (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
            <Chrome className="w-6 h-6 text-red-500" />
          </div>
        ) : (
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border border-border">
            <Github className="w-6 h-6 text-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-semibold">
            Sign in with {isGoogle ? "Google" : "GitHub"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            to continue to <span className="font-medium text-foreground">VeriX AI</span>
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="my-8 space-y-6 flex-1 max-w-sm mx-full w-full self-center">
        {/* Mock Accounts List */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Choose a mock account
          </p>
          
          <button
            onClick={() => handleSelectMockUser(`john.${provider}@example.com`, "John Doe")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/30 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              JD
            </div>
            <div>
              <p className="text-sm font-medium">John Doe</p>
              <p className="text-xs text-muted-foreground">john.{provider}@example.com</p>
            </div>
          </button>

          <button
            onClick={() => handleSelectMockUser(`jane.${provider}@example.com`, "Jane Smith")}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-accent-foreground/30 transition-all text-left"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
              JS
            </div>
            <div>
              <p className="text-sm font-medium">Jane Smith</p>
              <p className="text-xs text-muted-foreground">jane.{provider}@example.com</p>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-3 bg-background text-muted-foreground">
              Or use a custom mock profile
            </span>
          </div>
        </div>

        {/* Custom Mock User Form */}
        <form onSubmit={handleCustomSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Alice Cooper"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Email Address</label>
            <input
              type="email"
              placeholder="e.g. alice@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button type="submit" className="w-full h-10 rounded-lg">
            Authorize & Sign In
          </Button>
        </form>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <Shield className="w-3.5 h-3.5" />
          <span className="font-semibold">VeriX AI Secure Authorization</span>
        </div>
        <p>This is a simulated OAuth screen for testing local authentication.</p>
      </div>
    </div>
  );
}

export default function MockOAuthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <MockOAuthContent />
    </Suspense>
  );
}
