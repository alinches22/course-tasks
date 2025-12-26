'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { useQuery } from 'urql';
import Link from 'next/link';
import { GET_REPLAY } from '@/lib/graphql/operations/replay';
import { ReplayChart } from '@/components/replay/replay-chart';
import { ReplayTimeline } from '@/components/replay/replay-timeline';
import { ReplayActionsList } from '@/components/replay/replay-actions-list';
import { VerificationPanel } from '@/components/replay/verification-panel';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatAddress, formatPercentage } from '@/lib/utils/format';
import { ROUTES } from '@/lib/constants/routes';
import { cn } from '@/lib/utils/cn';

export default function ReplayPage() {
  const params = useParams();
  const battleId = params.id as string;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const [{ data, fetching }] = useQuery({
    query: GET_REPLAY,
    variables: { battleId },
  });

  const replay = data?.replay;

  // Playback logic
  useEffect(() => {
    if (!isPlaying || !replay) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev >= replay.ticks.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, playbackSpeed, replay]);

  const handleSeek = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPlaying(false);
  }, []);

  const handlePlayPause = useCallback(() => {
    if (replay && currentIndex >= replay.ticks.length - 1) {
      setCurrentIndex(0);
    }
    setIsPlaying((prev) => !prev);
  }, [currentIndex, replay]);

  if (fetching) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-[400px] rounded-xl" />
            <Skeleton className="h-16 rounded-xl" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!replay) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 text-center">
        <p className="text-text-secondary mb-4">Replay not found</p>
        <Link href={ROUTES.APP}>
          <Button variant="secondary">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-primary">{replay.asset}</h1>
              <Badge variant="default">{replay.timeframe}</Badge>
              <Badge variant="info">Replay</Badge>
            </div>
            <p className="text-text-secondary">Battle #{battleId.slice(0, 8)}...</p>
          </div>
          <Link href={ROUTES.APP}>
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chart + Timeline */}
          <div className="lg:col-span-2 space-y-4">
            <ReplayChart
              ticks={replay.ticks}
              actions={replay.actions}
              currentIndex={currentIndex}
              className="h-[400px]"
            />

            <Card>
              <CardContent className="p-4">
                <ReplayTimeline
                  totalTicks={replay.ticks.length}
                  currentIndex={currentIndex}
                  onSeek={handleSeek}
                  isPlaying={isPlaying}
                  onPlayPause={handlePlayPause}
                />
                
                {/* Speed controls */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-sm text-text-muted">Speed:</span>
                  {[0.5, 1, 2, 4].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={cn(
                        'px-3 py-1 text-sm rounded-lg transition-colors',
                        playbackSpeed === speed
                          ? 'bg-accent-green text-background-primary'
                          : 'bg-surface text-text-secondary hover:text-text-primary'
                      )}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Result summary */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  {replay.participants.map((p: any) => {
                    const isWinner = p.userId === replay.result.winnerId;
                    return (
                      <div
                        key={p.oderId}
                        className={cn(
                          'flex-1 p-4 rounded-lg',
                          isWinner ? 'bg-accent-green/10' : 'bg-surface'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                              p.side === 'A'
                                ? 'bg-accent-blue/20 text-accent-blue'
                                : 'bg-accent-purple/20 text-accent-purple'
                            )}
                          >
                            {p.side}
                          </div>
                          <span className="text-sm text-text-primary">
                            {formatAddress(p.address)}
                          </span>
                          {isWinner && !replay.result.isDraw && (
                            <span className="text-xs text-accent-green">👑 Winner</span>
                          )}
                        </div>
                        <p
                          className={cn(
                            'text-2xl font-bold',
                            p.finalPnl >= 0 ? 'text-accent-green' : 'text-accent-red'
                          )}
                        >
                          {formatPercentage(p.finalPnl)}
                        </p>
                      </div>
                    );
                  })}

                  <div className="px-4">
                    <span className="text-2xl text-text-muted">vs</span>
                  </div>
                </div>

                {replay.result.isDraw && (
                  <div className="text-center mt-4">
                    <Badge variant="warning">Draw</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <ReplayActionsList
                  actions={replay.actions}
                  participants={replay.participants}
                  currentIndex={currentIndex}
                />
              </CardContent>
            </Card>

            {/* Verification */}
            <Card>
              <CardHeader>
                <CardTitle>Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <VerificationPanel verification={replay.verification} />
              </CardContent>
            </Card>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
