'use client';

import { useEffect, useRef } from 'react';

interface Candle {
  x: number;
  open: number;
  close: number;
  high: number;
  low: number;
  color: string;
}

export function AnimatedChartBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let candles: Candle[] = [];
    let offset = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    const generateCandle = (x: number, prevClose: number): Candle => {
      const volatility = 0.02;
      const trend = Math.random() > 0.5 ? 1 : -1;
      const change = prevClose * volatility * Math.random() * trend;
      
      const open = prevClose;
      const close = prevClose + change;
      const high = Math.max(open, close) + Math.abs(change) * Math.random();
      const low = Math.min(open, close) - Math.abs(change) * Math.random();
      
      return {
        x,
        open,
        close,
        high,
        low,
        color: close >= open ? '#22c55e' : '#ef4444',
      };
    };

    const initCandles = () => {
      candles = [];
      const spacing = 30;
      const numCandles = Math.ceil(canvas.width / spacing) + 10;
      let price = canvas.height / 2;

      for (let i = 0; i < numCandles; i++) {
        const candle = generateCandle(i * spacing, price);
        candles.push(candle);
        price = candle.close;
      }
    };

    const drawCandle = (candle: Candle, offsetX: number) => {
      const candleWidth = 12;
      const wickWidth = 2;
      const x = candle.x - offsetX;
      const baseY = canvas.height / 2;
      const scale = 2;

      // Skip if off screen
      if (x < -candleWidth || x > canvas.width + candleWidth) return;

      ctx.globalAlpha = 0.15;
      ctx.fillStyle = candle.color;
      ctx.strokeStyle = candle.color;

      // Draw wick
      ctx.beginPath();
      ctx.rect(
        x - wickWidth / 2,
        baseY - (candle.high - canvas.height / 2) * scale,
        wickWidth,
        (candle.high - candle.low) * scale
      );
      ctx.fill();

      // Draw body
      const bodyTop = Math.max(candle.open, candle.close);
      const bodyBottom = Math.min(candle.open, candle.close);
      const bodyHeight = Math.max((bodyTop - bodyBottom) * scale, 2);

      ctx.beginPath();
      ctx.rect(
        x - candleWidth / 2,
        baseY - (bodyTop - canvas.height / 2) * scale,
        candleWidth,
        bodyHeight
      );
      ctx.fill();
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.03)';
      ctx.lineWidth = 1;
      
      const gridSize = 40;
      for (let x = -offset % gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Draw candles
      candles.forEach((candle) => drawCandle(candle, offset));

      // Update offset
      offset += 0.5;

      // Add new candles as needed
      const lastCandle = candles[candles.length - 1];
      if (lastCandle && lastCandle.x - offset < canvas.width + 100) {
        const spacing = 30;
        const newCandle = generateCandle(lastCandle.x + spacing, lastCandle.close);
        candles.push(newCandle);
      }

      // Remove old candles
      candles = candles.filter((c) => c.x - offset > -100);

      animationId = requestAnimationFrame(draw);
    };

    resize();
    initCandles();
    draw();

    window.addEventListener('resize', () => {
      resize();
      initCandles();
    });

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ background: 'transparent' }}
    />
  );
}
