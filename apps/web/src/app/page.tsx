import { Hero } from '@/components/landing/hero';
import { HowItWorks } from '@/components/landing/how-it-works';
import { ProvablyFair } from '@/components/landing/provably-fair';
import { FAQ } from '@/components/landing/faq';

export default function HomePage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <ProvablyFair />
      <FAQ />
    </>
  );
}
