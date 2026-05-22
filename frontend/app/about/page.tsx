"use client";

import { motion } from "framer-motion";
import { Navigation } from "@/components/verix/navigation";
import { Footer } from "@/components/verix/footer";
import { Shield, Target, Eye, Users, Globe, Award, Building } from "lucide-react";

const values = [
  {
    icon: Target,
    title: "Accuracy First",
    description: "We never compromise on the accuracy of our detection systems. Every percentage point matters."
  },
  {
    icon: Eye,
    title: "Transparency",
    description: "We explain how our AI works and provide clear reasoning for every detection result."
  },
  {
    icon: Shield,
    title: "Privacy by Design",
    description: "Your data is never stored or used for training. Privacy is built into every feature."
  },
  {
    icon: Users,
    title: "Accessibility",
    description: "Truth verification should be available to everyone, regardless of technical expertise."
  }
];

export default function AboutPage() {
  return (
    <main className="min-h-screen">
      <Navigation />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <span className="text-sm font-mono text-muted-foreground mb-4 block">ABOUT US</span>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Fighting Misinformation with AI
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              VeriX AI was founded with a mission to protect truth in the digital age. 
              We believe everyone deserves access to accurate information, and we&apos;re building 
              the tools to make that possible.
            </p>
          </motion.div>
        </div>
      </section>
      
      {/* Mission & Vision */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="p-8 lg:p-12 rounded-2xl bg-card border border-border"
            >
              <Target className="w-12 h-12 mb-6" />
              <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To democratize access to truth verification technology. We&apos;re building AI systems 
                that help individuals, journalists, and organizations quickly identify misinformation 
                and make informed decisions based on accurate information.
              </p>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="p-8 lg:p-12 rounded-2xl bg-card border border-border"
            >
              <Eye className="w-12 h-12 mb-6" />
              <h2 className="text-3xl font-bold mb-4">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                A world where misinformation can&apos;t spread unchecked. Where every person has the 
                tools to verify what they read and share. Where trust in information is restored 
                through technology and transparency.
              </p>
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Values */}
      <section className="py-20 lg:py-32">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-sm font-mono text-muted-foreground mb-4 block">OUR VALUES</span>
            <h2 className="text-4xl lg:text-5xl font-bold">What We Stand For</h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, i) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-foreground/5 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      

      {/* Stats */}
      <section className="py-20 lg:py-32 bg-foreground text-background">
        <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-4 gap-12 text-center">
            {[
              { icon: Users, value: "2M+", label: "Active Users" },
              { icon: Globe, value: "150+", label: "Languages" },
              { icon: Award, value: "99.2%", label: "Accuracy" },
              { icon: Building, value: "500+", label: "Enterprise Clients" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <stat.icon className="w-8 h-8 mx-auto mb-4 text-background/60" />
                <div className="text-4xl lg:text-5xl font-bold mb-2">{stat.value}</div>
                <div className="text-background/60">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
