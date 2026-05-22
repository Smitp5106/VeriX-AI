"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "VeriX AI has become an essential tool in our newsroom. It helps us verify sources and claims in minutes rather than hours.",
    author: "Sarah Chen",
    role: "Editor-in-Chief",
    company: "Digital News Network"
  },
  {
    quote: "The accuracy is remarkable. We&apos;ve integrated VeriX into our content moderation pipeline and seen a 90% reduction in misinformation reaching our users.",
    author: "Michael Torres",
    role: "VP of Trust & Safety",
    company: "SocialHub Inc."
  },
  {
    quote: "As a researcher studying misinformation, VeriX provides invaluable data and analysis that would take my team weeks to compile manually.",
    author: "Dr. Emily Watson",
    role: "Research Director",
    company: "MIT Media Lab"
  }
];

export function TestimonialsSection() {
  return (
    <section className="py-24 lg:py-32 relative">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-muted-foreground mb-4 block">TESTIMONIALS</span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Trusted by Experts
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            See what journalists, researchers, and platform operators say about VeriX AI.
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <motion.div
              key={testimonial.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative p-8 rounded-2xl bg-card border border-border"
            >
              <Quote className="w-8 h-8 text-foreground/10 mb-4" />
              <p className="text-foreground/80 leading-relaxed mb-6">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-foreground/10 flex items-center justify-center">
                  <span className="text-lg font-bold">{testimonial.author.charAt(0)}</span>
                </div>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
