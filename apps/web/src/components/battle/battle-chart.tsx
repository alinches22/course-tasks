'use client';

import { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

interface Tick {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface BattleChartProps {
  ticks: Tick[];
  className?: string;
}

export function BattleChart({ ticks, className }: BattleChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ticks.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear canvas
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, width, height);

    // Calculate price range
    const prices = ticks.flatMap((t) => [t.high, t.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.1;

    const scaleY = (price: number) =>
      padding.top + chartHeight - ((price - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;

    // Draw grid
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice + pricePadding - ((priceRange + pricePadding * 2) / 5) * i;
      ctx.fillStyle = '#71717a';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), width - padding.right + 5, y + 4);
    }

    // Draw candles
    const candleWidth = Math.max(2, Math.min(12, (chartWidth / ticks.length) * 0.7));
    const gap = (chartWidth - candleWidth * ticks.length) / (ticks.length + 1);

    ticks.forEach((tick, index) => {
      const x = padding.left + gap + index * (candleWidth + gap) + candleWidth / 2;
      const isGreen = tick.close >= tick.open;

      // Wick
      ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, scaleY(tick.high));
      ctx.lineTo(x, scaleY(tick.low));
      ctx.stroke();

      // Body
      const bodyTop = scaleY(Math.max(tick.open, tick.close));
      const bodyBottom = scaleY(Math.min(tick.open, tick.close));
      const bodyHeight = Math.max(1, bodyBottom - bodyTop);

      ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Draw current price line
    const lastTick = ticks[ticks.length - 1];
    if (lastTick) {
      const y = scaleY(lastTick.close);
      const isGreen = lastTick.close >= lastTick.open;

      ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Price tag
      ctx.fillStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.fillRect(width - padding.right, y - 10, 55, 20);
      ctx.fillStyle = '#0a0a0b';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(lastTick.close.toFixed(2), width - padding.right + 27, y + 4);
    }
  }, [ticks]);

  return (
    <div className={cn('relative bg-background-primary rounded-xl border border-border overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
      {ticks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-text-muted">Waiting for price data...</p>
        </div>
      )}
    </div>
  );
}
