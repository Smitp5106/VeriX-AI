"use client";

import { motion } from "framer-motion";
import { 
  Shield, 
  Zap, 
  BarChart3, 
  Globe, 
  Brain, 
  Lock,
  FileSearch,
  TrendingUp
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Advanced AI Analysis",
    description: "Our deep learning models analyze text patterns, writing style, and semantic content to identify misinformation with unprecedented accuracy."
  },
  {
    icon: Zap,
    title: "Real-Time Detection",
    description: "Get instant results within seconds. Our optimized inference pipeline ensures you never have to wait for critical information."
  },
  {
    icon: BarChart3,
    title: "Confidence Scoring",
    description: "Receive detailed confidence scores, sentiment analysis, and source credibility ratings for comprehensive verification."
  },
  {
    icon: FileSearch,
    title: "Source Verification",
    description: "Cross-reference claims against trusted databases and fact-checking organizations to verify information authenticity."
  },
  {
    icon: TrendingUp,
    title: "Trend Analysis",
    description: "Track misinformation trends and patterns across platforms. Identify emerging narratives before they go viral."
  },
  {
    icon: Lock,
    title: "Privacy First",
    description: "Your data is encrypted and never stored. We process your queries securely and delete them immediately after analysis."
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "SOC 2 Type II certified with end-to-end encryption. Built for organizations that demand the highest security standards."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-muted-foreground mb-4 block">FEATURES</span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Powerful Detection Tools
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to verify information and protect against misinformation, 
            powered by cutting-edge artificial intelligence.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-foreground/20 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center mb-4 group-hover:bg-foreground/10 transition-colors">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
