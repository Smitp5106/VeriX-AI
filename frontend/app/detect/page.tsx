"use client";

import { useState, useEffect } from "react";
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
  Newspaper,
  Loader2,
  ArrowRight,
  Shield,
  Zap,
  Globe,
  Upload,
  Image as ImageIcon,
  Trash2,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/utils";
import Link from "next/link";

type ContentType = "headline" | "article" | "image";

const validateInputClaim = (text: string): { valid: boolean; message?: string } => {
  const trimmed = text.trim();
  
  // 1. Length check: at least 15 characters and 3 words
  if (trimmed.length < 15) {
    return {
      valid: false,
      message: "Enter proper input: Please enter a statement of at least 15 characters."
    };
  }
  
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length < 3) {
    return {
      valid: false,
      message: "Enter proper input: Your text must contain at least 3 words to analyze."
    };
  }

  // 2. Conversational/Greeting check
  const lower = trimmed.toLowerCase();
  const greetings = /^(hello|hi|hey|greetings|good morning|good afternoon|good evening|howdy|sup|yo|testing|test|ok|okay|yes|no|thank you|thanks|bye|goodbye|welcome)\b/i;
  if (greetings.test(lower)) {
    return {
      valid: false,
      message: "Enter proper input: Greetings, simple test messages, and conversational text are not verifiable news claims."
    };
  }

  const conversational = /^(how are you|what is this|who are you|what is your name|where are you|tell me a joke|write a story|can you help me|who is this|what is that|why is that)\??$/i;
  if (conversational.test(lower)) {
    return {
      valid: false,
      message: "Enter proper input: Conversational questions cannot be analyzed as news claims."
    };
  }

  // 3. Simple personal/subjective statements check (e.g. "Smit is a boy")
  const simplePatterns = [
    /^(i|you|he|she|it|we|they)\s+(am|is|are|was|were)\s+(a|an|the|my|your|his|her|its|our|their)?\s*([a-zA-Z]+)(\s+[a-zA-Z]+)?\.?$/i,
    /^[a-zA-Z]+\s+(is|was)\s+(a|an|the|my|your|his|her|its|our|their|very)?\s*([a-zA-Z]+)(\s+[a-zA-Z]+)?\.?$/i
  ];

  for (const pattern of simplePatterns) {
    if (pattern.test(lower) && trimmed.length < 30) {
      return {
        valid: false,
        message: "Enter proper input: Simple personal statements like this cannot be verified as news claims."
      };
    }
  }

  // 4. Gibberish check: must contain vowels in english words
  const lettersOnly = trimmed.replace(/[^a-zA-Z]/g, "");
  if (lettersOnly.length > 0 && !/[aeiouy]/i.test(lettersOnly)) {
    return {
      valid: false,
      message: "Enter proper input: Please enter a valid english statement."
    };
  }

  return { valid: true };
};

export default function DetectPage() {
  const router = useRouter();
  const [contentType, setContentType] = useState<ContentType>("headline");
  const [content, setContent] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Image Upload and OCR State
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Reset states on tab change
  useEffect(() => {
    setContent("");
    setImageFile(null);
    setImagePreview(null);
    setOcrProgress(0);
    setIsExtracting(false);
    setError(null);
  }, [contentType]);
  
  // Guest and User State
  const [guestTries, setGuestTries] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");
    
    if (token && storedUser) {
      setIsLoggedIn(true);
      fetchHistory(token);
    } else {
      setIsLoggedIn(false);
      // Track guest tries
      const tries = localStorage.getItem("verix_guest_tries");
      if (tries) {
        setGuestTries(parseInt(tries, 10));
      } else {
        localStorage.setItem("verix_guest_tries", "0");
        setGuestTries(0);
      }
    }
  }, []);

  const fetchHistory = async (token: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${API_URL}/api/detect/history`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    
    const validation = validateInputClaim(content);
    if (!validation.valid) {
      setError(validation.message || "Enter proper input.");
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      const headers: Record<string, string> = {
        "Content-Type": "application/json"
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_URL}/api/detect/analyze`, {
        method: "POST",
        headers,
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

      // Increment guest tries if not logged in
      if (!token) {
        const nextTries = guestTries + 1;
        localStorage.setItem("verix_guest_tries", nextTries.toString());
        setGuestTries(nextTries);
      }
      
      router.push("/result");
    } catch (err: any) {
      console.error("Analysis error:", err);
      setError(err.message || "An error occurred during analysis. Please try again.");
      setIsAnalyzing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        runOcr(file);
      } else {
        setError("Only image files (PNG, JPG, WEBP) are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      runOcr(file);
    }
  };

  const runOcr = async (file: File) => {
    setIsExtracting(true);
    setOcrProgress(0);
    setError(null);
    setContent("");
    try {
      const Tesseract = (await import("tesseract.js")).default;
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            setOcrProgress(Math.floor(m.progress * 100));
          }
        },
      });
      const extractedText = result.data.text.trim();
      if (!extractedText) {
        throw new Error("No readable text was found in the image. Please upload a clear image of a headline or article.");
      }
      setContent(extractedText);
    } catch (err: any) {
      console.error("OCR Error:", err);
      setError(err.message || "Failed to extract text from the image.");
    } finally {
      setIsExtracting(false);
    }
  };

  const contentTypes = [
    { id: "headline" as const, label: "News Headline", icon: Newspaper, placeholder: "Enter a news headline to verify..." },
    { id: "article" as const, label: "Full Article", icon: FileText, placeholder: "Paste the full article text here..." },
    { id: "image" as const, label: "Upload Image", icon: ImageIcon, placeholder: "Upload an image containing news text..." },
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
            <div className="p-8 rounded-2xl bg-card border border-border relative overflow-hidden">
              {/* Guest Limit Overlay */}
              {!isLoggedIn && guestTries >= 3 && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 transition-all duration-300">
                  <div className="p-4 rounded-full bg-destructive/10 text-destructive mb-4">
                    <Shield className="w-10 h-10" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">Guest Limit Reached</h3>
                  <p className="text-muted-foreground max-w-md mb-6 text-sm leading-relaxed">
                    You have used your 3 free guest analyses. Sign up or log in to get unlimited verification attempts and save your analysis history.
                  </p>
                  <div className="flex gap-4">
                    <Link href="/signup">
                      <Button className="bg-foreground hover:bg-foreground/90 text-background rounded-full px-6 h-11">
                        Get Unlimited Access
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" className="rounded-full px-6 h-11">
                        Sign In
                      </Button>
                    </Link>
                  </div>
                </div>
              )}

              {contentType === "image" ? (
                <div className="space-y-6">
                  {!imagePreview ? (
                    <div
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      className={`relative flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-2xl transition-all duration-300 ${
                        dragActive
                          ? "border-foreground bg-foreground/5 scale-[1.01]"
                          : "border-border hover:border-foreground/50 hover:bg-card/50"
                      }`}
                    >
                      <input
                        type="file"
                        id="image-upload"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={!isLoggedIn && guestTries >= 3}
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center cursor-pointer text-center"
                      >
                        <div className="p-4 rounded-full bg-foreground/5 mb-4 transition-transform duration-300">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <span className="text-lg font-medium mb-1">
                          Drag & drop news image here
                        </span>
                        <span className="text-sm text-muted-foreground mb-4">
                          or click to browse from device
                        </span>
                        <span className="text-xs text-muted-foreground/60 border border-border/50 px-3 py-1 rounded-full">
                          Supports PNG, JPG, WEBP
                        </span>
                      </label>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Image Preview Panel */}
                      <div className="relative rounded-2xl overflow-hidden border border-border bg-card flex flex-col items-center justify-center p-4 min-h-[200px]">
                        <img
                          src={imagePreview}
                          alt="Uploaded news source"
                          className="max-h-[220px] rounded-xl object-contain shadow-md"
                        />
                        <button
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                            setContent("");
                            setOcrProgress(0);
                            setError(null);
                          }}
                          className="absolute top-4 right-4 p-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-full transition-colors duration-200"
                          title="Remove image"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Extracted Text Panel */}
                      <div className="flex flex-col h-full justify-between">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold tracking-wide uppercase text-muted-foreground flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
                              Extracted Text
                            </span>
                            {isExtracting && (
                              <span className="text-xs text-muted-foreground font-mono">
                                Scanning... {ocrProgress}%
                              </span>
                            )}
                          </div>

                          {isExtracting ? (
                            <div className="flex flex-col items-center justify-center min-h-[140px] bg-muted/20 border border-border rounded-xl p-6">
                              <Loader2 className="w-8 h-8 animate-spin mb-3 text-muted-foreground" />
                              <div className="w-full max-w-[150px] h-1 bg-muted rounded-full overflow-hidden mb-2">
                                <div
                                  className="h-full bg-foreground transition-all duration-300"
                                  style={{ width: `${ocrProgress}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">
                                Extracting text from image...
                              </span>
                            </div>
                          ) : (
                            <Textarea
                              id="content"
                              value={content}
                              onChange={(e) => setContent(e.target.value)}
                              placeholder="Text extracted from image will appear here. You can edit it if needed."
                              className="min-h-[140px] text-base rounded-xl resize-none"
                              disabled={!isLoggedIn && guestTries >= 3}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
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
                      disabled={!isLoggedIn && guestTries >= 3}
                    />
                  ) : (
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={currentType.placeholder}
                      className="min-h-[200px] text-base rounded-xl resize-none"
                      disabled={!isLoggedIn && guestTries >= 3}
                    />
                  )}
                </>
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
                  disabled={(!isLoggedIn && guestTries >= 3) || !content.trim() || isAnalyzing || isExtracting}
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

            {/* User History List */}
            {isLoggedIn && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
                className="mt-8 p-6 rounded-2xl bg-card border border-border"
              >
                <div className="flex items-center justify-between mb-4 border-b border-border/50 pb-3">
                  <div className="flex items-center gap-2">
                    <Scan className="w-5 h-5 text-muted-foreground" />
                    <h3 className="font-semibold text-lg font-mono text-sm tracking-wider uppercase text-muted-foreground">Verification History</h3>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    {history.length} Saved {history.length === 1 ? "Analysis" : "Analyses"}
                  </span>
                </div>

                {isLoadingHistory ? (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    <span className="text-sm text-muted-foreground font-mono">Loading history...</span>
                  </div>
                ) : history.length > 0 ? (
                  <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                    {history.map((item) => {
                      const isFake = item.result?.isFake;
                      const prediction = item.result?.prediction || "Unknown";
                      const confidence = item.result?.confidence || 0;
                      const dateStr = new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      });

                      return (
                        <div
                          key={item._id}
                          className="p-4 rounded-xl border border-border/40 hover:border-border/80 bg-muted/20 hover:bg-muted/40 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 group"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-foreground/90 font-medium line-clamp-1 mb-1 group-hover:text-foreground transition-colors">
                              {item.content}
                            </p>
                            <span className="text-xs text-muted-foreground font-mono">{dateStr}</span>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[10px] px-2.5 py-1 rounded-full font-mono font-bold tracking-wider border ${
                              isFake 
                                ? "bg-destructive/10 text-destructive border-destructive/20" 
                                : "bg-success/10 text-success border-success/20"
                            }`}>
                              {prediction.replace(/LIKELY\s+|UNCERTAIN\s+—\s+POSSIBLE\s+/g, '')} ({confidence}%)
                            </span>
                            <Button
                              onClick={() => {
                                localStorage.setItem("verix_analysis_content", item.content);
                                localStorage.setItem("verix_analysis_type", "article");
                                localStorage.setItem("verix_analysis_result", JSON.stringify(item.result));
                                router.push("/result");
                              }}
                              variant="ghost"
                              size="sm"
                              className="rounded-full hover:bg-foreground hover:text-background h-8 transition-all duration-300"
                            >
                              View Result
                              <ArrowRight className="w-3.5 h-3.5 ml-1" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-border/80 rounded-xl">
                    <p className="text-sm text-muted-foreground">You haven't analyzed any content yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">Your past verifications will appear here.</p>
                  </div>
                )}
              </motion.div>
            )}
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
