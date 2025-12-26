'use client';

import { motion } from 'framer-motion';
import { useQuery } from 'urql';
import { GET_MY_STATS, GET_WEEKLY_POOL } from '@/lib/graphql/operations/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPoints, formatPercentage } from '@/lib/utils/format';

export function UserStats() {
  const [{ data, fetching }] = useQuery({ query: GET_MY_STATS });
  const [{ data: poolData }] = useQuery({ query: GET_WEEKLY_POOL });

  if (fetching) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = data?.myStats;
  const balance = data?.myTotalPoints ?? stats?.totalPoints ?? 0;
  const weeklyPool = poolData?.weeklyPool?.totalFees ?? 0;

  const items = [
    { 
      label: 'Balance', 
      value: formatPoints(balance), 
      color: 'text-accent-green',
      highlight: true,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    { label: 'Total Battles', value: stats?.totalBattles || 0 },
    { label: 'Wins', value: stats?.wins || 0, color: 'text-accent-green' },
    { label: 'Win Rate', value: formatPercentage(stats?.winRate || 0, 1) },
    { 
      label: 'Weekly Pool', 
      value: formatPoints(weeklyPool), 
      color: 'text-accent-yellow',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={item.highlight ? 'border-accent-green/30 bg-accent-green/5' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                {item.icon && <span className={item.color || 'text-text-secondary'}>{item.icon}</span>}
                <p className="text-sm text-text-secondary">{item.label}</p>
              </div>
              <p className={`text-2xl font-bold ${item.color || 'text-text-primary'}`}>
                {item.value}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
