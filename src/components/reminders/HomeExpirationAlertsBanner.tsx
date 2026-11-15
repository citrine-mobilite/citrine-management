import React from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Car,
  CheckCircle2,
  FileText,
  Receipt,
  RefreshCw,
  Users,
} from 'lucide-react';
import { AppUser, Employee, Reminder, ReminderCategory } from '../../types';
import {
  RENEWAL_CYCLE_LABELS,
  computeReminderUrgency,
  formatDeadlineFrenchDate,
  getHomeUrgentReminders,
  getReminderCategoryLabel,
  renewOrResolveReminder,
} from '../../services/reminderService';

interface HomeExpirationAlertsBannerProps {
  reminders: Reminder[];
  employees?: Employee[];
  filterForUser?: AppUser | null;
  onRenewOrResolve?: (updatedReminder: Reminder) => void;
  onOpenRemindersModule?: () => void;
  maxVisible?: number;
}

const renderCategoryIcon = (category?: ReminderCategory) => {
  switch (category) {
    case 'vehicule':
      return <Car className="h-4 w-4 text-stone-600" />;
    case 'fiscalite':
      return <Receipt className="h-4 w-4 text-stone-600" />;
    case 'administratif':
      return <FileText className="h-4 w-4 text-stone-600" />;
    case 'rh':
      return <Users className="h-4 w-4 text-stone-600" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-stone-600" />;
  }
};

export const HomeExpirationAlertsBanner: React.FC<HomeExpirationAlertsBannerProps> = ({
  reminders = [],
  filterForUser = null,
  onRenewOrResolve,
  onOpenRemindersModule,
  maxVisible = 4,
}) => {
  const scopedReminders = React.useMemo(() => {
    if (!filterForUser) return reminders;
    const uId = String(filterForUser.id || '').toLowerCase();
    const uEmail = String(filterForUser.email || '').toLowerCase();
    const uName = String(filterForUser.name || '').toLowerCase();

    return reminders.filter((r) => {
      if (r.allEmployees) return true;
      if (r.employeeId && [uId, uEmail, uName].includes(String(r.employeeId).toLowerCase())) {
        return true;
      }
      if (
        r.employeeIds &&
        r.employeeIds.some((id) => [uId, uEmail, uName].includes(String(id).toLowerCase()))
      ) {
        return true;
      }
      return false;
    });
  }, [reminders, filterForUser]);

  const urgentReminders = React.useMemo(
    () => getHomeUrgentReminders(scopedReminders),
    [scopedReminders]
  );

  if (urgentReminders.length === 0) {
    return null;
  }

  const expiredCount = urgentReminders.filter(
    (r) => computeReminderUrgency(r).level === 'expired'
  ).length;
  const criticalCount = urgentReminders.filter(
    (r) => computeReminderUrgency(r).level === 'critical'
  ).length;
  const warningCount = urgentReminders.length - expiredCount - criticalCount;

  const hasExpiredOrCritical = expiredCount > 0 || criticalCount > 0;
  const visibleItems = urgentReminders.slice(0, maxVisible);
  const remainingCount = Math.max(0, urgentReminders.length - visibleItems.length);

  return (
    <section
      aria-label="Alertes d'expiration à traiter"
      className={`bg-white rounded-3xl border shadow-2xs overflow-hidden ${
        hasExpiredOrCritical ? 'border-rose-200' : 'border-amber-200'
      }`}
    >
      {/* En-tête synthétique */}
      <div
        className={`px-5 py-3.5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
          hasExpiredOrCritical
            ? 'bg-rose-50/70 border-rose-100'
            : 'bg-amber-50/70 border-amber-100'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          <div
            className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 border ${
              hasExpiredOrCritical
                ? 'bg-rose-100/80 text-rose-700 border-rose-200'
                : 'bg-amber-100/80 text-amber-700 border-amber-200'
            }`}
          >
            {hasExpiredOrCritical ? (
              <AlertOctagon className="h-4 w-4" />
            ) : (
              <AlertTriangle className="h-4 w-4" />
            )}
          </div>

          <div>
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Papiers, impôts & échéances à valider
            </h3>
            <p className="text-[11px] text-stone-600 font-medium">
              <span className="font-mono tabular-nums font-bold text-stone-900">
                {urgentReminders.length}
              </span>{' '}
              document{urgentReminders.length > 1 ? 's' : ''} ou échéance
              {urgentReminders.length > 1 ? 's' : ''} nécessite
              {urgentReminders.length > 1 ? 'nt' : ''} votre attention
              {expiredCount > 0 && (
                <span className="text-rose-700 font-semibold">
                  {' '}
                  · <span className="font-mono tabular-nums">{expiredCount}</span> expiré
                  {expiredCount > 1 ? 's' : ''}
                </span>
              )}
              {criticalCount > 0 && (
                <span className="text-rose-700 font-semibold">
                  {' '}
                  · <span className="font-mono tabular-nums">{criticalCount}</span> sous 7 jours
                </span>
              )}
              {warningCount > 0 && (
                <span className="text-amber-700 font-semibold">
                  {' '}
                  · <span className="font-mono tabular-nums">{warningCount}</span> à venir sous
                  quinzaine
                </span>
              )}
            </p>
          </div>
        </div>

        {onOpenRemindersModule && (
          <button
            type="button"
            onClick={onOpenRemindersModule}
            className="text-xs font-bold text-[#2A7B76] hover:text-[#1f5e5a] inline-flex items-center gap-1 self-start sm:self-center cursor-pointer transition"
          >
            <span>Gérer les échéances</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Liste compacte des échéances urgentes */}
      <div className="divide-y divide-stone-100">
        {visibleItems.map((reminder) => {
          const urgency = computeReminderUrgency(reminder);
          const isExpired = urgency.level === 'expired';
          const isCritical = urgency.level === 'critical';
          const cycle = reminder.renewalCycle || 'none';
          const isRecurring = cycle !== 'none';

          return (
            <div
              key={reminder.id}
              className="px-5 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-stone-50/70 transition"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-stone-100 border border-stone-200/70 flex items-center justify-center shrink-0 mt-0.5">
                  {renderCategoryIcon(reminder.category)}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-xs text-stone-900 truncate">
                      {reminder.title}
                    </span>
                    {reminder.entityName && (
                      <span className="text-xs font-medium text-stone-600 truncate">
                        — {reminder.entityName}
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold font-mono tabular-nums ${
                        isExpired || isCritical ? 'text-rose-700' : 'text-amber-700'
                      }`}
                    >
                      {isExpired ? (
                        <AlertOctagon className="h-3 w-3 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3 w-3 shrink-0" />
                      )}
                      <span>{urgency.statusLabel}</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-stone-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{getReminderCategoryLabel(reminder.category)}</span>
                    <span>·</span>
                    <span>{RENEWAL_CYCLE_LABELS[cycle]}</span>
                    {urgency.targetDateStr && (
                      <>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1 font-mono tabular-nums text-stone-600">
                          <Calendar className="h-3 w-3 text-stone-400" />
                          Échéance {formatDeadlineFrenchDate(urgency.targetDateStr)}
                        </span>
                      </>
                    )}
                    {reminder.documentRef && (
                      <>
                        <span>·</span>
                        <span className="font-mono text-stone-500">Réf. {reminder.documentRef}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 pl-11 md:pl-0">
                {onRenewOrResolve && (
                  <button
                    type="button"
                    onClick={() => onRenewOrResolve(renewOrResolveReminder(reminder))}
                    className="px-3 py-1.5 rounded-xl bg-[#2A7B76] hover:bg-[#216460] text-white font-bold text-[11px] inline-flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                    title={
                      isRecurring
                        ? 'Valider le paiement/dossier et reporter automatiquement à la prochaine échéance'
                        : 'Marquer ce document comme validé'
                    }
                  >
                    {isRecurring ? (
                      <>
                        <RefreshCw className="h-3 w-3" />
                        <span>Marquer renouvelé</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Valider</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {remainingCount > 0 && onOpenRemindersModule && (
        <div className="px-5 py-2.5 bg-stone-50/70 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-600">
          <span>
            +<span className="font-mono tabular-nums font-bold">{remainingCount}</span> autre
            {remainingCount > 1 ? 's' : ''} échéance{remainingCount > 1 ? 's' : ''} dans le délai
            d&apos;alerte
          </span>
          <button
            type="button"
            onClick={onOpenRemindersModule}
            className="font-bold text-[#2A7B76] hover:underline cursor-pointer"
          >
            Voir tout le registre
          </button>
        </div>
      )}
    </section>
  );
};
