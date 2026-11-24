import React, { useState, useEffect } from 'react';
import {
  Reminder,
  Employee,
  ReminderCategory,
  ReminderKind,
  ReminderRenewalCycle,
  ReminderRecurrenceMode,
  ReminderRoutineType,
} from '../../../types';
import {
  DEADLINE_TEMPLATES,
  ROUTINE_PRESETS,
  isRoutineReminder,
  resolveRecurrenceMode,
  getActiveWeekdays,
  toLocalIsoDateStr,
} from '../../../services/reminderService';

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
  defaultMode?: 'deadline' | 'routine';
  employees: Employee[];
  isEmployee: boolean;
  currentEmployee: Employee | null;
}

export function useReminderModalLogic({
  isOpen,
  onClose,
  onSaveReminder,
  initialReminder,
  defaultMode = 'deadline',
  employees,
  isEmployee,
  currentEmployee,
}: UseReminderModalLogicProps) {
  const [kind, setKind] = useState<ReminderKind>(defaultMode);
  const [category, setCategory] = useState<ReminderCategory>('vehicule');
  const [title, setTitle] = useState('');
  const [entityName, setEntityName] = useState('');
  const [documentRef, setDocumentRef] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(() => toLocalIsoDateStr(new Date()));
  const [renewalCycle, setRenewalCycle] = useState<ReminderRenewalCycle>('annual');
  const [alertLeadDays, setAlertLeadDays] = useState<number>(14);
  const [enableSoundAlarm, setEnableSoundAlarm] = useState(false);
  const [time, setTime] = useState('09:00');
  const [selectedPeriods, setSelectedPeriods] = useState<string[]>(['exact']);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [allEmployees, setAllEmployees] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [lastTemplateNote, setLastTemplateNote] = useState<string>('');
  const [lastTemplateEntity, setLastTemplateEntity] = useState<string>('');

  // Champs spécifiques aux Rituels & Rappels Récurrents (non-documentaires)
  const [routineType, setRoutineType] = useState<ReminderRoutineType>('reunion');
  const [recurrenceMode, setRecurrenceMode] = useState<ReminderRecurrenceMode>('weekly_days');
  const [recurrenceDays, setRecurrenceDays] = useState<number[]>([1, 3, 5]);
  const [location, setLocation] = useState('');
  const [sendPushNotification, setSendPushNotification] = useState(true);
  const [selectedRoutinePresetId, setSelectedRoutinePresetId] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    setSelectedTemplateId(null);
    setSelectedRoutinePresetId(null);
    setLastTemplateNote('');
    setLastTemplateEntity('');

    if (initialReminder) {
      const routineFlag = isRoutineReminder(initialReminder);
      const detectedKind: ReminderKind = routineFlag ? 'routine' : 'deadline';

      setKind(detectedKind);
      setCategory(initialReminder.category || (routineFlag ? 'autre' : 'vehicule'));
      setTitle(initialReminder.title || initialReminder.note || '');
      setEntityName(initialReminder.entityName || initialReminder.location || '');
      setDocumentRef(initialReminder.documentRef || '');
      setNote(initialReminder.note || '');
      setDate(
        (
          initialReminder.expirationDate ||
          initialReminder.date ||
          toLocalIsoDateStr(new Date())
        ).split('T')[0]
      );
      setRenewalCycle(initialReminder.renewalCycle || 'none');
      setAlertLeadDays(
        typeof initialReminder.alertLeadDays === 'number' ? initialReminder.alertLeadDays : 14
      );
      setEnableSoundAlarm(
        routineFlag
          ? initialReminder.enableSoundAlarm !== false
          : Boolean(initialReminder.time && initialReminder.time.trim().length > 0)
      );
      setTime(initialReminder.time || '09:00');
      setSelectedPeriods(
        initialReminder.triggerPeriods && initialReminder.triggerPeriods.length > 0
          ? initialReminder.triggerPeriods
          : ['exact']
      );
      setAllEmployees(initialReminder.allEmployees ?? true);
      setSelectedEmployeeIds(initialReminder.employeeIds || []);

      // Routine state
      setRoutineType(initialReminder.routineType || 'reunion');
      const mode = resolveRecurrenceMode(initialReminder);
      setRecurrenceMode(mode);
      const days = getActiveWeekdays(initialReminder);
      setRecurrenceDays(days.length > 0 ? days : [1, 3, 5]);
      setLocation(initialReminder.location || initialReminder.entityName || '');
      setSendPushNotification(initialReminder.sendPushNotification !== false);
    } else {
      const startKind: ReminderKind = defaultMode === 'routine' ? 'routine' : 'deadline';
      setKind(startKind);
      setCategory(startKind === 'routine' ? 'autre' : 'vehicule');
      setTitle('');
      setEntityName('');
      setDocumentRef('');
      setNote('');
      setDate(toLocalIsoDateStr(new Date()));
      setRenewalCycle('annual');
      setAlertLeadDays(14);
      setEnableSoundAlarm(startKind === 'routine');
      setTime('09:00');
      setSelectedPeriods(startKind === 'routine' ? ['15m', 'exact'] : ['exact']);
      setRoutineType('reunion');
      setRecurrenceMode('weekly_days');
      setRecurrenceDays([1, 3, 5]);
      setLocation('');
      setSendPushNotification(true);

      if (isEmployee && currentEmployee) {
        setSelectedEmployeeIds([currentEmployee.id]);
        setAllEmployees(false);
      } else {
        setSelectedEmployeeIds([]);
        setAllEmployees(true);
      }
    }
  }, [initialReminder, isOpen, isEmployee, currentEmployee, defaultMode]);

  const isEditing = Boolean(initialReminder && initialReminder.id);

  const computeNextMonthlyDueDate = (dayOfMonth: number): string => {
    const now = new Date();
    const currentDay = now.getDate();
    const targetMonthOffset = dayOfMonth >= currentDay ? 0 : 1;
    const targetMonthDate = new Date(now.getFullYear(), now.getMonth() + targetMonthOffset, 1);
    const lastDay = new Date(
      targetMonthDate.getFullYear(),
      targetMonthDate.getMonth() + 1,
      0
    ).getDate();
    const finalDay = Math.min(dayOfMonth, lastDay);
    const y = targetMonthDate.getFullYear();
    const m = String(targetMonthDate.getMonth() + 1).padStart(2, '0');
    const d = String(finalDay).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleApplyTemplate = (templateId: string) => {
    const tpl = DEADLINE_TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedTemplateId(tpl.id);
    setKind('deadline');
    setCategory(tpl.category);
    setTitle(tpl.title);
    setRenewalCycle(tpl.renewalCycle);
    setAlertLeadDays(tpl.alertLeadDays);

    if (tpl.entityName && (!entityName.trim() || entityName === lastTemplateEntity)) {
      setEntityName(tpl.entityName);
      setLastTemplateEntity(tpl.entityName);
    }

    if (!note.trim() || note === lastTemplateNote) {
      setNote(tpl.note);
      setLastTemplateNote(tpl.note);
    }

    if (tpl.suggestedDayOfMonth) {
      setDate(computeNextMonthlyDueDate(tpl.suggestedDayOfMonth));
    }

    if (tpl.id === 'salaires_mensuels' && !isEmployee) {
      setAllEmployees(true);
      setSelectedEmployeeIds([]);
    }
  };

  const handleApplyRoutinePreset = (presetId: string) => {
    const preset = ROUTINE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSelectedRoutinePresetId(preset.id);
    setKind('routine');
    setRoutineType(preset.routineType);
    setTitle(preset.title);
    setRecurrenceMode(preset.recurrenceMode);
    setRecurrenceDays(preset.recurrenceDays);
    setTime(preset.time);
    setSelectedPeriods(preset.triggerPeriods);
    setNote(preset.note);
  };

  const handleToggleRecurrenceDay = (day: number) => {
    setRecurrenceMode('weekly_days');
    if (recurrenceDays.includes(day)) {
      const remaining = recurrenceDays.filter((d) => d !== day);
      setRecurrenceDays(remaining.length > 0 ? remaining : [day]);
    } else {
      setRecurrenceDays([...recurrenceDays, day]);
    }
  };

  const handleTogglePeriod = (periodId: string) => {
    if (selectedPeriods.includes(periodId)) {
      const remaining = selectedPeriods.filter((p) => p !== periodId);
      setSelectedPeriods(remaining.length > 0 ? remaining : ['exact']);
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

    const isRoutine = kind === 'routine' || kind === 'alarm';

    if (isRoutine) {
      const finalDays =
        recurrenceMode === 'weekly_days'
          ? recurrenceDays.length > 0
            ? recurrenceDays
            : [1]
          : recurrenceMode === 'weekdays'
          ? [1, 2, 3, 4, 5]
          : recurrenceMode === 'daily'
          ? [0, 1, 2, 3, 4, 5, 6]
          : [];

      onSaveReminder({
        ...(initialReminder ? { id: initialReminder.id } : {}),
        kind: 'routine',
        routineType,
        category: 'autre',
        title: title.trim(),
        location: location.trim() || undefined,
        entityName: location.trim() || undefined,
        note: note.trim(),
        recurrenceMode,
        recurrenceDays: finalDays,
        date: recurrenceMode === 'once' || recurrenceMode === 'monthly' ? date : undefined,
        expirationDate: undefined,
        renewalCycle: 'none',
        time: time || '09:00',
        triggerPeriods: selectedPeriods.length > 0 ? selectedPeriods : ['exact'],
        sendPushNotification,
        enableSoundAlarm,
        allEmployees: finalAllEmployees,
        employeeIds: finalEmployeeIds,
        triggeredPeriods: initialReminder?.triggeredPeriods || [],
        lastTriggeredKey: initialReminder?.lastTriggeredKey,
        isResolved: false,
        stopped: initialReminder?.stopped ?? false,
      });
      onClose();
      return;
    }

    const useAlarmTime = enableSoundAlarm;

    onSaveReminder({
      ...(initialReminder ? { id: initialReminder.id } : {}),
      kind: 'deadline',
      category,
      title: title.trim(),
      entityName: entityName.trim() || undefined,
      location: entityName.trim() || undefined,
      documentRef: documentRef.trim() || undefined,
      note: note.trim(),
      date,
      expirationDate: date,
      alertLeadDays: Math.max(0, Number(alertLeadDays) || 14),
      renewalCycle,
      time: useAlarmTime ? time : '',
      triggerPeriods: useAlarmTime
        ? selectedPeriods.length > 0
          ? selectedPeriods
          : ['exact']
        : [],
      enableSoundAlarm: useAlarmTime,
      allEmployees: finalAllEmployees,
      employeeIds: finalEmployeeIds,
      triggeredPeriods: initialReminder?.triggeredPeriods || [],
      isResolved: false,
      stopped: false,
    });
    onClose();
  };

  return {
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
  };
}
