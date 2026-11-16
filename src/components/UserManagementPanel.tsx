import React, { useState } from 'react';
import { Users, Download, FileText, ShieldCheck, Plus } from 'lucide-react';
import { HumaanUsers } from './illustrations/HumaanIllustrations';
import { AppUser, Employee, Presence, SalaryPayment, Task } from '../types';
import { UserFormModal } from './users/UserFormModal';
import { UserTableItemRow } from './users/UserTableItemRow';
import { UserFilterToolbar } from './users/UserFilterToolbar';
import { UserDetailStatsModal } from './users/UserDetailStatsModal';
import { exportToExcel } from '../services/excelExportService';
import { exportElementToPdf } from '../services/pdfExportService';
import { useUserManagementActions } from './users/useUserManagementActions';

interface UserManagementPanelProps {
  users: AppUser[];
  onAddNotification: (notif: any) => void;
  currentUser: AppUser;
  onUpdateUsers?: (updated: AppUser[]) => void;
  employees?: Employee[];
  onUpdateEmployees?: (updated: Employee[]) => void;
  presences?: Presence[];
  tasks?: Task[];
  salaryPayments?: SalaryPayment[];
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function UserManagementPanel({
  users,
  onAddNotification,
  currentUser,
  onUpdateUsers,
  employees = [],
  onUpdateEmployees,
  presences = [],
  tasks = [],
  salaryPayments = [],
  showToast,
}: UserManagementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [detailUser, setDetailUser] = useState<AppUser | null>(null);

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const handleOpenNewUser = () => {
    setEditingUser(null);
    setIsModalOpen(true);
  };

  const handleEditUser = (user: AppUser) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const { handleDeleteUser, handleSaveUser } = useUserManagementActions({
    users,
    currentUser,
    editingUser,
    employees,
    onAddNotification,
    onUpdateUsers,
    onUpdateEmployees,
    showToast,
    setIsModalOpen,
    setEditingUser,
  });

  const handleExportExcel = () => {
    const headers = ['ID', 'Nom', 'Email', 'Rôle', 'Département', 'Statut'];
    const rows = filteredUsers.map((u) => [
      u.id,
      u.name,
      u.email,
      u.role,
      u.department || '',
      u.status,
    ]);
    exportToExcel('comptes_utilisateurs.xls', 'Comptes Utilisateurs Système Citrine', headers, rows);
  };

  const handleExportPdf = () => {
    exportElementToPdf('users-table-container', 'comptes_utilisateurs.pdf');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="bg-gradient-to-r from-[#2A7B76] to-emerald-800 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-5 relative overflow-hidden">
        <div className="z-10 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2.5">
            <div className="p-2.5 bg-white/10 backdrop-blur-xs rounded-2xl border border-white/20">
              <ShieldCheck className="h-6 w-6 text-emerald-200" />
            </div>
            <h2 className="font-serif font-bold text-xl md:text-2xl">
              Utilisateurs &amp; Rôles Système
            </h2>
          </div>
        </div>

        <div className="hidden lg:block shrink-0 z-10">
          <HumaanUsers className="w-36 h-28 drop-shadow-md" />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center md:justify-end gap-2.5 z-10 w-full sm:w-auto">
          <button
            onClick={handleExportExcel}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
          >
            <Download className="h-3.5 w-3.5 text-emerald-200" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
          >
            <FileText className="h-3.5 w-3.5 text-rose-300" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleOpenNewUser}
            className="w-full sm:w-auto justify-center flex items-center gap-1.5 bg-[#D4A82F] hover:bg-[#c39b28] text-stone-950 px-4 py-2.5 rounded-2xl text-xs font-extrabold shadow-md transition cursor-pointer active:scale-98"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel Utilisateur</span>
          </button>
        </div>
      </div>

      <UserFilterToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenNewUser={handleOpenNewUser}
      />

      <div id="users-table-container" className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-stone-50/50">
          <h3 className="font-serif font-bold text-xs text-stone-900 flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[#2A7B76]" /> Utilisateurs du Système ({filteredUsers.length})
          </h3>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={handleExportPdf}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5 text-rose-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-100">
              <tr>
                <th className="py-3 px-4">Utilisateur</th>
                <th className="py-3 px-4">Rôle</th>
                <th className="py-3 px-4">Département</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-stone-400 italic">
                    Aucun compte utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserTableItemRow
                    key={user.id}
                    user={user}
                    currentUserId={currentUser.id}
                    onViewDetails={setDetailUser}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailUser && (
        <UserDetailStatsModal
          isOpen={Boolean(detailUser)}
          onClose={() => setDetailUser(null)}
          user={detailUser}
          employees={employees}
          presences={presences}
          tasks={tasks}
          salaryPayments={salaryPayments}
          onEditUser={handleEditUser}
        />
      )}

      {isModalOpen && (
        <UserFormModal
          key={editingUser ? `edit-${editingUser.id}` : 'new-user'}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
          editingUser={editingUser}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
}
