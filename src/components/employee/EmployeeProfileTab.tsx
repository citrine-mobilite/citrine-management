import React from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Briefcase, 
  Calendar, 
  Award, 
  ShieldCheck, 
  Pencil, 
  Clock, 
  CheckSquare, 
  AlertTriangle, 
  CreditCard,
  Building2,
  DollarSign
} from 'lucide-react';
import { Employee, AppUser, Presence, Task, AttendanceIncident } from '../../types';

interface EmployeeProfileTabProps {
  employeeProfile: Employee;
  currentUser?: AppUser | null;
  presences: Presence[];
  tasks: Task[];
  incidents: AttendanceIncident[];
  calculateTenure: (hireDate?: string) => string;
  onOpenProfileModal?: () => void;
}

export const EmployeeProfileTab: React.FC<EmployeeProfileTabProps> = ({
  employeeProfile,
  currentUser,
  presences,
  tasks,
  incidents,
  calculateTenure,
  onOpenProfileModal,
}) => {
  const systemRoleLabel = currentUser?.role 
    ? (currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1))
    : 'Collaborateur';

  const myPresencesCount = presences.filter(p => p.employeeId === employeeProfile.id || p.employeeName === employeeProfile.name).length;
  const myPendingTasksCount = tasks.filter(t => t.assignedTo === employeeProfile.id && t.status !== 'completed').length;
  const myIncidentsCount = incidents.filter(i => i.employeeId === employeeProfile.id).length;

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
                Compte Collaborateur Connecté
              </span>
            </div>
            
            <p className="text-xs text-stone-500 font-medium">
              {employeeProfile.roleType || 'Collaborateur'} • {employeeProfile.department || 'Général'}
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

      {/* Grid Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Coordonnées & Identité */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#2A7B76]">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm">Identité & Contacts</h3>
              <p className="text-[11px] text-stone-500">Coordonnées du collaborateur</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">Nom complet</span>
              <span className="font-semibold text-stone-800">{employeeProfile.name}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Adresse e-mail professionnelle</span>
              <span className="font-semibold text-stone-800">{employeeProfile.email || currentUser?.email || 'N/A'}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Téléphone direct</span>
              <span className="font-semibold text-stone-800">{employeeProfile.phone || 'Non renseigné'}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Matricule / Identifiant</span>
              <span className="font-mono font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                {employeeProfile.id}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Poste & Carrière */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm">Poste & Entreprise</h3>
              <p className="text-[11px] text-stone-500">Informations contractuelles</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">Intitulé de poste</span>
              <span className="font-semibold text-stone-800">{employeeProfile.roleType || 'Collaborateur'}</span>
            </div>
            <div>
              <span className="text-stone-400 block text-[11px]">Département / Unité</span>
              <span className="font-semibold text-stone-800">{employeeProfile.department || 'Général'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-stone-400 block text-[11px]">Prise de fonction</span>
                <span className="font-semibold text-stone-800">{employeeProfile.hireDate || '2023-01-15'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[11px]">Ancienneté</span>
                <span className="font-semibold text-stone-800">{calculateTenure(employeeProfile.hireDate)}</span>
              </div>
            </div>
            {employeeProfile.salary ? (
              <div>
                <span className="text-stone-400 block text-[11px]">Salaire contractuel de base</span>
                <span className="font-semibold text-stone-800 font-mono">
                  {employeeProfile.salary.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            ) : null}
          </div>
        </div>

        {/* Card 3: Accès Système & Statistiques */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-200 space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-stone-100">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-800 text-sm">Accès & Résumé d'Activité</h3>
              <p className="text-[11px] text-stone-500">Statut système & indicateurs</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-stone-400 block text-[11px]">Rôle d'Accès Système</span>
              <span className="font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-xl inline-block mt-0.5">
                {systemRoleLabel}
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
          </div>
        </div>

      </div>
    </div>
  );
};
