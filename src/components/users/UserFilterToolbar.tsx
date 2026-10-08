import React from 'react';
import { Search, Plus } from 'lucide-react';
import { SearchableSelect } from '../common/SearchableSelect';

interface UserFilterToolbarProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  onOpenNewUser: () => void;
}

export const UserFilterToolbar: React.FC<UserFilterToolbarProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  onOpenNewUser,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-3xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="h-3.5 w-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher par nom ou email..."
          className="w-full pl-8 pr-3 py-1.5 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="w-36">
          <SearchableSelect
            value={roleFilter}
            onChange={(val) => setRoleFilter(String(val))}
            options={[
              { value: 'all', label: 'Tous rôles' },
              { value: 'administrateur', label: 'Administrateur' },
              { value: 'responsable', label: 'Responsable' },
              { value: 'employé', label: 'Employé' },
            ]}
            triggerClassName="py-1 px-2.5 text-xs h-8"
          />
        </div>

        <div className="w-32">
          <SearchableSelect
            value={statusFilter}
            onChange={(val) => setStatusFilter(String(val))}
            options={[
              { value: 'all', label: 'Tous statuts' },
              { value: 'actif', label: 'Actifs' },
              { value: 'inactif', label: 'Inactifs' },
            ]}
            triggerClassName="py-1 px-2.5 text-xs h-8"
          />
        </div>

        <button
          onClick={onOpenNewUser}
          className="px-3.5 py-1.5 bg-[#2A7B76] hover:bg-[#20635F] text-white font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
        >
          <Plus className="h-4 w-4" />
          <span>Nouvel Utilisateur</span>
        </button>
      </div>
    </div>
  );
};
