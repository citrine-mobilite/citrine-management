import React from 'react';
import { Trash2, MessageSquare, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Comment, Incident } from '../../../types';

interface TaskDetailCommentsAndBlockersProps {
  taskAssignedTo?: string;
  canReassign: boolean;
  isAssignedToCurrentUser: boolean;
  comments: Comment[];
  newCommentText: string;
  setNewCommentText: (val: string) => void;
  onAddComment: () => void;
  incidents: Incident[];
  blockerText: string;
  setBlockerText: (val: string) => void;
  onSignalBlocker: () => void;
  onDeleteBlocker: (incId: string) => void;
}

export const TaskDetailCommentsAndBlockers: React.FC<TaskDetailCommentsAndBlockersProps> = ({
  taskAssignedTo,
  canReassign,
  isAssignedToCurrentUser,
  comments,
  newCommentText,
  setNewCommentText,
  onAddComment,
  incidents,
  blockerText,
  setBlockerText,
  onSignalBlocker,
  onDeleteBlocker,
}) => (
  <>
    <div className="space-y-2.5 bg-stone-50 p-4 rounded-2xl border border-stone-200/80">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-[#2A7B76]" />
          <span>Commentaires &amp; Activité ({comments.length})</span>
        </h4>
        <span className="text-[10px] text-[#2A7B76] font-semibold bg-[#2A7B76]/10 px-2 py-0.5 rounded-full">
          Points pour le manager
        </span>
      </div>
      <p className="text-[10px] text-stone-500 italic">
        Vos commentaires rédigés ici font office de points à signaler au manager dans votre feuille de tâches.
      </p>
      <div className="space-y-2 max-h-36 overflow-y-auto">
        {comments.map((com) => (
          <div key={com.id} className="bg-white p-2.5 rounded-xl border border-stone-200 text-xs space-y-1">
            <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
              <span className="font-bold text-stone-700">{com.author}</span>
              <span>{com.timestamp}</span>
            </div>
            <p className="text-stone-800">{com.text}</p>
          </div>
        ))}
        {comments.length === 0 && <p className="text-[11px] text-stone-400 italic">Aucun commentaire pour le moment.</p>}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          placeholder="Écrire un commentaire..."
          value={newCommentText}
          onChange={(e) => setNewCommentText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAddComment();
            }
          }}
          className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
        />
        <button
          type="button"
          onClick={onAddComment}
          className="px-3 py-1.5 bg-[#2A7B76] text-white rounded-xl text-xs font-bold hover:bg-[#23635f] cursor-pointer"
        >
          Envoyer
        </button>
      </div>
    </div>

    <div className="space-y-2.5 bg-rose-50/70 p-4 rounded-2xl border border-rose-200">
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
          <span>Blocages &amp; Difficultés signalés ({incidents.length})</span>
        </h4>
        <span className="text-[10px] text-rose-700 font-semibold bg-rose-100 px-2 py-0.5 rounded-full border border-rose-200">
          Imprévus en feuille de tâches
        </span>
      </div>
      <p className="text-[10px] text-rose-600/90 italic">
        Les blocages signalés ici font office d'imprévus dans la feuille de tâches (signalés directement par le collaborateur assigné).
      </p>

      {incidents.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto">
          {incidents.map((inc) => (
            <div key={inc.id} className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-rose-200 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                <span className="text-stone-800 font-medium truncate">{inc.title}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteBlocker(inc.id)}
                className="text-stone-400 hover:text-rose-600 p-1 cursor-pointer transition"
                title="Supprimer ce blocage"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {canReassign && !isAssignedToCurrentUser ? (
        <div className="bg-white/80 p-2.5 rounded-xl border border-rose-200 text-stone-600 text-[11px] flex items-center gap-2">
          <span className="text-base">🛡️</span>
          <span>
            Les blocages font office d'imprévus : ils sont signalés par le collaborateur assigné (<strong>{taskAssignedTo || "l'employé"}</strong>) lors de l'exécution de sa tâche.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Décrivez un nouveau blocage..."
            value={blockerText}
            onChange={(e) => setBlockerText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onSignalBlocker();
              }
            }}
            className="flex-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-white text-xs outline-none focus:ring-2 focus:ring-rose-500 text-rose-900"
          />
          <button
            type="button"
            onClick={onSignalBlocker}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 cursor-pointer shrink-0"
          >
            Signaler
          </button>
        </div>
      )}
    </div>
  </>
);
