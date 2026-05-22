"use client";

import { motion } from "framer-motion";
import { FileText, Cpu, CheckCircle, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Input Your Content",
    description: "Paste any news headline, article, or social media post you want to verify. Our system accepts text in over 150 languages."
  },
  {
    number: "02",
    icon: Cpu,
    title: "AI Processing",
    description: "Our advanced neural networks analyze the content for linguistic patterns, factual claims, and source credibility markers."
  },
  {
    number: "03",
    icon: CheckCircle,
    title: "Get Results",
    description: "Receive a detailed analysis including authenticity prediction, confidence score, sentiment analysis, and explanation."
  }
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 lg:py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-muted-foreground mb-4 block">HOW IT WORKS</span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Simple Yet Powerful
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Verify any piece of content in three simple steps. 
            No technical expertise required.
          </p>
        </motion.div>
        
        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-border -translate-y-1/2" />
          
          <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.2 }}
                viewport={{ once: true }}
                className="relative"
              >
                <div className="relative z-10 bg-background p-8 rounded-2xl border border-border">
                  {/* Step number */}
                  <div className="flex items-center gap-4 mb-6">
                    <span className="text-5xl font-bold text-foreground/10">{step.number}</span>
                    <div className="w-12 h-12 rounded-full bg-foreground flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-background" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  
                  {i < steps.length - 1 && (
                    <div className="hidden lg:flex absolute -right-6 top-1/2 -translate-y-1/2 z-20">
                      <ArrowRight className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
