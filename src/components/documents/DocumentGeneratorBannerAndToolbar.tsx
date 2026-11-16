import React from 'react';
import {
  FileText,
  Search,
  Plus,
  Database,
  RotateCcw,
  LayoutGrid,
  Table as TableIcon,
  FolderPlus,
} from 'lucide-react';
import { HumaanInnovation } from '../illustrations/HumaanIllustrations';

interface DocumentGeneratorBannerProps {
  totalDocumentsCount: number;
  todayRemindersCount?: number;
  isRestricted: boolean;
  isResettingTemplates: boolean;
  onOpenCreateTemplate: () => void;
  onResetTemplates: () => void;
  onOpenGenerateDoc: () => void;
}

export const DocumentGeneratorBanner: React.FC<DocumentGeneratorBannerProps> = ({
  totalDocumentsCount,
  todayRemindersCount = 0,
  isRestricted,
  isResettingTemplates,
  onOpenCreateTemplate,
  onResetTemplates,
  onOpenGenerateDoc,
}) => (
  <div className="bg-gradient-to-r from-[#2A7B76] via-[#216762] to-emerald-900 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
    <div className="space-y-2 z-10 w-full md:w-auto text-center md:text-left">
      <div className="flex items-center justify-center md:justify-start gap-2">
        <FileText className="h-5 w-5 text-emerald-200" />
        <h2 className="font-serif font-bold text-2xl md:text-3xl">Générateur de Documents RH & Contrats</h2>
      </div>
      <div className="flex items-center justify-center md:justify-start gap-2 flex-wrap">
        <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-xl text-xs font-semibold text-emerald-100 border border-white/15">
          <span>{totalDocumentsCount} document{totalDocumentsCount > 1 ? 's' : ''} archivé{totalDocumentsCount > 1 ? 's' : ''}</span>
        </div>
        {todayRemindersCount > 0 && (
          <div className="inline-flex items-center gap-1.5 bg-amber-400/20 px-3 py-1 rounded-xl text-xs font-bold text-amber-200 border border-amber-300/35 tabular-nums">
            <span>🔔 {todayRemindersCount} rappel{todayRemindersCount > 1 ? 's' : ''} / point{todayRemindersCount > 1 ? 's' : ''} aujourd'hui</span>
          </div>
        )}
      </div>
    </div>

    <div className="shrink-0 z-10 hidden sm:flex items-center justify-center">
      <HumaanInnovation className="w-40 h-28 md:w-48 md:h-32 drop-shadow-md" />
    </div>

    {!isRestricted && (
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 shrink-0 z-10 w-full md:w-auto">
        <button
          type="button"
          onClick={onOpenCreateTemplate}
          className="px-3.5 py-2.5 bg-white/15 hover:bg-white/25 backdrop-blur-xs text-white text-xs font-bold rounded-2xl transition flex items-center gap-1.5 border border-white/20 cursor-pointer shadow-xs active:scale-95"
          title="Créer un nouveau type de document RH stocké en base de données Supabase"
        >
          <FolderPlus className="h-4 w-4 text-emerald-200" />
          <span>Nouveau Modèle</span>
        </button>

        <button
          type="button"
          disabled={isResettingTemplates}
          onClick={onResetTemplates}
          className="px-3 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-xs text-white text-xs font-semibold rounded-2xl transition flex items-center gap-1.5 border border-white/15 cursor-pointer disabled:opacity-50 active:scale-95"
          title="Synchroniser les modèles RH en base Supabase"
        >
          <RotateCcw className={`h-3.5 w-3.5 ${isResettingTemplates ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Restaurer</span>
        </button>

        <button
          onClick={onOpenGenerateDoc}
          className="px-4 py-2.5 bg-[#D4A82F] hover:bg-[#b88f24] text-stone-900 text-xs font-extrabold rounded-2xl transition flex items-center gap-2 shrink-0 cursor-pointer shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>Générer un Document</span>
        </button>
      </div>
    )}
  </div>
);

interface DocumentGeneratorArchiveToolbarProps {
  isRestricted: boolean;
  effectiveCount: number;
  searchTerm: string;
  viewMode: 'grid' | 'table';
  onSearchChange: (val: string) => void;
  onToggleViewMode: (mode: 'grid' | 'table') => void;
}

export const DocumentGeneratorArchiveToolbar: React.FC<DocumentGeneratorArchiveToolbarProps> = ({
  isRestricted,
  effectiveCount,
  searchTerm,
  viewMode,
  onSearchChange,
  onToggleViewMode,
}) => (
  <>
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-stone-100 text-[#2A7B76] rounded-lg">
          <FileText className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <span>{isRestricted ? 'Mes Documents & Bulletins Archivés' : 'Archives des Documents Générés'}</span>
            <span className="bg-emerald-50 text-[#2A7B76] font-bold text-[10px] px-2 py-0.5 rounded-full border border-emerald-200">
              {effectiveCount} document(s)
            </span>
          </h3>
          <p className="text-[11px] text-stone-500">
            {isRestricted
              ? 'Consultation de vos documents officiels, attestations et contrats personnels'
              : 'Historique complet des documents RH officiels générés, enregistrés et scellés'}
          </p>
        </div>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
      <div className="relative w-full sm:max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
        <input
          type="text"
          placeholder="Rechercher dans les archives (titre, collaborateur, catégorie)..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
        />
      </div>

      <div className="flex items-center gap-3 justify-between sm:justify-end">
        <div className="flex items-center bg-stone-100 p-1 rounded-xl border border-stone-200/80">
          <button
            type="button"
            onClick={() => onToggleViewMode('table')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-white text-[#2A7B76] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Affichage en tableau (DataTable)"
          >
            <TableIcon className="h-3.5 w-3.5" />
            <span>Tableau</span>
          </button>
          <button
            type="button"
            onClick={() => onToggleViewMode('grid')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              viewMode === 'grid'
                ? 'bg-white text-[#2A7B76] shadow-xs'
                : 'text-stone-500 hover:text-stone-800'
            }`}
            title="Affichage en fiches (Cards)"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Cards</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-50 text-[#2A7B76] px-3 py-1.5 rounded-xl border border-emerald-200/60 font-semibold text-xs shrink-0">
          <Database className="h-3.5 w-3.5" />
          <span>{effectiveCount} document(s)</span>
        </div>
      </div>
    </div>
  </>
);
