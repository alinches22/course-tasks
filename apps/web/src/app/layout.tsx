import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { Providers } from './providers';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'TradeVersus | Skill-Based PvP Trading Battles',
  description:
    'TradeVersus is a skill-based PvP trading battles platform. Two users trade the same historical price scenario, streamed in real-time. Winner is determined purely by decision quality.',
  keywords: ['trading', 'pvp', 'battles', 'crypto', 'web3', 'defi'],
  authors: [{ name: 'TradeVersus Team' }],
  openGraph: {
    title: 'TradeVersus | Skill-Based PvP Trading Battles',
    description: 'Trade against others. No luck. Pure skill.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TradeVersus | Skill-Based PvP Trading Battles',
    description: 'Trade against others. No luck. Pure skill.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
