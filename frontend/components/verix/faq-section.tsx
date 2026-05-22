"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "How accurate is VeriX AI?",
    answer: "VeriX AI achieves 99.2% accuracy on our benchmark tests, which include diverse datasets from multiple languages and content types. Our models are continuously updated with the latest misinformation patterns to maintain this high accuracy."
  },
  {
    question: "What types of content can VeriX analyze?",
    answer: "VeriX can analyze news headlines, full articles, social media posts, claims, and statements. We support text content in over 150 languages and can process both short-form and long-form content."
  },
  {
    question: "Is my data secure and private?",
    answer: "Absolutely. We use end-to-end encryption and never store your queries or content. All data is processed in isolated, secure environments and deleted immediately after analysis. We are SOC 2 Type II certified."
  },
  {
    question: "How does the AI detect fake news?",
    answer: "Our AI uses multiple techniques including natural language processing, pattern recognition, source verification, and cross-referencing with fact-checking databases. It analyzes writing style, claims made, source credibility, and historical context."
  },
  {
    question: "Can VeriX be integrated into our platform?",
    answer: "Yes, we offer robust APIs for seamless integration. Our enterprise plans include dedicated support, custom model training, and SLA guarantees. Contact our sales team for more information."
  },
  {
    question: "What&apos;s included in the free plan?",
    answer: "The free plan includes 100 analyses per month, access to our basic detection features, and community support. It&apos;s perfect for individuals who want to verify occasional content."
  }
];

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-24 lg:py-32 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-transparent" />
      
      <div className="relative max-w-[900px] mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-sm font-mono text-muted-foreground mb-4 block">FAQ</span>
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to know about VeriX AI.
          </p>
        </motion.div>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="rounded-xl border border-border overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-accent/50 transition-colors"
              >
                <span className="font-medium pr-4">{faq.question}</span>
                <ChevronDown 
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    openIndex === i ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <p className="px-6 pb-6 text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
