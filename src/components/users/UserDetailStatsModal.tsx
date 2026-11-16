import React, { useMemo, useState } from 'react';
import { X, Mail, Phone, Building2, Shield, Calendar, UserCheck, Edit3 } from 'lucide-react';
import { AppUser, Employee, Presence, SalaryPayment, Task } from '../../types';
import { findMatchingEmployee } from '../../utils/roleUtils';
import { ModalPortal } from '../common/ModalPortal';
import { UserStatisticsSummaryPanel } from '../presence/statistics/UserStatisticsSummaryPanel';
import { computePresenceStatistics } from '../presence/statistics/statisticsCalculations';
import { EmployeeRendementDetailModal } from '../presence/statistics/EmployeeRendementDetailModal';
import { TaskSheetModal } from '../tasksheet/TaskSheetModal';

interface UserDetailStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: AppUser;
  employees: Employee[];
  presences: Presence[];
  tasks: Task[];
  salaryPayments?: SalaryPayment[];
  onEditUser?: (user: AppUser) => void;
}

export const UserDetailStatsModal: React.FC<UserDetailStatsModalProps> = ({
  isOpen,
  onClose,
  user,
  employees,
  presences,
  tasks,
  salaryPayments = [],
  onEditUser,
}) => {
  const [taskSheetState, setTaskSheetState] = useState<{
    employee: Employee;
    mode: 'day' | 'month' | 'year';
  } | null>(null);
  const [rendementModalEmployee, setRendementModalEmployee] = useState<Employee | null>(null);

  const linkedEmployee = useMemo(
    () => findMatchingEmployee(employees, user),
    [employees, user]
  );

  const modalAssiduite = useMemo(() => {
    if (!rendementModalEmployee) return 100;
    const res = computePresenceStatistics([rendementModalEmployee], presences, 'all');
    return res.statsByEmployee[0]?.assiduiteRate ?? 100;
  }, [rendementModalEmployee, presences]);

  if (!isOpen) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-[9990] bg-stone-900/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-stone-200 overflow-hidden my-auto">
          {/* Header */}
          <div className="p-5 sm:p-6 bg-stone-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-[#2A7B76] text-white flex items-center justify-center font-bold text-lg shrink-0 overflow-hidden border border-white/20">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span>{user.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-serif font-bold text-lg truncate">{user.name}</h2>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-emerald-200 capitalize">
                    {user.role}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      user.status === 'actif'
                        ? 'bg-emerald-500/20 text-emerald-200'
                        : 'bg-stone-700 text-stone-300'
                    }`}
                  >
                    {user.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-300 mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-emerald-300" />
                    {user.email}
                  </span>
                  {user.phone && (
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Phone className="h-3.5 w-3.5 text-emerald-300" />
                      {user.phone}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5 text-emerald-300" />
                    {user.department || 'Général'}
                  </span>
                  {linkedEmployee && (
                    <span className="inline-flex items-center gap-1 text-emerald-200 font-semibold">
                      <UserCheck className="h-3.5 w-3.5" />
                      Fiche RH : {linkedEmployee.name}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {onEditUser && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onEditUser(user);
                  }}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Modifier compte</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                title="Fermer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Account metadata strip */}
          <div className="px-5 sm:px-6 py-3 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-stone-600 shrink-0">
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-[#2A7B76]" />
              Rôle : <strong className="text-stone-900 capitalize">{user.role}</strong>
            </span>
            {user.createdAt && (
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                Créé le : <strong className="text-stone-900">{user.createdAt.split('T')[0]}</strong>
              </span>
            )}
            {linkedEmployee?.position && (
              <span>
                Poste : <strong className="text-stone-900">{linkedEmployee.position}</strong>
              </span>
            )}
          </div>

          {/* Stats Body */}
          <div className="p-5 sm:p-6 overflow-y-auto flex-1">
            <UserStatisticsSummaryPanel
              user={user}
              employee={linkedEmployee}
              employees={employees}
              presences={presences}
              tasks={tasks}
              salaryPayments={salaryPayments}
              onOpenTaskSheet={(targetEmp, mode) => setTaskSheetState({ employee: targetEmp, mode })}
              onOpenFullRendement={(targetEmp) => setRendementModalEmployee(targetEmp)}
            />
          </div>
        </div>
      </div>

      {taskSheetState && (
        <TaskSheetModal
          isOpen={Boolean(taskSheetState)}
          onClose={() => setTaskSheetState(null)}
          employee={taskSheetState.employee}
          allTasks={tasks}
          presences={presences}
          defaultMode={taskSheetState.mode}
          currentUser={user}
          currentRole={user.role}
        />
      )}

      {rendementModalEmployee && (
        <EmployeeRendementDetailModal
          isOpen={Boolean(rendementModalEmployee)}
          onClose={() => setRendementModalEmployee(null)}
          employee={rendementModalEmployee}
          tasks={tasks}
          assiduiteRate={modalAssiduite}
        />
      )}
    </ModalPortal>
  );
};

export default UserDetailStatsModal;
