import React, { useState, useEffect } from 'react';
import { 
  KeyRound, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  ShieldCheck, 
  Info, 
  Share2, 
  Calendar, 
  User, 
  Clock, 
  Search,
  Filter
} from 'lucide-react';
import { BadgeSecurityCode16, AppUser } from '../types';
import { badgeCodeService } from '../services/badgeCodeService';

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

  const currentMonthStr = new Date().toISOString().slice(0, 7); // e.g., "2026-08"
  const currentMonthFormatted = new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const responsableName = currentUser?.name || 'Responsable';
      const created = await badgeCodeService.createBadgeCode(
        responsableName,
        notesInput.trim() || `Code de badgeage généré en ${currentMonthFormatted}`
      );
      setNewlyCreatedCode(created);
      setNotesInput('');
      if (showToast) {
        showToast(`Code 16 caractères généré avec succès: ${created.formattedCode}`, 'success');
      }
    } catch (err) {
      console.error('Error generating badge code:', err);
      if (showToast) {
        showToast('Erreur lors de la génération du code', 'error');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = (code: BadgeSecurityCode16) => {
    navigator.clipboard.writeText(code.formattedCode);
    setCopiedCodeId(code.id);
    if (showToast) {
      showToast(`Code ${code.formattedCode} copié dans le presse-papier !`, 'info');
    }
    setTimeout(() => setCopiedCodeId(null), 2500);
  };

  const handleShareWhatsApp = (code: BadgeSecurityCode16) => {
    const text = encodeURIComponent(
      `Bonjour,\nVoici votre Code de Badgeage Entreprise à 16 caractères : *${code.formattedCode}*\n\n` +
      `Saisissez ce code dans votre Portail Collaborateur pour valider votre heure de pointage en entreprise pour le mois en cours (${currentMonthFormatted}).\n` +
      `Note: Ce code est à usage unique pour ce mois.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce code de badgeage ?')) {
      await badgeCodeService.deleteCode(id);
      if (showToast) {
        showToast('Code de badgeage supprimé', 'info');
      }
    }
  };

  // Filtered list
  const filteredCodes = codes.filter((item) => {
    if (filter === 'active' && item.isUsed) return false;
    if (filter === 'used' && !item.isUsed) return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const matchCode = item.code.toLowerCase().includes(q) || item.formattedCode.toLowerCase().includes(q);
      const matchUser = (item.usedByEmployeeName || '').toLowerCase().includes(q);
      const matchGen = (item.generatedBy || '').toLowerCase().includes(q);
      const matchNotes = (item.notes || '').toLowerCase().includes(q);
      return matchCode || matchUser || matchGen || matchNotes;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeCount = codes.filter(c => !c.isUsed).length;
  const usedThisMonthCount = codes.filter(c => c.isUsed && c.usedMonth === currentMonthStr).length;

  return (
    <div className="bg-white rounded-3xl border border-purple-100 p-6 sm:p-8 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-purple-100 pb-5">
        <div>
          <h2 className="text-lg font-serif font-bold text-purple-950 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-purple-600" />
            <span>Génération & Suivi des Codes de Badgeage (16 Caractères)</span>
          </h2>
          <p className="text-stone-500 text-xs mt-1">
            Les codes sont générés par un responsable. L'employé saisit le code pour enregistrer son heure de badgeage en entreprise. <strong>Un code ne peut pas être utilisé deux fois le même mois.</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-3 py-1 bg-purple-50 text-purple-900 border border-purple-200 rounded-full text-xs font-bold">
            Mois actif : <span className="uppercase">{currentMonthFormatted}</span>
          </span>
        </div>
      </div>

      {/* KPI Counters Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-purple-50/60 p-4 rounded-2xl border border-purple-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <KeyRound className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">Total Codes Générés</p>
            <p className="text-xl font-bold text-purple-950">{codes.length}</p>
          </div>
        </div>

        <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Check className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Codes Actifs / Disponibles</p>
            <p className="text-xl font-bold text-emerald-950">{activeCount}</p>
          </div>
        </div>

        <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Utilisés ce mois ({currentMonthStr})</p>
            <p className="text-xl font-bold text-amber-950">{usedThisMonthCount}</p>
          </div>
        </div>
      </div>

      {/* Code Generation Form Card */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-white/10 rounded-xl">
              <KeyRound className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Générer un Code 16 Caractères pour un Collaborateur</h3>
              <p className="text-xs text-purple-200/80">
                Créez un code de sécurité unique à fournir au collaborateur.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={notesInput}
            onChange={(e) => setNotesInput(e.target.value)}
            placeholder="Remarque optionnelle (ex: Pour Jean Dupont - Site HQ)"
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-xs text-white placeholder:text-stone-400 focus:bg-white/20 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleGenerateCode}
            disabled={isGenerating}
            className="px-5 py-3 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-lg shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>{isGenerating ? "Génération..." : "Générer le Code 16 Caractères"}</span>
          </button>
        </div>

        {/* Newly Created Code Highlighting Card */}
        {newlyCreatedCode && (
          <div className="p-4 bg-white text-stone-900 rounded-xl border border-purple-300 space-y-3 animate-fade-in shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-600" />
                Nouveau Code 16 Caractères Prêt :
              </span>
              <button 
                onClick={() => setNewlyCreatedCode(null)}
                className="text-[10px] text-stone-400 hover:text-stone-700 font-bold"
              >
                Masquer
              </button>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 text-center font-mono text-xl font-black text-purple-950 tracking-widest">
              {newlyCreatedCode.formattedCode}
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <button
                type="button"
                onClick={() => handleCopy(newlyCreatedCode)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedCodeId === newlyCreatedCode.id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedCodeId === newlyCreatedCode.id ? "Copié !" : "Copier le Code"}</span>
              </button>
              <button
                type="button"
                onClick={() => handleShareWhatsApp(newlyCreatedCode)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>Partager via WhatsApp</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'all' ? 'bg-white text-purple-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Tous ({codes.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'active' ? 'bg-white text-purple-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Actifs ({activeCount})
          </button>
          <button
            onClick={() => setFilter('used')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filter === 'used' ? 'bg-white text-purple-950 shadow-xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Utilisés ({codes.length - activeCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher code, nom..."
            className="w-full pl-9 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Table List of Codes */}
      <div className="border border-stone-200 rounded-2xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-700">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold uppercase text-stone-600 tracking-wider">
              <tr>
                <th className="p-3.5 pl-4">Code 16 Caractères</th>
                <th className="p-3.5">Généré par</th>
                <th className="p-3.5">Statut / Utilisation</th>
                <th className="p-3.5">Mois concerné</th>
                <th className="p-3.5">Remarques</th>
                <th className="p-3.5 text-right pr-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredCodes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-stone-400 italic">
                    Aucun code de 16 caractères trouvé.
                  </td>
                </tr>
              ) : (
                filteredCodes.map((item) => (
                  <tr key={item.id} className="hover:bg-purple-50/30 transition">
                    <td className="p-3.5 pl-4 font-mono font-bold text-purple-950 text-sm">
                      {item.formattedCode}
                    </td>
                    <td className="p-3.5">
                      <div className="font-semibold text-stone-900">{item.generatedBy}</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="p-3.5">
                      {item.isUsed ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                            🔴 Utilisé
                          </span>
                          <div className="text-[11px] font-bold text-stone-800">
                            Par : {item.usedByEmployeeName || 'Employé'}
                          </div>
                          {item.usedAt && (
                            <div className="text-[10px] text-stone-500">
                              Le {new Date(item.usedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">
                          🟢 Actif / Disponible
                        </span>
                      )}
                    </td>
                    <td className="p-3.5 font-mono text-stone-800 font-semibold">
                      {item.targetMonth || currentMonthStr}
                    </td>
                    <td className="p-3.5 text-stone-600 max-w-xs truncate">
                      {item.notes || '--'}
                    </td>
                    <td className="p-3.5 text-right pr-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleCopy(item)}
                          className="p-1.5 text-stone-600 hover:text-purple-900 hover:bg-purple-100 rounded-lg transition"
                          title="Copier le code"
                        >
                          {copiedCodeId === item.id ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                        </button>
                        <button
                          onClick={() => handleShareWhatsApp(item)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                          title="Partager par WhatsApp"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                          title="Supprimer ce code"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
