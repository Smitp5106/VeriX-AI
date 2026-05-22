"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Navigation } from "@/components/verix/navigation";
import { Footer } from "@/components/verix/footer";
import { 
  Scan, 
  FileText, 
  MessageSquare, 
  Newspaper,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
  Globe
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/utils";

type ContentType = "headline" | "article" | "social";

export default function DetectPage() {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>("headline");
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const res = await fetch(`${API_URL}/api/detect/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || "Analysis failed");
      }
      
      // Store content, type, and result
      localStorage.setItem("verix_analysis_content", content);
      localStorage.setItem("verix_analysis_type", contentType);
      localStorage.setItem("verix_analysis_result", JSON.stringify(data));
      
      router.push("/result");
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "An error occurred during analysis. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const contentTypes = [
    { id: "headline" as const, label: "News Headline", icon: Newspaper, placeholder: "Enter a news headline to verify..." },
    { id: "article" as const, label: "Full Article", icon: FileText, placeholder: "Paste the full article text here..." },
    { id: "social" as const, label: "Social Media Post", icon: MessageSquare, placeholder: "Paste a social media post or tweet..." },
  ];

  const currentType = contentTypes.find(t => t.id === contentType)!;

  return (
    <main className="min-h-screen flex flex-col">
      <Navigation />
      
      <div className="flex-1 pt-32 pb-20 lg:pt-40 lg:pb-32 relative">
        {/* Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        
        <div className="relative max-w-[800px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm font-medium mb-6">
              <Scan className="w-4 h-4" />
              AI-Powered Analysis
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold mb-4">
              Detect Misinformation
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Enter any news content and our AI will analyze it for authenticity, 
              providing detailed insights and confidence scores.
            </p>
          </motion.div>
          
          {/* Content Type Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex justify-center gap-2 mb-8"
          >
            {contentTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setContentType(type.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  contentType === type.id
                    ? "bg-foreground text-background"
                    : "bg-card border border-border hover:bg-accent"
                }`}
              >
                <type.icon className="w-4 h-4" />
                {type.label}
              </button>
            ))}
          </motion.div>
          
          {/* Input Area */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
          >
            <div className="p-8 rounded-2xl bg-card border border-border">
              <Label htmlFor="content" className="text-lg font-medium mb-4 block">
                {currentType.label}
              </Label>
              
              {contentType === "headline" ? (
                <Input
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={currentType.placeholder}
                  className="h-14 text-lg rounded-xl"
                />
              ) : (
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={currentType.placeholder}
                  className="min-h-[200px] text-base rounded-xl resize-none"
                />
              )}

              {error && (
                <div className="mt-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                  {error}
                </div>
              )}
              
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  {content.length > 0 && (
                    <span>{content.split(/\s+/).filter(Boolean).length} words</span>
                  )}
                </div>
                
                <Button
                  onClick={handleAnalyze}
                  disabled={!content.trim() || isAnalyzing}
                  className="bg-foreground hover:bg-foreground/90 text-background rounded-full px-8 h-12"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Content
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {/* Processing Animation */}
            <AnimatePresence>
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="p-8 rounded-2xl bg-card border border-border"
                >
                  <div className="text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      {/* Outer ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-foreground/10" />
                      {/* Spinning ring */}
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-foreground animate-spin" />
                      {/* Center icon */}
                      <div className="absolute inset-4 rounded-full bg-foreground/5 flex items-center justify-center">
                        <Scan className="w-8 h-8" />
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2">Analyzing Content</h3>
                    <p className="text-muted-foreground mb-6">
                      Our AI is processing your content...
                    </p>
                    
                    <div className="space-y-3">
                      {[
                        { label: "Parsing text structure", done: true },
                        { label: "Analyzing linguistic patterns", done: true },
                        { label: "Cross-referencing sources", done: false },
                        { label: "Generating confidence score", done: false },
                      ].map((step, i) => (
                        <motion.div
                          key={step.label}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.5 }}
                          className="flex items-center gap-3 justify-center text-sm"
                        >
                          {step.done ? (
                            <div className="w-5 h-5 rounded-full bg-foreground flex items-center justify-center">
                              <svg className="w-3 h-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                          )}
                          <span className={step.done ? "text-foreground" : "text-muted-foreground"}>
                            {step.label}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          
          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 grid md:grid-cols-3 gap-6"
          >
            {[
              { icon: Shield, title: "99.2% Accuracy", description: "Industry-leading detection precision" },
              { icon: Zap, title: "Instant Results", description: "Analysis in under 1 second" },
              { icon: Globe, title: "150+ Languages", description: "Multilingual support" },
            ].map((feature, i) => (
              <div key={feature.title} className="text-center p-6 rounded-xl bg-card border border-border">
                <feature.icon className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
