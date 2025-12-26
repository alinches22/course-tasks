'use client';

import { motion } from 'framer-motion';

export function ProvablyFair() {
  return (
    <section id="provably-fair" className="py-24 bg-background-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-6">
              Provably Fair
            </h2>
            <p className="text-xl text-text-secondary mb-8">
              Every battle uses a commit-reveal scheme to ensure the scenario cannot be manipulated.
            </p>

            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
                  <span className="text-accent-green font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Scenario Selection</h4>
                  <p className="text-text-secondary">
                    Before battle, server randomly selects a historical price scenario and generates a commit hash.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
                  <span className="text-accent-green font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Hash Commitment</h4>
                  <p className="text-text-secondary">
                    You receive a cryptographic hash before battle starts — proving the scenario was pre-selected.
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent-green/10 flex items-center justify-center">
                  <span className="text-accent-green font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-text-primary mb-1">Verification</h4>
                  <p className="text-text-secondary">
                    After battle, the scenario ID and salt are revealed. You can verify the hash matches.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Visual */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative"
          >
            <div className="bg-background-secondary border border-border rounded-2xl p-8">
              <div className="space-y-4">
                {/* Commit hash example */}
                <div>
                  <div className="text-sm text-text-muted mb-2">Commit Hash (Before Battle)</div>
                  <div className="font-mono text-sm text-accent-green bg-background-primary p-3 rounded-lg break-all">
                    0x8f4d2e1a7b9c3f5e6d8a0b2c4e6f8a0b2c4e6f8a...
                  </div>
                </div>

                <div className="flex items-center justify-center py-4">
                  <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* Reveal */}
                <div>
                  <div className="text-sm text-text-muted mb-2">Revealed (After Battle)</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-sm">Scenario:</span>
                      <span className="font-mono text-sm text-text-primary">BTC_BULL_RUN_2024</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-secondary text-sm">Salt:</span>
                      <span className="font-mono text-sm text-text-primary">a7b9c3f5e6d8...</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center py-4">
                  <svg className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>

                {/* Verification result */}
                <div className="bg-accent-green/10 border border-accent-green/30 rounded-lg p-4 flex items-center gap-3">
                  <svg className="w-6 h-6 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-accent-green">Hash Verified ✓</span>
                </div>
              </div>
            </div>

            {/* Glow effect */}
            <div className="absolute -inset-4 bg-accent-green/5 blur-3xl rounded-3xl -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
