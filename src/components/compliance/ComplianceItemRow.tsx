import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  FileEdit,
  MessageSquare,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Employee } from '../../types';
import {
  ComplianceChecklistItem,
  ComplianceSubItemStatus,
} from '../../types/complianceTypes';
import {
  COMPLIANCE_STATUS_OPTIONS,
  computeParentComplianceStatus,
  getComplianceStatusMeta,
  resolveEmployeeFunction,
  resolveSubItemStatus,
} from '../../utils/complianceHelpers';

interface ComplianceItemRowProps {
  item: ComplianceChecklistItem;
  employees?: Employee[];
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onSubItemStatusChange: (
    item: ComplianceChecklistItem,
    subItemId: string,
    nextStatus: ComplianceSubItemStatus
  ) => void;
  onAddSubItemComment: (
    item: ComplianceChecklistItem,
    subItemId: string,
    text: string
  ) => Promise<void>;
  onDeleteSubItemComment: (
    item: ComplianceChecklistItem,
    subItemId: string,
    commentId: string
  ) => Promise<void>;
  onOpenEdit: (item: ComplianceChecklistItem) => void;
  onNavigateCitrineTab?: (tab: string) => void;
  savingItemId?: string | null;
}

export const ComplianceItemRow: React.FC<ComplianceItemRowProps> = ({
  item,
  employees = [],
  isExpanded,
  onToggleExpand,
  onSubItemStatusChange,
  onAddSubItemComment,
  onDeleteSubItemComment,
  onOpenEdit,
  onNavigateCitrineTab,
  savingItemId,
}) => {
  const [openCommentSubIds, setOpenCommentSubIds] = useState<Set<string>>(() => new Set());
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [submittingSubId, setSubmittingSubId] = useState<string | null>(null);

  const subItems = item.subItems || [];
  const parentStatus = computeParentComplianceStatus(subItems, item.status);
  const parentMeta = getComplianceStatusMeta(parentStatus);

  const applicableSubs = subItems.filter((s) => resolveSubItemStatus(s) !== 'non_applicable');
  const conformeSubsCount = applicableSubs.filter(
    (s) => resolveSubItemStatus(s) === 'conforme'
  ).length;
  const isSaving = savingItemId === item.id;

  // Automatically resolve collaborator's function from Employee record if assigned
  const matchedEmployee = item.ownerEmployeeId
    ? employees.find((e) => e.id === item.ownerEmployeeId)
    : item.ownerName
      ? employees.find((e) => e.name.toLowerCase() === item.ownerName!.toLowerCase())
      : undefined;
  const resolvedRole = item.ownerRole || resolveEmployeeFunction(matchedEmployee);

  const toggleSubCommentDrawer = (subId: string) => {
    setOpenCommentSubIds((prev) => {
      const next = new Set(prev);
      if (next.has(subId)) next.delete(subId);
      else next.add(subId);
      return next;
    });
  };

  const handleSubmitSubComment = async (e: React.FormEvent, subId: string) => {
    e.preventDefault();
    const text = (commentDrafts[subId] || '').trim();
    if (!text || submittingSubId === subId) return;
    setSubmittingSubId(subId);
    try {
      await onAddSubItemComment(item, subId, text);
      setCommentDrafts((prev) => ({ ...prev, [subId]: '' }));
    } finally {
      setSubmittingSubId(null);
    }
  };

  return (
    <div className="bg-white border border-stone-200 rounded-xl transition-colors hover:border-stone-300">
      {/* Parent Requirement Header (Automatic Binary Status: Conforme / Non conforme) */}
      <div className="p-4 flex flex-col lg:flex-row lg:items-start justify-between gap-3">
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

          {/* Parent Metadata */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-stone-500 pt-0.5">
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-semibold ${parentMeta.surfaceClass} ${parentMeta.borderClass} ${parentMeta.textClass}`}
              title="Statut calculé automatiquement selon l'état des sous-éléments"
            >
              {parentStatus === 'conforme' ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <XCircle className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>{parentMeta.label}</span>
            </span>

            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Sous-éléments :{' '}
              <strong className="text-stone-800 font-mono">
                {conformeSubsCount}/{applicableSubs.length}
              </strong>{' '}
              conformes
            </span>

            {item.ownerName && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Responsable :{' '}
                  <strong className="text-stone-800 font-medium">{item.ownerName}</strong>
                  {resolvedRole && (
                    <span className="text-stone-500"> ({resolvedRole})</span>
                  )}
                </span>
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

        {/* Parent Action Buttons */}
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
              <span className="tabular-nums">
                Sous-éléments ({conformeSubsCount}/{subItems.length})
              </span>
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

      {/* Expanded Sub-Elements List (Always expanded by default — status & comments live here) */}
      {isExpanded && subItems.length > 0 && (
        <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-3 space-y-2 rounded-b-xl">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
            <span>Sous-éléments, statuts détaillés &amp; commentaires</span>
            {isSaving && <span className="text-[#2A7B76]">Enregistrement...</span>}
          </div>

          <ul className="space-y-2">
            {subItems.map((sub) => {
              const subStatus = resolveSubItemStatus(sub);
              const subMeta = getComplianceStatusMeta(subStatus);
              const subComments = sub.comments || [];
              const isCommentsOpen = openCommentSubIds.has(sub.id);
              const draft = commentDrafts[sub.id] || '';
              const isPosting = submittingSubId === sub.id;

              return (
                <li
                  key={sub.id}
                  className="bg-white border border-stone-200/90 rounded-lg p-2.5 space-y-2"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    {/* Sub-item title + status dot */}
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      <span
                        className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${subMeta.dotClass}`}
                        aria-hidden="true"
                      />
                      <span
                        className={`text-xs leading-relaxed ${
                          subStatus === 'non_applicable'
                            ? 'line-through text-stone-400'
                            : subStatus === 'conforme'
                              ? 'text-stone-800 font-medium'
                              : 'text-stone-700'
                        }`}
                      >
                        {sub.label}
                      </span>
                    </div>

                    {/* Sub-item controls: Status selector + Comment button */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pl-4 md:pl-0">
                      <select
                        aria-label={`Statut du sous-élément ${sub.label}`}
                        value={subStatus}
                        disabled={isSaving}
                        onChange={(e) =>
                          onSubItemStatusChange(
                            item,
                            sub.id,
                            e.target.value as ComplianceSubItemStatus
                          )
                        }
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border focus:outline-none focus:ring-1 focus:ring-[#2A7B76] cursor-pointer ${subMeta.surfaceClass} ${subMeta.borderClass} ${subMeta.textClass}`}
                      >
                        {COMPLIANCE_STATUS_OPTIONS.map((opt) => (
                          <option
                            key={opt.value}
                            value={opt.value}
                            className="bg-white text-stone-800"
                          >
                            {opt.label}
                          </option>
                        ))}
                      </select>

                      <button
                        type="button"
                        aria-expanded={isCommentsOpen}
                        onClick={() => toggleSubCommentDrawer(sub.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium border rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
                          isCommentsOpen || subComments.length > 0
                            ? 'text-[#2A7B76] bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200'
                            : 'text-stone-600 bg-stone-50 hover:bg-stone-100 border-stone-200'
                        }`}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        <span className="tabular-nums">
                          {subComments.length > 0
                            ? `Commentaires (${subComments.length})`
                            : 'Commenter'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Preview latest comment on sub-item when collapsed */}
                  {!isCommentsOpen && subComments.length > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleSubCommentDrawer(sub.id)}
                      className="ml-4 inline-flex items-center gap-1.5 text-[11px] text-stone-600 hover:text-[#2A7B76] bg-stone-50 px-2 py-1 rounded border border-stone-200/80 max-w-full cursor-pointer text-left"
                    >
                      <MessageSquare className="h-3 w-3 text-[#2A7B76] shrink-0" />
                      <span className="truncate">
                        {subComments[subComments.length - 1].author} :{' '}
                        {subComments[subComments.length - 1].text}
                      </span>
                    </button>
                  )}

                  {/* Inline Sub-Item Comment Thread & Composer */}
                  {isCommentsOpen && (
                    <div className="ml-0 sm:ml-4 pt-2 border-t border-stone-100 space-y-2">
                      {subComments.length > 0 ? (
                        <ul className="space-y-1.5">
                          {subComments.map((cmt) => (
                            <li
                              key={cmt.id}
                              className="flex items-start justify-between gap-2 bg-stone-50 border border-stone-200/80 rounded-lg px-2.5 py-1.5 text-xs"
                            >
                              <div className="min-w-0 space-y-0.5">
                                <div className="flex items-center gap-2 text-[11px] text-stone-500">
                                  <span className="font-semibold text-stone-800">{cmt.author}</span>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">
                                    {cmt.createdAt
                                      ? new Date(cmt.createdAt).toLocaleDateString('fr-FR')
                                      : ''}
                                  </span>
                                </div>
                                <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">
                                  {cmt.text}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={isSaving}
                                onClick={() => onDeleteSubItemComment(item, sub.id, cmt.id)}
                                aria-label="Supprimer le commentaire"
                                className="p-1 text-stone-400 hover:text-red-600 rounded transition cursor-pointer shrink-0"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[11px] text-stone-500 italic">
                          Aucun commentaire sur ce sous-élément.
                        </p>
                      )}

                      <form
                        onSubmit={(e) => handleSubmitSubComment(e, sub.id)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          aria-label={`Ajouter un commentaire sur ${sub.label}`}
                          value={draft}
                          onChange={(e) =>
                            setCommentDrafts((prev) => ({ ...prev, [sub.id]: e.target.value }))
                          }
                          placeholder="Ajouter un commentaire sur ce sous-élément..."
                          className="flex-1 px-2.5 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
                        />
                        <button
                          type="submit"
                          disabled={!draft.trim() || isPosting || isSaving}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#22625E] rounded-lg transition disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <Send className="h-3 w-3" />
                          <span>{isPosting ? 'Envoi...' : 'Publier'}</span>
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
};
