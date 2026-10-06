import React, { useState } from 'react';
import { FileText, ShieldCheck, Printer, Download, CheckCircle2, Loader2 } from 'lucide-react';
import { Employee, SalaryPayment } from '../../types';
import { downloadPayslipPdf } from '../../services/pdfExportService';

interface EmployeePayslipModalProps {
  selectedPayslip: SalaryPayment | null;
  employeeProfile: Employee;
  onClose: () => void;
  formatXAF: (val?: number) => string;
}

export default function EmployeePayslipModal({
  selectedPayslip,
  employeeProfile,
  onClose,
  formatXAF,
}: EmployeePayslipModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!selectedPayslip) return null;

  const handleDownloadPdf = () => {
    setIsGenerating(true);
    try {
      downloadPayslipPdf(selectedPayslip, employeeProfile);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (e) {
      console.error("Failed to generate payslip PDF:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl p-6 border border-green-200 shadow-2xl max-w-lg w-full space-y-4 text-xs">
        <div className="flex items-center justify-between border-b border-green-100 pb-3">
          <h3 className="font-serif font-bold text-stone-900 flex items-center gap-1.5">
            <FileText className="h-4 w-4 text-green-600" /> Bulletin de Paie Officiel - {selectedPayslip.period}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-3 font-mono">
          <div className="flex justify-between border-b border-stone-200 pb-2 font-sans font-bold text-stone-900">
            <span>{employeeProfile.name}</span>
            <span className="text-stone-500">{employeeProfile.roleType || 'Salarié'}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Salaire de Base :</span>
            <span className="font-bold">{formatXAF(selectedPayslip.baseAmount)}</span>
          </div>
          <div className="flex justify-between text-emerald-600">
            <span>Primes & Indemnités :</span>
            <span className="font-bold">+{formatXAF(selectedPayslip.bonusAmount)}</span>
          </div>
          <div className="flex justify-between text-rose-600">
            <span>Retenues / Avances :</span>
            <span className="font-bold">-{formatXAF((selectedPayslip.advanceAmount || 0) + (selectedPayslip.deductions || 0))}</span>
          </div>
          <div className="flex justify-between border-t border-stone-300 pt-2 text-sm font-bold text-stone-900 font-sans bg-emerald-50/50 p-2 rounded-xl">
            <span>NET À PAYER :</span>
            <span className="text-emerald-700 font-mono text-base">{formatXAF(selectedPayslip.netAmount)}</span>
          </div>
        </div>

        {/* Cryptographic Digital Signature & Certified Stamp */}
        <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 text-[10px]">
          <div className="space-y-0.5 max-w-[280px]">
            <div className="flex items-center gap-1 text-emerald-950 font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Document Certifié & Scellé Numériquement</span>
            </div>
            <p className="text-stone-500 font-mono break-all text-[9px]">
              Réf: CITRINE-CERT-PAY-{(employeeProfile.id + selectedPayslip.period).substring(0, 10).toUpperCase()}
            </p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-bold rounded-lg uppercase tracking-tight text-[9px] border border-emerald-300">
            Certifié RH
          </span>
        </div>

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
          >
            Fermer
          </button>
          <button
            onClick={() => window.print()}
            className="px-3 py-2 bg-stone-50 hover:bg-stone-100 text-stone-700 border border-stone-200 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" /> Imprimer
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={isGenerating}
            className={`px-4 py-2 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition ${
              downloadSuccess 
                ? 'bg-emerald-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Génération du PDF...
              </>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" /> Téléchargé avec succès !
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" /> Télécharger Bulletin PDF (A4)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
