import FeaturedServices from "@/components/FeaturedServices";
import HeroSection from "@/components/HeroSection";
import HowItWorks from "@/components/HowItWorks";
import ServiceCategories from "@/components/ServiceCategories";
import TestimonialsCarousel from "@/components/TestimonialsCarousel";

export default function Home() {
  return (
    <main className="bg-zinc-50">
      <HeroSection />
      <ServiceCategories />
      <FeaturedServices />
      <TestimonialsCarousel />
      <HowItWorks />
    </main>
  );
}
