import React, { useState, useRef } from 'react';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { haptic } from '../services/hapticService';
import { offlineService } from '../services/offlineService';
import { playSuccessChime } from '../utils/audioChime';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh?: () => Promise<void> | void;
}

export default function PullToRefreshContainer({ children, onRefresh }: PullToRefreshProps) {
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const startYRef = useRef<number | null>(null);
  const THRESHOLD = 70;

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only trigger if scroll position is at the top
    if (window.scrollY === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startYRef.current === null || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startYRef.current;

    if (diff > 0) {
      // Resistance factor for fluid pull feel
      const resistance = Math.min(diff * 0.45, 100);
      setPullY(resistance);
    }
  };

  const handleTouchEnd = async () => {
    if (startYRef.current === null) return;

    if (pullY >= THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      haptic.light();

      try {
        // Trigger manual queue flush & connection check
        await offlineService.syncOfflineQueue();
        if (onRefresh) {
          await onRefresh();
        }
        haptic.success();
        playSuccessChime();
        setSyncSuccess(true);
        setTimeout(() => setSyncSuccess(false), 2500);
      } catch {
        haptic.warning();
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullY(0);
    startYRef.current = null;
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative min-h-full"
    >
      {/* Pull indicator bar */}
      <div 
        style={{ height: `${pullY}px` }}
        className="w-full flex items-center justify-center overflow-hidden transition-all duration-150 text-stone-500"
      >
        <div className="flex items-center gap-2 text-xs font-bold bg-white dark:bg-stone-800 px-4 py-1.5 rounded-full shadow-md border border-stone-200 dark:border-stone-700">
          <RefreshCw 
            className={`h-4 w-4 text-green-600 ${pullY >= THRESHOLD || isRefreshing ? 'animate-spin' : ''}`} 
          />
          <span className="text-[11px] text-stone-700 dark:text-stone-200">
            {isRefreshing 
              ? 'Vérification de la synchronisation Firestore...' 
              : pullY >= THRESHOLD 
                ? 'Relâcher pour synchroniser' 
                : 'Tirer vers le bas pour rafraîchir'
            }
          </span>
        </div>
      </div>

      {/* Sync Success Badge */}
      {syncSuccess && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="h-4 w-4" />
          <span>Base de données Firestore synchronisée !</span>
        </div>
      )}

      {children}
    </div>
  );
}
