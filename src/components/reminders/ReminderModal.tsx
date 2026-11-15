import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Calendar,
  Clock,
  Bell,
  Users,
  FileText,
  Car,
  Receipt,
  Repeat,
  AlertTriangle,
} from 'lucide-react';
import {
  Reminder,
  Employee,
  ReminderCategory,
  ReminderKind,
  ReminderRenewalCycle,
} from '../../types';
import {
  ALERT_LEAD_OPTIONS,
  DEADLINE_TEMPLATES,
  REMINDER_CATEGORY_META,
  RENEWAL_CYCLE_LABELS,
} from '../../services/reminderService';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }) => void;
  initialReminder?: Reminder | null;
  employees: Employee[];
  isEmployee?: boolean;
  currentEmployee?: Employee | null;
}

const AVAILABLE_PERIODS = [
  { id: 'exact', label: "À l'heure exacte" },
  { id: '5m', label: '5 min avant' },
  { id: '15m', label: '15 min avant' },
  { id: '30m', label: '30 min avant' },
  { id: '1h', label: '1h avant' },
];

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSaveReminder,
  initialReminder,
  employees,
  isEmployee = false,
  currentEmployee = null,
}) => {
  const [kind, setKind] = useState<ReminderKind>('deadline');
  const [category, setCategory] = useState<ReminderCategory>('vehicule');
  const [title, setTitle] = useState('');
  const [entityName, setEntityName] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [renewalCycle, setRenewalCycle] = useState<ReminderRenewalCycle>('annual');
  const [alertLeadDays, setAlertLeadDays] = useState<number>(14);
  const [enableSoundAlarm, setEnableSoundAlarm] = useState(false);
  const [time, setTime] = useState('09:00');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['exact']);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    if (initialReminder) {
      const detectedKind: ReminderKind =
        initialReminder.kind ||
        (initialReminder.category || initialReminder.expirationDate || initialReminder.renewalCycle
          ? 'deadline'
          : 'alarm');

      setKind(detectedKind);
      setCategory(initialReminder.category || (detectedKind === 'alarm' ? 'autre' : 'vehicule'));
      setTitle(initialReminder.title || initialReminder.note || '');
      setEntityName(initialReminder.entityName || initialReminder.location || '');
      setDocumentRef(initialReminder.documentRef || '');
      setNote(initialReminder.note || '');
      setDate(
        (initialReminder.expirationDate || initialReminder.date || new Date().toISOString().split('T')[0]).split('T')[0]
      );
      setRenewalCycle(initialReminder.renewalCycle || 'none');
      setAlertLeadDays(
        typeof initialReminder.alertLeadDays === 'number' ? initialReminder.alertLeadDays : 14
      );
      const hasSound = Boolean(initialReminder.time && initialReminder.time.trim().length > 0);
      setEnableSoundAlarm(detectedKind === 'alarm' || hasSound);
      setTime(initialReminder.time || '09:00');
      setSelectedPeriods(
        initialReminder.triggerPeriods && initialReminder.triggerPeriods.length > 0
          ? initialReminder.triggerPeriods
          : ['exact']
      );
      setAllEmployees(initialReminder.allEmployees ?? true);
      setSelectedEmployeeIds(initialReminder.employeeIds || []);
    } else {
      setKind('deadline');
      setCategory('vehicule');
      setTitle('');
      setEntityName('');
      setDocumentRef('');
      setNote('');
      setDate(new Date().toISOString().split('T')[0]);
      setRenewalCycle('annual');
      setAlertLeadDays(14);
      setEnableSoundAlarm(false);
      setTime('09:00');
      setSelectedPeriods(['exact']);
      if (isEmployee && currentEmployee) {
        setSelectedEmployeeIds([currentEmployee.id]);
        setAllEmployees(false);
      } else {
        setSelectedEmployeeIds([]);
        setAllEmployees(true);
      }
    }
  }, [initialReminder, isOpen, isEmployee, currentEmployee]);

  if (!isOpen) return null;

  const isEditing = Boolean(initialReminder && initialReminder.id);

  const handleApplyTemplate = (templateId: string) => {
    const tpl = DEADLINE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setKind('deadline');
    setCategory(tpl.category);
    setTitle(tpl.title);
    setRenewalCycle(tpl.renewalCycle);
    setAlertLeadDays(tpl.alertLeadDays);
    if (!note.trim()) {
      setNote(tpl.note);
    }
  };

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

    const finalAllEmployees = isEmployee ? false : allEmployees;
    const finalEmployeeIds = isEmployee
      ? currentEmployee?.id
        ? [currentEmployee.id]
        : []
      : allEmployees
      ? employees.map((emp) => emp.id)
      : selectedEmployeeIds;

    const useAlarmTime = kind === 'alarm' || enableSoundAlarm;

    onSaveReminder({
      ...(initialReminder ? { id: initialReminder.id } : {}),
      kind,
      category: kind === 'deadline' ? category : category || 'autre',
      title: title.trim(),
      entityName: entityName.trim() || undefined,
      location: entityName.trim() || undefined,
      documentRef: documentRef.trim() || undefined,
      note: note.trim(),
      date,
      expirationDate: date,
      alertLeadDays: Math.max(0, Number(alertLeadDays) || 14),
      renewalCycle: kind === 'deadline' ? renewalCycle : 'none',
      time: useAlarmTime ? time : '',
      triggerPeriods: useAlarmTime
        ? selectedPeriods.length > 0
          ? selectedPeriods
          : ['exact']
        : [],
      allEmployees: finalAllEmployees,
      employeeIds: finalEmployeeIds,
      triggeredPeriods: initialReminder?.triggeredPeriods || [],
      isResolved: false,
      stopped: false,
    });
    onClose();
  };

  const currentCatMeta = REMINDER_CATEGORY_META[category];

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2A7B76] border border-emerald-200/70 flex items-center justify-center">
              {kind === 'deadline' ? (
                <FileText className="h-4.5 w-4.5" />
              ) : (
                <Bell className="h-4.5 w-4.5" />
              )}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-950">
                {isEditing
                  ? "Modifier l'échéance ou le rappel"
                  : 'Nouvelle échéance ou alerte'}
              </h3>
              <p className="text-[11px] text-stone-500">
                Documents véhicules, impôts périodiques ou rappels horaires avec alerte anticipée.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-200/70 text-xs">
          <button
            type="button"
            onClick={() => setKind('deadline')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              kind === 'deadline'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Échéance / Document / Impôt</span>
          </button>
          <button
            type="button"
            onClick={() => setKind('alarm')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              kind === 'alarm'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bell className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Rappel horaire (sonnerie)</span>
          </button>
        </div>

        {/* Quick Templates in deadline mode (create only) */}
        {kind === 'deadline' && !isEditing && (
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wide">
              Modèles rapides
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEADLINE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl.id)}
                  className="px-2.5 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#2A7B76] text-stone-700 text-[11px] font-semibold transition cursor-pointer"
                >
                  + {tpl.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {kind === 'deadline' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Catégorie *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ReminderCategory)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
                >
                  {(Object.keys(REMINDER_CATEGORY_META) as ReminderCategory[]).map((catKey) => (
                    <option key={catKey} value={catKey}>
                      {REMINDER_CATEGORY_META[catKey].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Élément concerné (véhicule, organisme…)
                </label>
                <input
                  type="text"
                  placeholder={currentCatMeta.placeholderEntity}
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-medium text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>
            </div>
          )}

          {/* Titre */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={kind === 'deadline' ? 'sm:col-span-2' : 'sm:col-span-3'}>
              <label className="block font-bold text-stone-700 mb-1">
                {kind === 'deadline' ? 'Document ou obligation *' : "Titre de l'alerte *"}
              </label>
              <input
                type="text"
                required
                placeholder={
                  kind === 'deadline'
                    ? 'Ex: Carte grise, Visite technique, Impôts trimestriels…'
                    : "Ex: Clôture paie mensuelle, Point d'étape..."
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-bold text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            {kind === 'deadline' && (
              <div>
                <label className="block font-bold text-stone-700 mb-1">N° / Référence</label>
                <input
                  type="text"
                  placeholder="Ex: CG-2026-09"
                  value={documentRef}
                  onChange={(e) => setDocumentRef(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none"
                />
              </div>
            )}
          </div>

          {/* Date, Périodicité et Anticipation */}
          {kind === 'deadline' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-stone-50/90 border border-stone-200/80">
              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
                  Date d&apos;expiration *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono tabular-nums font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Repeat className="h-3.5 w-3.5 text-[#2A7B76]" />
                  Renouvellement
                </label>
                <select
                  value={renewalCycle}
                  onChange={(e) => setRenewalCycle(e.target.value as ReminderRenewalCycle)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-semibold text-stone-800"
                >
                  {(Object.keys(RENEWAL_CYCLE_LABELS) as ReminderRenewalCycle[]).map((key) => (
                    <option key={key} value={key}>
                      {RENEWAL_CYCLE_LABELS[key]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Alerte accueil
                </label>
                <select
                  value={
                    ALERT_LEAD_OPTIONS.some((o) => o.days === alertLeadDays)
                      ? String(alertLeadDays)
                      : 'custom'
                  }
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setAlertLeadDays(Number(e.target.value));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-semibold text-stone-800"
                >
                  {ALERT_LEAD_OPTIONS.map((opt) => (
                    <option key={opt.days} value={String(opt.days)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <span className="text-[10px] text-stone-500">Précis (jours) :</span>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={alertLeadDays}
                    onChange={(e) => setAlertLeadDays(Math.max(1, Number(e.target.value) || 7))}
                    className="w-16 px-2 py-0.5 rounded-lg border border-stone-200 bg-white text-[11px] font-mono tabular-nums font-bold text-stone-800"
                  />
                </div>
              </div>
            </div>
          ) : (
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
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono tabular-nums font-medium"
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
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none font-mono tabular-nums font-medium"
                />
              </div>
            </div>
          )}

          {/* Note / Consigne */}
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              {kind === 'deadline' ? 'Consignes / Pièces à préparer' : "Détail de l'alerte *"}
            </label>
            <textarea
              required={kind === 'alarm'}
              rows={2}
              placeholder={
                kind === 'deadline'
                  ? 'Ex: Contacter le transitaire ou préparer le chèque trésor...'
                  : 'Spécifications, consignes détaillées, ordre du jour...'
              }
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:ring-2 focus:ring-[#2A7B76] outline-none text-stone-800"
            />
          </div>

          {/* Optional audio alarm for deadline mode */}
          {kind === 'deadline' && (
            <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-stone-50/70">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-stone-500" />
                <div>
                  <span className="font-bold text-stone-800 block">
                    Déclencher aussi une sonnerie le jour de l&apos;échéance
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Le message d&apos;accueil s&apos;affiche automatiquement dès J-{alertLeadDays}.
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={enableSoundAlarm}
                onChange={(e) => setEnableSoundAlarm(e.target.checked)}
                className="h-4 w-4 rounded text-[#2A7B76] focus:ring-[#2A7B76] cursor-pointer"
              />
            </div>
          )}

          {/* Audio alarm schedule details */}
          {(kind === 'alarm' || enableSoundAlarm) && (
            <div className="space-y-2.5 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
              {kind === 'deadline' && (
                <div className="flex items-center gap-3">
                  <label className="font-bold text-stone-700">Heure de sonnerie :</label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white font-mono tabular-nums font-semibold"
                  />
                </div>
              )}
              <label className="block font-bold text-stone-800">
                Périodes de sonnerie
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {AVAILABLE_PERIODS.map((period) => {
                  const isChecked = selectedPeriods.includes(period.id);
                  return (
                    <button
                      key={period.id}
                      type="button"
                      onClick={() => handleTogglePeriod(period.id)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] font-bold cursor-pointer transition text-left ${
                        isChecked
                          ? 'bg-[#2A7B76] text-white border-[#2A7B76]'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <span>{period.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recipients */}
          {isEmployee ? (
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80 flex items-center justify-between">
              <span className="font-bold text-stone-700 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
                Destinataire
              </span>
              <span className="font-bold text-[#2A7B76]">
                {currentEmployee?.name || 'Votre compte'}
              </span>
            </div>
          ) : (
            <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
                  Personnes notifiées
                </label>
                <label className="flex items-center gap-2 text-[11px] text-[#2A7B76] font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allEmployees}
                    onChange={(e) => handleToggleAllEmployees(e.target.checked)}
                    className="rounded text-[#2A7B76] focus:ring-[#2A7B76]"
                  />
                  Toute l&apos;équipe
                </label>
              </div>

              {!allEmployees && (
                <div className="max-h-28 overflow-y-auto space-y-1 pt-2 border-t border-stone-200">
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
          )}

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
              className="px-5 py-2.5 rounded-xl bg-[#2A7B76] text-white hover:bg-[#226763] font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{isEditing ? 'Enregistrer' : "Enregistrer l'échéance"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
