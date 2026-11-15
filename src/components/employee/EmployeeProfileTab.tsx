import React, { useState } from 'react';
import { Mail, Phone, Pencil } from 'lucide-react';
import { Employee, AppUser, Presence, Task, AttendanceIncident } from '../../types';
import { PWAInstallButton } from '../pwa/PWAInstallButton';
import { saveDocument, COLLECTIONS } from '../../services/dataService';
import { saveUser } from '../../services/userService';
import { storeSecureSession } from '../../services/sessionService';
import { ProfileIdentityCard } from './profile/ProfileIdentityCard';
import { ProfileOrgAndSecurityCards } from './profile/ProfileOrgAndSecurityCards';

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
    ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)
    : employeeProfile.roleType || 'Collaborateur';

  const myPresencesCount = presences.filter((p) => p.employeeId === employeeProfile.id).length;
  const myPendingTasksCount = tasks.filter(
    (t) => t.assignedTo === employeeProfile.id && t.status !== 'completed'
  ).length;

  const [isEditingBirthDate, setIsEditingBirthDate] = useState(false);
  const [draftBirthDate, setDraftBirthDate] = useState(
    employeeProfile.birthDate || currentUser?.birthDate || ''
  );
  const [isSavingBirthDate, setIsSavingBirthDate] = useState(false);

  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [draftPhone, setDraftPhone] = useState(
    employeeProfile.phone || currentUser?.phone || ''
  );
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  const teamsList: string[] =
    Array.isArray(employeeProfile.teams) && employeeProfile.teams.length > 0
      ? employeeProfile.teams
      : employeeProfile.team
        ? employeeProfile.team.split(',').map((t) => t.trim()).filter(Boolean)
        : ['Équipe IT & Développement'];

  const managerDisplayName =
    employeeProfile.managerName ||
    (employeeProfile.managerId ? `Responsable #${employeeProfile.managerId}` : 'Direction Générale');

  const calculateAge = (dateStr?: string) => {
    if (!dateStr) return null;
    const birth = new Date(dateStr);
    if (isNaN(birth.getTime())) return null;
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age > 0 ? `${age} ans` : null;
  };

  const handleSaveBirthDate = async () => {
    if (!draftBirthDate) return;
    setIsSavingBirthDate(true);
    try {
      const updatedEmp: Employee = { ...employeeProfile, birthDate: draftBirthDate };
      await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);
      if (onUpdateEmployee) onUpdateEmployee(updatedEmp);
      if (currentUser) {
        const updatedUser: AppUser = { ...currentUser, birthDate: draftBirthDate };
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
      const updatedEmp: Employee = { ...employeeProfile, phone: trimmed };
      await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);
      if (onUpdateEmployee) onUpdateEmployee(updatedEmp);
      if (currentUser) {
        const updatedUser: AppUser = { ...currentUser, phone: trimmed };
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
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ProfileIdentityCard
          employeeProfile={employeeProfile}
          currentUser={currentUser}
          currentBirthDate={currentBirthDate}
          ageDisplay={ageDisplay}
          isEditingBirthDate={isEditingBirthDate}
          setIsEditingBirthDate={setIsEditingBirthDate}
          draftBirthDate={draftBirthDate}
          setDraftBirthDate={setDraftBirthDate}
          isSavingBirthDate={isSavingBirthDate}
          onSaveBirthDate={handleSaveBirthDate}
          currentPhone={currentPhone}
          isEditingPhone={isEditingPhone}
          setIsEditingPhone={setIsEditingPhone}
          draftPhone={draftPhone}
          setDraftPhone={setDraftPhone}
          isSavingPhone={isSavingPhone}
          onSavePhone={handleSavePhone}
        />

        <ProfileOrgAndSecurityCards
          employeeProfile={employeeProfile}
          currentUser={currentUser}
          managerDisplayName={managerDisplayName}
          teamsList={teamsList}
          calculateTenure={calculateTenure}
          systemRoleLabel={systemRoleLabel}
          myPresencesCount={myPresencesCount}
          myPendingTasksCount={myPendingTasksCount}
          showPasswordForm={showPasswordForm}
          setShowPasswordForm={setShowPasswordForm}
          onUpdateUser={onUpdateUser}
        />
      </div>
    </div>
  );
};
