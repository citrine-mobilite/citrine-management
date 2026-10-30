import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  X, 
  Users, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send,
  Eye,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { Employee, Presence } from '../../types';

interface WeeklyAttendanceRecapModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: Employee[];
  presences: Presence[];
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function WeeklyAttendanceRecapModal({
  isOpen,
  onClose,
  employees,
  presences,
  showToast,
}: WeeklyAttendanceRecapModalProps) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [reportPreview, setReportPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ recipients?: string[]; ccCount?: number } | null>(null);

  // Charger la prévisualisation des données de la semaine courante
  useEffect(() => {
    if (!isOpen) {
      setReportPreview(null);
      setError(null);
      setSuccessInfo(null);
      return;
    }

    let isMounted = true;
    async function loadPreview() {
      setLoadingPreview(true);
      setError(null);
      try {
        const res = await fetch('/api/attendance/weekly-recap?manual=true');
        const json = await res.json();
        if (json.success && json.report) {
          if (isMounted) setReportPreview(json.report);
        } else {
          if (isMounted) setError(json.error || "Impossible de prévisualiser le récapitulatif.");
        }
      } catch (err: any) {
        if (isMounted) setError(err.message || "Erreur de connexion avec le serveur.");
      } finally {
        if (isMounted) setLoadingPreview(false);
      }
    }

    loadPreview();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSendReport = async () => {
    setSending(true);
    setError(null);
    try {
      const res = await fetch('/api/attendance/weekly-recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manual: true }),
      });
      const json = await res.json();

      if (json.success) {
        setSuccessInfo({
          recipients: json.recipients,
          ccCount: json.ccCount,
        });
        if (showToast) {
          showToast(`Récapitulatif envoyé aux responsables et mis en copie à ${json.ccCount || 0} collaborateurs !`, 'success');
        }
      } else {
        const errorMsg = json.error || json.message || "Échec lors de l'envoi du récapitulatif.";
        setError(errorMsg);
        if (showToast) {
          showToast(`Erreur : ${errorMsg}`, 'error');
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || "Erreur réseau lors de l'envoi.";
      setError(errorMsg);
      if (showToast) {
        showToast(`Erreur : ${errorMsg}`, 'error');
      }
    } finally {
      setSending(false);
    }
  };

  // Détection stricte des Super Administrateurs pour affichage UI
  const isSuperAdminAccount = (e: any) => {
    const normalize = (s?: string) => (s || '').toLowerCase().replace(/[\s_-]/g, '');
    const email = (e.email || '').toLowerCase().trim();
    if (email === 'citrinemobilite@gmail.com') return true;
    const role = normalize(e.role);
    const roleType = normalize(e.roleType);
    const pos = normalize(e.position);
    return (
      role.includes('superadmin') ||
      role.includes('superadministrateur') ||
      roleType.includes('superadmin') ||
      roleType.includes('superadministrateur') ||
      pos.includes('superadmin') ||
      pos.includes('superadministrateur')
    );
  };

  const activeEmployeesWithEmail = (
    reportPreview?.summaries
      ? reportPreview.summaries.map((s: any) => ({
          id: s.employeeId,
          name: s.employeeName,
          email: s.employeeEmail,
          department: s.department,
          position: s.position,
        }))
      : employees.filter((e) => {
          const status = String(e.status || '').toLowerCase();
          const isActive = status !== 'archived' && status !== 'inactif' && Boolean(e.email);
          return isActive && !isSuperAdminAccount(e);
        })
  ).filter((e: any) => e.email && e.email.includes('@'));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-stone-200/90 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* En-tête officiel Citrine Mobilité */}
        <div className="bg-gradient-to-r from-[#164e4b] to-[#0f3e3b] p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-emerald-200 shadow-inner">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-white leading-tight">
                Récapitulatif Hebdomadaire des Présences
              </h3>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Envoi consolidé aux responsables avec l'ensemble des collaborateurs en copie (CC)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Corps du modal */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          
          {/* Succès confirmé */}
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
              {/* Note explicative sur le fonctionnement */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 leading-relaxed flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-1">Périmètre &amp; Règle d'envoi strict Citrine :</span>
                  Ce bouton permet d'envoyer <strong>manuellement et à tout moment</strong> le récapitulatif des présences pour la <strong>semaine en cours</strong> (du lundi au jour courant). 
                  Un seul e-mail structuré sera expédié aux responsables, et <strong>tous les collaborateurs</strong> recevront une copie en <strong>CC</strong>.
                </div>
              </div>

              {/* Chargement de la prévisualisation */}
              {loadingPreview ? (
                <div className="py-8 text-center space-y-2 text-stone-500">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#2A7B76]" />
                  <p className="text-xs">Compilation des pointages de la semaine en cours...</p>
                </div>
              ) : reportPreview ? (
                <div className="space-y-4">
                  
                  {/* Cartouche Période & KPI */}
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

                    {/* Précisions sur les règles appliquées */}
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

                  {/* Collaborateurs qui seront mis en copie */}
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

              {/* Message d'erreur éventuel */}
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

        {/* Pied de page avec boutons d'action */}
        {!successInfo && (
          <div className="p-4 bg-stone-50 border-t border-stone-200/80 flex items-center justify-between shrink-0">
            <button
              onClick={onClose}
              disabled={sending}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 font-bold text-xs transition cursor-pointer disabled:opacity-50"
            >
              Annuler
            </button>

            <button
              onClick={handleSendReport}
              disabled={sending || loadingPreview}
              className="py-2.5 px-5 bg-gradient-to-r from-[#164e4b] to-[#2A7B76] hover:from-[#0f3e3b] hover:to-[#20635F] text-white font-extrabold text-xs rounded-xl shadow-sm hover:shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Envoi en cours aux responsables &amp; collaborateurs...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Confirmer et envoyer le récapitulatif par e-mail</span>
                </>
              )}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
