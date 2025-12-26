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

interface Action {
  userId: string;
  type: 'BUY' | 'SELL' | 'CLOSE';
  tickIndex: number;
  price: number;
}

interface ReplayChartProps {
  ticks: Tick[];
  actions: Action[];
  currentIndex: number;
  className?: string;
}

export function ReplayChart({ ticks, actions, currentIndex, className }: ReplayChartProps) {
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
    const visibleTicks = ticks.slice(0, currentIndex + 1);
    const prices = visibleTicks.flatMap((t) => [t.high, t.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const pricePadding = priceRange * 0.1;

    const scaleY = (price: number) =>
      padding.top + chartHeight - ((price - minPrice + pricePadding) / (priceRange + pricePadding * 2)) * chartHeight;

    // Draw grid
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      const price = maxPrice + pricePadding - ((priceRange + pricePadding * 2) / 5) * i;
      ctx.fillStyle = '#71717a';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(price.toFixed(2), width - padding.right + 5, y + 4);
    }

    // Draw candles
    const candleWidth = Math.max(2, Math.min(12, (chartWidth / ticks.length) * 0.7));
    const gap = (chartWidth - candleWidth * ticks.length) / (ticks.length + 1);

    visibleTicks.forEach((tick, index) => {
      const x = padding.left + gap + index * (candleWidth + gap) + candleWidth / 2;
      const isGreen = tick.close >= tick.open;
      const isCurrent = index === currentIndex;

      // Wick
      ctx.strokeStyle = isGreen ? '#22c55e' : '#ef4444';
      ctx.globalAlpha = isCurrent ? 1 : 0.7;
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

      // Draw action markers
      const actionAtTick = actions.filter((a) => a.tickIndex === index);
      actionAtTick.forEach((action) => {
        ctx.globalAlpha = 1;
        
        if (action.type === 'CLOSE') {
          // Draw X marker for CLOSE
          const markerY = scaleY(tick.close);
          ctx.strokeStyle = '#eab308'; // yellow
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(x - 5, markerY - 5);
          ctx.lineTo(x + 5, markerY + 5);
          ctx.moveTo(x + 5, markerY - 5);
          ctx.lineTo(x - 5, markerY + 5);
          ctx.stroke();
        } else {
          const markerY = action.type === 'BUY' ? scaleY(tick.low) + 20 : scaleY(tick.high) - 20;
          ctx.fillStyle = action.type === 'BUY' ? '#22c55e' : '#ef4444';
          ctx.beginPath();
          if (action.type === 'BUY') {
            ctx.moveTo(x, markerY - 8);
            ctx.lineTo(x - 6, markerY + 4);
            ctx.lineTo(x + 6, markerY + 4);
          } else {
            ctx.moveTo(x, markerY + 8);
            ctx.lineTo(x - 6, markerY - 4);
            ctx.lineTo(x + 6, markerY - 4);
          }
          ctx.closePath();
          ctx.fill();
        }
      });
    });

    ctx.globalAlpha = 1;

    // Draw current position indicator
    if (currentIndex < ticks.length) {
      const x = padding.left + gap + currentIndex * (candleWidth + gap) + candleWidth / 2;
      
      ctx.strokeStyle = '#ffffff';
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [ticks, actions, currentIndex]);

  return (
    <div className={cn('relative bg-background-primary rounded-xl border border-border overflow-hidden', className)}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ display: 'block' }}
      />
    </div>
  );
}
