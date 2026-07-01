import { Navigation } from "@/components/verix/navigation";
import { HeroSection } from "@/components/verix/hero-section";
import { FeaturesSection } from "@/components/verix/features-section";
import { HowItWorksSection } from "@/components/verix/how-it-works-section";


import { FAQSection } from "@/components/verix/faq-section";
import { CTASection } from "@/components/verix/cta-section";
import { Footer } from "@/components/verix/footer";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />


      <FAQSection />
      <CTASection />
      <Footer />
    </main>
  );
}
