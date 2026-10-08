import React from 'react';
import { Edit3, Trash2, Shield, User } from 'lucide-react';
import { AppUser } from '../../types';

interface UserTableItemRowProps {
  user: AppUser;
  currentUserId: string;
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
}

export const UserTableItemRow: React.FC<UserTableItemRowProps> = ({
  user,
  currentUserId,
  onEdit,
  onDelete,
}) => {
  const isSelf = user.id === currentUserId;

  return (
    <tr className="hover:bg-stone-50/70 transition">
      <td className="py-3.5 px-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#2A7B76]/10 text-[#2A7B76] flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden border border-[#2A7B76]/20">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span>{user.name.slice(0, 2).toUpperCase()}</span>
            )}
          </div>
          <div>
            <div className="font-bold text-stone-900 flex items-center gap-1.5">
              <span>{user.name}</span>
              {isSelf && (
                <span className="text-[9px] bg-stone-100 text-stone-600 px-1.5 py-0.2 rounded font-mono">
                  (Vous)
                </span>
              )}
            </div>
            <div className="text-[10px] text-stone-400">{user.email}</div>
          </div>
        </div>
      </td>

      <td className="py-3.5 px-4">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
            user.role === 'administrateur'
              ? 'bg-purple-100 text-purple-800'
              : user.role === 'responsable'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-emerald-100 text-emerald-800'
          }`}
        >
          {user.role}
        </span>
      </td>

      <td className="py-3.5 px-4 text-stone-600">{user.department || 'Général'}</td>

      <td className="py-3.5 px-4">
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            user.status === 'actif'
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-stone-100 text-stone-500'
          }`}
        >
          {user.status}
        </span>
      </td>

      <td className="py-3.5 px-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onEdit(user)}
            className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition cursor-pointer"
            title="Modifier"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          {!isSelf && (
            <button
              onClick={() => onDelete(user)}
              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition cursor-pointer"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
