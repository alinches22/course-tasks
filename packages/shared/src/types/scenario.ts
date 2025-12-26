import { Tick } from './battle';

/**
 * Trading scenario (historical price data)
 */
export interface Scenario {
  id: string;
  asset: string;
  timeframe: string;
  ticks: Tick[];
  metadata: ScenarioMetadata;
  createdAt: Date;
}

/**
 * Scenario metadata
 */
export interface ScenarioMetadata {
  name: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  startDate: string;
  endDate: string;
  priceRange: {
    min: number;
    max: number;
  };
  volatility: number;
}

/**
 * Scenario summary (for listings)
 */
export interface ScenarioSummary {
  id: string;
  asset: string;
  timeframe: string;
  name: string;
  difficulty: string;
  tickCount: number;
}

/**
 * Supported assets
 */
export const SUPPORTED_ASSETS = ['BTC/USD', 'ETH/USD'] as const;
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number];

/**
 * Supported timeframes
 */
export const SUPPORTED_TIMEFRAMES = ['1m', '5m', '15m'] as const;
export type SupportedTimeframe = (typeof SUPPORTED_TIMEFRAMES)[number];
