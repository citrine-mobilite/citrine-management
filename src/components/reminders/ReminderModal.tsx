import React from 'react';
import { X, Save, Bell, Users, FileText, Repeat } from 'lucide-react';
import { Reminder, Employee } from '../../types';
import { DEADLINE_TEMPLATE_GROUPS, DEADLINE_TEMPLATES } from '../../services/reminderService';
import { useReminderModalLogic } from './modal/useReminderModalLogic';
import { ReminderDeadlineAndScheduleFields } from './modal/ReminderDeadlineAndScheduleFields';
import { ReminderRoutineFields } from './modal/ReminderRoutineFields';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }) => void;
  initialReminder?: Reminder | null;
  defaultMode?: 'deadline' | 'routine';
  employees: Employee[];
  isEmployee?: boolean;
  currentEmployee?: Employee | null;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSaveReminder,
  initialReminder,
  defaultMode = 'deadline',
  employees,
  isEmployee = false,
  currentEmployee = null,
}) => {
  const {
    kind,
    setKind,
    category,
    setCategory,
    title,
    setTitle,
    entityName,
    setEntityName,
    documentRef,
    setDocumentRef,
    note,
    setNote,
    date,
    setDate,
    renewalCycle,
    setRenewalCycle,
    alertLeadDays,
    setAlertLeadDays,
    enableSoundAlarm,
    setEnableSoundAlarm,
    time,
    setTime,
    selectedPeriods,
    selectedEmployeeIds,
    allEmployees,
    selectedTemplateId,
    routineType,
    setRoutineType,
    recurrenceMode,
    setRecurrenceMode,
    recurrenceDays,
    setRecurrenceDays,
    location,
    setLocation,
    sendPushNotification,
    setSendPushNotification,
    selectedRoutinePresetId,
    isEditing,
    handleApplyTemplate,
    handleApplyRoutinePreset,
    handleToggleRecurrenceDay,
    handleTogglePeriod,
    handleToggleEmployee,
    handleToggleAllEmployees,
    handleSubmit,
  } = useReminderModalLogic({
    isOpen,
    onClose,
    onSaveReminder,
    initialReminder,
    defaultMode: defaultMode === 'routine' ? 'routine' : 'deadline',
    employees,
    isEmployee,
    currentEmployee,
  });

  if (!isOpen) return null;

  const isRoutineMode = kind === 'routine' || kind === 'alarm';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reminder-modal-title"
      className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
    >
      <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2A7B76] border border-emerald-200/60 flex items-center justify-center shrink-0">
              {isRoutineMode ? <Repeat className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            </div>
            <div>
              <h3 id="reminder-modal-title" className="font-serif font-bold text-base text-stone-950">
                {isEditing
                  ? isRoutineMode
                    ? 'Modifier le Rappel Jour J'
                    : "Modifier l'Échéance / Document"
                  : isRoutineMode
                  ? 'Nouveau Rappel Jour J (Sonnerie & Push)'
                  : 'Nouvelle Échéance (Alerte Anticipée J-N)'}
              </h3>
              <p className="text-[11px] text-stone-500">
                {isRoutineMode
                  ? 'Alerte et sonnerie strictement le Jour J à l’heure programmée.'
                  : "Alerte sur l'accueil N jours avant l'échéance (salaires, documents, fiscalité)."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="p-1.5 rounded-xl text-stone-400 hover:bg-stone-100 hover:text-stone-700 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sélecteur des 2 modules bien distincts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-1.5 bg-stone-100 rounded-2xl border border-stone-200/80 text-xs">
          <button
            type="button"
            onClick={() => setKind('deadline')}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              !isRoutineMode
                ? 'bg-white text-stone-950 shadow-2xs border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Module 1 · Échéance (J-N)</span>
          </button>

          <button
            type="button"
            onClick={() => setKind('routine')}
            className={`py-2.5 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              isRoutineMode
                ? 'bg-white text-stone-950 shadow-2xs border border-stone-200/60'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Repeat className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Module 2 · Rappel Jour J</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {!isRoutineMode ? (
            <>
              {!isEditing && (
                <div className="space-y-2 p-3 rounded-2xl bg-stone-50/90 border border-stone-200/80">
                  <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
                    Modèles rapides d&apos;échéances (salaires, véhicules, fiscalité…)
                  </div>
                  <div className="space-y-2">
                    {DEADLINE_TEMPLATE_GROUPS.map((group) => {
                      const items = DEADLINE_TEMPLATES.filter((t) => t.group === group.id);
                      if (items.length === 0) return null;
                      return (
                        <div key={group.id} className="flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-bold text-stone-400 mr-1">
                            {group.label} :
                          </span>
                          {items.map((tpl) => {
                            const active = selectedTemplateId === tpl.id;
                            return (
                              <button
                                key={tpl.id}
                                type="button"
                                onClick={() => handleApplyTemplate(tpl.id)}
                                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                                  active
                                    ? 'bg-[#2A7B76] border-[#2A7B76] text-white shadow-2xs'
                                    : 'border-stone-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#2A7B76] text-stone-700'
                                }`}
                              >
                                + {tpl.label} (J-{tpl.alertLeadDays})
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <ReminderDeadlineAndScheduleFields
                kind="deadline"
                category={category}
                setCategory={setCategory}
                title={title}
                setTitle={setTitle}
                entityName={entityName}
                setEntityName={setEntityName}
                documentRef={documentRef}
                setDocumentRef={setDocumentRef}
                date={date}
                setDate={setDate}
                renewalCycle={renewalCycle}
                setRenewalCycle={setRenewalCycle}
                alertLeadDays={alertLeadDays}
                setAlertLeadDays={setAlertLeadDays}
                note={note}
                setNote={setNote}
                enableSoundAlarm={enableSoundAlarm}
                setEnableSoundAlarm={setEnableSoundAlarm}
                time={time}
                setTime={setTime}
                selectedPeriods={selectedPeriods}
                onTogglePeriod={handleTogglePeriod}
              />
            </>
          ) : (
            <ReminderRoutineFields
              isEditing={isEditing}
              routineType={routineType}
              setRoutineType={setRoutineType}
              title={title}
              setTitle={setTitle}
              location={location}
              setLocation={setLocation}
              recurrenceMode={recurrenceMode}
              setRecurrenceMode={setRecurrenceMode}
              recurrenceDays={recurrenceDays}
              setRecurrenceDays={setRecurrenceDays}
              onToggleRecurrenceDay={handleToggleRecurrenceDay}
              date={date}
              setDate={setDate}
              time={time}
              setTime={setTime}
              note={note}
              setNote={setNote}
              selectedPeriods={selectedPeriods}
              onTogglePeriod={handleTogglePeriod}
              sendPushNotification={sendPushNotification}
              setSendPushNotification={setSendPushNotification}
              enableSoundAlarm={enableSoundAlarm}
              setEnableSoundAlarm={setEnableSoundAlarm}
              selectedRoutinePresetId={selectedRoutinePresetId}
              onApplyRoutinePreset={handleApplyRoutinePreset}
            />
          )}

          {/* Personnes destinataires */}
          {isEmployee ? (
            <div className="p-3.5 bg-stone-50 rounded-2xl border border-stone-200/80">
              <label className="font-bold text-stone-800 flex items-center gap-1.5 mb-1">
                <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
                Destinataire
              </label>
              <div className="text-xs text-stone-700 bg-white p-2.5 rounded-xl border border-stone-200 flex items-center justify-between">
                <span className="font-bold text-[#2A7B76]">
                  {currentEmployee?.name || 'Votre compte'}
                </span>
                <span className="text-[11px] text-stone-400 italic">
                  Assignation directe automatique
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 bg-stone-50 p-3.5 rounded-2xl border border-stone-200/80">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-800 flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
                  Personnes concernées
                </label>
                <label className="flex items-center gap-2 text-[11px] text-[#2A7B76] font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allEmployees}
                    onChange={(e) => handleToggleAllEmployees(e.target.checked)}
                    className="rounded text-[#2A7B76] focus:ring-[#2A7B76]"
                  />
                  Toute l&apos;entreprise
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
                      <span className="text-stone-400 text-[10px]">
                        ({emp.roleType || emp.role || 'Employé'})
                      </span>
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
              className="px-5 py-2.5 rounded-xl bg-[#2A7B76] text-white hover:bg-[#226763] font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>
                {isEditing
                  ? 'Enregistrer les modifications'
                  : isRoutineMode
                  ? 'Programmer le rappel Jour J'
                  : "Créer l'échéance"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
