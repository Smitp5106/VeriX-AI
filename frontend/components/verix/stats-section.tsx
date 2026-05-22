"use client";

import { motion } from "framer-motion";
import { Shield, TrendingUp, Users, Zap } from "lucide-react";

const stats = [
  {
    icon: Shield,
    value: "99.2%",
    label: "Detection Accuracy",
    description: "Industry-leading precision in identifying fake news"
  },
  {
    icon: Zap,
    value: "0.3s",
    label: "Average Response",
    description: "Lightning-fast analysis powered by optimized AI"
  },
  {
    icon: Users,
    value: "2M+",
    label: "Active Users",
    description: "Trusted by researchers, journalists & individuals"
  },
  {
    icon: TrendingUp,
    value: "50M+",
    label: "Articles Analyzed",
    description: "Growing database of verified content daily"
  }
];

export function StatsSection() {
  return (
    <section className="py-24 lg:py-32 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
      
      <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-muted-foreground mb-4 block">BY THE NUMBERS</span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Trusted by Millions
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our platform processes millions of verification requests daily, 
            helping users worldwide combat misinformation.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="text-center p-8 rounded-2xl bg-card border border-border"
            >
              <div className="w-14 h-14 rounded-full bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                <stat.icon className="w-7 h-7" />
              </div>
              <div className="text-4xl lg:text-5xl font-bold mb-2">{stat.value}</div>
              <div className="text-lg font-medium mb-1">{stat.label}</div>
              <p className="text-sm text-muted-foreground">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
