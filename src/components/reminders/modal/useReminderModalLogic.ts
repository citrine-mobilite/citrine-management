import React, { useState, useEffect } from 'react';
import {
  Reminder,
  Employee,
  ReminderCategory,
  ReminderKind,
  ReminderRenewalCycle,
} from '../../../types';
import { DEADLINE_TEMPLATES } from '../../../services/reminderService';

export const AVAILABLE_PERIODS = [
  { id: 'exact', label: "À l'heure exacte" },
  { id: '5m', label: '5 min avant' },
  { id: '15m', label: '15 min avant' },
  { id: '30m', label: '30 min avant' },
  { id: '1h', label: '1h avant' },
];

interface UseReminderModalLogicProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveReminder: (reminderData: Omit<Reminder, 'id' | 'createdAt'> & { id?: string }) => void;
  initialReminder?: Reminder | null;
  employees: Employee[];
  isEmployee: boolean;
  currentEmployee: Employee | null;
}

export function useReminderModalLogic({
  isOpen,
  onClose,
  onSaveReminder,
  initialReminder,
  employees,
  isEmployee,
  currentEmployee,
}: UseReminderModalLogicProps) {
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
    setSelectedEmployeeIds(checked ? employees.map((e) => e.id) : []);
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

  return {
    kind, setKind, category, setCategory, title, setTitle,
    entityName, setEntityName, documentRef, setDocumentRef,
    note, setNote, date, setDate, renewalCycle, setRenewalCycle,
    alertLeadDays, setAlertLeadDays, enableSoundAlarm, setEnableSoundAlarm,
    time, setTime, selectedPeriods, selectedEmployeeIds, allEmployees,
    isEditing, handleApplyTemplate, handleTogglePeriod,
    handleToggleEmployee, handleToggleAllEmployees, handleSubmit,
  };
}
