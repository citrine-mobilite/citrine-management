import React, { useState } from 'react';
import { 
  Users, 
  Shield, 
  Plus, 
  Search, 
  Mail, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Edit3, 
  Key, 
  UserCheck, 
  UserX, 
  AlertCircle,
  Sparkles,
  Send,
  X
} from 'lucide-react';
import { AppUser, UserRole, UserStatus } from '../types';
import { saveUser, deleteUser } from '../services/userService';
import { hashPassword, generateStrongPassword } from '../utils/cryptoUtils';
import { SearchableSelect } from './common/SearchableSelect';
import { exportTableToExcel, exportTableToPDF } from '../utils/tableExportUtils';
import { FileSpreadsheet, Download } from 'lucide-react';

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
  showToast
}: UserManagementPanelProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employé');
  const [status, setStatus] = useState<UserStatus>('actif');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');

  // Pagination state (default 25)
  const [userPage, setUserPage] = useState<number>(1);
  const [userPageSize, setUserPageSize] = useState<number>(25);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleOpenCreateModal = () => {
    setEditingUser(null);
    setName('');
    setEmail('');
    setRole('employé');
    setStatus('actif');
    setDepartment('Développement');
    const tempPass = generateStrongPassword(12);
    setPassword(tempPass);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (user: AppUser) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setDepartment(user.department || '');
    setPassword(''); // Do not load password hash into form
    setIsModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const emailTrimmed = email.trim().toLowerCase();
    if (!editingUser) {
      const existing = users.find(u => u.email.toLowerCase() === emailTrimmed);
      if (existing) {
        if (showToast) {
          showToast(`Un utilisateur avec l'adresse email "${emailTrimmed}" existe déjà dans le système.`, 'error');
        }
        return;
      }
    }

    const userId = editingUser ? editingUser.id : 'usr-' + Date.now();
    let hashedPassword = editingUser ? editingUser.passwordHash : undefined;
    let rawPassToUse = password.trim();

    if (rawPassToUse) {
      hashedPassword = await hashPassword(rawPassToUse);
    } else if (!editingUser) {
      rawPassToUse = generateStrongPassword(12);
      hashedPassword = await hashPassword(rawPassToUse);
    }

    const newUser: AppUser = {
      id: userId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role,
      status,
      authMethod: 'password',
      passwordHash: hashedPassword,
      department: department.trim() || 'Général',
      avatarUrl: editingUser?.avatarUrl || '',
      createdAt: editingUser ? editingUser.createdAt : new Date().toISOString(),
      lastLoginAt: editingUser?.lastLoginAt
    };

    await saveUser(newUser);

    if (onUpdateUsers) {
      const updatedList = editingUser
        ? users.map(u => u.id === userId ? newUser : u)
        : [...users, newUser];
      onUpdateUsers(updatedList);
    }

    if (!editingUser && rawPassToUse) {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://citrine-hr.web.app';
      const notificationMessage = `Bonjour ${newUser.name},\n\n` +
        `Votre compte Citrine Management vient d'être créé par l'administration.\n\n` +
        `Vos identifiants de connexion sécurisés :\n` +
        `• Lien du site : ${siteUrl}\n` +
        `• Email : ${newUser.email}\n` +
        `• Mot de passe provisoire : ${rawPassToUse}\n` +
        `• Rôle : ${newUser.role.toUpperCase()}\n\n` +
        `Veuillez vous connecter et modifier votre mot de passe depuis votre profil.\n\n` +
        `Cordialement,\nLa Direction Citrine Management`;

      // Send Email Notification
      onAddNotification({
        id: 'notif-email-create-' + Date.now(),
        type: 'email',
        recipient: newUser.email,
        title: 'Vos identifiants de connexion Citrine Management',
        content: notificationMessage,
        payload: JSON.stringify({ siteUrl, email: newUser.email, role: newUser.role }),
        timestamp: new Date().toISOString()
      });

      // Send WhatsApp Notification
      onAddNotification({
        id: 'notif-wa-create-' + Date.now(),
        type: 'whatsapp',
        recipient: newUser.phone || newUser.email,
        title: 'Vos identifiants de connexion Citrine Management',
        content: notificationMessage,
        payload: JSON.stringify({ siteUrl, email: newUser.email, role: newUser.role }),
        timestamp: new Date().toISOString()
      });

      if (showToast) {
        showToast(`Compte créé pour ${newUser.name}. Identifiants envoyés par Email et WhatsApp.`, 'success');
      }
    } else {
      if (showToast) {
        showToast(`Modifications enregistrées pour ${newUser.name}.`, 'success');
      }
    }

    setIsModalOpen(false);
  };

  const handleInitiateDelete = (user: AppUser) => {
    if (user.email === currentUser.email) {
      if (showToast) {
        showToast('Vous ne pouvez pas supprimer votre propre compte connecté.', 'error');
      }
      return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      if (onUpdateUsers) {
        onUpdateUsers(users.filter(u => u.id !== userToDelete.id));
      }
      if (showToast) {
        showToast(`Utilisateur "${userToDelete.name}" supprimé définitivement du système.`, 'success');
      }
    } catch (err) {
      if (showToast) {
        showToast("Erreur lors de la suppression de l'utilisateur.", 'error');
      }
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const handleToggleStatus = async (user: AppUser) => {
    if (user.email === currentUser.email) {
      if (showToast) {
        showToast('Vous ne pouvez pas désactiver votre propre compte administrateur actif.', 'error');
      }
      return;
    }
    const updatedStatus: UserStatus = user.status === 'actif' ? 'inactif' : 'actif';
    const updatedUser: AppUser = {
      ...user,
      status: updatedStatus
    };
    await saveUser(updatedUser);
    if (onUpdateUsers) {
      onUpdateUsers(users.map(u => u.id === user.id ? updatedUser : u));
    }
    if (showToast) {
      showToast(`Statut de ${user.name} passé à ${updatedStatus.toUpperCase()}.`, 'success');
    }
  };

  return (
    <div className="space-y-6" id="users-management-panel">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-green-100 pb-5">
        <div>
          <h2 className="text-xl font-serif font-semibold text-green-950 tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Gestion des Utilisateurs du Système ({users.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => {
              const data = users.map(u => ({
                'Nom': u.name,
                'Email': u.email,
                'Téléphone': u.phone || '',
                'Rôle': u.role,
                'Statut': u.status || 'actif',
                'Département': u.department || '',
                'Date Création': u.createdAt || ''
              }));
              exportTableToExcel(data, 'Liste_Utilisateurs_Systeme');
            }}
            className="px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
            title="Exporter en Excel"
          >
            <FileSpreadsheet className="h-4 w-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={() => {
              const headers = ['Nom', 'Email', 'Rôle', 'Statut', 'Département'];
              const rows = users.map(u => [
                u.name,
                u.email,
                u.role,
                u.status || 'actif',
                u.department || '-'
              ]);
              exportTableToPDF('Rapport des Utilisateurs du Système', headers, rows, 'Liste_Utilisateurs_Systeme');
            }}
            className="px-3.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-stone-200"
            title="Exporter en PDF"
          >
            <Download className="h-4 w-4" />
            <span>PDF</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/20 transition cursor-pointer shrink-0"
          >
            <Plus className="h-4 w-4" />
            <span>Nouvel Utilisateur</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-green-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:border-green-500 outline-none transition font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Role Filter */}
          <div className="w-44">
            <SearchableSelect
              value={roleFilter}
              onChange={setRoleFilter}
              options={[
                { value: 'all', label: 'Tous les rôles' },
                { value: 'administrateur', label: 'Administrateur', badge: 'Admin' },
                { value: 'responsable', label: 'Responsable', badge: 'Manager' },
                { value: 'employé', label: 'Employé', badge: 'Staff' }
              ]}
              placeholder="Filtrer par rôle"
              searchPlaceholder="Chercher un rôle..."
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div className="w-44">
            <SearchableSelect
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'Tous les statuts' },
                { value: 'actif', label: 'Actifs uniquement', badge: 'Actif', badgeColor: 'bg-emerald-100 text-emerald-800' },
                { value: 'inactif', label: 'Inactifs (Bloqués)', badge: 'Inactif', badgeColor: 'bg-stone-100 text-stone-600' }
              ]}
              placeholder="Filtrer par statut"
              searchPlaceholder="Chercher un statut..."
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Users Grid Table */}
      <div className="bg-white rounded-2xl shadow-xs border border-green-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-green-50/70 border-b border-green-100 text-[10px] font-bold text-green-900 uppercase tracking-wider">
                <th className="py-3.5 px-4">Utilisateur</th>
                <th className="py-3.5 px-4">Rôle Système</th>
                <th className="py-3.5 px-4">Département</th>
                <th className="py-3.5 px-4">Méthode Auth</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs text-stone-800">
              {filteredUsers
                .slice((userPage - 1) * userPageSize, userPage * userPageSize)
                .map((u) => {
                const isAdmin = u.role === 'administrateur';
                const isActive = u.status === 'actif';
                const isSelf = u.email === currentUser.email;

                return (
                  <tr key={u.id} className="hover:bg-green-50/30 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="h-9 w-9 rounded-xl object-cover border border-stone-200 shrink-0"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-xl bg-green-900 text-white font-bold flex items-center justify-center text-xs shrink-0 border border-green-950">
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-stone-900 flex items-center gap-1.5">
                            {u.name}
                            {isSelf && (
                              <span className="bg-green-100 text-green-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                                Vous
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500 font-mono">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        isAdmin ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                        u.role === 'responsable' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        <Shield className="h-3 w-3" /> {u.role.toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-stone-600">
                      {u.department || 'Direction'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="text-[11px] font-mono text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md border border-stone-200">
                        Email & Mot de passe (Salé)
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={isSelf}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                          isActive 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                        }`}
                        title={isSelf ? "Impossible de modifier son propre statut" : "Cliquer pour basculer le statut"}
                      >
                        {isActive ? <UserCheck className="h-3 w-3 text-emerald-600" /> : <UserX className="h-3 w-3 text-green-600" />}
                        {isActive ? 'ACTIF' : 'INACTIF'}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(u)}
                          className="p-1.5 text-stone-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition cursor-pointer"
                          title="Modifier l'utilisateur"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleInitiateDelete(u)}
                          disabled={isSelf}
                          className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer disabled:opacity-30"
                          title={isSelf ? "Impossible de supprimer son propre compte connecté" : "Supprimer l'utilisateur"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-stone-400 italic">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Datatable Pagination Controls */}
        {(() => {
          const totalItems = filteredUsers.length;
          const totalPages = Math.ceil(totalItems / userPageSize) || 1;
          const indexOfLastItem = userPage * userPageSize;
          const indexOfFirstItem = indexOfLastItem - userPageSize;

          return (
            <div className="bg-stone-50 border-t border-stone-200 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-stone-500">Afficher</span>
                <div className="w-32">
                  <SearchableSelect
                    value={userPageSize.toString()}
                    onChange={(val) => {
                      setUserPageSize(Number(val) || 25);
                      setUserPage(1);
                    }}
                    options={[
                      { value: '10', label: '10 par page' },
                      { value: '25', label: '25 par page' },
                      { value: '50', label: '50 par page' },
                      { value: '100', label: '100 par page' },
                    ]}
                  />
                </div>
                <span className="text-stone-300">|</span>
                <span className="text-stone-500">
                  Lignes <strong className="text-stone-800">{totalItems > 0 ? indexOfFirstItem + 1 : 0}</strong> à <strong className="text-stone-800">{Math.min(indexOfLastItem, totalItems)}</strong> sur <strong className="text-stone-800">{totalItems}</strong>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setUserPage(1)}
                  disabled={userPage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                  title="Première page"
                >
                  «
                </button>
                <button
                  onClick={() => setUserPage(prev => Math.max(prev - 1, 1))}
                  disabled={userPage === 1}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                  title="Page précédente"
                >
                  ‹
                </button>

                <div className="px-3 py-1 bg-white border border-emerald-200 rounded-lg font-bold text-emerald-700 shadow-2xs">
                  Page {userPage} / {totalPages}
                </div>

                <button
                  onClick={() => setUserPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={userPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                  title="Page suivante"
                >
                  ›
                </button>
                <button
                  onClick={() => setUserPage(totalPages)}
                  disabled={userPage === totalPages}
                  className="p-1.5 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed text-stone-600 transition cursor-pointer"
                  title="Dernière page"
                >
                  »
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-br from-green-950 to-stone-900 text-white p-6 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-serif font-bold">
                  {editingUser ? 'Modifier l\'Utilisateur' : 'Créer un Nouvel Utilisateur'}
                </h3>
                <p className="text-xs text-green-200/80 mt-0.5">
                  Un email d'invitation avec les identifiants sera automatiquement émis.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-green-200 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600 uppercase block">Nom complet</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex. Paul Ndem"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600 uppercase block">Adresse Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="paul.ndem@citrine.cm"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-600 uppercase block">Rôle Système</label>
                  <SearchableSelect
                    value={role}
                    onChange={(val) => setRole(val as UserRole)}
                    options={[
                      { value: 'administrateur', label: 'Administrateur', description: 'Accès total à tous les modules' },
                      { value: 'responsable', label: 'Responsable', description: 'Gestion des équipes et pointages' },
                      { value: 'employé', label: 'Employé', description: 'Portail collaborateur personnel' }
                    ]}
                    placeholder="Choisir un rôle"
                    searchPlaceholder="Chercher un rôle..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-stone-600 uppercase block">Statut du compte</label>
                  <SearchableSelect
                    value={status}
                    onChange={(val) => setStatus(val as UserStatus)}
                    options={[
                      { value: 'actif', label: 'Actif (Connexion autorisée)', badgeColor: 'bg-emerald-100 text-emerald-800' },
                      { value: 'inactif', label: 'Inactif (Bloqué)', badgeColor: 'bg-stone-100 text-stone-600' }
                    ]}
                    placeholder="Statut"
                    searchPlaceholder="Chercher un statut..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-stone-600 uppercase block">Département / Service</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex. Direction Technique"
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-stone-600 uppercase block">
                    {editingUser ? 'Nouveau Mot de Passe (optionnel)' : 'Mot de Passe Provisoire'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPassword(generateStrongPassword(12))}
                    className="text-[11px] font-bold text-green-700 hover:text-green-800 flex items-center gap-1 cursor-pointer bg-green-50 px-2 py-0.5 rounded-lg border border-green-200 transition"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Générer un mot de passe</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? "Laisser vide pour conserver le mot de passe actuel" : "Générer ou saisir un mot de passe sécurisé"}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-medium text-stone-800 focus:bg-white focus:border-green-500 outline-none"
                />
                <p className="text-[10px] text-stone-400">
                  {editingUser 
                    ? "Laissez ce champ vide si vous ne souhaitez pas modifier le mot de passe actuel de l'utilisateur."
                    : "L'utilisateur pourra se connecter avec ce mot de passe et le modifier depuis son profil."}
                </p>
              </div>

              <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md shadow-green-600/20 transition cursor-pointer"
                >
                  {editingUser ? 'Enregistrer les modifications' : 'Créer et notifier l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal (In-App, No browser alert blocking) */}
      {userToDelete && (
        <div className="fixed inset-0 bg-stone-950/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 text-red-700 rounded-2xl shrink-0">
                <Trash2 className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Supprimer cet utilisateur ?</h3>
                <p className="text-xs text-stone-500">Cette action retirera définitivement les accès système de ce compte.</p>
              </div>
            </div>

            {/* Target User Summary Card */}
            <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 flex items-center gap-3">
              <img 
                src={userToDelete.avatarUrl || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100`} 
                alt={userToDelete.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-stone-200 shrink-0" 
              />
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-stone-900 truncate">{userToDelete.name}</div>
                <div className="text-[11px] text-stone-500 truncate">{userToDelete.email}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-stone-200 text-stone-700">
                    {userToDelete.role}
                  </span>
                  <span className="text-[10px] text-stone-500">
                    {userToDelete.department || 'Général'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-red-50/50 border border-red-100 p-3 rounded-xl">
              ⚠️ <strong>Attention :</strong> L'utilisateur ne pourra plus se connecter à l'application. Ses pointages passés resteront conservés dans l'historique d'audit RH.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition cursor-pointer flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'Suppression en cours...' : 'Supprimer définitivement'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
