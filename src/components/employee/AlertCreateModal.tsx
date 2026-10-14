import React, { useState } from 'react';
import { X, Bell, Calendar, Clock, Users } from 'lucide-react';
import { Employee, AppUser } from '../../types';

interface AlertCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeProfile?: Employee;
  currentUser?: AppUser | null;
  onCreateAlert: (alertData: {
    title: string;
    note: string;
    date: string;
    time: string;
    triggerPeriods: string[];
    employeeId: string;
  }) => void;
}

const AVAILABLE_PERIODS = [
  { id: 'exact', label: "À l'heure exacte (par défaut)" },
  { id: '5m', label: '5 minutes avant' },
  { id: '15m', label: '15 minutes avant' },
  { id: '30m', label: '30 minutes avant' },
  { id: '1h', label: '1h avant' },
];

export const AlertCreateModal: React.FC<AlertCreateModalProps> = ({
  isOpen,
  onClose,
  employeeProfile,
  currentUser,
  onCreateAlert,
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 15);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['exact']);

  if (!isOpen) return null;

  const handleTogglePeriod = (periodId: string) => {
    if (selectedPeriods.includes(periodId)) {
      if (selectedPeriods.length > 1) {
        setSelectedPeriods(selectedPeriods.filter((p) => p !== periodId));
      }
    } else {
      setSelectedPeriods([...selectedPeriods, periodId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !note.trim()) return;

    const targetEmployeeId = employeeProfile?.id || currentUser?.id || 'moi';

    onCreateAlert({
      title: title.trim(),
      note: note.trim(),
      date,
      time,
      triggerPeriods: selectedPeriods.length > 0 ? selectedPeriods : ['exact'],
      employeeId: targetEmployeeId,
    });

    setTitle('');
    setNote('');
    setSelectedPeriods(['exact']);
    onClose();
  };

  const displayName = employeeProfile?.name || currentUser?.name || 'Vous-même';

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100/70 text-[#2A7B76] rounded-xl">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Créer une Nouvelle Alerte
              </h3>
              <p className="text-[11px] text-stone-400">
                Titre, détail, date, heure et périodes de rappel personnalisées.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Titre */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Titre de l'alerte *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Réunion d'équipe, Échéance dossier, Contrôle sécurité..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-900 font-semibold"
            />
          </div>

          {/* Détail */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Détail de l'alerte *
            </label>
            <textarea
              required
              rows={3}
              placeholder="Détails, consignes et informations importantes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800"
            />
          </div>

          {/* Date & Heure de rappel */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
                Date de rappel *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
                Heure de rappel *
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-bold text-stone-800"
              />
            </div>
          </div>

          {/* Périodes de rappel */}
          <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
            <label className="block font-bold text-stone-800">
              Périodes de rappel (une alerte peut sonner plusieurs fois)
            </label>
            <p className="text-[11px] text-stone-500">
              Sélectionnez les moments où l'alerte doit sonner (par défaut à l'heure exacte).
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {AVAILABLE_PERIODS.map((period) => {
                const isChecked = selectedPeriods.includes(period.id);
                return (
                  <button
                    key={period.id}
                    type="button"
                    onClick={() => handleTogglePeriod(period.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-[11px] font-bold cursor-pointer transition text-left ${
                      isChecked
                        ? 'bg-[#2A7B76] text-white border-[#2A7B76] shadow-xs'
                        : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-md border flex items-center justify-center shrink-0 ${
                        isChecked ? 'bg-white border-white' : 'border-stone-400'
                      }`}
                    >
                      {isChecked && <div className="w-2 h-2 rounded-xs bg-[#2A7B76]" />}
                    </div>
                    <span>{period.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Personnes à qui c'est destiné */}
          <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
            <label className="font-bold text-stone-800 flex items-center gap-1.5 mb-1">
              <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
              Personnes à qui c'est destiné
            </label>
            <div className="text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between">
              <span className="font-bold text-[#2A7B76]">
                {displayName}
              </span>
              <span className="text-[11px] text-stone-400 italic">
                Directement assignée à vous-même
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20615d] text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
            >
              Créer l'alerte
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
