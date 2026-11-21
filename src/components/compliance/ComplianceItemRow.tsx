import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDashed,
  Clock,
  ExternalLink,
  FileEdit,
  MessageSquare,
  MinusCircle,
  Send,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  ComplianceChecklistItem,
  ComplianceStatus,
} from '../../types/complianceTypes';
import {
  COMPLIANCE_STATUS_OPTIONS,
  getComplianceStatusMeta,
} from '../../utils/complianceHelpers';

interface ComplianceItemRowProps {
  item: ComplianceChecklistItem;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
  onToggleSubItem: (item: ComplianceChecklistItem, subItemId: string) => void;
  onQuickStatusChange: (item: ComplianceChecklistItem, nextStatus: ComplianceStatus) => void;
  onAddComment: (item: ComplianceChecklistItem, text: string) => Promise<void>;
  onDeleteComment: (item: ComplianceChecklistItem, commentId: string) => Promise<void>;
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
    case 'non_conforme':
      return <XCircle className="h-4 w-4 text-[#DC2626] shrink-0" />;
    case 'non_existant':
      return <AlertCircle className="h-4 w-4 text-[#991B1B] shrink-0" />;
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
  onQuickStatusChange,
  onAddComment,
  onDeleteComment,
  onOpenEdit,
  onNavigateCitrineTab,
  savingItemId,
}) => {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const statusMeta = getComplianceStatusMeta(item.status);
  const subItems = item.subItems || [];
  const doneSubs = subItems.filter((s) => s.completed).length;
  const comments = item.comments || [];
  const hasNotes = Boolean(item.auditorNotes && item.auditorNotes.trim());
  const commentCount = comments.length + (hasNotes ? 1 : 0);
  const isSaving = savingItemId === item.id;

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = commentDraft.trim();
    if (!trimmed || submittingComment) return;
    setSubmittingComment(true);
    try {
      await onAddComment(item, trimmed);
      setCommentDraft('');
    } finally {
      setSubmittingComment(false);
    }
  };

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

          {/* Metadata & Inline Status Picker */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-stone-500 pt-0.5">
            <label className="inline-flex items-center gap-1 cursor-pointer">
              {renderStatusIcon(item.status)}
              <select
                aria-label={`Statut de conformité pour ${item.controlCode}`}
                value={item.status}
                disabled={isSaving}
                onChange={(e) =>
                  onQuickStatusChange(item, e.target.value as ComplianceStatus)
                }
                className={`bg-transparent font-semibold text-xs pr-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-[#2A7B76] cursor-pointer ${statusMeta.textClass}`}
              >
                {COMPLIANCE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value} className="text-stone-800 bg-white">
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Sous-livrables : <strong className="text-stone-700 font-mono">{doneSubs}/{subItems.length}</strong>
            </span>

            {item.ownerName && (
              <>
                <span aria-hidden="true">·</span>
                <span>
                  Responsable : <strong className="text-stone-700 font-medium">{item.ownerName}</strong>
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

          {/* Latest comment snippet when collapsed */}
          {!commentsOpen && commentCount > 0 && (
            <button
              type="button"
              onClick={() => setCommentsOpen(true)}
              className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-stone-600 hover:text-[#2A7B76] bg-stone-50 px-2.5 py-1 rounded-lg border border-stone-200/80 max-w-full cursor-pointer text-left"
            >
              <MessageSquare className="h-3 w-3 text-[#2A7B76] shrink-0" />
              <span className="truncate">
                {comments.length > 0
                  ? `${comments[comments.length - 1].author} : ${comments[comments.length - 1].text}`
                  : item.auditorNotes}
              </span>
            </button>
          )}
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

          <button
            type="button"
            aria-expanded={commentsOpen}
            onClick={() => setCommentsOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer ${
              commentsOpen || commentCount > 0
                ? 'text-[#2A7B76] bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200'
                : 'text-stone-700 bg-stone-50 hover:bg-stone-100 border-stone-200'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="tabular-nums">
              {commentCount > 0 ? `Commentaires (${commentCount})` : 'Commenter'}
            </span>
          </button>

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

      {/* Expandable Inline Comments Drawer */}
      {commentsOpen && (
        <div className="border-t border-stone-100 bg-stone-50/70 px-4 py-3 space-y-2.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500">
            <span>Commentaires &amp; observations sur {item.controlCode}</span>
            {isSaving && <span className="text-[#2A7B76]">Enregistrement...</span>}
          </div>

          {hasNotes && (
            <div className="p-2.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-700 space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-[#2A7B76]">
                Note auditeur
              </span>
              <p className="leading-relaxed whitespace-pre-wrap">{item.auditorNotes}</p>
            </div>
          )}

          {comments.length > 0 ? (
            <ul className="space-y-1.5">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="flex items-start justify-between gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2 text-xs"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 text-[11px] text-stone-500">
                      <span className="font-semibold text-stone-800">{comment.author}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums">
                        {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('fr-FR') : ''}
                      </span>
                    </div>
                    <p className="text-stone-700 leading-relaxed whitespace-pre-wrap">{comment.text}</p>
                  </div>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => onDeleteComment(item, comment.id)}
                    aria-label="Supprimer le commentaire"
                    className="p-1 text-stone-400 hover:text-red-600 rounded transition cursor-pointer shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
          ) : !hasNotes ? (
            <p className="text-xs text-stone-500 italic">
              Aucun commentaire pour ce point. Ajoutez une observation ou précision ci-dessous.
            </p>
          ) : null}

          <form onSubmit={handleSubmitComment} className="flex items-center gap-2">
            <input
              type="text"
              aria-label={`Ajouter un commentaire sur ${item.controlCode}`}
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder={`Ajouter un commentaire sur ${item.controlCode}...`}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-stone-200 rounded-lg focus:outline-none focus:border-[#2A7B76]"
            />
            <button
              type="submit"
              disabled={!commentDraft.trim() || submittingComment || isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#22625E] rounded-lg transition disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{submittingComment ? 'Envoi...' : 'Publier'}</span>
            </button>
          </form>
        </div>
      )}

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
