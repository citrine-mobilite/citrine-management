import React, { useState, useEffect } from 'react';
import { User, Mail, Building, Smartphone, CheckCircle2, Camera, Calendar, Shield, Users, Briefcase } from 'lucide-react';
import { AppUser, Employee } from '../../types';
import { saveUser } from '../../services/userService';
import { saveDocument, getCollection, COLLECTIONS } from '../../services/dataService';
import { storeSecureSession } from '../../services/sessionService';
import { CollaboratorAvatarPickerModal } from '../collaborators/CollaboratorAvatarPickerModal';
import { generateUuidV4 } from '../../services/employeeService';

interface ProfileInfoSubTabProps {
  currentUser: AppUser;
  onAddNotification: (notif: any) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  onUpdateUser?: (updated: AppUser) => void;
}

export const ProfileInfoSubTab: React.FC<ProfileInfoSubTabProps> = ({
  currentUser,
  onAddNotification,
  showToast,
  onUpdateUser,
}) => {
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department || '');
  const [phone, setPhone] = useState(currentUser.phone || '+237 699 00 00 00');
  const [birthDate, setBirthDate] = useState(currentUser.birthDate || '');
  const [avatarUrl, setAvatarUrl] = useState(currentUser.avatarUrl || '');
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Informations étendues du collaborateur (Hiérarchie, Équipes, etc.)
  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [managerName, setManagerName] = useState<string>('Direction Générale');
  const [assignedTeams, setAssignedTeams] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    const fetchEmployeeDetails = async () => {
      try {
        const empList: Employee[] = await getCollection(COLLECTIONS.EMPLOYEES);
        if (!isMounted || !Array.isArray(empList)) return;

        const myEmp = empList.find(
          (e) =>
            (currentUser.employeeId && e.id === currentUser.employeeId) ||
            (currentUser.email && e.email && e.email.toLowerCase() === currentUser.email.toLowerCase()) ||
            e.id === currentUser.id
        );

        if (myEmp) {
          setEmployeeData(myEmp);
          if (!currentUser.birthDate && myEmp.birthDate) {
            setBirthDate(myEmp.birthDate);
          }
          if (myEmp.department && !currentUser.department) {
            setDepartment(myEmp.department);
          }
          if (myEmp.phone && (!currentUser.phone || currentUser.phone === '+237 699 00 00 00')) {
            setPhone(myEmp.phone);
          }

          // Équipes
          if (Array.isArray(myEmp.teams) && myEmp.teams.length > 0) {
            setAssignedTeams(myEmp.teams);
          } else if (myEmp.team) {
            setAssignedTeams(myEmp.team.split(',').map(t => t.trim()).filter(Boolean));
          } else if (currentUser.teams && currentUser.teams.length > 0) {
            setAssignedTeams(currentUser.teams);
          } else if (currentUser.team) {
            setAssignedTeams(currentUser.team.split(',').map(t => t.trim()).filter(Boolean));
          } else {
            setAssignedTeams(['Équipe IT & Développement']);
          }

          // Responsable
          if (myEmp.managerId) {
            const mgr = empList.find((m) => m.id === String(myEmp.managerId));
            setManagerName(mgr ? `${mgr.name} (${mgr.roleType || 'Responsable'})` : (myEmp.managerName || 'Direction Générale'));
          } else if (myEmp.managerName) {
            setManagerName(myEmp.managerName);
          } else if (currentUser.managerName) {
            setManagerName(currentUser.managerName);
          } else {
            setManagerName('Direction Générale');
          }
        } else {
          if (currentUser.teams && currentUser.teams.length > 0) {
            setAssignedTeams(currentUser.teams);
          } else if (currentUser.team) {
            setAssignedTeams([currentUser.team]);
          } else {
            setAssignedTeams(['Équipe Principale']);
          }
          setManagerName(currentUser.managerName || 'Direction Générale');
        }
      } catch (err) {
        console.warn('Erreur chargement détails collaborateur:', err);
      }
    };

    fetchEmployeeDetails();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Formatage lisible de l'âge
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

  const handleAvatarChange = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    try {
      const updated: AppUser = {
        ...currentUser,
        name: name.trim(),
        department: department.trim(),
        phone: phone.trim(),
        birthDate: birthDate.trim() || undefined,
        avatarUrl: newUrl.trim(),
      };
      await saveUser(updated);

      try {
        const empItem: Employee = {
          ...(employeeData || {}),
          id: employeeData?.id || currentUser.employeeId || currentUser.id || `emp-${Date.now()}`,
          uid: employeeData?.uid || generateUuidV4(),
          name: name.trim(),
          email: currentUser.email,
          roleType: employeeData?.roleType || currentUser.role || 'employé',
          department: department.trim(),
          phone: phone.trim(),
          birthDate: birthDate.trim() || undefined,
          avatarUrl: newUrl.trim(),
          team: assignedTeams.join(', '),
          teams: assignedTeams,
          managerId: employeeData?.managerId || currentUser.managerId || undefined,
          managerName,
          status: employeeData?.status || 'en_poste',
          employmentStatus: employeeData?.employmentStatus || 'en_poste',
          hireDate: employeeData?.hireDate || new Date().toISOString().split('T')[0],
        };
        await saveDocument(COLLECTIONS.EMPLOYEES, empItem);
        setEmployeeData(empItem);
        window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: empItem }));
      } catch (err) {
        console.warn('Could not sync employee record to DB:', err);
      }

      showToast?.("Photo de profil mise à jour avec succès", 'success');
      onAddNotification({
        id: 'notif-avatar-' + Date.now(),
        type: 'system',
        recipient: currentUser.email,
        title: "Modification de l'avatar",
        content: `La photo de profil de ${name} a été modifiée avec succès.`,
        timestamp: new Date().toISOString(),
      });
      await storeSecureSession(updated).catch(() => {});
      onUpdateUser?.(updated);
    } catch (err) {
      console.error('Error saving avatar:', err);
      showToast?.("Erreur lors de la mise à jour de l'avatar", 'error');
    }
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo(null);
    setError(null);
    setLoading(true);
    try {
      const updated: AppUser = {
        ...currentUser,
        name: name.trim(),
        department: department.trim(),
        phone: phone.trim(),
        birthDate: birthDate.trim() || undefined,
        avatarUrl: avatarUrl.trim(),
        team: assignedTeams.join(', '),
        teams: assignedTeams,
        managerName,
      };
      await saveUser(updated);

      try {
        const empItem: Employee = {
          ...(employeeData || {}),
          id: employeeData?.id || currentUser.employeeId || currentUser.id || `emp-${Date.now()}`,
          uid: employeeData?.uid || generateUuidV4(),
          name: name.trim(),
          email: currentUser.email,
          roleType: employeeData?.roleType || currentUser.role || 'employé',
          department: department.trim(),
          phone: phone.trim(),
          birthDate: birthDate.trim() || undefined,
          avatarUrl: avatarUrl.trim(),
          team: assignedTeams.join(', '),
          teams: assignedTeams,
          managerId: employeeData?.managerId || currentUser.managerId || undefined,
          managerName,
          status: employeeData?.status || 'en_poste',
          employmentStatus: employeeData?.employmentStatus || 'en_poste',
          hireDate: employeeData?.hireDate || new Date().toISOString().split('T')[0],
        };
        await saveDocument(COLLECTIONS.EMPLOYEES, empItem);
        setEmployeeData(empItem);
        window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: empItem }));
      } catch (err) {
        console.warn('Could not sync employee record to DB:', err);
      }

      setSuccessInfo('Informations personnelles et date de naissance mises à jour avec succès.');
      showToast?.('Profil mis à jour avec succès', 'success');
      onAddNotification({
        id: 'notif-prof-' + Date.now(),
        type: 'system',
        recipient: currentUser.email,
        title: 'Mise à jour du profil',
        content: `Le profil et la date de naissance de ${name} ont été mis à jour.`,
        timestamp: new Date().toISOString(),
      });
      await storeSecureSession(updated).catch(() => {});
      onUpdateUser?.(updated);
    } catch {
      setError('Erreur lors de l’enregistrement des modifications.');
      showToast?.('Erreur lors de la mise à jour du profil', 'error');
    } finally {
      setLoading(false);
    }
  };

  const ageText = calculateAge(birthDate);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 gap-3 mb-6">
          <div>
            <h2 className="text-xl font-serif font-bold text-stone-900 flex items-center gap-2">
              <User className="w-5 h-5 text-[#2A7B76]" />
              Mon Profil & Informations Collaborateur
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Consultez vos rattachements et modifiez vos informations personnelles (date de naissance, téléphone, avatar).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-xs rounded-full uppercase tracking-wider">
              {currentUser.role}
            </span>
            {employeeData?.roleType && employeeData.roleType !== currentUser.role && (
              <span className="px-3 py-1 bg-stone-100 text-stone-700 border border-stone-200 font-semibold text-xs rounded-full">
                {employeeData.roleType}
              </span>
            )}
          </div>
        </div>

        {successInfo && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{successInfo}</span>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs font-semibold">
            {error}
          </div>
        )}

        {/* 🌟 Bannière Récapitulative : Supérieur Hiérarchique, Équipes, Rôle */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-stone-50/80 rounded-2xl border border-stone-200/80 text-xs">
          {/* Supérieur hiérarchique */}
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200/60 shadow-3xs">
            <div className="p-2 rounded-lg bg-teal-50 text-[#2A7B76]">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Supérieur Hiérarchique Direct</span>
              <strong className="text-stone-800 text-xs block mt-0.5">{managerName}</strong>
              <span className="text-[10px] text-stone-500">Validation des congés & tâches</span>
            </div>
          </div>

          {/* Équipes de rattachement */}
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200/60 shadow-3xs">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] text-stone-400 font-bold uppercase block">
                Équipe(s) de Rattachement ({assignedTeams.length})
              </span>
              <div className="flex flex-wrap gap-1 mt-1">
                {assignedTeams.map((t, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Rôle & Statut */}
          <div className="flex items-start gap-3 p-3 bg-white rounded-xl border border-stone-200/60 shadow-3xs">
            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-stone-400 font-bold uppercase block">Rôle & Fonction</span>
              <strong className="text-stone-800 text-xs block mt-0.5 capitalize">{currentUser.role}</strong>
              <span className="text-[10px] text-stone-500">{employeeData?.department || department || 'Général'}</span>
            </div>
          </div>
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6 pb-6 border-b border-stone-100">
          <div className="relative group shrink-0">
            <div className="w-24 h-24 rounded-3xl overflow-hidden bg-stone-100 flex items-center justify-center text-[#2A7B76] font-bold text-3xl shadow-sm border-2 border-stone-200">
              {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
              ) : (
                name ? name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsAvatarPickerOpen(true)}
              className="absolute -bottom-1.5 -right-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white p-2 rounded-xl shadow-md transition cursor-pointer"
              title="Changer la photo de profil"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-1.5">
            <h3 className="text-lg font-bold text-stone-900">{name}</h3>
            <p className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#2A7B76]" /> {currentUser.email}
            </p>
            <p className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-1.5">
              <Building className="w-3.5 h-3.5 text-[#2A7B76]" /> {department || 'Direction Générale'}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setIsAvatarPickerOpen(true)}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                Changer la photo / avatar
              </button>
            </div>
          </div>
        </div>

        {/* Formulaire des Informations & Date de Naissance */}
        <form onSubmit={handleSaveInfo} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nom complet */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Nom complet *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76] text-xs"
                  placeholder="Votre nom complet"
                />
              </div>
            </div>

            {/* Date de naissance (MODIFIABLE PAR L'EMPLOYÉ) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#2A7B76]" />
                  Date de naissance (Modifiable) *
                </span>
                {ageText && (
                  <span className="text-[10px] font-mono font-bold text-[#2A7B76] bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                    {ageText}
                  </span>
                )}
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76] text-xs"
                  title="Sélectionnez votre date de naissance"
                />
              </div>
            </div>

            {/* Numéro de téléphone */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Numéro de téléphone
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Smartphone className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76] text-xs"
                  placeholder="+237 600 00 00 00"
                />
              </div>
            </div>

            {/* Département / Service */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Département / Direction
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Building className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-semibold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76] text-xs"
                  placeholder="Ex: Direction Générale, RH, IT"
                />
              </div>
            </div>

            {/* Email professionnel (Lecture seule) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                Email professionnel (Lecture seule)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  disabled
                  value={currentUser.email}
                  className="w-full pl-9 pr-3 py-2 bg-stone-100 border border-stone-200 rounded-xl text-stone-500 font-medium text-xs cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-stone-100">
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 text-xs flex items-center gap-2"
            >
              {loading ? 'Enregistrement...' : 'Enregistrer mon profil et ma date de naissance'}
            </button>
          </div>
        </form>
      </div>

      {isAvatarPickerOpen && (
        <CollaboratorAvatarPickerModal
          isOpen={isAvatarPickerOpen}
          currentAvatarUrl={avatarUrl}
          collaboratorName={name}
          onSelectAvatar={(url) => {
            setIsAvatarPickerOpen(false);
            handleAvatarChange(url);
          }}
          onClose={() => setIsAvatarPickerOpen(false)}
        />
      )}
    </div>
  );
};
