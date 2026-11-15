import React, { useState, useEffect } from 'react';
import { Mail, X, Loader2, Send } from 'lucide-react';
import { Employee, Presence } from '../../types';
import { WeeklyAttendanceRecapBody } from './WeeklyAttendanceRecapBody';

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
  showToast,
}: WeeklyAttendanceRecapModalProps) {
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [sending, setSending] = useState(false);
  const [reportPreview, setReportPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<{ recipients?: string[]; ccCount?: number } | null>(null);

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

        <WeeklyAttendanceRecapBody
          successInfo={successInfo}
          loadingPreview={loadingPreview}
          reportPreview={reportPreview}
          activeEmployeesWithEmail={activeEmployeesWithEmail}
          error={error}
          onClose={onClose}
        />

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
