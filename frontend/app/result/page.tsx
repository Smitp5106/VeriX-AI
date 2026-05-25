"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Navigation } from "@/components/verix/navigation";
import { Footer } from "@/components/verix/footer";
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ArrowLeft,
  Share2,
  Download,
  ExternalLink,
  Brain,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface AnalysisResult {
  prediction: string;
  isFake: boolean;
  confidence: number;
  sentiment: {
    score: number;
    label: string;
  };
  trustScore: number;
  sourceCredibility: number;
  factors: Array<{
    label: string;
    type: "success" | "warning" | "error";
  }>;
  explanation: string;
  corroboration?: {
    available: boolean;
    searchSuccess: boolean;
    trustedSources: number;
    score: number;
    searchQuery: string;
    topMatches: Array<{
      title: string;
      source: string;
      trusted: boolean;
      link: string;
    }>;
    mlOverridden: boolean;
  };
}

export default function ResultPage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedContent = localStorage.getItem("verix_analysis_content");
    const storedResult = localStorage.getItem("verix_analysis_result");
    
    if (!storedContent || !storedResult) {
      router.replace("/detect");
      return;
    }
    
    setContent(storedContent);
    try {
      setResult(JSON.parse(storedResult));
    } catch (e) {
      console.error("Error parsing stored analysis result:", e);
      router.replace("/detect");
    }
  }, [router]);

  if (!mounted || !result) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
      </main>
    );
  }

  const getSentimentIcon = () => {
    if (result.sentiment.score > 0.3) return ThumbsUp;
    if (result.sentiment.score < -0.3) return ThumbsDown;
    return Minus;
  };
  const SentimentIcon = getSentimentIcon();

  return (
    <main className="min-h-screen">
      <Navigation />
      
      <div className="pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
          >
            <div>
              <Link 
                href="/detect" 
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Detection
              </Link>
              <h1 className="text-3xl lg:text-4xl font-bold">Analysis Result</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="rounded-full">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" className="rounded-full">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </motion.div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Result Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Prediction Card */}
              <div className={`p-8 rounded-2xl border ${
                result.isFake 
                  ? "bg-destructive/5 border-destructive/20" 
                  : "bg-success/5 border-success/20"
              }`}>
                <div className="flex items-start gap-6">
                  <div className={`p-4 rounded-2xl ${
                    result.isFake ? "bg-destructive/10" : "bg-success/10"
                  }`}>
                    {result.isFake ? (
                      <ShieldAlert className={`w-12 h-12 ${result.isFake ? "text-destructive" : "text-success"}`} />
                    ) : (
                      <ShieldCheck className="w-12 h-12 text-success" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`text-sm font-mono mb-2 ${
                      result.isFake ? "text-destructive" : "text-success"
                    }`}>
                      PREDICTION
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{result.prediction}</h2>
                    
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                        <div className="flex items-center gap-3">
                          <Progress value={result.confidence} className="w-32 h-2" />
                          <span className="font-bold">{result.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Analyzed Content */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="text-sm font-mono text-muted-foreground mb-3">ANALYZED CONTENT</h3>
                <p className="text-foreground/80 leading-relaxed line-clamp-4">
                  {content || "No content available"}
                </p>
              </div>
              
              {/* AI Explanation */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-5 h-5" />
                  <h3 className="font-semibold">AI Explanation</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {result.explanation}
                </p>
              </div>
              
              {/* Detection Factors */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold mb-4">Detection Factors</h3>
                <div className="space-y-3">
                  {result.factors.map((factor, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                    >
                      {factor.type === "success" && (
                        <CheckCircle className="w-5 h-5 text-success shrink-0" />
                      )}
                      {factor.type === "warning" && (
                        <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                      )}
                      {factor.type === "error" && (
                        <XCircle className="w-5 h-5 text-destructive shrink-0" />
                      )}
                      <span className="text-sm">{factor.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
            
            {/* Sidebar Scores */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-6"
            >
              {/* Scores Grid */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold mb-6">Detailed Scores</h3>
                
                <div className="space-y-6">
                  {/* Trust Score */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Trust Score</span>
                      <span className="font-bold">{result.trustScore}%</span>
                    </div>
                    <Progress value={result.trustScore} className="h-2" />
                  </div>
                  
                  {/* Source Credibility */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Source Credibility</span>
                      <span className="font-bold">{result.sourceCredibility}%</span>
                    </div>
                    <Progress value={result.sourceCredibility} className="h-2" />
                  </div>
                  
                  {/* Sentiment */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Sentiment</span>
                      <div className="flex items-center gap-2">
                        <SentimentIcon className="w-4 h-4" />
                        <span className="font-medium">{result.sentiment.label}</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-foreground transition-all duration-500"
                        style={{ 
                          width: `${(result.sentiment.score + 1) * 50}%`,
                          marginLeft: result.sentiment.score < 0 ? `${(result.sentiment.score + 1) * 50}%` : '50%',
                          marginRight: result.sentiment.score > 0 ? '0' : `${50 - (result.sentiment.score + 1) * 50}%`
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>Negative</span>
                      <span>Positive</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Related News */}
              <div className="p-6 rounded-2xl bg-card border border-border">
                <h3 className="font-semibold mb-4 font-mono text-sm tracking-wide text-muted-foreground">POSSIBLE REAL NEWS REFERENCES</h3>
                <div className="space-y-3">
                  {result.corroboration?.topMatches && result.corroboration.topMatches.length > 0 ? (
                    result.corroboration.topMatches.map((item, i) => (
                      <a
                        key={i}
                        href={item.link || "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-3 rounded-xl hover:bg-muted/50 transition-all duration-300 border border-border/40 hover:border-border group"
                      >
                        <div className="flex items-start gap-2.5">
                          <ExternalLink className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium mb-1 leading-snug text-foreground/90 group-hover:text-foreground transition-colors line-clamp-3">
                              {item.title}
                            </div>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-xs text-muted-foreground font-semibold">{item.source}</span>
                              {item.trusted && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-success/10 text-success border border-success/20 font-mono tracking-wider font-bold">
                                  TRUSTED
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground p-6 text-center border border-dashed border-border/80 rounded-xl">
                      No matching news references found in live searches.
                    </div>
                  )}
                </div>
              </div>
              
              {/* Disclaimer */}
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-start gap-3">
                  <Info className="w-4 h-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This analysis is provided by AI and should be used as a guide, not a definitive verdict. 
                    Always verify important information through multiple trusted sources.
                  </p>
                </div>
              </div>
              
              {/* Analyze Another */}
              <Link href="/detect" className="block">
                <Button className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-full h-12">
                  Analyze Another
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
