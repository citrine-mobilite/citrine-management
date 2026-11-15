import React from 'react';
import {
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';

interface WeeklyAttendanceRecapBodyProps {
  successInfo: { recipients?: string[]; ccCount?: number } | null;
  loadingPreview: boolean;
  reportPreview: any;
  activeEmployeesWithEmail: any[];
  error: string | null;
  onClose: () => void;
}

export const WeeklyAttendanceRecapBody: React.FC<WeeklyAttendanceRecapBodyProps> = ({
  successInfo,
  loadingPreview,
  reportPreview,
  activeEmployeesWithEmail,
  error,
  onClose,
}) => (
  <div className="p-6 space-y-5 overflow-y-auto flex-1">
    {successInfo ? (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-3 animate-in zoom-in-95 duration-200">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-700">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h4 className="font-bold text-stone-900 text-sm">
          Rapport Hebdomadaire Envoyé avec Succès !
        </h4>
        <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
          Le récapitulatif de la semaine en cours a été transmis aux responsables RH.
          Une copie conforme (CC) a été adressée à l'ensemble des <strong>{successInfo.ccCount || activeEmployeesWithEmail.length} collaborateurs actifs</strong>.
        </p>
        {successInfo.recipients && successInfo.recipients.length > 0 && (
          <div className="text-[11px] font-mono text-stone-500 bg-white/80 py-1.5 px-3 rounded-lg border border-emerald-100 w-fit mx-auto">
            Destinataires RH : {successInfo.recipients.join(', ')}
          </div>
        )}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
          >
            Fermer
          </button>
        </div>
      </div>
    ) : (
      <>
        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-1">Périmètre &amp; Règle d'envoi strict Citrine :</span>
            Ce bouton permet d'envoyer <strong>manuellement et à tout moment</strong> le récapitulatif des présences pour la <strong>semaine en cours</strong> (du lundi au jour courant).
            Un seul e-mail structuré sera expédié aux responsables, et <strong>tous les collaborateurs</strong> recevront une copie en <strong>CC</strong>.
          </div>
        </div>

        {loadingPreview ? (
          <div className="py-8 text-center space-y-2 text-stone-500">
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#2A7B76]" />
            <p className="text-xs">Compilation des pointages de la semaine en cours...</p>
          </div>
        ) : reportPreview ? (
          <div className="space-y-4">
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200/80 pb-2.5">
                <div className="flex items-center gap-2 text-stone-700 font-bold text-xs">
                  <Calendar className="h-4 w-4 text-[#2A7B76]" />
                  <span>Période analysée :</span>
                </div>
                <span className="text-xs font-bold text-stone-900 bg-white px-2.5 py-1 rounded-lg border border-stone-200 shadow-3xs">
                  {reportPreview.startDateStr} au {reportPreview.endDateStr}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-3xs">
                  <div className="text-[10px] text-stone-400 font-extrabold uppercase">Effectif</div>
                  <div className="text-base font-extrabold text-stone-900 mt-0.5">{reportPreview.totalCollaborators}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-3xs">
                  <div className="text-[10px] text-stone-400 font-extrabold uppercase">Heures</div>
                  <div className="text-base font-extrabold text-[#164e4b] mt-0.5">{reportPreview.totalCollectiveHoursText}</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-3xs">
                  <div className="text-[10px] text-stone-400 font-extrabold uppercase">Assiduité</div>
                  <div className="text-base font-extrabold text-sky-700 mt-0.5">{reportPreview.averageAttendanceRate}%</div>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-stone-200/70 shadow-3xs">
                  <div className="text-[10px] text-stone-400 font-extrabold uppercase">Retards</div>
                  <div className={`text-base font-extrabold mt-0.5 ${reportPreview.totalLateness > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {reportPreview.totalLateness}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-stone-600">
                <div className="flex items-center gap-1.5 font-medium">
                  <Clock className="h-3.5 w-3.5 text-amber-600" />
                  <span>Seuil de retard paramétré :</span>
                  <strong className="text-stone-900 bg-amber-100/70 text-amber-900 px-1.5 py-0.5 rounded-md font-mono">
                    {reportPreview.lateThreshold || '08:30'}
                  </strong>
                  <span className="text-[10px] text-stone-400">(par défaut 08:00 si non défini)</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60 font-semibold w-fit">
                  <span>🛡️ Superadmins exclus • Inclus : Responsables, IT, Employés</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-stone-700">
                <div className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-[#2A7B76]" />
                  <span>Collaborateurs inclus dans le rapport &amp; mis en copie (CC) :</span>
                </div>
                <span className="text-[11px] text-stone-400 font-mono">
                  {activeEmployeesWithEmail.length} e-mails valides
                </span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-stone-50 rounded-2xl border border-stone-200">
                {activeEmployeesWithEmail.map((emp) => (
                  <div key={emp.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-stone-100 text-xs shadow-3xs">
                    <span className="font-bold text-stone-800">{emp.name}</span>
                    <span className="text-[11px] font-mono text-stone-400 truncate max-w-[220px]">{emp.email}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Impossible d'expédier le récapitulatif :</span>
              <span className="break-all">{error}</span>
            </div>
          </div>
        )}
      </>
    )}
  </div>
);
