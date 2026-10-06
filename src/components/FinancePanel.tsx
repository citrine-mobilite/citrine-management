import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Plus, 
  Calendar, 
  Check, 
  Trash2, 
  ArrowUpRight, 
  ArrowDownRight, 
  User, 
  FileSpreadsheet, 
  ShieldAlert, 
  Award,
  Sparkles,
  Send,
  Eye,
  Coins,
  Receipt,
  CheckCircle2,
  Download,
  FileText
} from 'lucide-react';
import { Employee, EmployeeSalaryDebt, SalaryPayment, FinancialTransaction, Role } from '../types';
import { downloadPayslipPdf } from '../services/pdfExportService';
import { exportTableToExcel, exportTableToPDF } from '../utils/tableExportUtils';

interface FinancePanelProps {
  employees: Employee[];
  salaryDebts: EmployeeSalaryDebt[];
  onUpdateSalaryDebts: (debts: EmployeeSalaryDebt[]) => void;
  salaryPayments: SalaryPayment[];
  onUpdateSalaryPayments: (payments: SalaryPayment[]) => void;
  financialTransactions: FinancialTransaction[];
  onUpdateFinancialTransactions: (transactions: FinancialTransaction[]) => void;
  currentRole: Role;
  onAddNotification?: (log: { id: string; type: 'whatsapp' | 'email'; recipient: string; title: string; content: string; payload: string; timestamp: string }) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function FinancePanel({
  employees,
  salaryDebts = [],
  onUpdateSalaryDebts,
  salaryPayments,
  onUpdateSalaryPayments,
  financialTransactions,
  onUpdateFinancialTransactions,
  currentRole,
  onAddNotification,
  showToast
}: FinancePanelProps) {
  // Navigation internal state
  const [financeTab, setFinanceTab] = useState<'dashboard' | 'salaries' | 'ledger' | 'advances'>('dashboard');

  // Salary Debts Form State (Loans & Advances)
  const [debtEmpId, setDebtEmpId] = useState<string>(employees[0]?.id || '');
  const [debtTotalAmount, setDebtTotalAmount] = useState<string>('150000');
  const [debtMonths, setDebtMonths] = useState<string>('3');
  const [debtReason, setDebtReason] = useState<string>('Prêt personnel / Avance exceptionnelle');
  const [debtFilterStatus, setDebtFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');

  // Synchronize debtEmpId when employees load
  useEffect(() => {
    if ((!debtEmpId || !employees.some(e => e.id === debtEmpId)) && employees.length > 0) {
      setDebtEmpId(employees[0].id);
    }
  }, [employees, debtEmpId]);

  // Ledger forms & filters state
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [newTxType, setNewTxType] = useState<'income' | 'expense'>('expense');
  const [newTxCategory, setNewTxCategory] = useState<string>('Matériel');
  const [newTxAmount, setNewTxAmount] = useState<string>('');
  const [newTxDescription, setNewTxDescription] = useState<string>('');
  const [newTxRecipient, setNewTxRecipient] = useState<string>('');
  const [newTxDate, setNewTxDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [newTxProof, setNewTxProof] = useState<string | undefined>(undefined);
  const [newTxProofName, setNewTxProofName] = useState<string | undefined>(undefined);
  const [isCompressingFile, setIsCompressingFile] = useState<boolean>(false);

  // Modal for viewing receipt / invoice proof photo
  const [viewingProofTx, setViewingProofTx] = useState<FinancialTransaction | null>(null);

  // Active period filter for salaries
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Juillet 2026');

  // Edit salary payment row state
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editBase, setEditBase] = useState<number>(0);
  const [editBonus, setEditBonus] = useState<number>(0);
  const [editAdvance, setEditAdvance] = useState<number>(0);
  const [editDeductions, setEditDeductions] = useState<number>(0);

  // Viewing pay slip modal
  const [viewingSlipPayment, setViewingSlipPayment] = useState<SalaryPayment | null>(null);

  // Categories list
  const expenseCategories = ['Salaires', 'Matériel', 'Loyer / Locaux', 'Prêt / Avance Personnel', 'Prestations Externes', 'Taxes / Impôts', 'Divers Dépenses'];
  const incomeCategories = ['Prestation Client', 'Financement', 'Subvention', 'Remboursement Dette', 'Autre Recette'];

  // Compress image helper (< 1.5MB)
  const handleProofFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingFile(true);
    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 1200;

            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);

            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
            setNewTxProof(compressedBase64);
            setNewTxProofName(file.name);
            setIsCompressingFile(false);
          };
          img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          setNewTxProof(event.target?.result as string);
          setNewTxProofName(file.name);
          setIsCompressingFile(false);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error("Compression error:", err);
      setIsCompressingFile(false);
    }
  };

  // Helper names
  const getEmployeeName = (id: string) => {
    return employees.find(e => e.id === id)?.name || 'Collaborateur inconnu';
  };

  const getEmployeeRole = (id: string) => {
    return employees.find(e => e.id === id)?.roleType || 'Employé';
  };

  const getEmployeeEmail = (id: string) => {
    return employees.find(e => e.id === id)?.email || '';
  };

  const getEmployeePhone = (id: string) => {
    return employees.find(e => e.id === id)?.phone || '';
  };

  // Calculations
  const validatedTransactions = financialTransactions.filter(t => t.status === 'validated');
  
  const totalIncome = validatedTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = validatedTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const treasuryBalance = totalIncome - totalExpense;

  const currentPeriodPaidSalaries = salaryPayments
    .filter(p => p.period === selectedPeriod && p.status === 'paid')
    .reduce((sum, p) => sum + p.netAmount, 0);

  const currentPeriodPendingSalaries = salaryPayments
    .filter(p => p.period === selectedPeriod && p.status !== 'paid')
    .reduce((sum, p) => sum + p.netAmount, 0);

  // Add transaction handler
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(newTxAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      showToast?.("Veuillez saisir un montant valide supérieur à 0 FCFA.", "error");
      return;
    }

    const newTx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      date: newTxDate,
      type: newTxType,
      category: newTxCategory,
      amount: amountNum,
      description: newTxDescription,
      recipientOrSource: newTxRecipient || undefined,
      status: 'validated',
      proofUrl: newTxProof,
      proofFileName: newTxProofName
    };

    onUpdateFinancialTransactions([newTx, ...financialTransactions]);
    
    // Clear inputs
    setNewTxAmount('');
    setNewTxDescription('');
    setNewTxRecipient('');
    setNewTxProof(undefined);
    setNewTxProofName(undefined);

    showToast?.(`Transaction de ${amountNum.toLocaleString('fr-FR')} FCFA enregistrée avec succès.`, 'success');
    
    if (onAddNotification) {
      onAddNotification({
        id: `log-tx-${Date.now()}`,
        type: 'email',
        recipient: 'coordination@citrine.com',
        title: `Flux de trésorerie enregistré - ${newTxType === 'income' ? 'Recette' : 'Dépense'}`,
        content: `Une transaction de ${amountNum} FCFA sous la catégorie "${newTxCategory}" a été validée. Description: ${newTxDescription}.`,
        payload: JSON.stringify(newTx, null, 2),
        timestamp: new Date().toISOString()
      });
    }
  };

  // Delete transaction
  const handleDeleteTransaction = (id: string) => {
    if (confirm("Supprimer cette transaction définitivement ?")) {
      onUpdateFinancialTransactions(financialTransactions.filter(t => t.id !== id));
      showToast?.("Transaction supprimée.", "success");
    }
  };

  // Grant New Loan / Salary Debt Handler
  const handleCreateDebtLoan = (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(debtTotalAmount);
    const months = parseInt(debtMonths, 10) || 1;
    const targetEmpId = debtEmpId || employees[0]?.id;
    if (!targetEmpId || isNaN(total) || total <= 0 || months <= 0) {
      showToast?.("Veuillez sélectionner un collaborateur, saisir un montant et un nombre de mensualités valides.", "error");
      return;
    }

    const emp = employees.find(e => e.id === targetEmpId);
    const empName = emp ? emp.name : 'Collaborateur';
    const baseInstallment = Math.floor(total / months);
    const remainder = total - (baseInstallment * months);

    const newDebts: EmployeeSalaryDebt[] = [];
    const now = new Date();
    const startYear = now.getFullYear();
    const startMonth = now.getMonth();
    const loanTimestamp = Date.now();

    for (let i = 0; i < months; i++) {
      const d = new Date(startYear, startMonth + i, 1);
      const yearStr = d.getFullYear();
      const monthStr = (d.getMonth() + 1).toString().padStart(2, '0');
      const dueDate = `${yearStr}-${monthStr}`;
      // Adjust last installment for any remainder
      const monthlyInstallment = i === months - 1 ? baseInstallment + remainder : baseInstallment;

      newDebts.push({
        id: `debt-${loanTimestamp}-${i + 1}`,
        employeeId: targetEmpId,
        employeeName: empName,
        totalLoanAmount: total,
        monthlyInstallment,
        totalMonths: months,
        installmentNumber: i + 1,
        dueDate,
        status: 'pending',
        reason: debtReason || 'Prêt personnel / Avance de salaire',
        createdAt: new Date().toISOString()
      });
    }

    onUpdateSalaryDebts([...salaryDebts, ...newDebts]);

    // Automatically record an expense transaction in Treasury for loan payout
    const loanTx: FinancialTransaction = {
      id: `tx-loan-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'expense',
      category: 'Prêt / Avance Personnel',
      amount: total,
      description: `Déboursement prêt personnel - ${empName} (${months} mensualités de ${baseInstallment.toLocaleString('fr-FR')} FCFA)`,
      recipientOrSource: empName,
      status: 'validated'
    };
    onUpdateFinancialTransactions([loanTx, ...financialTransactions]);

    showToast?.(`Prêt de ${total.toLocaleString('fr-FR')} FCFA accordé à ${empName} en ${months} mensualité(s). Déboursement enregistré en trésorerie.`, 'success');

    setDebtTotalAmount('150000');
    setDebtMonths('3');
    setDebtReason('Prêt personnel / Avance exceptionnelle');
  };

  // Delete / Cancel Debt Installment
  const handleDeleteDebt = (debtId: string) => {
    if (confirm("Supprimer définitivement cette mensualité de prêt / dette ?")) {
      const updated = salaryDebts.filter(d => d.id !== debtId);
      onUpdateSalaryDebts(updated);
      showToast?.("Mensualité de dette supprimée.", "success");
    }
  };

  // Repay Debt Manually via Cash / Caisse
  const handlePayDebtManually = (debtItem: EmployeeSalaryDebt) => {
    if (debtItem.status === 'paid') return;

    // 1. Mark debt item as paid
    const updatedDebts = salaryDebts.map(d => {
      if (d.id === debtItem.id) {
        return {
          ...d,
          status: 'paid' as const,
          paymentMethod: 'manual_cash' as const,
          paidAt: new Date().toISOString().split('T')[0]
        };
      }
      return d;
    });
    onUpdateSalaryDebts(updatedDebts);

    // 2. Register cash inflow in Treasury
    const incomeTx: FinancialTransaction = {
      id: `tx-repay-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      type: 'income',
      category: 'Remboursement Dette',
      amount: debtItem.monthlyInstallment,
      description: `Remboursement manuel en caisse - ${debtItem.employeeName} (Échéance ${debtItem.installmentNumber}/${debtItem.totalMonths})`,
      recipientOrSource: debtItem.employeeName,
      status: 'validated'
    };
    onUpdateFinancialTransactions([incomeTx, ...financialTransactions]);

    showToast?.(`Remboursement manuel de ${debtItem.monthlyInstallment.toLocaleString('fr-FR')} FCFA enregistré ! Entrée en caisse ajoutée.`, 'success');
  };

  // Salary Payments Handlers
  const handleStartEditPayment = (pay: SalaryPayment) => {
    setEditingPaymentId(pay.id);
    setEditBase(pay.baseAmount);
    setEditBonus(pay.bonusAmount);
    setEditAdvance(pay.advanceAmount);
    setEditDeductions(pay.deductions);
  };

  const handleSavePayment = (id: string) => {
    const updated = salaryPayments.map(p => {
      if (p.id === id) {
        const net = editBase + editBonus - editAdvance - editDeductions;
        return {
          ...p,
          baseAmount: editBase,
          bonusAmount: editBonus,
          advanceAmount: editAdvance,
          deductions: editDeductions,
          netAmount: Math.max(0, net)
        };
      }
      return p;
    });
    onUpdateSalaryPayments(updated);
    setEditingPaymentId(null);
    showToast?.("Fiche de paie mise à jour avec succès.", "success");
  };

  const handleUpdatePaymentStatus = (payment: SalaryPayment, newStatus: 'draft' | 'approved' | 'paid') => {
    const updated = salaryPayments.map(p => {
      if (p.id === payment.id) {
        return {
          ...p,
          status: newStatus,
          paidAt: newStatus === 'paid' ? new Date().toISOString().split('T')[0] : p.paidAt
        };
      }
      return p;
    });

    onUpdateSalaryPayments(updated);
    const empName = getEmployeeName(payment.employeeId);

    if (newStatus === 'paid') {
      // 1. Create expense transaction in Treasury
      const isTxAlreadyExist = financialTransactions.some(
        t => t.type === 'expense' && t.category === 'Salaires' && t.description.includes(empName) && t.description.includes(payment.period)
      );

      if (!isTxAlreadyExist) {
        const salaryTx: FinancialTransaction = {
          id: `tx-salary-${payment.id}`,
          date: new Date().toISOString().split('T')[0],
          type: 'expense',
          category: 'Salaires',
          amount: payment.netAmount,
          description: `Virement de salaire - ${empName} - ${payment.period}`,
          recipientOrSource: empName,
          status: 'validated'
        };
        onUpdateFinancialTransactions([salaryTx, ...financialTransactions]);
      }

      // 2. Automatically apply pending debt installment if present
      const pendingDebt = salaryDebts
        .filter(d => d.employeeId === payment.employeeId && d.status === 'pending')
        .sort((a, b) => a.installmentNumber - b.installmentNumber)[0];

      if (pendingDebt) {
        const updatedDebts = salaryDebts.map(d => {
          if (d.id === pendingDebt.id) {
            return {
              ...d,
              status: 'paid' as const,
              paymentMethod: 'salary_deduction' as const,
              paidAt: new Date().toISOString().split('T')[0]
            };
          }
          return d;
        });
        onUpdateSalaryDebts(updatedDebts);
        showToast?.(`Salaire de ${empName} validé ! Retenue de dette de ${pendingDebt.monthlyInstallment.toLocaleString('fr-FR')} FCFA effectuée.`, 'success');
      } else {
        showToast?.(`Virement de salaire de ${empName} (${payment.period}) validé avec succès.`, 'success');
      }

      // WhatsApp / Email log
      if (onAddNotification) {
        const empPhone = getEmployeePhone(payment.employeeId);
        onAddNotification({
          id: `log-pay-wa-emp-${Date.now()}`,
          type: 'whatsapp',
          recipient: empPhone || '+237 600 000 000',
          title: `📄 Bulletin de Paie Disponible (${payment.period})`,
          content: `Bonjour ${empName}, votre virement de salaire pour ${payment.period} d'un montant net de ${payment.netAmount.toLocaleString('fr-FR')} FCFA a été validé.`,
          payload: JSON.stringify({
            event: 'payslip_available',
            employeeId: payment.employeeId,
            period: payment.period,
            baseAmount: payment.baseAmount,
            bonusAmount: payment.bonusAmount,
            advanceAmount: payment.advanceAmount + payment.deductions,
            netAmount: payment.netAmount,
            status: 'paid'
          }),
          timestamp: new Date().toISOString()
        });
      }
    } else {
      showToast?.(`Statut de la fiche de paie de ${empName} changé en ${newStatus.toUpperCase()}.`, 'success');
    }
  };

  // Generate Salary Sheet Drafts for missing employees
  const handleGeneratePeriodDrafts = () => {
    const existingEmpIds = salaryPayments
      .filter(p => p.period === selectedPeriod)
      .map(p => p.employeeId);

    const missingEmployees = employees.filter(e => !existingEmpIds.includes(e.id));

    if (missingEmployees.length === 0) {
      showToast?.(`Tous les brouillons de salaires pour ${selectedPeriod} ont déjà été générés.`, "error");
      return;
    }

    const newDrafts: SalaryPayment[] = missingEmployees.map(emp => {
      const baseSalary = emp.salary || 250000;
      
      // Calculate pending debt deduction if any
      const pendingDebt = salaryDebts
        .filter(d => d.employeeId === emp.id && d.status === 'pending')
        .sort((a, b) => a.installmentNumber - b.installmentNumber)[0];

      const debtDeduction = pendingDebt ? pendingDebt.monthlyInstallment : 0;
      const netAmount = Math.max(0, baseSalary - debtDeduction);

      return {
        id: `pay-${selectedPeriod.replace(' ', '-').toLowerCase()}-${emp.id}`,
        employeeId: emp.id,
        period: selectedPeriod,
        baseAmount: baseSalary,
        bonusAmount: 0,
        advanceAmount: debtDeduction,
        deductions: 0,
        netAmount,
        status: 'draft',
        paymentMethod: 'transfer',
        notes: pendingDebt 
          ? `Déduction mensuelle de dette : ${debtDeduction.toLocaleString('fr-FR')} FCFA (Échéance ${pendingDebt.installmentNumber}/${pendingDebt.totalMonths})`
          : `Généré automatiquement d'après le salaire contractuel.`
      };
    });

    onUpdateSalaryPayments([...salaryPayments, ...newDrafts]);
    showToast?.(`${newDrafts.length} brouillon(s) de paie généré(s) pour ${selectedPeriod}.`, "success");
  };

  const isFinanceManager = currentRole === 'Responsable' || currentRole === 'Administrateur';
  const loggedInEmpId = currentRole === 'Employé' ? (employees[0]?.id || 'emp-1') : 'emp-2';

  const visiblePayments = isFinanceManager
    ? salaryPayments.filter(p => p.period === selectedPeriod)
    : salaryPayments.filter(p => p.employeeId === loggedInEmpId);

  const personalAllPayments = salaryPayments.filter(p => p.employeeId === loggedInEmpId);

  return (
    <div className="bg-white rounded-2xl border border-green-100 shadow-sm overflow-hidden" id="finance-module-container">
      
        {/* Module Title Banner */}
      <div className="bg-white p-5 border-b border-stone-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-600" /> Gestion des Finances, Trésorerie & Salaires
          </h2>

          {isFinanceManager && (
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => {
                  const data = financialTransactions.map(t => ({
                    'Date': t.date,
                    'Type': t.type,
                    'Catégorie': t.category,
                    'Description': t.description,
                    'Montant (XAF)': t.amount,
                    'Source/Bénéficiaire': t.recipientOrSource || 'N/A',
                    'Statut': t.status
                  }));
                  exportTableToExcel(data, 'Rapport_Finances_Tresorerie');
                }}
                className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-emerald-200"
                title="Exporter Excel"
              >
                <FileSpreadsheet className="h-3 w-3" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => {
                  const headers = ['Date', 'Type', 'Catégorie', 'Description', 'Montant'];
                  const rows = financialTransactions.map(t => [
                    t.date,
                    t.type,
                    t.category,
                    t.description,
                    `${t.amount} XAF`
                  ]);
                  exportTableToPDF('Rapport Financier & Trésorerie', headers, rows, 'Rapport_Finances_Tresorerie');
                }}
                className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer border border-stone-200"
                title="Exporter PDF"
              >
                <Download className="h-3 w-3" />
                <span>PDF</span>
              </button>
            </div>
          )}
        </div>

        {/* Panel Tabs Selection */}
        {isFinanceManager && (
          <div className="inline-flex rounded-xl bg-stone-100 p-1 border border-stone-200 shrink-0 text-xs">
            <button
              onClick={() => setFinanceTab('dashboard')}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                financeTab === 'dashboard' 
                  ? 'bg-white text-green-950 shadow-xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Wallet className="h-3.5 w-3.5 text-green-500" /> Tableau de bord
            </button>
            <button
              onClick={() => setFinanceTab('salaries')}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                financeTab === 'salaries' 
                  ? 'bg-white text-green-950 shadow-xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-green-500" /> Fiches & Salaires
            </button>
            <button
              onClick={() => setFinanceTab('advances')}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                financeTab === 'advances' 
                  ? 'bg-white text-green-950 shadow-xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Coins className="h-3.5 w-3.5 text-green-500" /> Prêts & Dettes de Salaire ({salaryDebts.filter(d => d.status === 'pending').length})
            </button>
            <button
              onClick={() => setFinanceTab('ledger')}
              className={`px-3 py-1.5 font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                financeTab === 'ledger' 
                  ? 'bg-white text-green-950 shadow-xs' 
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" /> Grand Livre & Caisse
            </button>
          </div>
        )}
      </div>

      {/* ----------------- MANAGER SPACE ----------------- */}
      {isFinanceManager ? (
        <div className="p-6">
          
          {/* A. DASHBOARD TAB */}
          {financeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Financial Summary KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] text-emerald-800 uppercase tracking-widest font-bold">Trésorerie Actuelle</span>
                    <h3 className="text-xl font-serif font-extrabold text-emerald-950">
                      {treasuryBalance.toLocaleString('fr-FR')} FCFA
                    </h3>
                    <p className="text-[9px] text-stone-500">Compte courant consolidé</p>
                  </div>
                  <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl border border-emerald-200">
                    <Wallet className="h-5 w-5" />
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">Revenus Enregistrés</span>
                    <h3 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-emerald-600 shrink-0" />
                      {totalIncome.toLocaleString('fr-FR')} FCFA
                    </h3>
                    <p className="text-[9px] text-stone-500">Recettes & Remboursements</p>
                  </div>
                  <div className="bg-white text-stone-600 p-2.5 rounded-xl border border-stone-100 shadow-2xs">
                    <ArrowUpRight className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>

                <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] text-stone-500 uppercase tracking-widest font-bold">Dépenses Cumulées</span>
                    <h3 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-green-500 shrink-0" />
                      {totalExpense.toLocaleString('fr-FR')} FCFA
                    </h3>
                    <p className="text-[9px] text-stone-500">Salaires + Déboursements</p>
                  </div>
                  <div className="bg-white text-stone-600 p-2.5 rounded-xl border border-stone-100 shadow-2xs">
                    <ArrowDownRight className="h-5 w-5 text-green-500" />
                  </div>
                </div>

                <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] text-green-800 uppercase tracking-widest font-bold">Salaires {selectedPeriod}</span>
                    <h3 className="text-xl font-serif font-bold text-green-950">
                      {(currentPeriodPaidSalaries + currentPeriodPendingSalaries).toLocaleString('fr-FR')} FCFA
                    </h3>
                    <div className="flex gap-2 text-[8px] font-bold text-stone-500 uppercase">
                      <span className="text-emerald-700">{currentPeriodPaidSalaries.toLocaleString('fr-FR')} FCFA Payé</span>
                      <span className="text-amber-700">{currentPeriodPendingSalaries.toLocaleString('fr-FR')} FCFA En attente</span>
                    </div>
                  </div>
                  <div className="bg-green-100 text-green-800 p-2.5 rounded-xl border border-green-200">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </div>
              </div>

              {/* Quick Salary Debts Alert Box */}
              <div className="bg-amber-50/40 border border-amber-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600" /> Gestion des Dettes Salariales & Prêts
                  </h4>
                  <p className="text-[10px] text-amber-800 max-w-2xl leading-normal">
                    Actuellement <strong>{salaryDebts.filter(d => d.status === 'pending').length} mensualité(s) de dette</strong> en attente de déduction ou de remboursement manuel en caisse.
                  </p>
                </div>
                <button
                  onClick={() => setFinanceTab('advances')}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-3.5 py-2 rounded-xl shadow-xs cursor-pointer transition shrink-0"
                >
                  Gérer les dettes & prêts
                </button>
              </div>

            </div>
          )}

          {/* B. SALARIES & PAYROLL TAB */}
          {financeTab === 'salaries' && (
            <div className="space-y-6">
              <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-stone-500 font-bold uppercase shrink-0">Période d'activité :</span>
                  <select
                    value={selectedPeriod}
                    onChange={(e) => setSelectedPeriod(e.target.value)}
                    className="text-[11px] font-bold border border-green-200 rounded-xl px-3 py-1.5 bg-white text-stone-800 focus:outline-green-500 shadow-2xs"
                  >
                    <option value="Juin 2026">Juin 2026 (Clôturé)</option>
                    <option value="Juillet 2026">Juillet 2026 (En cours)</option>
                    <option value="Août 2026">Août 2026 (Planification)</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleGeneratePeriodDrafts}
                    className="bg-green-50 border border-green-200 hover:bg-green-100 text-green-800 font-bold text-[10px] px-3.5 py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 text-green-600" /> Générer les brouillons
                  </button>
                </div>
              </div>

              {/* Table of salary sheets */}
              <div className="bg-white border border-green-100 rounded-2xl shadow-2xs overflow-x-auto">
                <table className="w-full text-[11px] text-left">
                  <thead>
                    <tr className="bg-green-50/50 border-b border-green-100 text-[9px] font-extrabold uppercase tracking-wider text-green-900/80">
                      <th className="py-3 px-4">Collaborateur</th>
                      <th className="py-3 px-3 text-center">Salaire Base</th>
                      <th className="py-3 px-3 text-center">Primes</th>
                      <th className="py-3 px-3 text-center">Retenue Dette</th>
                      <th className="py-3 px-3 text-center font-bold">Net à Payer</th>
                      <th className="py-3 px-3 text-center">Statut du virement</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-green-50">
                    {visiblePayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-stone-400 font-medium">
                          Aucune fiche de paie n'est enregistrée pour la période de <strong>{selectedPeriod}</strong>.<br />
                          Cliquez sur "Générer les brouillons" pour initier le traitement des salaires.
                        </td>
                      </tr>
                    ) : (
                      visiblePayments.map((pay) => {
                        const isEditing = editingPaymentId === pay.id;
                        const isPaid = pay.status === 'paid';

                        return (
                          <tr key={pay.id} className="hover:bg-green-50/10 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="h-7 w-7 rounded-full overflow-hidden shrink-0 border border-stone-200">
                                  <img 
                                    src={employees.find(e => e.id === pay.employeeId)?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80'} 
                                    alt="avatar" 
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-stone-800">{getEmployeeName(pay.employeeId)}</div>
                                  <div className="text-[9px] text-stone-500 capitalize">{getEmployeeRole(pay.employeeId)}</div>
                                </div>
                              </div>
                            </td>

                            <td className="py-3 px-3 text-center font-mono font-medium text-stone-600">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editBase}
                                  onChange={(e) => setEditBase(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-20 text-center border border-green-200 rounded p-1 font-mono text-xs"
                                />
                              ) : (
                                `${pay.baseAmount.toLocaleString('fr-FR')} FCFA`
                              )}
                            </td>

                            <td className="py-3 px-3 text-center font-mono text-emerald-700 font-bold">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editBonus}
                                  onChange={(e) => setEditBonus(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-20 text-center border border-green-200 rounded p-1 text-emerald-800 font-bold bg-emerald-50/30 font-mono text-xs"
                                />
                              ) : (
                                pay.bonusAmount > 0 ? `+${pay.bonusAmount.toLocaleString('fr-FR')} FCFA` : '--'
                              )}
                            </td>

                            <td className="py-3 px-3 text-center font-mono text-amber-700 font-bold">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editAdvance}
                                  onChange={(e) => setEditAdvance(Math.max(0, parseInt(e.target.value) || 0))}
                                  className="w-20 text-center border border-amber-300 rounded p-1 text-amber-900 font-bold bg-amber-50/50 font-mono text-xs"
                                  title="Retenue mensuelle pour remboursement de prêt ou avance"
                                />
                              ) : (
                                pay.advanceAmount > 0 ? `-${pay.advanceAmount.toLocaleString('fr-FR')} FCFA` : '--'
                              )}
                            </td>

                            <td className="py-3 px-3 text-center font-mono font-bold text-green-950 text-[12px]">
                              {isEditing 
                                ? `${Math.max(0, editBase + editBonus - editAdvance - editDeductions).toLocaleString('fr-FR')} FCFA`
                                : `${pay.netAmount.toLocaleString('fr-FR')} FCFA`
                              }
                            </td>

                            <td className="py-3 px-3 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                                pay.status === 'approved' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                'bg-stone-100 text-stone-600 border border-stone-200'
                              }`}>
                                {isPaid ? 'Payé' : pay.status === 'approved' ? 'Approuvé' : 'Brouillon'}
                              </span>
                            </td>

                            <td className="py-3 px-4 text-right space-x-1.5">
                              <button
                                onClick={() => {
                                  const targetEmp: Employee = employees.find(e => e.id === pay.employeeId) || {
                                    id: pay.employeeId,
                                    name: getEmployeeName(pay.employeeId),
                                    roleType: 'employé',
                                    department: 'Opérations',
                                    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
                                    email: '',
                                    phone: '',
                                    status: 'en_poste',
                                    salary: pay.baseAmount,
                                    hireDate: '2024-01-01'
                                  };
                                  downloadPayslipPdf(pay, targetEmp);
                                  showToast?.(`Bulletin de paie généré en PDF A4 pour ${targetEmp.name} (${pay.period})`, 'success');
                                }}
                                className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer inline-flex items-center gap-1 transition"
                                title="Télécharger le bulletin de paie au format PDF A4 officiel"
                              >
                                <Download className="h-3 w-3 text-emerald-600" /> PDF
                              </button>

                              {isEditing ? (
                                <button
                                  onClick={() => handleSavePayment(pay.id)}
                                  className="bg-emerald-600 text-white hover:bg-emerald-700 px-2 py-1 rounded text-[10px] font-bold cursor-pointer"
                                >
                                  Enregistrer
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleStartEditPayment(pay)}
                                  className="text-stone-400 hover:text-green-600 text-[10px] font-bold cursor-pointer"
                                >
                                  Modifier
                                </button>
                              )}

                              {!isPaid && (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(pay, 'paid')}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg transition cursor-pointer"
                                >
                                  ✓ Valider le Virement
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* C. SALARY DEBTS & LOANS TAB */}
          {financeTab === 'advances' && (
            <div className="space-y-6">
              
              {/* Header KPI Cards for Debts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 block">Total Prêts Accordés</span>
                  <h3 className="text-xl font-serif font-extrabold text-amber-950">
                    {salaryDebts.reduce((sum, a) => sum + a.monthlyInstallment, 0).toLocaleString('fr-FR')} FCFA
                  </h3>
                  <p className="text-[9px] text-stone-500">{salaryDebts.length} mensualité(s) générée(s)</p>
                </div>

                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-800 block">Mensualités Remboursées</span>
                  <h3 className="text-xl font-serif font-extrabold text-emerald-950">
                    {salaryDebts.filter(a => a.status === 'paid').reduce((sum, a) => sum + a.monthlyInstallment, 0).toLocaleString('fr-FR')} FCFA
                  </h3>
                  <p className="text-[9px] text-stone-500">Remboursées (Caisse ou Salaire)</p>
                </div>

                <div className="bg-green-50/70 border border-green-200 rounded-2xl p-4 space-y-1">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-green-800 block">Dette Restante à Recouvrer</span>
                  <h3 className="text-xl font-serif font-extrabold text-green-950">
                    {salaryDebts.filter(a => a.status === 'pending').reduce((sum, a) => sum + a.monthlyInstallment, 0).toLocaleString('fr-FR')} FCFA
                  </h3>
                  <p className="text-[9px] text-stone-500">En attente de paiement</p>
                </div>
              </div>

              {/* Main Section: Grant Loan Form + Table */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Form: Grant New Loan / Advance */}
                <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                  <div className="border-b border-stone-200 pb-2">
                    <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
                      <Coins className="h-4 w-4 text-green-600" /> Octroyer un Prêt / Avance de Salaire
                    </h4>
                    <p className="text-[10px] text-stone-500">Divise automatiquement le montant en mensualités déductibles du salaire ou remboursables en caisse.</p>
                  </div>

                  <form onSubmit={handleCreateDebtLoan} className="space-y-3 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">Collaborateur Bénéficiaire</label>
                      <select
                        value={debtEmpId}
                        onChange={(e) => setDebtEmpId(e.target.value)}
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none focus:border-green-400"
                      >
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>
                            {emp.name} ({getEmployeeRole(emp.id)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">Montant Total du Prêt (FCFA)</label>
                      <input
                        type="number"
                        min="5000"
                        step="5000"
                        value={debtTotalAmount}
                        onChange={(e) => setDebtTotalAmount(e.target.value)}
                        placeholder="Ex: 150000"
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-bold text-green-950 focus:outline-none focus:border-green-400 font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">Durée de remboursement (Mois)</label>
                      <input
                        type="number"
                        min="1"
                        max="24"
                        value={debtMonths}
                        onChange={(e) => setDebtMonths(e.target.value)}
                        placeholder="Ex: 3"
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 font-bold text-stone-800 focus:outline-none focus:border-green-400 font-mono"
                      />
                      {parseFloat(debtTotalAmount) > 0 && parseInt(debtMonths) > 0 && (
                        <p className="text-[10px] text-emerald-700 font-bold italic">
                          💡 Mensualité : {Math.round(parseFloat(debtTotalAmount) / parseInt(debtMonths)).toLocaleString('fr-FR')} FCFA / mois
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">Motif / Justificatif</label>
                      <textarea
                        rows={2}
                        value={debtReason}
                        onChange={(e) => setDebtReason(e.target.value)}
                        placeholder="Ex: Prêt équipement, travaux ou urgence"
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-stone-800 font-medium focus:outline-none focus:border-green-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition shadow-xs flex items-center justify-center gap-2 cursor-pointer uppercase text-[10px] tracking-wide"
                    >
                      <Coins className="h-3.5 w-3.5" /> Créer le prêt & débourser
                    </button>
                  </form>
                </div>

                {/* Table: List of Employee Salary Debts */}
                <div className="lg:col-span-2 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <h4 className="font-serif font-bold text-stone-900 text-sm">
                      Échéancier des Dettes & Remboursements
                    </h4>
                    
                    <div className="flex gap-1.5 text-[10px]">
                      <button
                        onClick={() => setDebtFilterStatus('all')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${debtFilterStatus === 'all' ? 'bg-green-950 text-white' : 'bg-stone-100 text-stone-600'}`}
                      >
                        Tous ({salaryDebts.length})
                      </button>
                      <button
                        onClick={() => setDebtFilterStatus('pending')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${debtFilterStatus === 'pending' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-600'}`}
                      >
                        En attente ({salaryDebts.filter(d => d.status === 'pending').length})
                      </button>
                      <button
                        onClick={() => setDebtFilterStatus('paid')}
                        className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${debtFilterStatus === 'paid' ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'}`}
                      >
                        Remboursés ({salaryDebts.filter(d => d.status === 'paid').length})
                      </button>
                    </div>
                  </div>

                  <div className="border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                          <th className="p-3">Collaborateur</th>
                          <th className="p-3">Échéance</th>
                          <th className="p-3">Montant Mensuel</th>
                          <th className="p-3">Prêt Total</th>
                          <th className="p-3">Statut</th>
                          <th className="p-3 text-right">Remboursement</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 font-sans">
                        {salaryDebts.filter(d => debtFilterStatus === 'all' || d.status === debtFilterStatus).length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-6 text-center text-stone-400 italic">
                              Aucune dette salariale enregistrée.
                            </td>
                          </tr>
                        ) : (
                          salaryDebts
                            .filter(d => debtFilterStatus === 'all' || d.status === debtFilterStatus)
                            .map(debt => {
                              const isPaid = debt.status === 'paid';
                              return (
                                <tr key={debt.id} className="hover:bg-stone-50 transition">
                                  <td className="p-3">
                                    <div className="font-bold text-stone-800">{debt.employeeName}</div>
                                    <div className="text-[9px] text-stone-400">{debt.reason}</div>
                                  </td>
                                  <td className="p-3 font-mono font-medium text-stone-600 text-[11px]">
                                    {debt.dueDate} ({debt.installmentNumber}/{debt.totalMonths})
                                  </td>
                                  <td className="p-3 font-mono font-bold text-green-950">
                                    {debt.monthlyInstallment.toLocaleString('fr-FR')} FCFA
                                  </td>
                                  <td className="p-3 font-mono text-stone-500 text-[11px]">
                                    {debt.totalLoanAmount.toLocaleString('fr-FR')} FCFA
                                  </td>
                                  <td className="p-3">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                                      isPaid 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                        : 'bg-amber-50 text-amber-800 border-amber-200'
                                    }`}>
                                      {isPaid 
                                        ? (debt.paymentMethod === 'manual_cash' ? 'Payé en caisse' : 'Déduit du salaire') 
                                        : 'En attente'
                                      }
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5">
                                      {!isPaid ? (
                                        <button
                                          onClick={() => handlePayDebtManually(debt)}
                                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg transition cursor-pointer shadow-2xs"
                                          title="Rembourser manuellement au comptant (Caisse)"
                                        >
                                          💵 Rembourser (Caisse)
                                        </button>
                                      ) : (
                                        <span className="text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                                          <CheckCircle2 className="h-3.5 w-3.5" /> Remboursé
                                        </span>
                                      )}
                                      <button
                                        onClick={() => handleDeleteDebt(debt.id)}
                                        className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                        title="Supprimer cette mensualité"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* D. GENERAL TREASURY LEDGER TAB */}
          {financeTab === 'ledger' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-stone-50 border border-stone-200/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-wrap gap-2.5 items-center">
                    <span className="text-[10px] text-stone-500 font-bold uppercase">Filtrer par :</span>
                    
                    <button
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        filterType === 'all' ? 'bg-green-600 text-white' : 'bg-white text-stone-600 border border-stone-200'
                      }`}
                    >
                      Tout
                    </button>
                    <button
                      onClick={() => setFilterType('income')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        filterType === 'income' ? 'bg-emerald-600 text-white' : 'bg-white text-stone-600 border border-stone-200'
                      }`}
                    >
                      Recettes
                    </button>
                    <button
                      onClick={() => setFilterType('expense')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                        filterType === 'expense' ? 'bg-green-950 text-white' : 'bg-white text-stone-600 border border-stone-200'
                      }`}
                    >
                      Dépenses
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-green-100 rounded-2xl shadow-2xs overflow-x-auto">
                  <table className="w-full text-[11px] text-left">
                    <thead>
                      <tr className="bg-green-50/50 border-b border-green-100 text-[9px] font-extrabold uppercase tracking-wider text-green-900/80">
                        <th className="py-2.5 px-4">Date</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Catégorie</th>
                        <th className="py-2.5 px-3">Source/Tiers</th>
                        <th className="py-2.5 px-3 text-right">Montant</th>
                        <th className="py-2.5 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-green-50 font-sans">
                      {financialTransactions
                        .filter(tx => filterType === 'all' || tx.type === filterType)
                        .map((tx) => {
                          const isIncome = tx.type === 'income';
                          return (
                            <tr key={tx.id} className="hover:bg-green-50/10 transition-colors">
                              <td className="py-3 px-4 font-mono text-[10px] text-stone-500 whitespace-nowrap">{tx.date}</td>
                              <td className="py-3 px-3">
                                <div className="font-bold text-stone-800">{tx.description}</div>
                              </td>
                              <td className="py-3 px-3 whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded-full text-[8px] font-extrabold uppercase border ${
                                  isIncome ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-green-50 text-green-800 border-green-100'
                                }`}>
                                  {tx.category}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-stone-600 font-medium whitespace-nowrap">{tx.recipientOrSource || '--'}</td>
                              <td className={`py-3 px-3 text-right font-mono font-bold text-[12px] whitespace-nowrap ${
                                isIncome ? 'text-emerald-700' : 'text-stone-800'
                              }`}>
                                {isIncome ? `+${tx.amount.toLocaleString('fr-FR')} FCFA` : `-${tx.amount.toLocaleString('fr-FR')} FCFA`}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => handleDeleteTransaction(tx.id)}
                                  className="text-stone-400 hover:text-green-600 cursor-pointer p-1"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

              </div>

              {/* Form: Add ledger transaction */}
              <div className="bg-stone-50 border border-stone-200/50 rounded-2xl p-5 space-y-4 h-fit">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-stone-800">Saisir un flux de trésorerie</h4>
                  <p className="text-[9px] text-stone-400 font-medium">Enregistrement instantané d'une facture, achat ou prestation.</p>
                </div>

                <form onSubmit={handleAddTransaction} className="space-y-3.5 text-xs text-stone-700">
                  <div className="grid grid-cols-2 gap-2 p-1 bg-stone-200/60 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setNewTxType('expense')}
                      className={`py-1.5 text-center font-bold rounded-lg cursor-pointer text-[10px] ${newTxType === 'expense' ? 'bg-green-950 text-white' : 'text-stone-600'}`}
                    >
                      Dépense
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTxType('income')}
                      className={`py-1.5 text-center font-bold rounded-lg cursor-pointer text-[10px] ${newTxType === 'income' ? 'bg-emerald-600 text-white' : 'text-stone-600'}`}
                    >
                      Recette
                    </button>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[10px] text-stone-500 uppercase">Catégorie</label>
                    <select
                      value={newTxCategory}
                      onChange={(e) => setNewTxCategory(e.target.value)}
                      className="w-full border border-green-200 rounded-xl px-3 py-2 bg-white text-stone-800 font-bold focus:outline-green-500"
                    >
                      {newTxType === 'expense' 
                        ? expenseCategories.map(c => <option key={c} value={c}>{c}</option>)
                        : incomeCategories.map(c => <option key={c} value={c}>{c}</option>)
                      }
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[10px] text-stone-500 uppercase">Montant (FCFA)</label>
                    <input
                      type="number"
                      placeholder="Ex: 50000"
                      value={newTxAmount}
                      onChange={(e) => setNewTxAmount(e.target.value)}
                      required
                      className="w-full border border-green-200 rounded-xl px-3 py-2 font-mono font-bold focus:outline-green-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-[10px] text-stone-500 uppercase">Description</label>
                    <input
                      type="text"
                      placeholder="Motif de la transaction"
                      value={newTxDescription}
                      onChange={(e) => setNewTxDescription(e.target.value)}
                      required
                      className="w-full border border-green-200 rounded-xl px-3 py-2 focus:outline-green-500"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl transition cursor-pointer uppercase text-[10px]"
                  >
                    Enregistrer la transaction
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>
      ) : (
        /* ----------------- EMPLOYEE CO-WORKER VIEW ----------------- */
        <div className="p-6 space-y-6">
          <div className="bg-green-50/50 border border-green-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-stone-200">
                <img src={employees.find(e => e.id === loggedInEmpId)?.avatarUrl || undefined} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-stone-900 text-sm">Portail Salarial : {getEmployeeName(loggedInEmpId)}</h3>
                <p className="text-[10px] text-stone-500 capitalize">Rôle : {getEmployeeRole(loggedInEmpId)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-green-100 rounded-2xl shadow-2xs overflow-hidden">
            <table className="w-full text-[11px] text-left">
              <thead>
                <tr className="bg-green-50/50 border-b border-green-100 text-[9px] font-extrabold uppercase tracking-wider text-green-900/80">
                  <th className="py-2.5 px-4">Période</th>
                  <th className="py-2.5 px-3">Base brute</th>
                  <th className="py-2.5 px-3">Primes</th>
                  <th className="py-2.5 px-3 text-center">Net versé</th>
                  <th className="py-2.5 px-4 text-right">Fiche</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-green-50">
                {personalAllPayments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-stone-400 font-medium">
                      Aucun versement de salaire n'a encore été traité sur votre compte.
                    </td>
                  </tr>
                ) : (
                  personalAllPayments.map(pay => (
                    <tr key={pay.id} className="hover:bg-green-50/10 transition-colors">
                      <td className="py-3 px-4 font-bold text-stone-800">{pay.period}</td>
                      <td className="py-3 px-3 font-mono text-stone-600">{pay.baseAmount.toLocaleString('fr-FR')} FCFA</td>
                      <td className="py-3 px-3 font-mono text-emerald-700 font-bold">{pay.bonusAmount > 0 ? `+${pay.bonusAmount.toLocaleString('fr-FR')} FCFA` : '--'}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-[12px] text-green-950">{pay.netAmount.toLocaleString('fr-FR')} FCFA</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setViewingSlipPayment(pay)}
                          className="bg-stone-50 hover:bg-green-50 text-stone-600 hover:text-green-900 border border-stone-200 rounded-lg text-[9px] font-bold px-2 py-1 transition cursor-pointer"
                        >
                          Consulter
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
