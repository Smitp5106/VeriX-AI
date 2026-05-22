"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Navigation } from "@/components/verix/navigation";
import { Footer } from "@/components/verix/footer";
import { Check, X, Sparkles, Building, Zap } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Free",
    description: "Perfect for individuals getting started",
    icon: Sparkles,
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { name: "100 analyses per month", included: true },
      { name: "Basic detection features", included: true },
      { name: "Standard accuracy (95%)", included: true },
      { name: "Community support", included: true },
      { name: "API access", included: false },
      { name: "Priority processing", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Custom training", included: false },
    ],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Pro",
    description: "For professionals and power users",
    icon: Zap,
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: [
      { name: "Unlimited analyses", included: true },
      { name: "Advanced detection features", included: true },
      { name: "Premium accuracy (99.2%)", included: true },
      { name: "Priority email support", included: true },
      { name: "Full API access", included: true },
      { name: "Priority processing", included: true },
      { name: "Advanced analytics", included: true },
      { name: "Custom training", included: false },
    ],
    cta: "Start Free Trial",
    popular: true
  },
  {
    name: "Enterprise",
    description: "For organizations at scale",
    icon: Building,
    monthlyPrice: null,
    yearlyPrice: null,
    features: [
      { name: "Unlimited analyses", included: true },
      { name: "All Pro features", included: true },
      { name: "Custom model training", included: true },
      { name: "Dedicated account manager", included: true },
      { name: "SLA guarantees", included: true },
      { name: "SSO & advanced security", included: true },
      { name: "White-label options", included: true },
      { name: "On-premise deployment", included: true },
    ],
    cta: "Contact Sales",
    popular: false
  }
];

const faqs = [
  {
    q: "Can I change plans at any time?",
    a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards, PayPal, and bank transfers for enterprise customers."
  },
  {
    q: "Is there a free trial for Pro?",
    a: "Yes, Pro comes with a 14-day free trial. No credit card required to start."
  },
  {
    q: "What happens if I exceed my monthly limit?",
    a: "Free plan users will be prompted to upgrade. We never charge overage fees without consent."
  }
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <main className="min-h-screen">
      <Navigation />
      
      {/* Header */}
      <section className="pt-32 pb-16 lg:pt-40 lg:pb-24 relative">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_70%)]" />
        
        <div className="relative max-w-[1400px] mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-sm font-mono text-muted-foreground mb-4 block">PRICING</span>
            <h1 className="text-4xl lg:text-6xl font-bold mb-6">
              Simple, Transparent Pricing
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <span className={`text-sm ${isYearly ? "text-foreground" : "text-muted-foreground"}`}>
                Yearly
                <span className="ml-2 text-xs px-2 py-1 rounded-full bg-success/10 text-success">
                  Save 20%
                </span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>
      
      {/* Pricing Cards */}
      <section className="pb-24 lg:pb-32">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className={`relative rounded-2xl border ${
                  plan.popular 
                    ? "border-foreground bg-foreground text-background" 
                    : "border-border bg-card"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-background text-foreground text-xs font-medium">
                    Most Popular
                  </div>
                )}
                
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      plan.popular ? "bg-background/10" : "bg-foreground/5"
                    }`}>
                      <plan.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.name}</h3>
                    </div>
                  </div>
                  
                  <p className={`text-sm mb-6 ${plan.popular ? "text-background/70" : "text-muted-foreground"}`}>
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    {plan.monthlyPrice !== null ? (
                      <>
                        <span className="text-4xl font-bold">
                          ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                        </span>
                        <span className={`${plan.popular ? "text-background/70" : "text-muted-foreground"}`}>
                          /{isYearly ? "year" : "month"}
                        </span>
                      </>
                    ) : (
                      <span className="text-4xl font-bold">Custom</span>
                    )}
                  </div>
                  
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/signup"}>
                    <Button 
                      className={`w-full rounded-full h-12 ${
                        plan.popular 
                          ? "bg-background text-foreground hover:bg-background/90" 
                          : "bg-foreground text-background hover:bg-foreground/90"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
                
                <div className={`p-8 border-t ${plan.popular ? "border-background/10" : "border-border"}`}>
                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature.name} className="flex items-start gap-3">
                        {feature.included ? (
                          <Check className={`w-5 h-5 shrink-0 ${
                            plan.popular ? "text-background" : "text-foreground"
                          }`} />
                        ) : (
                          <X className={`w-5 h-5 shrink-0 ${
                            plan.popular ? "text-background/30" : "text-muted-foreground/50"
                          }`} />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? "" 
                            : plan.popular ? "text-background/50" : "text-muted-foreground"
                        }`}>
                          {feature.name}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Feature Comparison */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Compare All Features
            </h2>
            <p className="text-muted-foreground">
              See which plan is right for you
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 pr-4 font-semibold">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold">Free</th>
                  <th className="text-center py-4 px-4 font-semibold">Pro</th>
                  <th className="text-center py-4 px-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Monthly analyses", free: "100", pro: "Unlimited", enterprise: "Unlimited" },
                  { feature: "Detection accuracy", free: "95%", pro: "99.2%", enterprise: "99.5%+" },
                  { feature: "API access", free: false, pro: true, enterprise: true },
                  { feature: "Priority processing", free: false, pro: true, enterprise: true },
                  { feature: "Advanced analytics", free: false, pro: true, enterprise: true },
                  { feature: "Custom model training", free: false, pro: false, enterprise: true },
                  { feature: "Dedicated support", free: false, pro: false, enterprise: true },
                  { feature: "SLA guarantee", free: false, pro: false, enterprise: true },
                  { feature: "SSO integration", free: false, pro: false, enterprise: true },
                  { feature: "White-label options", free: false, pro: false, enterprise: true },
                ].map((row, i) => (
                  <tr key={i} className="border-b border-border">
                    <td className="py-4 pr-4 text-sm">{row.feature}</td>
                    <td className="text-center py-4 px-4">
                      {typeof row.free === "boolean" ? (
                        row.free ? <Check className="w-5 h-5 mx-auto text-foreground" /> : <X className="w-5 h-5 mx-auto text-muted-foreground/50" />
                      ) : (
                        <span className="text-sm">{row.free}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? <Check className="w-5 h-5 mx-auto text-foreground" /> : <X className="w-5 h-5 mx-auto text-muted-foreground/50" />
                      ) : (
                        <span className="text-sm">{row.pro}</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? <Check className="w-5 h-5 mx-auto text-foreground" /> : <X className="w-5 h-5 mx-auto text-muted-foreground/50" />
                      ) : (
                        <span className="text-sm">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>
      
      {/* FAQs */}
      <section className="py-24 lg:py-32">
        <div className="max-w-[800px] mx-auto px-6 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </motion.div>
          
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                viewport={{ once: true }}
                className="p-6 rounded-xl border border-border"
              >
                <h3 className="font-semibold mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm">{faq.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-24 lg:py-32 bg-foreground text-background">
        <div className="max-w-[800px] mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl lg:text-5xl font-bold mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-background/70 mb-8">
              Join millions of users who trust VeriX AI to verify information.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button 
                  size="lg"
                  className="bg-background text-foreground hover:bg-background/90 rounded-full px-8 h-14"
                >
                  Start Free Trial
                </Button>
              </Link>
              <Link href="/contact">
                <Button 
                  size="lg"
                  variant="outline"
                  className="border-background/30 text-background hover:bg-background/10 rounded-full px-8 h-14"
                >
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      
      <Footer />
    </main>
  );
}
