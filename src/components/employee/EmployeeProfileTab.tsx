import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar, 
  ShieldCheck, 
  Pencil, 
  Clock, 
  CheckSquare, 
  Users,
  Building,
  Check,
  X,
  Lock
} from 'lucide-react';
import { Employee, AppUser, Presence, Task, AttendanceIncident } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { saveDocument, COLLECTIONS } from '../../services/dataService';
import { saveUser } from '../../services/userService';
import { storeSecureSession } from '../../services/sessionService';
import { ProfileSecuritySubTab } from '../profile/ProfileSecuritySubTab';

interface EmployeeProfileTabProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  presences: Presence[];
  tasks: Task[];
  incidents: AttendanceIncident[];
  calculateTenure: (hireDate?: string) => string;
  onOpenProfileModal?: () => void;
  onUpdateEmployee?: (updated: Employee) => void;
  onUpdateUser?: (updated: AppUser) => void;
}

export const EmployeeProfileTab: React.FC<EmployeeProfileTabProps> = ({
  employeeProfile,
  currentUser,
  presences,
  tasks,
  calculateTenure,
  onOpenProfileModal,
  onUpdateEmployee,
  onUpdateUser,
}) => {
  const systemRoleLabel = currentUser?.role 
    ? (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1))
    : (employeeProfile.roleType || 'Collaborateur');

  const myPresencesCount = presences.filter(p => p.employeeId === employeeProfile.id).length;
  const myPendingTasksCount = tasks.filter(t => t.assignedTo === employeeProfile.id && t.status !== 'completed').length;

  // Édition inline de la date de naissance
  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [draftBirthDate, setDraftBirthDate] = useState(employeeProfile.birthDate || currentUser?.birthDate || '');
  const [isSavingBirthDate, setIsSavingBirthDate] = useState(false);

  // Édition inline du numéro de téléphone
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [draftPhone, setDraftPhone] = useState(employeeProfile.phone || currentUser?.phone || '');
  const [isSavingPhone, setIsSavingPhone] = useState(false);

  // Panneau inline de changement de mot de passe
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Équipes
  const teamsList: string[] = Array.isArray(employeeProfile.teams) && employeeProfile.teams.length > 0
    ? employeeProfile.teams
    : (employeeProfile.team ? employeeProfile.team.split(',').map(t => t.trim()).filter(Boolean) : ['Équipe IT & Développement']);

  // Manager
  const managerDisplayName = employeeProfile.managerName || (employeeProfile.managerId ? `Responsable #${employeeProfile.managerId}` : 'Direction Générale');

  const calculateAge = (dateStr?: string) => {
    if (!dateStr) return null;
    const birth = new Date(dateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age > 0 ? `${age} ans` : null;
  };

  const handleSaveBirthDate = async () => {
    if (!draftBirthDate) return;
    setIsSavingBirthDate(true);
    try {
      const updatedEmp: Employee = {
        ...employeeProfile,
        birthDate: draftBirthDate,
      };
      await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);
      if (onUpdateEmployee) onUpdateEmployee(updatedEmp);

      if (currentUser) {
        const updatedUser: AppUser = {
          ...currentUser,
          birthDate: draftBirthDate,
        };
        await saveUser(updatedUser);
        await storeSecureSession(updatedUser).catch(() => {});
        if (onUpdateUser) onUpdateUser(updatedUser);
      }

      window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: updatedEmp }));
      setIsEditingBirthDate(false);
    } catch (err) {
      console.error('Erreur sauvegarde date de naissance:', err);
    } finally {
      setIsSavingBirthDate(false);
    }
  };

  const handleSavePhone = async () => {
    const trimmed = draftPhone.trim();
    if (!trimmed) return;
    setIsSavingPhone(true);
    try {
      const updatedEmp: Employee = {
        ...employeeProfile,
        phone: trimmed,
      };
      await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);
      if (onUpdateEmployee) onUpdateEmployee(updatedEmp);

      if (currentUser) {
        const updatedUser: AppUser = {
          ...currentUser,
          phone: trimmed,
        };
        await saveUser(updatedUser);
        await storeSecureSession(updatedUser).catch(() => {});
        if (onUpdateUser) onUpdateUser(updatedUser);
      }

      window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: updatedEmp }));
      setIsEditingPhone(false);
    } catch (err) {
      console.error('Erreur sauvegarde téléphone:', err);
    } finally {
      setIsSavingPhone(false);
    }
  };

  const currentBirthDate = employeeProfile.birthDate || currentUser?.birthDate;
  const currentPhone = employeeProfile.phone || currentUser?.phone || '';
  const ageDisplay = calculateAge(currentBirthDate);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Profile Header Card */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar connected user */}
          <div className="relative group shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden ring-4 ring-[#2A7B76]/20 shadow-md bg-stone-100 flex items-center justify-center">
              {employeeProfile.avatarUrl || currentUser?.avatarUrl ? (
                <img
                  src={employeeProfile.avatarUrl || currentUser?.avatarUrl}
                  alt={employeeProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#2A7B76] to-emerald-800 text-white flex items-center justify-center text-3xl font-serif font-black">
                  {employeeProfile.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white bg-emerald-500 shadow-xs" title="Profil connecté actif" />
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-2xl font-serif font-bold text-stone-800">
                {employeeProfile.name}
              </h2>
              <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                Compte Collaborateur Actif
              </span>
            </div>
            
            <p className="text-xs text-stone-500 font-medium">
              <strong className="text-stone-700">{employeeProfile.roleType || 'Collaborateur'}</strong> • {employeeProfile.department || 'Général'}
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1 text-xs">
              <span className="inline-flex items-center gap-1.5 text-stone-600 bg-stone-100 px-3 py-1 rounded-xl">
                <Mail className="h-3.5 w-3.5 text-[#2A7B76]" />
                {employeeProfile.email || currentUser?.email}
              </span>
              {employeeProfile.phone && (
                <span className="inline-flex items-center gap-1.5 text-stone-600 bg-stone-100 px-3 py-1 rounded-xl">
                  <Phone className="h-3.5 w-3.5 text-[#2A7B76]" />
                  {employeeProfile.phone}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <PWAInstallButton />
          {onOpenProfileModal && (
            <button
              onClick={onOpenProfileModal}
              className="shrink-0 bg-[#2A7B76] hover:bg-[#20615d] active:scale-98 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
            >
              <Pencil className="h-4 w-4 text-emerald-200" />
              <span>Modifier Mon Profil & Sécurité</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Coordonnées & Identité (avec Date de Naissance modifiable) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#2A7B76]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm">Identité & Date de Naissance</h3>
              <p className="text-[11px] text-stone-500">Coordonnées et état civil</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">Nom complet</span>
              <span className="font-semibold text-stone-800">{employeeProfile.name}</span>
            </div>

            {/* Date de Naissance avec modification */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-bold text-[11px] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-[#2A7B76]" />
                  Date de naissance
                </span>
                {!isEditingBirthDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftBirthDate(currentBirthDate || '');
                      setIsEditingBirthDate(true);
                    }}
                    className="text-[10px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Modifier</span>
                  </button>
                )}
              </div>

              {isEditingBirthDate ? (
                <div className="space-y-2 pt-1 animate-in fade-in">
                  <input
                    type="date"
                    value={draftBirthDate}
                    onChange={(e) => setDraftBirthDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-xs text-stone-900 outline-none focus:ring-2 focus:ring-[#2A7B76]"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingBirthDate(false)}
                      className="px-2.5 py-1 text-stone-500 hover:bg-stone-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={isSavingBirthDate}
                      onClick={handleSaveBirthDate}
                      className="px-3 py-1 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs"
                    >
                      <Check className="h-3 w-3" />
                      <span>{isSavingBirthDate ? 'Sauvegarde...' : 'Enregistrer'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 font-mono text-sm">
                    {currentBirthDate || 'Non renseignée'}
                  </span>
                  {ageDisplay && (
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {ageDisplay}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <span className="text-stone-400 block text-[11px]">Adresse e-mail professionnelle</span>
              <span className="font-semibold text-stone-800">{employeeProfile.email || currentUser?.email || 'N/A'}</span>
            </div>

            {/* Numéro de téléphone avec modification inline */}
            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/70 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-stone-500 font-bold text-[11px] flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-[#2A7B76]" />
                  Téléphone direct
                </span>
                {!isEditingPhone && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftPhone(currentPhone);
                      setIsEditingPhone(true);
                    }}
                    className="text-[10px] font-bold text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Modifier</span>
                  </button>
                )}
              </div>

              {isEditingPhone ? (
                <div className="space-y-2 pt-1 animate-in fade-in">
                  <input
                    type="tel"
                    value={draftPhone}
                    onChange={(e) => setDraftPhone(e.target.value)}
                    placeholder="+237 6XX XX XX XX"
                    className="w-full px-2.5 py-1.5 rounded-xl border border-stone-300 bg-white font-mono font-bold text-xs text-stone-900 outline-none focus:ring-2 focus:ring-[#2A7B76]"
                  />
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsEditingPhone(false)}
                      className="px-2.5 py-1 text-stone-500 hover:bg-stone-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={isSavingPhone || !draftPhone.trim()}
                      onClick={handleSavePhone}
                      className="px-3 py-1 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-3xs disabled:opacity-50"
                    >
                      <Check className="h-3 w-3" />
                      <span>{isSavingPhone ? 'Sauvegarde...' : 'Enregistrer'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <span className="font-bold text-stone-900 font-mono text-sm block">
                  {currentPhone || 'Non renseigné'}
                </span>
              )}
            </div>

            <div>
              <span className="text-stone-400 block text-[11px]">Matricule / Identifiant</span>
              <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                {employeeProfile.id}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Poste, Hiérarchie & Équipes de Rattachement */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm">Poste & Organisation</h3>
              <p className="text-[11px] text-stone-500">Rattachements et hiérarchie</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            {/* Supérieur Hiérarchique Direct */}
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200/70">
              <span className="text-amber-800 font-bold text-[10px] uppercase block tracking-wider">
                👔 Supérieur Hiérarchique Direct
              </span>
              <strong className="text-stone-900 text-sm block mt-0.5">
                {managerDisplayName}
              </strong>
              <span className="text-[10px] text-stone-500">
                Responsable de validation des tâches et permissions
              </span>
            </div>

            {/* Équipes de Rattachement multiples */}
            <div>
              <span className="text-stone-400 block text-[11px] mb-1 flex items-center gap-1 font-bold">
                <Users className="h-3.5 w-3.5 text-[#2A7B76]" />
                Équipe(s) de rattachement ({teamsList.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {teamsList.map((t, idx) => (
                  <span
                    key={idx}
                    className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-xl shadow-3xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-stone-400 block text-[11px]">Fonction / Intitulé de poste</span>
              <span className="font-semibold text-stone-800">{employeeProfile.roleType || 'Collaborateur'}</span>
            </div>

            <div>
              <span className="text-stone-400 block text-[11px]">Département / Direction</span>
              <span className="font-semibold text-stone-800">{employeeProfile.department || 'Général'}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-stone-100">
              <div>
                <span className="text-stone-400 block text-[11px]">Prise de fonction</span>
                <span className="font-semibold text-stone-800">{employeeProfile.hireDate || '2023-01-15'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Ancienneté</span>
                <span className="font-semibold text-stone-800">{calculateTenure(employeeProfile.hireDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Rôle d'Accès Système & Statistiques */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm">Rôles & Accès Système</h3>
              <p className="text-[11px] text-stone-500">Statut de sécurité et indicateurs</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">Rôle Système</span>
              <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-3 py-1 rounded-xl inline-block mt-0.5">
                {systemRoleLabel}
              </span>
            </div>

            <div>
              <span className="text-stone-400 block text-[11px]">Statut Contractuel</span>
              <span className="font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg inline-block mt-0.5">
                {String(employeeProfile.status || 'Actif').replace(/_/g, ' ')}
              </span>
            </div>

            <div className="pt-2 border-t border-stone-100 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
                <Clock className="h-4 w-4 text-[#2A7B76] mx-auto mb-1" />
                <span className="text-base font-bold text-stone-800 block">{myPresencesCount}</span>
                <span className="text-[10px] text-stone-500">Pointages récents</span>
              </div>

              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-100 text-center">
                <CheckSquare className="h-4 w-4 text-amber-600 mx-auto mb-1" />
                <span className="text-base font-bold text-stone-800 block">{myPendingTasksCount}</span>
                <span className="text-[10px] text-stone-500">Tâches assignées</span>
              </div>
            </div>

            {currentUser && (
              <div className="pt-3 border-t border-stone-100 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowPasswordForm((prev) => !prev)}
                  className="w-full py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="h-3.5 w-3.5 text-[#2A7B76]" />
                  <span>{showPasswordForm ? 'Masquer le formulaire' : 'Modifier mon mot de passe'}</span>
                </button>
                {showPasswordForm && (
                  <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/80">
                    <ProfileSecuritySubTab
                      currentUser={currentUser}
                      onUpdateUser={onUpdateUser}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
