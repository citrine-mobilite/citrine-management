import React from 'react';
import { AlertTriangle, CheckCircle2, Clock, AlertCircle, PlusCircle, ShieldAlert } from 'lucide-react';
import { soundService } from '../../services/soundService';

interface EmployeeIncidentsSummaryProps {
  totalCount: number;
  declaredCount: number;
  autoRetardCount: number;
  autoDepartCount: number;
  onOpenDeclareIncidentModal: () => void;
}

export const EmployeeIncidentsSummary: React.FC<EmployeeIncidentsSummaryProps> = ({
  totalCount,
  declaredCount,
  autoRetardCount,
  autoDepartCount,
  onOpenDeclareIncidentModal,
}) => (
  <>
    <div className="bg-gradient-to-r from-amber-700 via-emerald-800 to-stone-900 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="space-y-1 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <AlertTriangle className="h-5 w-5 text-amber-300" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-lg">Journal des Signalements &amp; Assiduité</h2>
            <p className="text-xs text-amber-100/80">Suivi en temps réel de vos retards, départs et justifications</p>
          </div>
        </div>
      </div>

      <button
        onClick={() => {
          try { soundService.playClick(); } catch {}
          onOpenDeclareIncidentModal();
        }}
        className="bg-white text-stone-900 hover:bg-amber-50 font-bold px-4 py-3 rounded-2xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer shrink-0 relative z-10"
      >
        <PlusCircle className="h-4 w-4 text-amber-700" />
        <span>Signaler un événement (Retard / Départ)</span>
      </button>
    </div>

    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs hover:border-amber-300 transition">
        <div className="flex items-center justify-between text-stone-500 mb-1 text-[11px] font-bold">
          <span>Total Signalements</span>
          <AlertCircle className="h-4 w-4 text-stone-400" />
        </div>
        <div className="text-2xl font-serif font-bold text-stone-900">{totalCount}</div>
        <p className="text-[10px] text-stone-400 mt-0.5">Historique complet</p>
      </div>

      <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200/80 shadow-2xs hover:border-emerald-300 transition">
        <div className="flex items-center justify-between text-emerald-800 mb-1 text-[11px] font-bold">
          <span>Signalés &amp; Justifiés</span>
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
        </div>
        <div className="text-2xl font-serif font-bold text-emerald-950">{declaredCount}</div>
        <p className="text-[10px] text-emerald-700 mt-0.5">Prévenus avant pointage</p>
      </div>

      <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 shadow-2xs hover:border-amber-300 transition">
        <div className="flex items-center justify-between text-amber-800 mb-1 text-[11px] font-bold">
          <span>Retards non justifiés</span>
          <Clock className="h-4 w-4 text-amber-600" />
        </div>
        <div className="text-2xl font-serif font-bold text-amber-950">{autoRetardCount}</div>
        <p className="text-[10px] text-amber-700 mt-0.5">Badgés sans déclaration</p>
      </div>

      <div className="bg-rose-50/70 p-4 rounded-2xl border border-rose-200/80 shadow-2xs hover:border-rose-300 transition">
        <div className="flex items-center justify-between text-rose-800 mb-1 text-[11px] font-bold">
          <span>Départs anticipés auto</span>
          <ShieldAlert className="h-4 w-4 text-rose-600" />
        </div>
        <div className="text-2xl font-serif font-bold text-rose-950">{autoDepartCount}</div>
        <p className="text-[10px] text-rose-700 mt-0.5">Parti avant l&apos;heure prévue</p>
      </div>
    </div>
  </>
);
