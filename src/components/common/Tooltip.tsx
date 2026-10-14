import React, { useState, useRef } from 'react';

interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  children: React.ReactElement;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  position = 'top',
  delay = 120,
  children,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<any>(null);

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom':
        return 'top-full left-1/2 -translate-x-1/2 mt-2';
      case 'left':
        return 'right-full top-1/2 -translate-y-1/2 mr-2';
      case 'right':
        return 'left-full top-1/2 -translate-y-1/2 ml-2';
      case 'top':
      default:
        return 'bottom-full left-1/2 -translate-x-1/2 mb-2';
    }
  };

  const getArrowClasses = () => {
    switch (position) {
      case 'bottom':
        return '-top-1 left-1/2 -translate-x-1/2 border-l border-t';
      case 'left':
        return '-right-1 top-1/2 -translate-y-1/2 border-r border-t';
      case 'right':
        return '-left-1 top-1/2 -translate-y-1/2 border-l border-b';
      case 'top':
      default:
        return '-bottom-1 left-1/2 -translate-x-1/2 border-r border-b';
    }
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && content && (
        <div
          role="tooltip"
          className={`absolute z-[999999] pointer-events-none transition-all duration-150 ease-out transform ${getPositionClasses()} animate-in fade-in-0 zoom-in-95`}
        >
          <div className="relative max-w-xs px-3 py-1.5 rounded-xl bg-stone-900/95 dark:bg-stone-950/95 text-white text-[11px] font-medium leading-relaxed tracking-tight shadow-2xl backdrop-blur-md border border-white/15 ring-1 ring-black/40 text-center whitespace-normal select-none">
            {/* Subtle glow accent */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-500/10 via-[#2A7B76]/15 to-teal-500/10 pointer-events-none" />
            
            <div className="relative z-10">{content}</div>

            {/* Pointer arrow */}
            <div
              className={`absolute w-2 h-2 rotate-45 bg-stone-900/95 dark:bg-stone-950/95 border-white/15 ${getArrowClasses()}`}
            />
          </div>
        </div>
      )}
    </div>
  );
};
