import React from 'react';
import { ComplianceAxis, ComplianceMetrics } from '../../types/complianceTypes';

interface ComplianceKpiStripProps {
  metrics: ComplianceMetrics;
  activeAxis: 'all' | ComplianceAxis;
  onSelectAxis: (axis: 'all' | ComplianceAxis) => void;
  loading?: boolean;
}

export const ComplianceKpiStrip: React.FC<ComplianceKpiStripProps> = ({
  metrics,
  activeAxis,
  onSelectAxis,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="bg-white border border-stone-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200">
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="p-5 space-y-2.5 animate-pulse">
            <div className="h-3.5 w-28 bg-stone-200 rounded" />
            <div className="h-6 w-24 bg-stone-200 rounded" />
            <div className="h-3 w-40 bg-stone-100 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const inProgressSubCount =
    metrics.enCoursCount + metrics.partiellementConformeCount + metrics.aVerifierCount;
  const blockedSubCount = metrics.subNonConformeCount + metrics.nonExistantCount;

  return (
    <div className="space-y-3">
      {/* 4-Column Main Metrics Strip */}
      <section
        aria-label="Indicateurs de conformité ANTIC"
        className="bg-white border border-stone-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-stone-200"
      >
        <div className="p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-stone-500">Conformité Globale</span>
          <p className="text-2xl font-bold text-stone-900 font-mono tabular-nums">
            {metrics.readinessPercent}%
          </p>
          <p className="text-xs text-stone-500 tabular-nums">
            {metrics.conformeCount} / {metrics.totalItems} exigences conformes
          </p>
        </div>

        <div className="p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-stone-500">Grands Éléments (Auto)</span>
          <div className="flex items-baseline gap-3">
            <p className="text-2xl font-bold text-[#16A34A] font-mono tabular-nums">
              {metrics.conformeCount}
            </p>
            <span className="text-xs text-stone-400">vs</span>
            <p className="text-lg font-bold text-[#DC2626] font-mono tabular-nums">
              {metrics.nonConformeCount}
            </p>
          </div>
          <p className="text-xs text-stone-500 tabular-nums">
            {metrics.conformeCount} conformes · {metrics.nonConformeCount} non conformes
          </p>
        </div>

        <div className="p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-stone-500">Sous-éléments Conformes</span>
          <p className="text-2xl font-bold text-[#2A7B76] font-mono tabular-nums">
            {metrics.subItemsDone} / {metrics.subItemsApplicable}
          </p>
          <p className="text-xs text-stone-500 tabular-nums">
            {inProgressSubCount} en cours / partiels / à vérifier
          </p>
        </div>

        <div className="p-5 flex flex-col justify-between gap-1.5">
          <span className="text-xs font-medium text-stone-500">Écarts &amp; À initier</span>
          <p
            className={`text-2xl font-bold font-mono tabular-nums ${
              blockedSubCount > 0 ? 'text-[#DC2626]' : 'text-stone-900'
            }`}
          >
            {blockedSubCount}
          </p>
          <p className="text-xs text-stone-500 tabular-nums">
            {metrics.aPreparerCount} à initier · {metrics.nonApplicableCount} N/A
          </p>
        </div>
      </section>

      {/* Per-Axis Quick Readiness Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {metrics.byAxis.map((axisStat) => {
          const isSelected = activeAxis === axisStat.axis;
          return (
            <button
              key={axisStat.axis}
              type="button"
              onClick={() => onSelectAxis(isSelected ? 'all' : axisStat.axis)}
              className={`text-left p-3 rounded-xl border transition cursor-pointer ${
                isSelected
                  ? 'bg-[#2A7B76]/8 border-[#2A7B76] text-stone-900'
                  : 'bg-white border-stone-200 hover:border-stone-300 text-stone-700'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#2A7B76] font-mono">
                  Axe {axisStat.shortCode}
                </span>
                <span className="text-xs font-bold font-mono tabular-nums text-stone-900">
                  {axisStat.readinessPercent}%
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-stone-800 truncate">
                {axisStat.label.replace(/^[0A-E]\.\s*/, '')}
              </p>
              <div className="mt-2 h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#2A7B76] rounded-full transition-all duration-300"
                  style={{ width: `${axisStat.readinessPercent}%` }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-stone-500 tabular-nums">
                {axisStat.conformeCount}/{axisStat.totalItems} conformes · {axisStat.subItemsDone}/{axisStat.subItemsApplicable} sous-élém.
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
