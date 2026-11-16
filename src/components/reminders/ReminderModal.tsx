import React from 'react';
import { X, Save, Bell, FileText } from 'lucide-react';
import { Reminder, Employee } from '../../types';
import { DEADLINE_TEMPLATES } from '../../services/reminderService';
import { DEADLINE_TEMPLATE_GROUPS } from '../../services/reminders/reminderConstants';
import { useReminderModalLogic } from './modal/useReminderModalLogic';
import { ReminderDeadlineAndScheduleFields } from './modal/ReminderDeadlineAndScheduleFields';
import { ReminderRecipientsSection } from './modal/ReminderRecipientsSection';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }) => void;
  initialReminder?: Reminder | null;
  employees: Employee[];
  isEmployee?: boolean;
  currentEmployee?: Employee | null;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSaveReminder,
  initialReminder,
  employees,
  isEmployee = false,
  currentEmployee = null,
}) => {
  const logic = useReminderModalLogic({
    isOpen,
    onClose,
    onSaveReminder,
    initialReminder,
    employees,
    isEmployee,
    currentEmployee,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl p-6 w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-stone-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2A7B76] border border-emerald-200/70 flex items-center justify-center">
              {logic.kind === 'deadline' ? (
                <FileText className="h-4.5 w-4.5" />
              ) : (
                <Bell className="h-4.5 w-4.5" />
              )}
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-950">
                {logic.isEditing ? "Modifier l'échéance ou le rappel" : 'Nouvelle échéance ou alerte'}
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

        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-2xl border border-stone-200/70 text-xs">
          <button
            type="button"
            onClick={() => logic.setKind('deadline')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              logic.kind === 'deadline'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <FileText className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Échéance / Document / Impôt</span>
          </button>
          <button
            type="button"
            onClick={() => logic.setKind('alarm')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              logic.kind === 'alarm'
                ? 'bg-white text-stone-900 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Bell className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>Rappel horaire (sonnerie)</span>
          </button>
        </div>

        {logic.kind === 'deadline' && !logic.isEditing && (
          <div className="space-y-2.5 p-3 rounded-2xl bg-stone-50/90 border border-stone-200/80">
            <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wide">
              Modèles rapides d&apos;entreprise
            </div>
            <div className="space-y-2">
              {DEADLINE_TEMPLATE_GROUPS.map((grp) => {
                const items = DEADLINE_TEMPLATES.filter((t) => t.group === grp.id);
                if (items.length === 0) return null;
                return (
                  <div key={grp.id} className="space-y-1">
                    <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                      {grp.label}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((tpl) => {
                        const isSelected = logic.selectedTemplateId === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => logic.handleApplyTemplate(tpl.id)}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#2A7B76] border-[#2A7B76] text-white shadow-2xs'
                                : 'border-stone-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 hover:text-[#2A7B76] text-stone-700'
                            }`}
                          >
                            + {tpl.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={logic.handleSubmit} className="space-y-4 text-xs">
          <ReminderDeadlineAndScheduleFields
            kind={logic.kind}
            category={logic.category}
            setCategory={logic.setCategory}
            title={logic.title}
            setTitle={logic.setTitle}
            entityName={logic.entityName}
            setEntityName={logic.setEntityName}
            documentRef={logic.documentRef}
            setDocumentRef={logic.setDocumentRef}
            date={logic.date}
            setDate={logic.setDate}
            renewalCycle={logic.renewalCycle}
            setRenewalCycle={logic.setRenewalCycle}
            alertLeadDays={logic.alertLeadDays}
            setAlertLeadDays={logic.setAlertLeadDays}
            note={logic.note}
            setNote={logic.setNote}
            enableSoundAlarm={logic.enableSoundAlarm}
            setEnableSoundAlarm={logic.setEnableSoundAlarm}
            time={logic.time}
            setTime={logic.setTime}
            selectedPeriods={logic.selectedPeriods}
            onTogglePeriod={logic.handleTogglePeriod}
          />

          <ReminderRecipientsSection
            isEmployee={isEmployee}
            currentEmployee={currentEmployee}
            employees={employees}
            allEmployees={logic.allEmployees}
            selectedEmployeeIds={logic.selectedEmployeeIds}
            onToggleAllEmployees={logic.handleToggleAllEmployees}
            onToggleEmployee={logic.handleToggleEmployee}
          />

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
              <span>{logic.isEditing ? 'Enregistrer' : "Enregistrer l'échéance"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
