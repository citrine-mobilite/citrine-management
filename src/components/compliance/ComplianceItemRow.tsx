import React from 'react';
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock,
  ExternalLink,
  FileEdit,
  MinusCircle,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { ComplianceChecklistItem } from '../../types/complianceTypes';
import { getComplianceStatusMeta } from '../../utils/complianceHelpers';

interface ComplianceItemRowProps {
  item: ComplianceChecklistItem;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggleSubItem: (item: ComplianceChecklistItem, subItemId: string) => void;
  onOpenEdit: (item: ComplianceChecklistItem) => void;
  onNavigateCitrineTab?: (tab: string) => void;
  savingItemId?: string | null;
}

function renderStatusIcon(status: ComplianceChecklistItem['status']) {
  switch (status) {
    case 'conforme':
      return <CheckCircle2 className="h-4 w-4 text-[#16A34A] shrink-0" />;
    case 'en_cours':
      return <Clock className="h-4 w-4 text-[#D97706] shrink-0" />;
    case 'non_existant':
      return <AlertCircle className="h-4 w-4 text-[#DC2626] shrink-0" />;
    case 'non_applicable':
      return <MinusCircle className="h-4 w-4 text-stone-400 shrink-0" />;
    default:
      return <CircleDashed className="h-4 w-4 text-stone-400 shrink-0" />;
  }
}

export const ComplianceItemRow: React.FC<ComplianceItemRowProps> = ({
  item,
  isExpanded,
  onToggleExpand,
  onToggleSubItem,
  onOpenEdit,
  onNavigateCitrineTab,
  savingItemId,
}) => {
  const statusMeta = getComplianceStatusMeta(item.status);
  const subItems = item.subItems || [];
  const doneSubs = subItems.filter((s) => s.completed).length;
  const isSaving = savingItemId === item.id;

  return (
    <div className="bg-white border border-stone-200 rounded-xl transition-colors hover:border-stone-300">
      <div className="p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-3">
        {/* Left: Code, Title & Quiet Metadata */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-xs font-mono font-bold text-[#2A7B76] shrink-0">
              {item.controlCode}
            </span>
            <h4 className="text-sm font-semibold text-stone-900 leading-snug">
              {item.title}
            </h4>
            {item.conditionalIfApplicable && (
              <span className="text-[11px] font-medium text-stone-500 italic">
                (Le cas échéant)
              </span>
            )}
          </div>

          {item.description && (
            <p className="text-xs text-stone-600 leading-relaxed">{item.description}</p>
          )}

          {/* Clean unboxed metadata separated by typographic dots */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500 pt-0.5">
            <span className={`inline-flex items-center gap-1 font-semibold ${statusMeta.textClass}`}>
              {renderStatusIcon(item.status)}
              <span>{statusMeta.label}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Sous-livrables : <strong className="text-stone-700 font-mono">{doneSubs}/{subItems.length}</strong>
            </span>
            {item.ownerName && (
              <>
                <span aria-hidden="true">·</span>
                <span>Responsable : <strong className="text-stone-700 font-medium">{item.ownerName}</strong></span>
              </>
            )}
            {item.documentVersion && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono">Version {item.documentVersion}</span>
              </>
            )}
            {item.documentDate && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">{item.documentDate}</span>
              </>
            )}
            {item.confidentiality && (
              <>
                <span aria-hidden="true">·</span>
                <span>{item.confidentiality}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: Single-line functional actions */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {item.citrineModuleHint && onNavigateCitrineTab && (
            <button
              type="button"
              onClick={() => onNavigateCitrineTab(item.citrineModuleHint!.tab)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#2A7B76] bg-emerald-50/70 hover:bg-emerald-50 border border-emerald-200/80 rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer"
              title={`Ouvrir le module ${item.citrineModuleHint.label} dans Citrine`}
            >
              <span>{item.citrineModuleHint.label}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          )}

          {item.evidenceUrl && (
            <a
              href={item.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition whitespace-nowrap shrink-0"
              title="Ouvrir le document ou la preuve liée"
            >
              <span>Preuve</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {subItems.length > 0 && (
            <button
              type="button"
              aria-expanded={isExpanded}
              onClick={() => onToggleExpand(item.id)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-stone-700 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span className="tabular-nums">Sous-éléments ({doneSubs}/{subItems.length})</span>
              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}

          <button
            type="button"
            onClick={() => onOpenEdit(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#22625E] rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <FileEdit className="h-3.5 w-3.5" />
            <span>Renseigner</span>
          </button>
        </div>
      </div>

      {/* Expandable Granular Sub-Items Checklist */}
      {isExpanded && subItems.length > 0 && (
        <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-3 space-y-2 rounded-b-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
            <span>Sous-éléments &amp; livrables attendus</span>
            {isSaving && <span className="text-[#2A7B76]">Enregistrement...</span>}
          </div>
          <ul className="space-y-1.5">
            {subItems.map((sub) => (
              <li key={sub.id}>
                <label className="flex items-start gap-2.5 py-1 px-2 rounded-lg hover:bg-white transition cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={Boolean(sub.completed)}
                    disabled={isSaving}
                    onChange={() => onToggleSubItem(item, sub.id)}
                    className="mt-0.5 h-4 w-4 rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76] cursor-pointer"
                  />
                  <span
                    className={`text-xs leading-relaxed ${
                      sub.completed ? 'line-through text-stone-400' : 'text-stone-700'
                    }`}
                  >
                    {sub.label}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
