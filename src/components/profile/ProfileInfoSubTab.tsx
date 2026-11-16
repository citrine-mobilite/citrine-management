import React, { useState, useEffect } from 'react';
import { AppUser, Employee } from '../../types';
import { saveUser } from '../../services/userService';
import { saveDocument, COLLECTIONS } from '../../services/dataService';
import { storeSecureSession } from '../../services/sessionService';
import { CollaboratorAvatarPickerModal } from '../collaborators/CollaboratorAvatarPickerModal';
import { executeOperationWithLoading } from '../../utils/sweetAlert';
import {
  calculateAge,
  fetchResolvedEmployeeDetails,
  buildEmployeeSyncPayload,
} from './profileInfoHelpers';
import { ProfileSummaryBanner } from './ProfileSummaryBanner';
import { ProfileInfoForm } from './ProfileInfoForm';

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

  const [employeeData, setEmployeeData] = useState<Employee | null>(null);
  const [managerName, setManagerName] = useState<string>('Direction Générale');
  const [assignedTeams, setAssignedTeams] = useState<string[]>([]);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const details = await fetchResolvedEmployeeDetails(currentUser);
        if (!isMounted) return;
        if (details.employeeData) setEmployeeData(details.employeeData);
        if (details.birthDate) setBirthDate(details.birthDate);
        if (details.department) setDepartment(details.department);
        if (details.phone) setPhone(details.phone);
        setAssignedTeams(details.assignedTeams);
        setManagerName(details.managerName);
      } catch (err) {
        console.warn('Erreur chargement détails collaborateur:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  const syncEmployeeToDb = async (targetAvatar: string) => {
    try {
      const empItem = buildEmployeeSyncPayload({
        employeeData,
        currentUser,
        name,
        department,
        phone,
        birthDate,
        avatarUrl: targetAvatar,
        assignedTeams,
        managerName,
      });
      await saveDocument(COLLECTIONS.EMPLOYEES, empItem);
      setEmployeeData(empItem);
      window.dispatchEvent(new CustomEvent('citrine:employee_updated', { detail: empItem }));
    } catch (err) {
      console.warn('Could not sync employee record to DB:', err);
    }
  };

  const handleAvatarChange = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    await executeOperationWithLoading({
      loadingTitle: "Mise à jour de l'avatar...",
      loadingText: 'Enregistrement de votre photo de profil, veuillez patienter...',
      action: async () => {
        const updated: AppUser = {
          ...currentUser,
          name: name.trim(),
          department: department.trim(),
          phone: phone.trim(),
          birthDate: birthDate.trim() || undefined,
          avatarUrl: newUrl.trim(),
        };
        await saveUser(updated);
        await syncEmployeeToDb(newUrl);

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
      },
      successTitle: 'Photo de profil mise à jour !',
      successMessage: 'Votre avatar a été enregistré avec succès.',
      errorMessage: "Erreur lors de la mise à jour de l'avatar.",
    });
  };

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessInfo(null);
    setError(null);
    setLoading(true);
    const res = await executeOperationWithLoading({
      loadingTitle: 'Enregistrement du profil...',
      loadingText: 'Mise à jour de vos informations personnelles, veuillez patienter...',
      action: async () => {
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
        await syncEmployeeToDb(avatarUrl);

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
      },
      successTitle: 'Profil mis à jour !',
      successMessage: 'Vos informations personnelles ont été enregistrées avec succès.',
      errorMessage: 'Erreur lors de l’enregistrement des modifications.',
    });
    if (res.success) {
      setSuccessInfo('Informations personnelles et date de naissance mises à jour avec succès.');
    } else {
      setError('Erreur lors de l’enregistrement des modifications.');
    }
    setLoading(false);
  };

  const ageText = calculateAge(birthDate);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl shadow-sm border border-stone-200 p-6 md:p-8">
        <ProfileSummaryBanner
          currentUser={currentUser}
          employeeData={employeeData}
          name={name}
          department={department}
          avatarUrl={avatarUrl}
          managerName={managerName}
          assignedTeams={assignedTeams}
          successInfo={successInfo}
          error={error}
          onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
        />

        <ProfileInfoForm
          name={name}
          setName={setName}
          birthDate={birthDate}
          setBirthDate={setBirthDate}
          ageText={ageText}
          phone={phone}
          setPhone={setPhone}
          department={department}
          setDepartment={setDepartment}
          email={currentUser.email}
          loading={loading}
          onSubmit={handleSaveInfo}
        />
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
