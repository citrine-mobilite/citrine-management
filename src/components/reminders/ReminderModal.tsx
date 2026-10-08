import React, { useState, useEffect } from 'react';
import { X, Save, Calendar, Clock, Bell, Users, Repeat } from 'lucide-react';
import { Reminder, Employee } from '../../types';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }) => void;
  initialReminder?: Reminder | null;
  employees: Employee[];
}

const AVAILABLE_PERIODS = [
  { id: '1h', label: '1 heure avant' },
  { id: '30m', label: '30 minutes avant' },
  { id: '15m', label: '15 minutes avant' },
  { id: '5m', label: '5 minutes avant' },
  { id: 'exact', label: "Uniquement à l'heure exacte" },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSaveReminder,
  initialReminder,
  employees,
}) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('09:00');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['exact']);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState(true);
  const [recurrence, setRecurrence] = useState<'once' | 'daily' | 'weekdays' | 'weekends'>('once');

  // Pre-fill fields when initialReminder changes (editing mode vs creating mode)
  useEffect(() => {
    if (initialReminder) {
      setTitle(initialReminder.title || initialReminder.note || '');
      setNote(initialReminder.note || '');
      setDate(initialReminder.date || new Date().toISOString().split('T')[0]);
      setTime(initialReminder.time || '09:00');
      setSelectedPeriods(
        initialReminder.triggerPeriods && initialReminder.triggerPeriods.length > 0
          ? initialReminder.triggerPeriods
          : ['exact']
      );
      setAllEmployees(initialReminder.allEmployees ?? true);
      setSelectedEmployeeIds(initialReminder.employeeIds || []);
      setRecurrence(initialReminder.recurrence || 'once');
    } else {
      setTitle('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setTime('09:00');
      setSelectedPeriods(['exact']);
      setSelectedEmployeeIds([]);
      setAllEmployees(true);
      setRecurrence('once');
    }
  }, [initialReminder, isOpen]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialReminder && initialReminder.id);

  const handleTogglePeriod = (periodId: string) => {
    if (selectedPeriods.includes(periodId)) {
      setSelectedPeriods(selectedPeriods.filter((p) => p !== periodId));
    } else {
      setSelectedPeriods([...selectedPeriods, periodId]);
    }
  };

  const handleToggleEmployee = (empId: string) => {
    if (selectedEmployeeIds.includes(empId)) {
      setSelectedEmployeeIds(selectedEmployeeIds.filter((id) => id !== empId));
      setAllEmployees(false);
    } else {
      setSelectedEmployeeIds([...selectedEmployeeIds, empId]);
    }
  };

  const handleToggleAllEmployees = (checked: boolean) => {
    setAllEmployees(checked);
    if (checked) {
      setSelectedEmployeeIds(employees.map((e) => e.id));
    } else {
      setSelectedEmployeeIds([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSaveReminder({
      ...(initialReminder ? { id: initialReminder.id } : {}),
      title: title.trim(),
      note: note.trim(),
      date,
      time,
      triggerPeriods: selectedPeriods.length > 0 ? selectedPeriods : ['exact'],
      allEmployees,
      employeeIds: allEmployees ? employees.map((e) => e.id) : selectedEmployeeIds,
      recurrence,
      triggeredPeriods: initialReminder?.triggeredPeriods || [],
      stopped: false,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#2A7B76] border border-emerald-200/60 flex items-center justify-center">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-950">
                {isEditing ? "Modifier l'Alerte Programmée" : "Créer une Nouvelle Alerte"}
              </h3>
              <p className="text-[11px] text-stone-500">
                {isEditing
                  ? "Mettez à jour les paramètres de réveil, la date ou les cibles."
                  : "Programmez plusieurs sonneries en continu et ciblez votre équipe."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-stone-400 hover:bg-stone-100 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Titre */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Titre de l'alerte *
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Clôture paie mensuelle, Point d'étape..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          {/* Note / Consigne */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Description / Consignes détaillées
            </label>
            <textarea
              rows={2}
              placeholder="Ordre du jour, lien de visioconférence, actions urgentes..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          {/* Date & Heure */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
                Date d'échéance
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-[#2A7B76]" />
                Heure exacte de l'événement
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-medium"
              />
            </div>
          </div>

          {/* Multi-Alarm Trigger Periods */}
          <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
            <label className="block font-bold text-stone-800">
              Périodes de sonnerie multiples (Plusieurs réveils d'avertissement)
            </label>
            <p className="text-[11px] text-stone-500">
              La sonnerie retentira en continu à chacun de ces moments jusqu'à ce qu'un utilisateur l'arrête.
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

          {/* Récurrence */}
          <div>
            <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
              <Repeat className="h-3.5 w-3.5 text-[#2A7B76]" />
              Fréquence / Récurrence
            </label>
            <select
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-medium"
            >
              <option value="once">Une seule fois (Ponctuelle)</option>
              <option value="daily">Tous les jours (Quotidienne)</option>
              <option value="weekdays">Jours ouvrés (Du lundi au vendredi)</option>
              <option value="weekends">Week-ends (Samedi et Dimanche)</option>
            </select>
          </div>

          {/* Collaborateurs ciblés */}
          <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
                Collaborateurs ciblés
              </label>
              <label className="flex items-center gap-2 text-[11px] text-[#2A7B76] font-bold cursor-pointer">
                <input
                  type="checkbox"
                  checked={allEmployees}
                  onChange={(e) => handleToggleAllEmployees(e.target.checked)}
                  className="rounded text-[#2A7B76] focus:ring-[#2A7B76]"
                />
                Tous les collaborateurs
              </label>
            </div>

            {!allEmployees && (
              <div className="max-h-32 overflow-y-auto space-y-1.5 pt-2 border-t border-stone-200">
                {employees.map((emp) => (
                  <label
                    key={emp.id}
                    className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg cursor-pointer transition text-[11px]"
                  >
                    <input
                      type="checkbox"
                      checked={selectedEmployeeIds.includes(emp.id)}
                      onChange={() => handleToggleEmployee(emp.id)}
                      className="rounded text-[#2A7B76] focus:ring-[#2A7B76]"
                    />
                    <span className="font-semibold text-stone-800">{emp.name}</span>
                    <span className="text-stone-400 text-[10px]">({emp.role || 'Employé'})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-bold transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#2A7B76] text-white hover:bg-[#226763] font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Enregistrer les modifications' : "Créer l'alerte"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
