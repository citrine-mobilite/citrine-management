import React, { useState, useEffect, useRef } from 'react';

interface TooltipState {
  text: string;
  x: number;
  y: number;
  placement: 'top' | 'bottom';
  visible: boolean;
}

export const GlobalTooltipContainer: React.FC = () => {
  const [tooltip, setTooltip] = useState<TooltipState>({
    text: '',
    x: 0,
    y: 0,
    placement: 'top',
    visible: false,
  });

  const timerRef = useRef<any>(null);
  const currentTargetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-tooltip], [title]') as HTMLElement | null;
      if (!target) return;

      // Extract tooltip text
      let text = target.getAttribute('data-tooltip');
      if (!text && target.hasAttribute('title')) {
        text = target.getAttribute('title');
        if (text) {
          // Temporarily store in data-native-title and clear title to suppress browser native tooltip
          target.setAttribute('data-native-title', text);
          target.removeAttribute('title');
        }
      }

      if (!text || !text.trim()) return;

      currentTargetRef.current = target;

      clearTimeout(timerRef.current);
      // Fast, comfortable delay (120ms) for snappy, non-sluggish appearance
      timerRef.current = setTimeout(() => {
        if (!currentTargetRef.current) return;
        const rect = currentTargetRef.current.getBoundingClientRect();
        const placement = rect.top < 50 ? 'bottom' : 'top';
        const x = rect.left + rect.width / 2;
        const y = placement === 'top' ? rect.top - 8 : rect.bottom + 8;

        setTooltip({
          text: text!.trim(),
          x,
          y,
          placement,
          visible: true,
        });
      }, 120);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest('[data-tooltip], [data-native-title]') as HTMLElement | null;
      if (target) {
        // Restore title if it was temporarily removed
        const originalTitle = target.getAttribute('data-native-title');
        if (originalTitle && !target.hasAttribute('title')) {
          target.setAttribute('title', originalTitle);
          target.removeAttribute('data-native-title');
        }
      }

      clearTimeout(timerRef.current);
      currentTargetRef.current = null;
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    const handleScrollOrClick = () => {
      clearTimeout(timerRef.current);
      currentTargetRef.current = null;
      setTooltip((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    };

    document.addEventListener('mouseover', handleMouseOver, { passive: true });
    document.addEventListener('mouseout', handleMouseOut, { passive: true });
    window.addEventListener('scroll', handleScrollOrClick, { passive: true, capture: true });
    document.addEventListener('click', handleScrollOrClick, { passive: true });

    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      window.removeEventListener('scroll', handleScrollOrClick, { capture: true });
      document.removeEventListener('click', handleScrollOrClick);
    };
  }, []);

  if (!tooltip.visible || !tooltip.text) return null;

  return (
    <div
      className={`fixed z-[999999] pointer-events-none transition-all duration-150 ease-out transform -translate-x-1/2 ${
        tooltip.placement === 'top' ? '-translate-y-full mb-1' : 'translate-y-0 mt-1'
      } ${tooltip.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
      style={{
        left: `${tooltip.x}px`,
        top: `${tooltip.y}px`,
      }}
    >
      <div className="relative max-w-xs sm:max-w-sm px-3 py-1.5 rounded-xl bg-stone-900/95 dark:bg-stone-950/95 text-white text-[11px] font-medium leading-relaxed tracking-tight shadow-2xl backdrop-blur-md border border-white/15 ring-1 ring-black/40 text-center select-none">
        {/* Glow accent */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 via-[#2A7B76]/15 to-teal-500/10 pointer-events-none" />
        
        <span className="relative z-10 block">{tooltip.text}</span>

        {/* Pointer Arrow */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-stone-900/95 dark:bg-stone-950/95 border-white/15 ${
            tooltip.placement === 'top'
              ? 'bottom-[-4px] border-r border-b'
              : 'top-[-4px] border-l border-t'
          }`}
        />
      </div>
    </div>
  );
};
