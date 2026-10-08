import React, { useState } from 'react';
import { Users, Download, FileText } from 'lucide-react';
import { AppUser, UserRole, UserStatus } from '../types';
import { saveUser, deleteUser } from '../services/userService';
import { hashPassword } from '../utils/cryptoUtils';
import { logAdminOperation } from '../services/adminAuditService';
import { UserFormModal } from './users/UserFormModal';
import { UserDeleteConfirmModal } from './users/UserDeleteConfirmModal';
import { UserTableItemRow } from './users/UserTableItemRow';
import { UserFilterToolbar } from './users/UserFilterToolbar';
import { exportToExcel } from '../services/excelExportService';
import { exportElementToPdf } from '../services/pdfExportService';

interface UserManagementPanelProps {
  users: AppUser[];
  onAddNotification: (notif: any) => void;
  currentUser: AppUser;
  onUpdateUsers?: (updated: AppUser[]) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function UserManagementPanel({
  users,
  onAddNotification,
  currentUser,
  onUpdateUsers,
  showToast,
}: UserManagementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleSaveUser = async (data: {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    department: string;
    password?: string;
  }) => {
    try {
      let passwordHash = editingUser?.passwordHash;
      if (data.password) {
        passwordHash = await hashPassword(data.password);
      }

      const userToSave: AppUser = {
        id: editingUser ? editingUser.id : `user-${Date.now()}`,
        name: data.name.trim(),
        email: data.email.trim(),
        role: data.role,
        status: data.status,
        department: data.department.trim(),
        createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
        passwordHash,
      };

      await saveUser(userToSave);

      // Audit log
      if (editingUser) {
        if (editingUser.role !== data.role) {
          logAdminOperation({
            authorName: currentUser.name,
            authorRole: currentUser.role,
            targetUserId: userToSave.id,
            targetName: userToSave.name,
            operationType: 'role_change',
            operationLabel: 'Modification Rôle Utilisateur',
            details: `Rôle modifié : ${editingUser.role} ➔ ${data.role}`,
          });
        }
        if (editingUser.status !== data.status) {
          logAdminOperation({
            authorName: currentUser.name,
            authorRole: currentUser.role,
            targetUserId: userToSave.id,
            targetName: userToSave.name,
            operationType: 'status_change',
            operationLabel: 'Changement Statut Compte',
            details: `Statut modifié : ${editingUser.status} ➔ ${data.status}`,
          });
        }
        if (data.password) {
          logAdminOperation({
            authorName: currentUser.name,
            authorRole: currentUser.role,
            targetUserId: userToSave.id,
            targetName: userToSave.name,
            operationType: 'password_reset',
            operationLabel: 'Réinitialisation Mot de Passe',
            details: 'Mot de passe réinitialisé par l’administrateur',
          });
        }
      } else {
        logAdminOperation({
          authorName: currentUser.name,
          authorRole: currentUser.role,
          targetUserId: userToSave.id,
          targetName: userToSave.name,
          operationType: 'creation',
          operationLabel: 'Création de Compte',
          details: `Création compte ${userToSave.role} (${userToSave.email})`,
        });
      }

      showToast?.(
        editingUser ? 'Utilisateur mis à jour avec succès' : 'Nouvel utilisateur créé avec succès',
        'success'
      );
      setIsModalOpen(false);
    } catch {
      showToast?.('Erreur lors de l’enregistrement de l’utilisateur', 'error');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      logAdminOperation({
        authorName: currentUser.name,
        authorRole: currentUser.role,
        targetUserId: userToDelete.id,
        targetName: userToDelete.name,
        operationType: 'status_change',
        operationLabel: 'Suppression de Compte',
        details: `Compte utilisateur ${userToDelete.email} supprimé définitivement.`,
      });
      showToast?.('Utilisateur supprimé avec succès', 'success');
      setUserToDelete(null);
    } catch {
      showToast?.('Erreur lors de la suppression', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

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
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Filter toolbar */}
      <UserFilterToolbar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        roleFilter={roleFilter}
        setRoleFilter={setRoleFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onOpenNewUser={handleOpenNewUser}
      />

      {/* Users table */}
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
                    onEdit={handleEditUser}
                    onDelete={(u) => setUserToDelete(u)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingUser={editingUser}
        onSave={handleSaveUser}
      />

      <UserDeleteConfirmModal
        user={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        isDeleting={isDeleting}
      />
    </div>
  );
}
