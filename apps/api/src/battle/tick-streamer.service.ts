import { Injectable, OnModuleDestroy } from '@nestjs/common';

/**
 * Manages tick streaming intervals for active battles
 * This is a lightweight service to track active streaming sessions
 */
@Injectable()
export class TickStreamerService implements OnModuleDestroy {
  private activeStreamers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Register a streamer for a battle
   */
  registerStreamer(battleId: string, intervalId: NodeJS.Timeout): void {
    // Clear any existing streamer
    this.stopStreamer(battleId);
    this.activeStreamers.set(battleId, intervalId);
  }

  /**
   * Stop a streamer
   */
  stopStreamer(battleId: string): void {
    const intervalId = this.activeStreamers.get(battleId);
    if (intervalId) {
      clearTimeout(intervalId);
      this.activeStreamers.delete(battleId);
    }
  }

  /**
   * Check if a streamer is active
   */
  isStreaming(battleId: string): boolean {
    return this.activeStreamers.has(battleId);
  }

  /**
   * Get count of active streamers
   */
  getActiveCount(): number {
    return this.activeStreamers.size;
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    for (const [battleId] of this.activeStreamers) {
      this.stopStreamer(battleId);
    }
  }
}
