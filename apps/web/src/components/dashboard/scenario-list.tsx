'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'urql';
import { useRouter } from 'next/navigation';
import { GET_SCENARIOS } from '@/lib/graphql/operations/scenarios';
import { CREATE_BATTLE } from '@/lib/graphql/operations/battles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ROUTES } from '@/lib/constants/routes';

interface Scenario {
  id: string;
  symbol: string;
  asset: string;
  timeframe: string;
  tickIntervalMs: number;
  tickCount: number;
  metadata?: {
    name: string;
    description: string;
    difficulty: string;
  };
}

export function ScenarioList() {
  const router = useRouter();
  const { addToast } = useToast();
  const [creatingId, setCreatingId] = useState<string | null>(null);

  const [{ data, fetching }] = useQuery({ query: GET_SCENARIOS });
  const [, createBattle] = useMutation(CREATE_BATTLE);

  const handleCreateBattle = async (scenarioId: string) => {
    setCreatingId(scenarioId);
    try {
      const result = await createBattle({
        input: { scenarioId, startingBalance: 10000 },
      });

      if (result.error) throw new Error(result.error.message);

      addToast('success', 'Battle created! Waiting for opponent...');

      if (result.data?.createBattle?.id) {
        router.push(ROUTES.BATTLE(result.data.createBattle.id));
      }
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to create battle');
    } finally {
      setCreatingId(null);
    }
  };

  if (fetching) {
    return (
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  const scenarios: Scenario[] = data?.scenarios || [];

  if (scenarios.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-text-secondary">No scenarios available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {scenarios.map((scenario, index) => (
        <motion.div
          key={scenario.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
        >
          <Card hover className="h-full">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-text-primary">
                    {scenario.symbol}
                  </span>
                  <Badge variant="outline">{scenario.timeframe}</Badge>
                </div>
                {scenario.metadata?.difficulty && (
                  <Badge
                    variant={
                      scenario.metadata.difficulty === 'EASY'
                        ? 'success'
                        : scenario.metadata.difficulty === 'HARD'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {scenario.metadata.difficulty}
                  </Badge>
                )}
              </div>

              {scenario.metadata?.name && (
                <h4 className="font-medium text-text-primary mb-1">
                  {scenario.metadata.name}
                </h4>
              )}

              {scenario.metadata?.description && (
                <p className="text-sm text-text-secondary mb-3 line-clamp-2">
                  {scenario.metadata.description}
                </p>
              )}

              <div className="flex items-center justify-between text-xs text-text-muted mb-4">
                <span>{scenario.tickCount} ticks</span>
                <span>{scenario.tickIntervalMs}ms interval</span>
              </div>

              <Button
                className="w-full"
                onClick={() => handleCreateBattle(scenario.id)}
                isLoading={creatingId === scenario.id}
              >
                Create Battle
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
