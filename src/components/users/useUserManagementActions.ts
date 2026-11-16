import React from 'react';
import { AppUser, UserRole, UserStatus, Employee, EmployeeStatus } from '../../types';
import { saveUser, deleteUser } from '../../services/userService';
import { hashPassword } from '../../utils/cryptoUtils';
import { logAdminOperation } from '../../services/adminAuditService';
import { executeDeleteWithSweetAlert, executeOperationWithLoading } from '../../utils/sweetAlert';

export interface SaveUserPayload {
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  employmentStatus: EmployeeStatus;
  department: string;
  password?: string;
  allowEarlyDeparture15_17?: boolean;
  allowLateArrival8_930?: boolean;
}

interface UseUserManagementActionsParams {
  users: AppUser[];
  currentUser: AppUser;
  editingUser: AppUser | null;
  employees?: Employee[];
  onAddNotification: (notif: any) => void;
  onUpdateUsers?: (updated: AppUser[]) => Promise<void> | void;
  onUpdateEmployees?: (updated: Employee[]) => Promise<void> | void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingUser: React.Dispatch<React.SetStateAction<AppUser | null>>;
}

export function useUserManagementActions({
  users,
  currentUser,
  editingUser,
  employees,
  onAddNotification,
  onUpdateUsers,
  onUpdateEmployees,
  setIsModalOpen,
  setEditingUser,
}: UseUserManagementActionsParams) {
  const handleDeleteUser = async (user: AppUser) => {
    await executeDeleteWithSweetAlert({
      title: 'Supprimer cet utilisateur ?',
      text: `Voulez-vous vraiment supprimer définitivement le compte de ${user.name} (${user.email}) ? Cette action est irréversible.`,
      itemName: user.name,
      action: async () => {
        await deleteUser(user.id);
        if (onUpdateUsers) {
          await onUpdateUsers(users.filter((u) => u.id !== user.id));
        }
        logAdminOperation({
          authorName: currentUser.name,
          authorRole: currentUser.role,
          targetUserId: user.id,
          targetName: user.name,
          operationType: 'status_change',
          operationLabel: 'Suppression de Compte',
          details: `Compte utilisateur ${user.email} supprimé définitivement.`,
        });
      },
      successTitle: 'Utilisateur supprimé !',
      successMessage: `Le compte de "${user.name}" a été supprimé avec succès.`,
      errorMessage: "Erreur lors de la suppression de l'utilisateur.",
    });
  };

  const handleSaveUser = async (data: SaveUserPayload) => {
    const isEditing = Boolean(editingUser);
    const trimmedName = data.name.trim();

    const res = await executeOperationWithLoading({
      loadingTitle: isEditing ? 'Mise à jour du compte...' : 'Création du compte...',
      loadingText: isEditing
        ? `Enregistrement des modifications de "${trimmedName}", veuillez patienter...`
        : `Création du compte de "${trimmedName}", veuillez patienter...`,
      action: async () => {
        let passwordHash = editingUser?.passwordHash;
        if (data.password) {
          passwordHash = await hashPassword(data.password);
        }

        const userToSave: AppUser = {
          ...(editingUser || {}),
          id: editingUser ? editingUser.id : `user-${Date.now()}`,
          name: trimmedName,
          email: data.email.trim(),
          role: data.role,
          roleId: data.role === 'administrateur' ? 1 : data.role === 'responsable' ? 2 : 3,
          status: data.status,
          employmentStatus: data.employmentStatus,
          department: data.department.trim(),
          allowEarlyDeparture15_17: Boolean(data.allowEarlyDeparture15_17),
          allowLateArrival8_930: Boolean(data.allowLateArrival8_930),
          createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
          passwordHash,
        };

        const savedUser = await saveUser(userToSave, editingUser || undefined);

        if (onUpdateUsers) {
          if (editingUser) {
            await onUpdateUsers(users.map((u) => (u.id === userToSave.id || u.id === savedUser.id ? savedUser : u)));
          } else {
            await onUpdateUsers([savedUser, ...users]);
          }
        }

        if (onUpdateEmployees && employees && employees.length > 0) {
          const targetEmail = savedUser.email.toLowerCase();
          const oldEmail = editingUser?.email ? editingUser.email.toLowerCase() : '';
          const empIdx = employees.findIndex(
            (e) =>
              (savedUser.employeeId &&
                (String(e.id) === String(savedUser.employeeId) ||
                  e.uid === savedUser.employeeId ||
                  (e as any).doc_id === savedUser.employeeId)) ||
              (e.userId && (String(e.userId) === String(savedUser.id) || String(e.userId) === String(userToSave.id))) ||
              (e.email && (e.email.toLowerCase() === targetEmail || (oldEmail && e.email.toLowerCase() === oldEmail)))
          );

          if (empIdx >= 0) {
            const emp = employees[empIdx];
            const isEmpActive =
              savedUser.status === 'actif' &&
              data.employmentStatus !== 'renvoye' &&
              data.employmentStatus !== 'demissionne' &&
              data.employmentStatus !== 'suspendu' &&
              data.employmentStatus !== 'parti';

            const resolvedRoleId = savedUser.role === 'administrateur' ? 1 : savedUser.role === 'responsable' ? 2 : 3;
            const resolvedRoleType =
              savedUser.role === 'administrateur'
                ? 'Super Administrateur'
                : savedUser.role === 'responsable'
                ? 'Responsable'
                : emp.roleType || 'Employé';

            const updatedEmp: Employee = {
              ...emp,
              name: savedUser.name,
              email: savedUser.email,
              department: savedUser.department || emp.department,
              roleId: resolvedRoleId,
              roleType: resolvedRoleType,
              role: resolvedRoleType,
              status: isEmpActive,
              employmentStatus: data.employmentStatus,
              userId: savedUser.id,
              allowEarlyDeparture15_17: Boolean(data.allowEarlyDeparture15_17),
              allowLateArrival8_930: Boolean(data.allowLateArrival8_930),
            };
            await onUpdateEmployees(employees.map((e, i) => (i === empIdx ? updatedEmp : e)));
          }
        }

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

          const userNotif = {
            id: `notif-user-${Date.now()}`,
            type: 'system',
            title: 'Nouveau compte utilisateur créé',
            content: `Le compte pour ${userToSave.name} (${userToSave.email}) avec le rôle ${userToSave.role} a été créé.`,
            recipient: 'Administrateurs',
            payload: JSON.stringify({ userId: userToSave.id, email: userToSave.email, role: userToSave.role }),
            timestamp: new Date().toISOString(),
            read: false,
          };
          onAddNotification(userNotif);
        }

        return userToSave;
      },
      successTitle: isEditing ? 'Utilisateur mis à jour !' : 'Utilisateur créé !',
      successMessage: isEditing
        ? `Le compte "${trimmedName}" a été mis à jour.`
        : `Le compte "${trimmedName}" a été créé avec succès.`,
      errorMessage: "Erreur lors de l'enregistrement de l'utilisateur.",
    });

    if (res.success) {
      setIsModalOpen(false);
      setEditingUser(null);
    }
  };

  return { handleDeleteUser, handleSaveUser };
}
