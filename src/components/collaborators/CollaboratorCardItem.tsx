import React from 'react';
import { Mail, Phone, Briefcase, Trash2, Pencil } from 'lucide-react';
import { Employee } from '../../types';

interface CollaboratorCardItemProps {
  employee: Employee;
  onDelete: (id: string) => void;
  onEdit: (employee: Employee) => void;
}

export const CollaboratorCardItem: React.FC<CollaboratorCardItemProps> = ({ employee, onDelete, onEdit }) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md transition flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-[#2A7B76] text-white flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden shadow-2xs">
          {employee.avatarUrl ? (
            <img src={employee.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{employee.name.slice(0, 2).toUpperCase()}</span>
          )}
        </div>

        <div className="min-w-0">
          <h4 className="font-bold text-xs text-stone-900 truncate">{employee.name}</h4>
          <p className="text-[10px] text-stone-500 font-bold uppercase tracking-wide truncate">
            {employee.roleType || 'Employé'} • {employee.department || 'Général'}
          </p>
          <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
            <div className="flex items-center gap-1 truncate">
              <Phone className="h-3 w-3 text-stone-400" />
              <span>{employee.phone || 'Non renseigné'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onEdit(employee)}
          className="p-2 text-stone-400 hover:text-[#2A7B76] hover:bg-emerald-50 rounded-xl transition cursor-pointer shrink-0"
          title="Modifier le collaborateur"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(employee.id)}
          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
          title="Supprimer"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
