'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation } from 'urql';
import Link from 'next/link';
import { GET_BATTLES, JOIN_BATTLE, CANCEL_BATTLE } from '@/lib/graphql/operations/battles';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';
import { BattleCardSkeleton } from '@/components/ui/skeleton';
import { formatAddress, formatRelativeTime } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/components/ui/toast';

interface BattleListProps {
  filter?: {
    status?: string;
    myBattles?: boolean;
  };
}

export function BattleList({ filter }: BattleListProps) {
  const { user } = useAuthStore();
  const { addToast } = useToast();
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [{ data, fetching }, refetch] = useQuery({
    query: GET_BATTLES,
    variables: { filter },
  });

  const [, joinBattle] = useMutation(JOIN_BATTLE);
  const [, cancelBattle] = useMutation(CANCEL_BATTLE);

  const handleJoin = async (battleId: string) => {
    setJoiningId(battleId);
    try {
      const result = await joinBattle({ input: { battleId } });
      if (result.error) throw new Error(result.error.message);
      addToast('success', 'Joined battle successfully!');
      refetch();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to join battle');
    } finally {
      setJoiningId(null);
    }
  };

  const handleCancel = async (battleId: string) => {
    setCancellingId(battleId);
    try {
      const result = await cancelBattle({ id: battleId });
      if (result.error) throw new Error(result.error.message);
      addToast('success', 'Battle cancelled');
      refetch();
    } catch (error) {
      addToast('error', error instanceof Error ? error.message : 'Failed to cancel battle');
    } finally {
      setCancellingId(null);
    }
  };

  if (fetching) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <BattleCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const battles = data?.battles?.battles || [];

  if (battles.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-text-secondary">No battles found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {battles.map((battle: any, index: number) => {
        const isCreator = battle.participants[0]?.user?.id === user?.id;
        const canJoin = battle.status === 'WAITING' && !isCreator;
        const canCancel = battle.status === 'WAITING' && isCreator;
        const canEnter = battle.status === 'MATCHED' || battle.status === 'RUNNING';

        return (
          <motion.div
            key={battle.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card hover={canEnter}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold text-text-primary">{battle.asset}</span>
                    <span className="text-sm text-text-muted">{battle.timeframe}</span>
                    <span className="px-2 py-0.5 rounded bg-accent-green/10 text-accent-green text-xs font-medium">
                      {battle.stakeAmount || 100} pts
                    </span>
                  </div>
                  <StatusBadge status={battle.status} />
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                      </svg>
                    </div>
                    <span className="text-sm text-text-primary">
                      {formatAddress(battle.participants[0]?.user?.address || '')}
                    </span>
                  </div>

                  <span className="text-text-muted">vs</span>

                  <div className="flex items-center gap-2">
                    {battle.participants[1] ? (
                      <>
                        <span className="text-sm text-text-primary">
                          {formatAddress(battle.participants[1]?.user?.address || '')}
                        </span>
                        <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center text-text-secondary">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                          </svg>
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-text-muted">Waiting...</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-muted">
                    {formatRelativeTime(battle.createdAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    {canJoin && (
                      <Button
                        size="sm"
                        onClick={() => handleJoin(battle.id)}
                        isLoading={joiningId === battle.id}
                      >
                        Join Battle
                      </Button>
                    )}
                    {canCancel && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCancel(battle.id)}
                        isLoading={cancellingId === battle.id}
                      >
                        Cancel
                      </Button>
                    )}
                    {canEnter && (
                      <Link href={ROUTES.BATTLE(battle.id)}>
                        <Button size="sm">Enter Battle</Button>
                      </Link>
                    )}
                    {(battle.status === 'ACTIVE' || battle.status === 'RUNNING') && (
                      <Link href={ROUTES.BATTLE(battle.id)}>
                        <Button size="sm" variant="secondary">
                          Watch Live
                        </Button>
                      </Link>
                    )}
                    {battle.status === 'FINISHED' && (
                      <Link href={ROUTES.REPLAY(battle.id)}>
                        <Button size="sm" variant="secondary">
                          View Replay
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
