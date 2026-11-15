import React from 'react';
import {
  AlertTriangle,
  CheckSquare,
  CheckCircle2,
  CheckCheck,
  ShieldAlert,
  Info,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import { PersonalAlert } from './employeeAlertsTypes';

interface EmployeeAlertsListViewProps {
  filteredAlerts: PersonalAlert[];
  searchQuery: string;
  viewDensity: 'compact' | 'detailed';
  expandedAlertId: string | null;
  onSelectAlert: (alert: PersonalAlert) => void;
}

export const EmployeeAlertsListView: React.FC<EmployeeAlertsListViewProps> = ({
  filteredAlerts,
  searchQuery,
  viewDensity,
  expandedAlertId,
  onSelectAlert,
}) => {
  if (filteredAlerts.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-stone-200 shadow-2xs space-y-2.5">
        <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
        <h3 className="font-bold text-stone-800 text-sm">Aucune alerte à afficher</h3>
        <p className="text-xs text-stone-500 max-w-sm mx-auto">
          {searchQuery
            ? `Aucun résultat pour "${searchQuery}". Essayez un autre mot-clé.`
            : 'Toutes vos notifications sont à jour pour ce filtre.'}
        </p>
      </div>
    );
  }

  if (viewDensity === 'compact') {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 divide-y divide-stone-100 shadow-2xs overflow-hidden">
        {filteredAlerts.map((alert) => {
          const isExpanded = expandedAlertId === alert.id;
          const isUrgent = alert.type === 'urgent';
          const isIncident = alert.type === 'incident';

          return (
            <div
              key={alert.id}
              onClick={() => onSelectAlert(alert)}
              className={`group px-4 py-3 transition-colors cursor-pointer flex flex-col ${
                !alert.read
                  ? isUrgent
                    ? 'bg-red-50/40 hover:bg-red-50/70'
                    : 'bg-amber-50/30 hover:bg-amber-50/60'
                  : 'bg-white hover:bg-stone-50/80'
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      !alert.read
                        ? isUrgent
                          ? 'bg-red-500 ring-4 ring-red-200/60'
                          : 'bg-amber-500 ring-4 ring-amber-200/60'
                        : 'bg-stone-300'
                    }`}
                    title={alert.read ? 'Lue' : 'Non lue'}
                  />

                  <div className="p-1 rounded-lg bg-stone-100 text-stone-600 shrink-0">
                    {isUrgent ? (
                      <ShieldAlert className="w-3.5 h-3.5 text-red-600" />
                    ) : isIncident ? (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    ) : alert.category === 'Tâche' ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-600" />
                    ) : (
                      <Info className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </div>

                  <div className="min-w-0 flex items-center gap-2 truncate">
                    <span className={`truncate text-xs ${!alert.read ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                      {alert.title}
                    </span>
                    <span className="hidden md:inline text-stone-400">·</span>
                    <span className="hidden md:inline text-[11px] text-stone-500 truncate max-w-sm">{alert.message}</span>
                  </div>

                  <span className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-stone-100 text-stone-600">
                    {alert.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] font-mono text-stone-400">{alert.timestamp}</span>

                  {alert.read ? (
                    <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" /> Lu
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 font-bold">Non lue</span>
                  )}

                  {alert.actionUrl && (
                    <a
                      href={alert.actionUrl}
                      onClick={(e) => e.stopPropagation()}
                      className="px-2 py-1 rounded-lg bg-stone-100 hover:bg-[#2A7B76] text-stone-600 hover:text-white text-[11px] font-bold transition flex items-center gap-1"
                      title="Consulter l'élément"
                    >
                      <span className="hidden sm:inline">Voir</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}

                  <div className="text-stone-400">
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-2.5 pt-2.5 border-t border-stone-200/60 pl-6 text-xs space-y-2 text-stone-700 animate-in fade-in duration-150">
                  <p className="leading-relaxed bg-white/70 p-2.5 rounded-xl border border-stone-200/60 text-xs">
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                    <span>
                      Identifiant : <code className="font-mono text-[10px] text-stone-400">{alert.id}</code>
                    </span>
                    <span className="text-emerald-700 font-bold">Lue et enregistrée ✓</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {filteredAlerts.map((alert) => {
        const isUrgent = alert.type === 'urgent';
        return (
          <div
            key={alert.id}
            onClick={() => onSelectAlert(alert)}
            className={`bg-white rounded-2xl p-4 border shadow-2xs transition flex flex-col justify-between gap-3 cursor-pointer ${
              !alert.read
                ? isUrgent
                  ? 'border-red-300 bg-red-50/30'
                  : 'border-amber-300 bg-amber-50/20'
                : 'border-stone-200 opacity-90'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      !alert.read ? 'bg-amber-500 ring-4 ring-amber-200/60' : 'bg-stone-300'
                    }`}
                  />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                    {alert.category}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400">{alert.timestamp}</span>
              </div>

              <h4 className={`text-xs font-bold ${!alert.read ? 'text-stone-900' : 'text-stone-700'}`}>{alert.title}</h4>
              <p className="text-xs text-stone-600 leading-relaxed bg-stone-50/60 p-2 rounded-xl border border-stone-100">
                {alert.message}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
              <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                {alert.read ? '✓ Lue' : 'Non lue (cliquer pour lire)'}
              </span>

              {alert.actionUrl && (
                <a
                  href={alert.actionUrl}
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-lg bg-[#2A7B76] text-white font-bold text-xs flex items-center gap-1 hover:bg-[#20615d] transition"
                >
                  <span>Consulter</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
