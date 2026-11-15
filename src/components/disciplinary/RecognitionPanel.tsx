import React, { useState } from 'react';
import { Award, Trophy, User, Search, Medal } from 'lucide-react';
import { Employee, EmployeeRecognition } from '../../types';
import { RecognitionFormModal } from './RecognitionFormModal';

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
  currentUserName = 'Direction RH',
}) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [timeframeFilter, setTimeframeFilter] = useState<'mois' | 'trois_mois' | 'annee'>('mois');

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
      matchesTimeframe =
        r.period.toLowerCase().includes('q3') ||
        r.period.toLowerCase().includes('octobre') ||
        r.period.toLowerCase().includes('septembre');
    }

    return matchesSearch && matchesType && matchesTimeframe;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-[#2A7B76]" />
          <h3 className="font-serif font-bold text-lg text-stone-900">Reconnaissance &amp; Distinctions</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-2xl border border-stone-200/80">
            {[
              { key: 'mois', label: 'Mois' },
              { key: 'trois_mois', label: 'Trois derniers mois' },
              { key: 'annee', label: "L'année entière" },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setTimeframeFilter(item.key as any)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer ${
                  timeframeFilter === item.key ? 'bg-[#2A7B76] text-white shadow-2xs' : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[#2A7B76] hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold shadow-xs transition cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Award className="h-4 w-4" /> Décerner une Distinction
          </button>
        </div>
      </div>

      {employeeOfTheMonth && (
        <div className="bg-[#2A7B76] rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-emerald-600/40">
          <div className="flex items-center gap-5 z-10">
            <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 backdrop-blur-xs">
              <Trophy className="h-8 w-8 text-amber-300" />
            </div>
            <div className="space-y-1">
              <span className="px-3 py-1 bg-white/20 rounded-full text-[10px] uppercase font-bold tracking-wider text-emerald-100 backdrop-blur-xs">
                EMPLOYÉ DU MOIS EN VEDETTE ({employeeOfTheMonth.period})
              </span>
              <h2 className="text-xl font-serif font-bold text-white">{employeeOfTheMonth.employeeName}</h2>
              <p className="text-xs text-emerald-100">{employeeOfTheMonth.employeeRole} • Attribué le {employeeOfTheMonth.awardedAt}</p>
              <p className="text-xs text-emerald-50 max-w-lg mt-2 italic">&quot;{employeeOfTheMonth.description}&quot;</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl p-6 border border-stone-200/80 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
            <Medal className="h-4 w-4 text-amber-500" /> Registre Historique des Distinctions &amp; Titres
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecognitions.map((rec) => (
            <div key={rec.id} className="bg-stone-50 p-4 rounded-2xl border border-stone-200/80 shadow-2xs flex flex-col justify-between space-y-3">
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
                <p className="text-[11px] text-stone-600 italic line-clamp-2">&quot;{rec.description}&quot;</p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500">
                <span>Décerné par : {rec.awardedBy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RecognitionFormModal
        isOpen={showModal}
        employees={employees}
        currentUserName={currentUserName}
        onClose={() => setShowModal(false)}
        onAddRecognition={onAddRecognition}
      />
    </div>
  );
};
