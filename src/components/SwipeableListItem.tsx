import React, { useState, useRef } from 'react';
import { Check, Trash2, Archive } from 'lucide-react';
import { haptic } from '../services/hapticService';
import { playSuccessChime, playWarningChime } from '../utils/audioChime';

interface SwipeableListItemProps {
  key?: React.Key;
  children: React.ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
  className?: string;
}

export default function SwipeableListItem({
  children,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = 'Terminé',
  leftLabel = 'Archiver',
  className = ''
}: SwipeableListItemProps) {
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const startXRef = useRef<number | null>(null);
  const THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - startXRef.current;
    
    // Limit max swipe distance
    if (diff > 0 && onSwipeRight) {
      setOffsetX(Math.min(diff, 120));
    } else if (diff < 0 && onSwipeLeft) {
      setOffsetX(Math.max(diff, -120));
    }
  };

  const handleTouchEnd = () => {
    if (startXRef.current === null) return;

    if (offsetX >= THRESHOLD && onSwipeRight) {
      haptic.success();
      playSuccessChime();
      onSwipeRight();
    } else if (offsetX <= -THRESHOLD && onSwipeLeft) {
      haptic.warning();
      playWarningChime();
      onSwipeLeft();
    }

    setOffsetX(0);
    setIsSwiping(false);
    startXRef.current = null;
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl select-none ${className}`}>
      {/* Background action indicators */}
      <div className="absolute inset-0 flex items-center justify-between px-4 text-xs font-bold pointer-events-none">
        {/* Left side background (triggered when swiping right) */}
        <div 
          className={`h-full w-full absolute left-0 top-0 bg-emerald-600 text-white flex items-center justify-start pl-4 gap-2 transition-opacity ${
            offsetX > 20 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Check className="h-5 w-5 stroke-[3]" />
          <span>{rightLabel}</span>
        </div>

        {/* Right side background (triggered when swiping left) */}
        <div 
          className={`h-full w-full absolute right-0 top-0 bg-green-600 text-white flex items-center justify-end pr-4 gap-2 transition-opacity ${
            offsetX < -20 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <span>{leftLabel}</span>
          <Archive className="h-5 w-5" />
        </div>
      </div>

      {/* Foreground swipable content card */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: isSwiping ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
        }}
        className="relative z-10 bg-white dark:bg-stone-900"
      >
        {children}
      </div>
    </div>
  );
}
