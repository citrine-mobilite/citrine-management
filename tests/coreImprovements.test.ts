import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDailyWorkedHours,
  countWorkingDaysBetween,
  computeWorkHoursPeriodAnalysis,
} from '../src/components/presence/statistics/workHoursCalculations';
import { computePresenceStatistics } from '../src/components/presence/statistics/statisticsCalculations';
import {
  computeReminderUrgency,
  computeActionableRemindersCount,
  getHomeUrgentReminders,
  renewOrResolveReminder,
  doesRoutineOccurOnDate,
  doesRoutineMatchMoment,
} from '../src/services/reminderService';
import type { Employee, Presence, Reminder } from '../src/types';

function makePresence(overrides: Partial<Presence>): Presence {
  return {
    id: overrides.id || `p-${overrides.date || '2026-11-02'}`,
    employeeId: overrides.employeeId || 'emp-1',
    date: overrides.date || '2026-11-02',
    arrivalTime: 'arrivalTime' in overrides ? overrides.arrivalTime! : '08:00',
    departureTime: 'departureTime' in overrides ? overrides.departureTime! : '17:00',
    pauseStart: overrides.pauseStart ?? '12:00',
    pauseEnd: overrides.pauseEnd ?? '13:00',
    status: overrides.status || 'present',
  };
}

describe('Contrôle du volume horaire (40h/sem · 8h/jour ouvré)', () => {
  it('déduit la pause et vérifie une journée standard de 8h', () => {
    const res = computeDailyWorkedHours(
      makePresence({ arrivalTime: '08:00', departureTime: '17:00', pauseStart: '12:00', pauseEnd: '13:00' })
    );
    assert.equal(res.workedHours, 8);
    assert.equal(res.isIncomplete, false);
    assert.equal(res.isWeekend, false);
  });

  it('marque les pointages sans départ comme incomplets (0h, sans inventer 8h)', () => {
    const res = computeDailyWorkedHours(
      makePresence({ arrivalTime: '08:15', departureTime: '' })
    );
    assert.equal(res.workedHours, 0);
    assert.equal(res.isIncomplete, true);
  });

  it('valide une semaine complète de 40h comme conforme', () => {
    const dates = ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']; // Lun-Ven
    const presences = dates.map((d) => makePresence({ date: d }));
    const analysis = computeWorkHoursPeriodAnalysis(
      presences,
      '2026-11-02',
      '2026-11-08',
      new Date(2026, 10, 8)
    );
    assert.equal(analysis.workingDaysInPeriod, 5);
    assert.equal(analysis.expectedHoursFullPeriod, 40);
    assert.equal(analysis.workedHoursTotal, 40);
    assert.equal(analysis.hoursDelta, 0);
    assert.equal(analysis.hoursVerdict, 'conforme');
    assert.equal(analysis.weeklyHoursBreakdown.length, 1);
    assert.equal(analysis.weeklyHoursBreakdown[0].targetHours, 40);
    assert.equal(analysis.weeklyHoursBreakdown[0].verdict, 'conforme');
  });

  it('sépare les heures de week-end et détecte un déficit mensuel', () => {
    const emp: Employee = {
      id: 'emp-1',
      name: 'Claire Test',
      email: 'claire@citrine.cm',
      phone: '',
      role: 'employé',
      roleType: 'employé',
      salary: 250000,
      hireDate: '2025-01-01',
      avatarUrl: '',
      status: 'en_poste',
    };
    const presences: Presence[] = [
      makePresence({ date: '2026-11-02' }), // 8h Lun
      makePresence({ date: '2026-11-03' }), // 8h Mar
      makePresence({ date: '2026-11-07', arrivalTime: '09:00', departureTime: '13:00', pauseStart: '', pauseEnd: '' }), // 4h Sam
      makePresence({ date: '2026-11-04', arrivalTime: '08:00', departureTime: '' }), // incomplet
    ];
    const stats = computePresenceStatistics(
      [emp],
      presences,
      'this_month',
      undefined,
      undefined,
      new Date(2026, 10, 30)
    );
    const row = stats.statsByEmployee[0];
    assert.equal(countWorkingDaysBetween('2026-11-01', '2026-11-30'), 21);
    assert.equal(row.expectedHoursFullPeriod, 168);
    assert.equal(row.workedHoursWeekdays, 16);
    assert.equal(row.workedHoursWeekend, 4);
    assert.equal(row.workedHoursTotal, 20);
    assert.equal(row.incompleteClockingsCount, 1);
    assert.equal(row.hoursVerdict, 'insuffisant');
  });
});

describe('Modules Alertes (J-N anticipées vs Rappels strictement Jour J)', () => {
  it('déclenche les salaires du 28 dès J-7 (le 21) et reste silencieux le 18', () => {
    const salaryDeadline: Reminder = {
      id: 'rem-sal-1',
      kind: 'deadline',
      category: 'rh',
      title: 'Paiement des salaires',
      date: '2026-11-28',
      expirationDate: '2026-11-28',
      alertLeadDays: 7,
      renewalCycle: 'monthly',
      time: '',
      note: 'Virements mensuels',
      allEmployees: true,
      createdAt: '2026-11-01T08:00:00Z',
    };

    const on18 = computeReminderUrgency(salaryDeadline, new Date(2026, 10, 18));
    assert.equal(on18.isActionNeeded, false);
    assert.equal(on18.level, 'upcoming');
    assert.equal(computeActionableRemindersCount([salaryDeadline], new Date(2026, 10, 18)), 0);

    const on21 = computeReminderUrgency(salaryDeadline, new Date(2026, 10, 21));
    assert.equal(on21.isActionNeeded, true);
    assert.equal(on21.level, 'critical');
    assert.equal(computeActionableRemindersCount([salaryDeadline], new Date(2026, 10, 21)), 1);
    assert.equal(getHomeUrgentReminders([salaryDeadline], new Date(2026, 10, 21)).length, 1);

    const renewed = renewOrResolveReminder(salaryDeadline);
    assert.equal(renewed.expirationDate, '2026-12-28');
    assert.equal(computeActionableRemindersCount([renewed], new Date(2026, 10, 21)), 0);
  });

  it("n'affiche ni n'alerte un rappel Jour J avant la date prévue", () => {
    const futureDayJReminder: Reminder = {
      id: 'rem-dayj-1',
      kind: 'routine',
      routineType: 'reunion',
      recurrenceMode: 'once',
      title: 'Audit de sécurité ponctuel',
      date: '2026-11-25',
      time: '10:30',
      triggerPeriods: ['exact'],
      enableSoundAlarm: true,
      note: 'Rappel Jour J',
      allEmployees: true,
      createdAt: '2026-11-18T08:00:00Z',
    };

    // Le 18 novembre : aucune alerte, aucune sonnerie, absent du bandeau accueil et du compteur sidebar
    const beforeDate = new Date(2026, 10, 18);
    assert.equal(doesRoutineOccurOnDate(futureDayJReminder, beforeDate), false);
    assert.equal(getHomeUrgentReminders([futureDayJReminder], beforeDate).length, 0);
    assert.equal(computeActionableRemindersCount([futureDayJReminder], beforeDate), 0);
    assert.equal(
      doesRoutineMatchMoment(futureDayJReminder, {
        dateStr: '2026-11-18',
        dayOfMonth: 18,
        dayOfWeek: 3,
        hour: 10,
        minute: 30,
      }),
      null
    );

    // Le 25 novembre (Jour J) : actif et sonne exactement à 10:30
    const onDayJ = new Date(2026, 10, 25);
    assert.equal(doesRoutineOccurOnDate(futureDayJReminder, onDayJ), true);
    assert.equal(computeActionableRemindersCount([futureDayJReminder], onDayJ), 1);
    assert.equal(getHomeUrgentReminders([futureDayJReminder], onDayJ).length, 0);
    const match = doesRoutineMatchMoment(futureDayJReminder, {
      dateStr: '2026-11-25',
      dayOfMonth: 25,
      dayOfWeek: 3,
      hour: 10,
      minute: 30,
    });
    assert.ok(match);
    assert.equal(match?.period, 'exact');
  });
});

describe('Calcul réel des taux de présence et assiduité depuis le 20/10/2026', () => {
  const sampleEmployee: Employee = {
    id: 'emp-stat-1',
    name: 'Collaborateur Test',
    email: 'test@citrine.cm',
    phone: '',
    role: 'employé',
    roleType: 'employé',
    salary: 200000,
    hireDate: '2026-11-20',
    avatarUrl: '',
    status: 'en_poste',
  };

  it('ne donne jamais 100% quand des jours ouvrés ne sont pas badgés', () => {
    // Du 20/10/2026 au 16/11/2026 = 20 jours ouvrés (4 semaines complètes Lun-Ven)
    const badgedDates = ['2026-10-20', '2026-10-21', '2026-11-02', '2026-11-03', '2026-11-04'];
    const presences = badgedDates.map((d) => makePresence({ employeeId: 'emp-stat-1', date: d }));
    const stats = computePresenceStatistics(
      [sampleEmployee],
      presences,
      'all',
      undefined,
      undefined,
      new Date(2026, 10, 16)
    );
    const row = stats.statsByEmployee[0];
    assert.equal(stats.startStr, '2026-10-20');
    assert.equal(row.workingDaysElapsed, 20);
    assert.equal(row.absentDays, 15);
    assert.equal(row.presenceRate, 25);
    assert.ok(row.assiduiteRate < 35);
  });

  it('retourne 0% (et non 100%) pour un profil sans aucun pointage', () => {
    const stats = computePresenceStatistics(
      [sampleEmployee],
      [],
      'this_month',
      undefined,
      undefined,
      new Date(2026, 10, 24)
    );
    const row = stats.statsByEmployee[0];
    assert.equal(row.workingDaysElapsed, 17);
    assert.equal(row.absentDays, 17);
    assert.equal(row.presenceRate, 0);
    assert.equal(row.ponctualiteRate, 0);
    assert.equal(row.assiduiteRate, 0);
  });

  it("borne le mois d'octobre au 20/10/2026 sans pénaliser les jours d'avant lancement", () => {
    const oct20To30 = [
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
    ];
    const presences = oct20To30.map((d) => makePresence({ employeeId: 'emp-stat-1', date: d }));
    // En novembre, 'last_month' correspond à octobre 2026
    const stats = computePresenceStatistics(
      [sampleEmployee],
      presences,
      'last_month',
      undefined,
      undefined,
      new Date(2026, 10, 24)
    );
    const row = stats.statsByEmployee[0];
    assert.equal(stats.startStr, '2026-10-20');
    assert.equal(stats.endStr, '2026-10-31');
    assert.equal(row.workingDaysElapsed, 9);
    assert.equal(row.absentDays, 0);
    assert.equal(row.presenceRate, 100);
    assert.equal(row.assiduiteRate, 100);
  });

  it("ne compte pas les jours ouvrés futurs du mois en cours comme des absences", () => {
    // Au mardi 10/11/2026 : seulement 7 jours ouvrés écoulés en novembre (2,3,4,5,6,9,10)
    const nov2To10 = [
      '2026-11-02',
      '2026-11-03',
      '2026-11-04',
      '2026-11-05',
      '2026-11-06',
      '2026-11-09',
      '2026-11-10',
    ];
    const presences = nov2To10.map((d) => makePresence({ employeeId: 'emp-stat-1', date: d }));
    const stats = computePresenceStatistics(
      [sampleEmployee],
      presences,
      'this_month',
      undefined,
      undefined,
      new Date(2026, 10, 10)
    );
    const row = stats.statsByEmployee[0];
    assert.equal(row.workingDaysElapsed, 7);
    assert.equal(row.absentDays, 0);
    assert.equal(row.presenceRate, 100);
    assert.equal(row.assiduiteRate, 100);
  });

  it("fait avancer dynamiquement le jour d'arrêt au fil du temps (non figé à aujourd'hui)", () => {
    const statsDec = computePresenceStatistics(
      [sampleEmployee],
      [makePresence({ employeeId: 'emp-stat-1', date: '2026-10-20' })],
      'all',
      undefined,
      undefined,
      new Date(2026, 11, 4) // Vendredi 04/12/2026
    );
    assert.equal(statsDec.startStr, '2026-10-20');
    assert.equal(statsDec.endStr, '2026-12-04');
    assert.equal(statsDec.statsByEmployee[0].workingDaysElapsed, 34);
  });
});
