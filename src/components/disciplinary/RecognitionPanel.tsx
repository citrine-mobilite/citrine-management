import React, { useState } from 'react';
import { Award, Trophy, Star, Gift, Plus, Calendar, User, Search, Medal, CheckCircle2, X } from 'lucide-react';
import { Employee, EmployeeRecognition } from '../../types';

interface RecognitionPanelProps {
  employees: Employee[];
  recognitions: EmployeeRecognition[];
  onAddRecognition: (recognition: EmployeeRecognition) => void;
  currentUserRole?: string;
  currentUserName?: string;
}

export const RecognitionPanel: React.FC<RecognitionPanelProps> = ({
  employees,
  recognitions = [],
  onAddRecognition,
  currentUserRole = 'Direction',
  currentUserName = 'Direction RH',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<'mois' | 'trois_mois' | 'annee'>('mois');

  // Modal Form State
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [type, setType] = useState<'employe_du_mois' | 'trophee' | 'felicitations' | 'prime_performance' | 'autre'>('employe_du_mois');
  const [title, setTitle] = useState("Employé du Mois d'Octobre");
  const [description, setDescription] = useState('Pour sa ponctualité exemplaire, son professionnalisme et son implication remarquable.');
  const [period, setPeriod] = useState('Octobre 2026');
  const [bonusAmount, setBonusAmount] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return;

    const newRec: EmployeeRecognition = {
      id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      employeeId: emp.id,
      employeeName: emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim(),
      employeeRole: emp.role || 'Collaborateur',
      type,
      title: title || (type === 'employe_du_mois' ? `Employé du Mois (${period})` : 'Distinction d\'Excellence'),
      description,
      period,
      awardedAt: new Date().toISOString().split('T')[0],
      awardedBy: currentUserName,
      bonusAmount: 0,
      badgeIcon: type === 'employe_du_mois' ? 'Trophy' : type === 'trophee' ? 'Medal' : 'Star',
    };

    onAddRecognition(newRec);
    setShowModal(false);
  };

  // Find latest Employee of the Month
  const employeeOfTheMonth = recognitions.find((r) => r.type === 'employe_du_mois') || recognitions[0];

  const filteredRecognitions = recognitions.filter((r) => {
    const matchesSearch =
      r.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || r.type === typeFilter;
    
    let matchesTimeframe = true;
    if (timeframeFilter === 'mois') {
      matchesTimeframe = r.period.toLowerCase().includes('octobre') || r.period.toLowerCase().includes('mois');
    } else if (timeframeFilter === 'trois_mois') {
      matchesTimeframe = r.period.toLowerCase().includes('q3') || r.period.toLowerCase().includes('octobre') || r.period.toLowerCase().includes('septembre');
    }

    return matchesSearch && matchesType && matchesTimeframe;
  });

  return (
    <div className="space-y-6">
      {/* Top Action Banner with Timeframe Tabs */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#2A7B76]" />
          <h3 className="font-serif font-bold text-lg text-stone-900">Reconnaissance & Distinctions</h3>
        </div>

        {/* Timeframe Tabs: Mois, Trois derniers mois, L'année entière */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
            <button
              onClick={() => setTimeframeFilter('mois')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                timeframeFilter === 'mois'
                  ? 'bg-[#2A7B76] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Mois
            </button>
            <button
              onClick={() => setTimeframeFilter('trois_mois')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                timeframeFilter === 'trois_mois'
                  ? 'bg-[#2A7B76] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Trois derniers mois
            </button>
            <button
              onClick={() => setTimeframeFilter('annee')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                timeframeFilter === 'annee'
                  ? 'bg-[#2A7B76] text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              L'année entière
            </button>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#2A7B76] hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Award className="h-4 w-4" /> Décerner une Distinction
          </button>
        </div>
      </div>

      {/* Featured Employee of the Month Spotlight - NO BLACK COLOR (#2A7B76 Brand Teal) */}
      {employeeOfTheMonth && (
        <div className="bg-[#2A7B76] rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-600/40">
          <div className="flex items-center gap-5 z-10">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 backdrop-blur-xs">
                <Trophy className="h-8 w-8 text-amber-300" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] uppercase font-bold tracking-wider text-emerald-100 backdrop-blur-xs">
                EMPLOYÉ DU MOIS EN VEDETTE ({employeeOfTheMonth.period})
              </span>
              <h2 className="text-xl font-serif font-bold text-white">{employeeOfTheMonth.employeeName}</h2>
              <p className="text-xs text-emerald-100">{employeeOfTheMonth.employeeRole} • Attribué le {employeeOfTheMonth.awardedAt}</p>
              <p className="text-xs text-emerald-50 max-w-lg mt-2 italic">
                "{employeeOfTheMonth.description}"
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History Table / Filters */}
      <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <Medal className="h-4 w-4 text-amber-500" /> Registre Historique des Distinctions & Titres
          </h3>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, période..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-bold text-stone-700 outline-none"
            >
              <option value="all">Tous les types</option>
              <option value="employe_du_mois">Employés du Mois</option>
              <option value="trophee">Trophées du Mérite</option>
              <option value="prime_performance">Primes de Performance</option>
              <option value="felicitations">Félicitations Officielles</option>
            </select>
          </div>
        </div>

        {/* Recognitions Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecognitions.map((rec) => (
            <div
              key={rec.id}
              className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-600" /> {rec.type.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono">{rec.period}</span>
                </div>

                <h4 className="font-bold text-xs text-stone-900">{rec.title}</h4>

                <div className="flex items-center gap-2 text-xs text-stone-800 font-bold">
                  <User className="h-3.5 w-3.5 text-[#2A7B76]" /> {rec.employeeName}
                </div>

                <p className="text-[11px] text-stone-600 italic line-clamp-2">"{rec.description}"</p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                <span>Décerné par : {rec.awardedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Nomination */}
      {showModal && (
        <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
            <div className="bg-[#2A7B76] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="h-5 w-5 text-emerald-200" />
                <h3 className="font-serif font-bold text-base">Attribuer une Distinction</h3>
              </div>
              <button onClick={() => setShowModal(false)} className="text-emerald-100 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Collaborateur à honorer *</label>
                <select
                  required
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="">-- Choisir un collaborateur --</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim()} ({e.role || 'Collaborateur'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Type de Distinction *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-bold focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="employe_du_mois">Employé du Mois</option>
                    <option value="trophee">Trophée du Mérite</option>
                    <option value="prime_performance">Prime de Performance</option>
                    <option value="felicitations">Félicitations Officielles</option>
                    <option value="autre">Autre Distinction</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Mois / Période *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Octobre 2026"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Titre de la récompensé *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Motif / Éloge de la distinction *</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Prime financière (Optionnelle en FCFA)</label>
                <input
                  type="number"
                  step="5000"
                  value={bonusAmount}
                  onChange={(e) => setBonusAmount(Number(e.target.value))}
                  className="w-full p-2.5 bg-stone-50 rounded-xl border border-stone-200 font-mono font-bold text-emerald-800 focus:ring-2 focus:ring-amber-500 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 font-bold text-stone-600 hover:bg-stone-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-bold shadow-md"
                >
                  Valider et Honoré
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
