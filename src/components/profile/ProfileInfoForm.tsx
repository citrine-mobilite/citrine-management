import React from 'react';
import { User, Mail, Building, Smartphone, Calendar } from 'lucide-react';

interface ProfileInfoFormProps {
  name: string;
  setName: (v: string) => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  ageText: string | null;
  phone: string;
  setPhone: (v: string) => void;
  department: string;
  setDepartment: (v: string) => void;
  email: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

export const ProfileInfoForm: React.FC<ProfileInfoFormProps> = ({
  name,
  setName,
  birthDate,
  setBirthDate,
  ageText,
  phone,
  setPhone,
  department,
  setDepartment,
  email,
  loading,
  onSubmit,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">Nom complet *</label>
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
          <input
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 font-mono font-bold focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#2A7B76] text-xs"
            title="Sélectionnez votre date de naissance"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">Numéro de téléphone</label>
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

        <div>
          <label className="block text-xs font-bold text-stone-700 mb-1.5">Département / Direction</label>
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

        <div className="sm:col-span-2">
          <label className="block text-xs font-bold text-stone-700 mb-1.5">Email professionnel (Lecture seule)</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
              <Mail className="w-4 h-4" />
            </span>
            <input
              type="email"
              disabled
              value={email}
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
  );
};
