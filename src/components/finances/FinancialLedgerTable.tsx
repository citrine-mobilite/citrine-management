import React from 'react';
import { Download, FileText } from 'lucide-react';
import { FinancialTransaction } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { exportElementToPdf } from '../../services/pdfExportService';

interface FinancialLedgerTableProps {
  transactions: FinancialTransaction[];
  onUpdateTransactions: (updated: FinancialTransaction[]) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const FinancialLedgerTable: React.FC<FinancialLedgerTableProps> = ({ transactions }) => {
  const handleExportExcel = () => {
    const headers = ['ID', 'Date', 'Intitulé', 'Type', 'Montant (XAF)'];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.date,
      tx.title,
      tx.type === 'income' ? 'Recette' : 'Dépense',
      tx.amount || 0,
    ]);
    exportToExcel('grand_livre_comptable.xls', 'Grand Livre des Transactions Comptables Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('financial-ledger-container', 'grand_livre_comptable.pdf');
  };

  return (
    <div id="financial-ledger-container" className="bg-white rounded-3xl border border-stone-200/80 p-6 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h3 className="font-serif font-bold text-sm text-stone-900">Grand Livre des Transactions Comptables</h3>

        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-xl font-bold transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="h-3.5 w-3.5 text-rose-600" />
            <span>Export PDF</span>
          </button>
          <span className="text-xs text-stone-500 bg-stone-100 px-3 py-1 rounded-xl">
            {transactions.length} entrées
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider">
              <th className="pb-3">Date</th>
              <th className="pb-3">Intitulé / Référence</th>
              <th className="pb-3">Type</th>
              <th className="pb-3">Montant (XAF)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-stone-400">Aucune transaction enregistrée</td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50/50">
                  <td className="py-3 text-stone-600">{tx.date}</td>
                  <td className="py-3 font-bold text-stone-900">{tx.title}</td>
                  <td className="py-3">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${tx.type === 'income' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {tx.type === 'income' ? 'Recette' : 'Dépense'}
                    </span>
                  </td>
                  <td className={`py-3 font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {tx.type === 'income' ? '+' : '-'}{tx.amount?.toLocaleString('fr-FR')} XAF
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
