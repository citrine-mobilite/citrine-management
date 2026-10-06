import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Building, 
  Calendar, 
  Clock, 
  UserCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Check, 
  FileText, 
  Award,
  Hash
} from 'lucide-react';
import { AttendanceMonthlyReport } from '../services/rhReportService';

interface RhReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AttendanceMonthlyReport | null;
}

export default function RhReportModal({ isOpen, onClose, report }: RhReportModalProps) {
  const [copiedFingerprint, setCopiedFingerprint] = useState(false);

  if (!isOpen || !report) return null;

  const handleCopyFingerprint = () => {
    if (!report.certificate) return;
    navigator.clipboard.writeText(
      `CERTIFICAT CITRINE RH : ${report.certificate.certificateId}\nSHA-256 : ${report.certificate.hashSha256}\nDATE : ${report.certificate.issuedAt}`
    );
    setCopiedFingerprint(true);
    setTimeout(() => setCopiedFingerprint(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white text-stone-900 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-10 space-y-6 max-h-[92vh] overflow-y-auto border border-green-200 relative print:max-w-none print:max-h-none print:shadow-none print:border-none print:p-6 print:rounded-none">
        
        {/* Screen Controls Header (hidden in print) */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-green-900 text-green-100 text-xs font-bold rounded-full flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-green-300" />
              Rapport RH Certifié & Scellé Numériquement
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyFingerprint}
              className="bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
              title="Copier la signature cryptographique SHA-256"
            >
              {copiedFingerprint ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copiedFingerprint ? 'Empreinte Copiée' : 'Empreinte SHA-256'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimer / PDF A4</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-full transition cursor-pointer ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT BODY */}
        <div className="space-y-6 print:space-y-4">
          
          {/* Document Header */}
          <div className="border-b-2 border-stone-900 pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Building className="h-6 w-6 text-green-800" />
                <h1 className="text-xl font-serif font-black tracking-wide uppercase text-green-950">
                  Citrine Management Enterprise
                </h1>
              </div>
              <p className="text-xs text-stone-600 font-medium">
                Direction des Ressources Humaines & Audit Opérationnel
              </p>
              <p className="text-[11px] text-stone-500">
                Douala, République du Cameroun • Conforme Code du Travail & Règlements Intérieurs
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="bg-green-950 text-white font-serif font-bold text-xs px-3 py-1.5 rounded-lg uppercase tracking-wider block">
                FICHE MENSUELLE DE PRÉSENCE
              </span>
              <p className="text-xs font-black text-stone-800">
                Période : {report.monthLabel}
              </p>
              <p className="text-[10px] font-mono text-stone-500">
                Réf : {report.certificate.certificateId}
              </p>
            </div>
          </div>

          {/* Employee & Summary Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
            <div className="space-y-1.5">
              <p className="font-bold text-stone-400 uppercase text-[10px] tracking-wider">COLLABORATEUR</p>
              <p className="font-bold text-base text-stone-900">{report.employee.name}</p>
              <p className="text-stone-600">Matricule : <strong className="text-stone-900 font-mono">{report.employee.id.toUpperCase()}</strong></p>
              <p className="text-stone-600">Poste / Fonction : <strong className="text-stone-800">{report.employee.roleType || 'Collaborateur'}</strong></p>
              <p className="text-stone-600">Email : {report.employee.email}</p>
              <p className="text-stone-600">Département : <strong className="text-stone-800">{report.employee.department || 'Opérations'}</strong></p>
            </div>

            <div className="space-y-1.5 sm:border-l sm:border-stone-200 sm:pl-4">
              <p className="font-bold text-stone-400 uppercase text-[10px] tracking-wider">SYNTHÈSE DU MOIS</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-500 block">Jours Travaillés :</span>
                  <strong className="text-sm font-black text-green-950">{report.workedDays} jours</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-500 block">Volume Réalisé :</span>
                  <strong className="text-sm font-black text-emerald-800">{report.totalHoursFormatted}</strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-500 block">Retards Constatés :</span>
                  <strong className={`text-sm font-black ${report.totalLateOccurrences > 0 ? 'text-amber-700' : 'text-stone-700'}`}>
                    {report.totalLateOccurrences} ({report.totalLateMinutes} min)
                  </strong>
                </div>
                <div className="bg-white p-2 rounded-xl border border-stone-200/70">
                  <span className="text-[10px] text-stone-500 block">Jours Non Pointés :</span>
                  <strong className="text-sm font-black text-stone-700">{report.absenceDays}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Records Chronological Table */}
          <div className="space-y-2">
            <h3 className="font-serif font-bold text-xs uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-green-700" />
              Relevé Chronologique Journalier des Pointages
            </h3>

            <div className="border border-stone-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-stone-100 border-b border-stone-200 text-[10px] font-bold text-stone-600 uppercase">
                    <th className="p-2 border-r border-stone-200">Date / Jour</th>
                    <th className="p-2 border-r border-stone-200 text-center">Arrivée</th>
                    <th className="p-2 border-r border-stone-200 text-center">Pause</th>
                    <th className="p-2 border-r border-stone-200 text-center">Départ</th>
                    <th className="p-2 border-r border-stone-200 text-right">Durée</th>
                    <th className="p-2 border-r border-stone-200">Méthode Sécurisée</th>
                    <th className="p-2 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {report.dailyRows.map((row, idx) => (
                    <tr 
                      key={row.date || idx} 
                      className={row.status === 'late' ? 'bg-amber-50/40' : row.status === 'present' ? 'hover:bg-green-50/20' : 'bg-stone-50/30 text-stone-400'}
                    >
                      <td className="p-2 border-r border-stone-200 font-bold text-stone-800">
                        {row.dayLabel} ({row.date.split('-')[2]})
                      </td>
                      <td className="p-2 border-r border-stone-200 text-center font-mono font-medium">
                        {row.arrival}
                      </td>
                      <td className="p-2 border-r border-stone-200 text-center font-mono text-stone-500">
                        {row.pauseStart !== '--:--' ? `${row.pauseStart} - ${row.pauseEnd}` : '--:--'}
                      </td>
                      <td className="p-2 border-r border-stone-200 text-center font-mono font-medium">
                        {row.departure}
                      </td>
                      <td className="p-2 border-r border-stone-200 text-right font-bold text-stone-800">
                        {row.durationFormatted}
                      </td>
                      <td className="p-2 border-r border-stone-200 text-stone-600 truncate max-w-[140px]" title={row.location}>
                        {row.method}
                      </td>
                      <td className="p-2 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          row.status === 'present' ? 'bg-emerald-100 text-emerald-800' :
                          row.status === 'late' ? 'bg-amber-100 text-amber-800' :
                          'bg-stone-100 text-stone-500'
                        }`}>
                          {row.status === 'present' ? 'PRÉSENT' : row.status === 'late' ? 'RETARD' : 'REPOS / ABS'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-stone-100 font-bold border-t-2 border-stone-300 text-stone-900 text-xs">
                    <td colSpan={4} className="p-2.5 border-r border-stone-200 uppercase">
                      Total Heures Prestées ({report.monthLabel}) :
                    </td>
                    <td className="p-2.5 text-right font-black text-green-950 font-mono text-sm">
                      {report.totalHoursFormatted}
                    </td>
                    <td colSpan={2} className="p-2.5 text-stone-500 text-[10px]">
                      Validé conforme pour traitement en paie
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Cryptographic Digital Signature & Official Stamp */}
          <div className="border border-green-200 bg-green-50/40 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
            <div className="space-y-1 max-w-md">
              <div className="flex items-center gap-1.5 text-green-900 font-bold">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                <span>SIGNATURE NUMÉRIQUE D'INTÉGRITÉ (SHA-256)</span>
              </div>
              <p className="text-[10px] text-stone-600 leading-relaxed font-mono break-all">
                Hash : <strong className="text-stone-800">{report.certificate.hashSha256}</strong>
              </p>
              <p className="text-[10px] text-stone-500">
                Certificat délivré le {new Date(report.certificate.issuedAt).toLocaleString('fr-FR')} par la {report.certificate.issuedBy}.
              </p>
            </div>

            <div className="border-2 border-dashed border-green-400 bg-white p-3 rounded-2xl text-center space-y-1 min-w-[170px] shrink-0 shadow-sm">
              <p className="font-bold text-stone-800 uppercase text-[9px]">Sceau Électronique RH</p>
              <div className="w-12 h-12 border-2 border-emerald-600 rounded-full mx-auto flex items-center justify-center text-[8px] font-black text-emerald-800 uppercase tracking-tighter bg-emerald-50">
                CERTIFIÉ
              </div>
              <p className="text-[9px] text-emerald-800 font-bold font-mono">
                {report.certificate.certificateId}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
