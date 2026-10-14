import React, { useState, useEffect } from 'react';
import { X, User, Mail, Lock, Building, Sparkles, UserCheck, UserPlus, Shield } from 'lucide-react';
import { AppUser, UserRole, UserStatus, EmployeeStatus } from '../../types';
import { generateStrongPassword } from '../../utils/cryptoUtils';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingUser: AppUser | null;
  onSave: (data: {
    name: string;
    email: string;
    role: UserRole;
    status: UserStatus;
    employmentStatus: EmployeeStatus;
    department: string;
    password?: string;
  }) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  editingUser,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('employé');
  const [status, setStatus] = useState<UserStatus>('actif');
  const [employmentStatus, setEmploymentStatus] = useState<EmployeeStatus>('en_poste');
  const [department, setDepartment] = useState('');
  const [password, setPassword] = useState('');

  // Synchronise toujours les champs dès que editingUser change ou que le modal s'ouvre
  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name || '');
      setEmail(editingUser.email || '');
      setRole(editingUser.role || 'employé');
      setStatus(editingUser.status || 'actif');
      setEmploymentStatus(editingUser.employmentStatus || (editingUser.status === 'inactif' ? 'suspendu' : 'en_poste'));
      setDepartment(editingUser.department || '');
      setPassword('');
    } else {
      setName('');
      setEmail('');
      setRole('employé');
      setStatus('actif');
      setEmploymentStatus('en_poste');
      setDepartment('');
      setPassword('');
    }
  }, [editingUser, isOpen]);

  if (!isOpen) return null;

  const handleEmploymentStatusChange = (newStatus: EmployeeStatus) => {
    setEmploymentStatus(newStatus);
    if (newStatus === 'renvoye' || newStatus === 'demissionne' || newStatus === 'suspendu' || newStatus === 'parti') {
      setStatus('inactif');
    } else {
      setStatus('actif');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email, role, status, employmentStatus, department, password });
  };

  const isEditing = Boolean(editingUser);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* En-tête avec distinction visuelle claire Création vs Modification */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isEditing 
            ? 'bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-950'
            : 'bg-gradient-to-r from-emerald-700 via-[#2A7B76] to-[#1d5754]'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-xs shrink-0">
              {isEditing ? (
                <UserCheck className="h-5 w-5 text-emerald-200" />
              ) : (
                <UserPlus className="h-5 w-5 text-emerald-200" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm sm:text-base truncate">
                  {isEditing ? `Modifier l'utilisateur : ${editingUser?.name || ''}` : 'Créer un nouvel utilisateur'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                  isEditing ? 'bg-amber-400/20 text-amber-200 border border-amber-300/30' : 'bg-emerald-400/20 text-emerald-200 border border-emerald-300/30'
                }`}>
                  {isEditing ? 'Édition Utilisateur' : 'Nouveau Compte'}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80 truncate">
                {isEditing ? `Mise à jour des droits et informations de ${editingUser?.name || 'cet utilisateur'}` : 'Renseignez les accès et le rôle du collaborateur'}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 hover:bg-white/20 rounded-xl transition cursor-pointer text-white/80 hover:text-white shrink-0 ml-2"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="font-bold text-stone-700 block mb-1">Nom complet *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Jean Dupont"
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] text-stone-900 font-medium"
            />
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">
              Adresse Email (identifiant de connexion) *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isEditing}
              placeholder="Ex: jean.dupont@citrine.cm"
              className={`w-full px-3.5 py-2.5 border rounded-xl text-stone-900 font-medium ${
                isEditing 
                  ? 'bg-stone-100 border-stone-200 cursor-not-allowed opacity-80' 
                  : 'bg-stone-50 border-stone-200 focus:outline-none focus:border-[#2A7B76]'
              }`}
            />
            {isEditing && (
              <span className="text-[10px] text-stone-400 mt-1 block">
                L'adresse email est l'identifiant unique de connexion et ne peut pas être modifiée.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-stone-700 block mb-1">Rôle d'accès *</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] text-stone-800 font-medium cursor-pointer"
              >
                <option value="employé">Employé (Espace personnel)</option>
                <option value="responsable">Responsable (Gestion d'équipe)</option>
                <option value="administrateur">Administrateur (Contrôle total)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Situation RH / Contrat *</label>
              <select
                value={employmentStatus}
                onChange={(e) => handleEmploymentStatusChange(e.target.value as EmployeeStatus)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] text-stone-800 font-medium cursor-pointer"
              >
                <option value="en_poste">En poste (Actif)</option>
                <option value="en_conge">En congés</option>
                <option value="en_permission">En permission</option>
                <option value="maladie">Arrêt maladie</option>
                <option value="suspendu">Suspendu</option>
                <option value="demissionne">Démissionné</option>
                <option value="renvoye">Renvoyé / Licencié</option>
                <option value="parti">Départ entreprise</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-stone-700 block mb-1">Statut du compte *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] text-stone-800 font-medium cursor-pointer"
              >
                <option value="actif">Actif (autorisé)</option>
                <option value="inactif">Inactif (bloqué)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-stone-700 block mb-1">Département d'affectation</label>
            <input
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Ex: Informatique, Exploitation Japoma, RH, Direction..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] text-stone-800"
            />
          </div>

          <div className={`p-3.5 rounded-2xl border ${
            isEditing 
              ? 'bg-amber-50/50 border-amber-200/80' 
              : 'bg-stone-50 border-stone-200'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-stone-700">
                {isEditing 
                  ? 'Réinitialiser le mot de passe (optionnel)' 
                  : 'Mot de passe initial *'}
              </label>
              <button
                type="button"
                onClick={() => setPassword(generateStrongPassword())}
                className="text-[10px] text-[#2A7B76] hover:underline flex items-center gap-1 cursor-pointer font-bold"
              >
                <Sparkles className="h-3 w-3" /> Générer un mot de passe
              </button>
            </div>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={!isEditing}
              placeholder={isEditing ? 'Laissez vide pour conserver le mot de passe actuel' : 'Minimum 6 caractères'}
              className="w-full px-3.5 py-2 bg-white border border-stone-200 rounded-xl focus:outline-none focus:border-[#2A7B76] font-mono text-xs"
            />
            {isEditing && (
              <span className="text-[10px] text-amber-800 mt-1 block">
                ℹ️ Si ce champ reste vide, le mot de passe actuel de l'utilisateur ne sera pas modifié.
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2"
            >
              {isEditing ? (
                <>
                  <UserCheck className="h-4 w-4" />
                  <span>Enregistrer les modifications</span>
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  <span>Créer le compte utilisateur</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
