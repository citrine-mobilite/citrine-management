import React from 'react';

interface ModuleSkeletonProps {
  title?: string;
  type?: 'dashboard' | 'panel' | 'modal';
}

export default function ModuleSkeletonLoader({ title = 'Chargement du module...', type = 'panel' }: ModuleSkeletonProps) {
  if (type === 'modal') {
    return (
      <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-md shadow-2xl border border-stone-200 dark:border-stone-800 text-center space-y-4 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-950/60 mx-auto flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="h-5 bg-stone-200 dark:bg-stone-800 rounded-lg w-3/4 mx-auto" />
          <div className="h-4 bg-stone-100 dark:bg-stone-800/60 rounded-lg w-1/2 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-pulse p-4 md:p-6 bg-white dark:bg-stone-900/80 rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-sm">
      {/* Header skeleton */}
      <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
        <div className="space-y-2">
          <div className="h-6 w-48 bg-stone-200 dark:bg-stone-800 rounded-lg" />
          <div className="h-4 w-72 bg-stone-100 dark:bg-stone-800/60 rounded-lg" />
        </div>
        <div className="h-9 w-28 bg-green-100/60 dark:bg-green-950/40 rounded-xl" />
      </div>

      {/* Grid items skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 bg-stone-50 dark:bg-stone-800/40 rounded-2xl border border-stone-100 dark:border-stone-800 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <div className="h-4 w-20 bg-stone-200 dark:bg-stone-700 rounded" />
              <div className="h-8 w-8 bg-stone-200 dark:bg-stone-700 rounded-xl" />
            </div>
            <div className="h-7 w-24 bg-stone-300 dark:bg-stone-600 rounded" />
          </div>
        ))}
      </div>

      {/* Main content body skeleton */}
      <div className="h-64 bg-stone-50 dark:bg-stone-800/30 rounded-2xl border border-stone-100 dark:border-stone-800 p-4 flex flex-col justify-center items-center gap-3">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium text-stone-500 dark:text-stone-400">{title}</span>
      </div>
    </div>
  );
}
