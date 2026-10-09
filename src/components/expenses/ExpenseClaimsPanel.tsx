import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Search } from 'lucide-react';
import { 
  ExpenseClaim, 
  ExpenseClaimStatus, 
  ExpenseCategory, 
  PaymentMode, 
  AppUser, 
  Employee 
} from '../../types';
import { 
  subscribeToExpenseClaims, 
  saveExpenseClaim 
} from '../../services/expenseClaimService';
import { ExpenseKpiCards } from './ExpenseKpiCards';
import { ExpenseDetailModal } from './ExpenseDetailModal';
import { NewExpenseModal } from './NewExpenseModal';
import { ExpenseClaimsTable } from './ExpenseClaimsTable';

interface ExpenseClaimsPanelProps {
  currentUser?: AppUser | null;
  employees: Employee[];
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const ExpenseClaimsPanel: React.FC<ExpenseClaimsPanelProps> = ({
  currentUser,
  employees,
  onAddNotification,
  showToast,
}) => {
  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<ExpenseClaim | null>(null);

  useEffect(() => {
    const unsub = subscribeToExpenseClaims(setClaims);
    return () => unsub();
  }, []);

  const isAdminOrManager = currentUser?.role === 'administrateur' || currentUser?.role === 'responsable';

  const visibleClaims = claims.filter((c) => {
    if (!isAdminOrManager && currentUser?.employeeId) {
      return c.employeeId === currentUser.employeeId;
    }
    return true;
  });

  const totalAmount = visibleClaims.reduce((acc, c) => acc + (c.amount || 0), 0);
  const pendingAmount = visibleClaims
    .filter((c) => c.status === 'soumis' || c.status === 'en_verification')
    .reduce((acc, c) => acc + (c.amount || 0), 0);
  const approvedToPay = visibleClaims
    .filter((c) => c.status === 'approuve')
    .reduce((acc, c) => acc + (c.amount || 0), 0);
  const reimbursedTotal = visibleClaims
    .filter((c) => c.status === 'rembourse')
    .reduce((acc, c) => acc + (c.amount || 0), 0);

  const filteredClaims = visibleClaims.filter((c) => {
    const matchSearch = 
      c.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.missionLocation && c.missionLocation.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchCat = categoryFilter === 'all' || c.category === categoryFilter;
    return matchSearch && matchStatus && matchCat;
  });

  const formatCFA = (amount: number) => {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' XAF';
  };

  const getCategoryLabel = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'carburant': return 'Carburant & Gazole';
      case 'transport': return 'Transport & Taxi';
      case 'hebergement': return 'Hôtel & Hébergement';
      case 'restauration': return 'Repas & Restauration';
      case 'peage': return 'Péages & Stationnement';
      case 'materiel_urgence': return 'Pièce / Achat d\'urgence';
      case 'telecom': return 'Forfait & Communications';
      default: return 'Autre dépense';
    }
  };

  const handleUpdateStatus = async (claim: ExpenseClaim, newStatus: ExpenseClaimStatus, reason?: string) => {
    try {
      const updated: ExpenseClaim = {
        ...claim,
        status: newStatus,
        ...(newStatus === 'approuve' ? { approvedBy: currentUser?.name || 'Direction', approvedAt: new Date().toISOString() } : {}),
        ...(newStatus === 'rembourse' ? { reimbursedAt: new Date().toISOString() } : {}),
        ...(reason ? { rejectionReason: reason } : {}),
      };
      await saveExpenseClaim(updated);
      setSelectedClaim(updated);
      showToast?.(`Note de frais mise à jour : ${newStatus}`, 'success');
      onAddNotification?.({
        title: 'Note de Frais actualisée',
        message: `${claim.reference} (${claim.employeeName}) : statut passé à "${newStatus}".`,
        type: newStatus === 'rejete' ? 'warning' : 'success',
      });
    } catch {
      showToast?.('Erreur lors de la mise à jour.', 'error');
    }
  };

  const handleCreateClaim = async (claimData: Partial<ExpenseClaim>) => {
    if (!claimData.title || !claimData.amount || Number(claimData.amount) <= 0) {
      showToast?.('Veuillez renseigner un titre et un montant valide.', 'error');
      return;
    }

    try {
      const selectedEmp = employees.find((emp) => emp.id === claimData.employeeId) || 
        (currentUser?.employeeId ? employees.find((emp) => emp.id === currentUser.employeeId) : employees[0]);

      const claimToSave: ExpenseClaim = {
        id: `exp-${Date.now()}`,
        reference: `NDF-2026-${String(claims.length + 41).padStart(4, '0')}`,
        employeeId: selectedEmp?.id || 'emp-citrine',
        employeeName: selectedEmp?.name || currentUser?.name || 'Collaborateur Citrine',
        employeeDepartment: selectedEmp?.department || 'Exploitation',
        title: claimData.title,
        missionLocation: claimData.missionLocation || 'Douala',
        expenseDate: claimData.expenseDate || new Date().toISOString().split('T')[0],
        category: (claimData.category as ExpenseCategory) || 'carburant',
        amount: Number(claimData.amount),
        receiptNumber: claimData.receiptNumber || '',
        receiptDescription: claimData.receiptDescription || '',
        paymentMode: (claimData.paymentMode as PaymentMode) || 'orange_money',
        status: 'soumis',
        notes: claimData.notes || '',
        createdAt: new Date().toISOString(),
      };

      await saveExpenseClaim(claimToSave);
      setIsNewModalOpen(false);
      showToast?.('Note de frais soumise avec succès !', 'success');
      onAddNotification?.({
        title: 'Nouvelle Note de Frais',
        message: `${claimToSave.employeeName} a soumis une note de frais de ${formatCFA(claimToSave.amount)}.`,
        type: 'info',
      });
    } catch {
      showToast?.('Erreur lors de la création de la note de frais.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800">Notes de Frais & Remboursements de Mission</h1>
            <p className="text-xs text-stone-500">
              Déclaration des débours, carburant, déplacements et circuit de remboursement Citrine
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Déclarer une Note de Frais
        </button>
      </div>

      <ExpenseKpiCards
        totalAmount={totalAmount}
        pendingAmount={pendingAmount}
        approvedToPay={approvedToPay}
        reimbursedTotal={reimbursedTotal}
        claimsCount={visibleClaims.length}
        formatCFA={formatCFA}
      />

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par référence, collaborateur, motif ou lieu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Tous les statuts</option>
          <option value="soumis">Soumis</option>
          <option value="en_verification">En vérification</option>
          <option value="approuve">Approuvé</option>
          <option value="rembourse">Remboursé</option>
          <option value="rejete">Rejeté</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Toutes les natures</option>
          <option value="carburant">Carburant</option>
          <option value="transport">Transport</option>
          <option value="hebergement">Hébergement</option>
          <option value="restauration">Restauration</option>
          <option value="peage">Péage</option>
          <option value="materiel_urgence">Matériel d'urgence</option>
        </select>
      </div>

      <ExpenseClaimsTable
        claims={filteredClaims}
        onSelectClaim={setSelectedClaim}
        formatCFA={formatCFA}
        getCategoryLabel={getCategoryLabel}
      />

      {selectedClaim && (
        <ExpenseDetailModal
          claim={selectedClaim}
          isAdminOrManager={isAdminOrManager}
          onClose={() => setSelectedClaim(null)}
          onUpdateStatus={handleUpdateStatus}
          formatCFA={formatCFA}
          getCategoryLabel={getCategoryLabel}
        />
      )}

      {isNewModalOpen && (
        <NewExpenseModal
          employees={employees}
          isAdminOrManager={isAdminOrManager}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateClaim}
        />
      )}
    </div>
  );
};

export default ExpenseClaimsPanel;
