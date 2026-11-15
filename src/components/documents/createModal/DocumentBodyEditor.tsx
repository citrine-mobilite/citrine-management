import React from 'react';
import { FileText, Plus, Trash2, ArrowUp, ArrowDown, ListOrdered, AlignLeft } from 'lucide-react';

interface DocumentBodyEditorProps {
  sentences: string[];
  bodyMode: 'sentences' | 'text';
  setBodyMode: (m: 'sentences' | 'text') => void;
  customContent: string;
  onSentenceChange: (index: number, value: string) => void;
  onAddSentence: () => void;
  onRemoveSentence: (index: number) => void;
  onMoveSentence: (index: number, direction: 'up' | 'down') => void;
  onTextareaChange: (value: string) => void;
}

export const DocumentBodyEditor: React.FC<DocumentBodyEditorProps> = ({
  sentences,
  bodyMode,
  setBodyMode,
  customContent,
  onSentenceChange,
  onAddSentence,
  onRemoveSentence,
  onMoveSentence,
  onTextareaChange,
}) => {
  return (
    <div className="space-y-3 p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
            Corps du document ({sentences.length} {sentences.length > 1 ? 'éléments' : 'élément'})
          </label>
          <p className="text-[10px] text-stone-500">
            Rédigez phrase par phrase ou ajoutez des éléments à votre convenance.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 text-[11px]">
          <button
            type="button"
            onClick={() => setBodyMode('sentences')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              bodyMode === 'sentences'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <ListOrdered className="h-3 w-3" />
            Mode Phrases / Éléments
          </button>
          <button
            type="button"
            onClick={() => setBodyMode('text')}
            className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5 ${
              bodyMode === 'text'
                ? 'bg-[#2A7B76] text-white shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <AlignLeft className="h-3 w-3" />
            Mode Texte Libre
          </button>
        </div>
      </div>

      {bodyMode === 'sentences' ? (
        <div className="space-y-2.5">
          {sentences.map((sentence, idx) => (
            <div
              key={idx}
              className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-2 group hover:border-[#2A7B76]/50 transition"
            >
              <div className="flex items-center justify-between text-[11px] text-stone-500">
                <span className="font-bold text-stone-700 font-mono">Phrase #{idx + 1}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => onMoveSentence(idx, 'up')}
                    className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded hover:bg-stone-100 transition cursor-pointer"
                    title="Monter"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sentences.length - 1}
                    onClick={() => onMoveSentence(idx, 'down')}
                    className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-20 rounded hover:bg-stone-100 transition cursor-pointer"
                    title="Descendre"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveSentence(idx)}
                    className="p-1 text-stone-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                    title="Supprimer cette phrase"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <textarea
                rows={2}
                value={sentence}
                onChange={(e) => onSentenceChange(idx, e.target.value)}
                placeholder={`Écrivez la phrase ou le paragraphe ${idx + 1}...`}
                className="w-full p-2.5 bg-stone-50/60 border border-stone-200/80 rounded-lg text-xs text-stone-800 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none leading-relaxed resize-y"
              />
            </div>
          ))}

          <button
            type="button"
            onClick={onAddSentence}
            className="w-full py-2.5 px-4 bg-white border-2 border-dashed border-[#2A7B76]/40 hover:border-[#2A7B76] text-[#2A7B76] hover:bg-[#2A7B76]/5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
          >
            <Plus className="h-4 w-4" />
            <span>Ajouter une phrase / un paragraphe</span>
          </button>
        </div>
      ) : (
        <div className="space-y-1.5">
          <textarea
            rows={6}
            value={customContent}
            onChange={(e) => onTextareaChange(e.target.value)}
            className="w-full p-3 bg-white border border-stone-200 rounded-xl text-xs font-mono text-stone-800 focus:ring-2 focus:ring-[#2A7B76] outline-none leading-relaxed"
            placeholder="Rédigez librement le corps du document..."
          />
        </div>
      )}

      <p className="text-[10px] text-stone-400">
        L&apos;en-tête officiel CITRINE SARL, le logo, les mentions légales OHADA et le pied de page sont automatiquement incorporés sur l&apos;aperçu et dans l&apos;export PDF.
      </p>
    </div>
  );
};
