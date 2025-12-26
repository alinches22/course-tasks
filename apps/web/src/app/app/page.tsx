'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/auth.store';
import { UserStats } from '@/components/dashboard/user-stats';
import { BattleList } from '@/components/dashboard/battle-list';
import { ScenarioList } from '@/components/dashboard/scenario-list';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

type TabType = 'scenarios' | 'waiting' | 'active' | 'my' | 'finished';

export default function DashboardPage() {
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('scenarios');
  const [refreshKey, setRefreshKey] = useState(0);

  const tabs: { id: TabType; label: string; filter?: any }[] = [
    { id: 'scenarios', label: 'Scenarios' },
    { id: 'waiting', label: 'Open Battles', filter: { status: 'WAITING' } },
    { id: 'active', label: 'Live Battles', filter: { status: 'ACTIVE' } },
    { id: 'my', label: 'My Battles', filter: { myBattles: true } },
    { id: 'finished', label: 'Finished', filter: { status: 'FINISHED' } },
  ];

  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-accent-green/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">Connect Your Wallet</h1>
          <p className="text-text-secondary mb-6">
            Connect and sign in to start trading battles
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-secondary">Select a scenario to create a battle or join an existing one</p>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <UserStats />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-border overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                activeTab === tab.id
                  ? 'text-accent-green border-accent-green'
                  : 'text-text-secondary border-transparent hover:text-text-primary'
              )}
            >
              {tab.label}
            </button>
          ))}
          <div className="flex-1" />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRefreshKey((k) => k + 1)}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </Button>
        </div>

        {/* Content */}
        {activeTab === 'scenarios' ? (
          <ScenarioList key={`scenarios-${refreshKey}`} />
        ) : (
          <BattleList
            key={`${activeTab}-${refreshKey}`}
            filter={tabs.find((t) => t.id === activeTab)?.filter}
          />
        )}
      </motion.div>
    </div>
  );
}
