'use client';

import { motion } from 'framer-motion';
import { useQuery } from 'urql';
import { GET_MY_STATS } from '@/lib/graphql/operations/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPoints, formatPercentage } from '@/lib/utils/format';

export function UserStats() {
  const [{ data, fetching }] = useQuery({ query: GET_MY_STATS });

  if (fetching) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
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

  const items = [
    { label: 'Total Battles', value: stats?.totalBattles || 0 },
    { label: 'Wins', value: stats?.wins || 0, color: 'text-accent-green' },
    { label: 'Win Rate', value: formatPercentage(stats?.winRate || 0, 1), color: 'text-accent-green' },
    { label: 'Total Points', value: formatPoints(stats?.totalPoints || 0), color: 'text-accent-yellow' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {items.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-text-secondary mb-1">{item.label}</p>
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
