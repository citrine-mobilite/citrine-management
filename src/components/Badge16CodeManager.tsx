import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { BadgeSecurityCode16, AppUser } from '../types';
import { badgeCodeService } from '../services/badgeCodeService';
import { BadgeCodeGeneratorForm } from './presence/badge/BadgeCodeGeneratorForm';
import { BadgeCodeItemCard } from './presence/badge/BadgeCodeItemCard';

interface Badge16CodeManagerProps {
  currentUser?: AppUser | null;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function Badge16CodeManager({ currentUser, showToast }: Badge16CodeManagerProps) {
  const [codes, setCodes] = useState<BadgeSecurityCode16[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'used'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [notesInput, setNotesInput] = useState<string>('');
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [newlyCreatedCode, setNewlyCreatedCode] = useState<BadgeSecurityCode16 | null>(null);

  useEffect(() => {
    const unsub = badgeCodeService.subscribe((data) => {
      setCodes(data || []);
    });
    return () => unsub();
  }, []);

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const responsableName = currentUser?.name || 'Responsable';
      const created = await badgeCodeService.createBadgeCode(
        responsableName,
        notesInput.trim() || `Code de badgeage généré le ${new Date().toLocaleDateString('fr-FR')}`
      );
      setNewlyCreatedCode(created);
      setNotesInput('');
      showToast?.(`Code généré avec succès: ${created.formattedCode}`, 'success');
    } catch {
      showToast?.('Erreur lors de la génération du code', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleDelete = async (id: string) => {
    try {
      await badgeCodeService.deleteCode(id);
      showToast?.('Code supprimé avec succès', 'info');
    } catch {
      showToast?.('Erreur lors de la suppression', 'error');
    }
  };

  const filteredCodes = codes.filter((c) => {
    if (filter === 'active' && c.isUsed) return false;
    if (filter === 'used' && !c.isUsed) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.formattedCode.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (c.notes && c.notes.toLowerCase().includes(q)) ||
        c.generatedBy.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Generator Form */}
      <BadgeCodeGeneratorForm
        notesInput={notesInput}
        setNotesInput={setNotesInput}
        isGenerating={isGenerating}
        onGenerateCode={handleGenerateCode}
        newlyCreatedCode={newlyCreatedCode}
        onCopyCode={handleCopy}
        copiedCodeId={copiedCodeId}
      />

      {/* Filter and Search */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'active', label: 'Disponibles' },
            { id: 'used', label: 'Utilisés' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                filter === f.id ? 'bg-white text-[#2A7B76] shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher un code..."
            className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>

      {/* Codes List */}
      <div className="space-y-2">
        {filteredCodes.length === 0 ? (
          <div className="bg-white p-8 text-center text-stone-400 text-xs italic rounded-2xl border border-stone-200">
            Aucun code 16 caractères trouvé.
          </div>
        ) : (
          filteredCodes.map((codeItem) => (
            <BadgeCodeItemCard
              key={codeItem.id}
              codeItem={codeItem}
              onCopy={handleCopy}
              onDelete={handleDelete}
              copiedCodeId={copiedCodeId}
            />
          ))
        )}
      </div>
    </div>
  );
}
