'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

const faqs = [
  {
    question: 'Is this gambling?',
    answer:
      'No. TradeVersus is a skill-based competition. Both players trade the exact same historical price scenario with the same information. There is no house edge, no randomness in outcomes — only your decision-making determines the result.',
  },
  {
    question: 'Do I need to deposit real money?',
    answer:
      'No. TradeVersus uses virtual balance for all battles. Your wallet is only used for authentication and identity. No real deposits or withdrawals are involved.',
  },
  {
    question: 'How is the scenario selected?',
    answer:
      'Scenarios are randomly selected by the server before each battle and secured using a commit-reveal cryptographic scheme. This ensures neither player can know or manipulate the scenario in advance.',
  },
  {
    question: 'Can I see future price data during a battle?',
    answer:
      'No. Price data is streamed in real-time, tick by tick. Neither player receives future data. Both players see exactly the same information at the same time.',
  },
  {
    question: 'What happens if I disconnect during a battle?',
    answer:
      'The battle continues. Any open positions remain open. We recommend a stable internet connection for the best experience.',
  },
  {
    question: 'How are points calculated?',
    answer:
      'Winners receive 100 points, losers receive 25 points, and draws award 50 points each. Additional bonus points are awarded based on PnL performance.',
  },
  {
    question: 'What is the weekly pool?',
    answer:
      'A percentage of earned points contributes to a weekly pool. Top performers on the leaderboard share this pool every week.',
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 bg-background-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-text-secondary">
            Everything you need to know about TradeVersus
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={cn(
                  'w-full text-left p-6 rounded-xl border transition-all duration-200',
                  openIndex === index
                    ? 'bg-background-secondary border-accent-green/50'
                    : 'bg-background-secondary border-border hover:border-border-light'
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <h3 className="text-lg font-semibold text-text-primary">{faq.question}</h3>
                  <svg
                    className={cn(
                      'w-5 h-5 text-text-secondary transition-transform duration-200',
                      openIndex === index && 'rotate-180'
                    )}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                <AnimatePresence>
                  {openIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <p className="mt-4 text-text-secondary leading-relaxed">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
