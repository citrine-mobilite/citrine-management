import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertTriangle, Eye, Download, Loader2 } from 'lucide-react';
import { Employee, SalaryPayment } from '../../types';
import { downloadPayslipPdf } from '../../services/pdfExportService';

interface EmployeeSalaryTabProps {
  employeeProfile: Employee;
  mySalaryPayments: SalaryPayment[];
  formatXAF: (val?: number) => string;
  onSelectPayslip: (slip: SalaryPayment) => void;
}

export default function EmployeeSalaryTab({
  employeeProfile,
  mySalaryPayments,
  formatXAF,
  onSelectPayslip,
}: EmployeeSalaryTabProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleQuickDownload = (slip: SalaryPayment, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(slip.id);
    try {
      downloadPayslipPdf(slip, employeeProfile);
    } catch (err) {
      console.error('Error downloading payslip:', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-3xs space-y-1">
          <span className="text-[10px] text-stone-400 font-bold uppercase">Salaire Mensuel de Base</span>
          <div className="text-xl font-bold text-emerald-600">
            {formatXAF(employeeProfile.salary || 0)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-3xs space-y-1">
          <span className="text-[10px] text-stone-400 font-bold uppercase">Dernier Virement Perçu</span>
          <div className="text-xl font-bold text-stone-900">
            {mySalaryPayments.length > 0 ? formatXAF(mySalaryPayments[0].netAmount) : formatXAF(0)}
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-green-100 shadow-3xs space-y-1">
          <span className="text-[10px] text-stone-400 font-bold uppercase">Statut Règlement</span>
          <div className="flex items-center gap-1.5 pt-1">
            {mySalaryPayments.length > 0 && mySalaryPayments[0].status === 'paid' ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">À jour ({mySalaryPayments[0].period})</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <span className="text-xs font-bold text-amber-700">En attente / Aucun versement</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* List of Payslips */}
      <div className="bg-white rounded-2xl border border-green-100 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-green-100 pb-3">
          <h3 className="text-xs font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-green-600" /> Mes Fiches de Paie Mensuelles
          </h3>
          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
            Téléchargement PDF A4 1-Clic
          </span>
        </div>

        <div className="space-y-2">
          {mySalaryPayments.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-500 bg-stone-50 rounded-xl border border-stone-200 border-dashed">
              Aucune fiche de paie enregistrée.
            </div>
          ) : (
            mySalaryPayments.map((slip) => (
              <div key={slip.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-stone-200/80 hover:bg-green-50/20 transition">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-stone-900">{slip.period}</span>
                  <div className="text-[10px] text-stone-500 font-mono">
                    Base : {formatXAF(slip.baseAmount)} | Primes : {formatXAF(slip.bonusAmount)}
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2.5 flex-wrap sm:flex-nowrap w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {formatXAF(slip.netAmount)}
                    </span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      slip.status === 'paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {slip.status === 'paid' ? 'Payé' : 'En attente'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    <button
                      onClick={(e) => handleQuickDownload(slip, e)}
                      disabled={downloadingId === slip.id}
                      className="p-2 sm:p-1.5 text-emerald-700 hover:bg-emerald-100 rounded-lg transition cursor-pointer border border-emerald-200/60 bg-emerald-50/50"
                      title="Télécharger le bulletin PDF"
                    >
                      {downloadingId === slip.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      onClick={() => onSelectPayslip(slip)}
                      className="p-2 sm:p-1.5 text-[#2A7B76] hover:text-[#1E5753] hover:bg-emerald-50 rounded-lg transition cursor-pointer border border-stone-200"
                      title="Consulter ma fiche"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
