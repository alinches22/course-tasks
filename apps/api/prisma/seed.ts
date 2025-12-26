import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

interface TickData {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Generate realistic OHLCV tick data
function generateTicks(
  basePrice: number,
  volatility: number,
  trend: 'bull' | 'bear' | 'sideways',
  count: number,
): TickData[] {
  const ticks: TickData[] = [];
  let currentPrice = basePrice;
  const startTime = Date.now() - count * 5000; // 5 second intervals

  for (let i = 0; i < count; i++) {
    const trendBias = trend === 'bull' ? 0.6 : trend === 'bear' ? 0.4 : 0.5;
    const direction = Math.random() > trendBias ? -1 : 1;
    const change = (Math.random() * volatility * currentPrice) / 100;

    const open = currentPrice;
    const movement = direction * change;
    const close = Math.max(currentPrice + movement, basePrice * 0.5); // Prevent going below 50% of base

    // Generate high/low based on volatility
    const intraVolatility = (Math.random() * volatility * currentPrice) / 200;
    const high = Math.max(open, close) + intraVolatility;
    const low = Math.min(open, close) - intraVolatility;

    // Generate volume
    const baseVolume = 1000000;
    const volume = baseVolume * (0.5 + Math.random());

    ticks.push({
      ts: startTime + i * 5000,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(0)),
    });

    currentPrice = close;
  }

  return ticks;
}

async function seed() {
  console.log('🌱 Starting database seed...');

  // Clear existing scenarios (for development)
  await prisma.scenario.deleteMany();

  // Create scenarios
  const scenarios = [
    {
      symbol: 'BTC/USD',
      asset: 'BTC/USD',
      timeframe: '5m',
      tickIntervalMs: 2000, // 2 seconds per tick for faster battles
      ticks: generateTicks(42000, 0.8, 'bull', 30), // 30 ticks = 60s battle at 2s/tick
      metadata: {
        name: 'BTC Bull Run',
        description: 'Bitcoin experiencing strong upward momentum with consistent buying pressure.',
        difficulty: 'MEDIUM',
        startDate: '2024-01-15T10:00:00Z',
        endDate: '2024-01-15T10:05:00Z',
      },
    },
    {
      symbol: 'BTC/USD',
      asset: 'BTC/USD',
      timeframe: '5m',
      tickIntervalMs: 2000,
      ticks: generateTicks(45000, 1.2, 'bear', 30),
      metadata: {
        name: 'BTC Flash Crash',
        description: 'Bitcoin sudden sell-off with high volatility and cascading liquidations.',
        difficulty: 'HARD',
        startDate: '2024-02-20T14:30:00Z',
        endDate: '2024-02-20T14:35:00Z',
      },
    },
    {
      symbol: 'ETH/USD',
      asset: 'ETH/USD',
      timeframe: '5m',
      tickIntervalMs: 2000,
      ticks: generateTicks(2800, 0.6, 'bull', 30),
      metadata: {
        name: 'ETH Breakout',
        description: 'Ethereum breaking above key resistance with increasing volume.',
        difficulty: 'EASY',
        startDate: '2024-03-10T09:00:00Z',
        endDate: '2024-03-10T09:05:00Z',
      },
    },
    {
      symbol: 'ETH/USD',
      asset: 'ETH/USD',
      timeframe: '5m',
      tickIntervalMs: 2000,
      ticks: generateTicks(3200, 0.9, 'sideways', 30),
      metadata: {
        name: 'ETH Consolidation',
        description: 'Ethereum in tight range with low volatility and uncertain direction.',
        difficulty: 'MEDIUM',
        startDate: '2024-04-05T16:00:00Z',
        endDate: '2024-04-05T16:05:00Z',
      },
    },
  ];

  for (const scenario of scenarios) {
    await prisma.scenario.create({
      data: {
        symbol: scenario.symbol,
        asset: scenario.asset,
        timeframe: scenario.timeframe,
        tickIntervalMs: scenario.tickIntervalMs,
        ticks: scenario.ticks as unknown as Prisma.InputJsonValue,
        metadata: scenario.metadata as unknown as Prisma.InputJsonValue,
      },
    });
    console.log(`✅ Created scenario: ${scenario.metadata.name}`);
  }

  console.log('');
  console.log('🎉 Database seeded successfully!');
  console.log(`   Created ${scenarios.length} scenarios`);
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
