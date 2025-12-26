'use client';

interface ReplayTimelineProps {
  totalTicks: number;
  currentIndex: number;
  onSeek: (index: number) => void;
  isPlaying: boolean;
  onPlayPause: () => void;
}

export function ReplayTimeline({
  totalTicks,
  currentIndex,
  onSeek,
  isPlaying,
  onPlayPause,
}: ReplayTimelineProps) {
  const progress = totalTicks > 0 ? ((currentIndex + 1) / totalTicks) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      {/* Play/Pause button */}
      <button
        onClick={onPlayPause}
        className="w-10 h-10 rounded-full bg-surface hover:bg-surface-hover flex items-center justify-center transition-colors"
      >
        {isPlaying ? (
          <svg className="w-5 h-5 text-text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-text-primary ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Timeline */}
      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={totalTicks - 1}
          value={currentIndex}
          onChange={(e) => onSeek(parseInt(e.target.value))}
          className="w-full h-2 bg-surface rounded-full appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:bg-accent-green
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg"
          style={{
            background: `linear-gradient(to right, #22c55e ${progress}%, #27272a ${progress}%)`,
          }}
        />
      </div>

      {/* Tick counter */}
      <div className="text-sm text-text-secondary font-mono min-w-[80px] text-right">
        {currentIndex + 1} / {totalTicks}
      </div>
    </div>
  );
}
