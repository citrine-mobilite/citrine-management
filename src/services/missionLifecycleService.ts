import { LeaveRequest, Employee, AppUser, NotificationLog } from '../types';
import { COLLECTIONS, saveDocument } from './dataService';
import { pushNotificationBridgeService } from './pushNotificationBridgeService';
import { logSystemAudit } from './adminAuditService';

/**
 * Service automatisé de gestion du cycle de vie des missions professionnelles :
 * - Active le statut "en_mission" dès le premier jour d'une mission approuvée.
 * - Bascule automatiquement la mission en "terminee" dès que la date de fin est dépassée.
 * - Rétablit automatiquement le collaborateur et son compte utilisateur en statut "en_poste".
 */
export async function syncMissionsAndEmployeeStatus(
  leaveRequests: LeaveRequest[],
  employees: Employee[],
  users: AppUser[],
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void,
  onUpdateEmployees?: (employees: Employee[]) => void,
  onUpdateUsers?: (users: AppUser[]) => void,
  onAddNotification?: (n: NotificationLog) => void
): Promise<{ updatedLeaves: LeaveRequest[]; updatedEmployees: Employee[]; updatedUsers: AppUser[] }> {
  if (!leaveRequests || !employees) {
    return { updatedLeaves: leaveRequests || [], updatedEmployees: employees || [], updatedUsers: users || [] };
  }

  const todayStr = new Date().toISOString().split('T')[0];
  let hasLeavesChanged = false;
  let hasEmployeesChanged = false;
  let hasUsersChanged = false;

  const currentLeaves = [...leaveRequests];
  const currentEmployees = [...employees];
  const currentUsers = [...(users || [])];

  for (let i = 0; i < currentLeaves.length; i++) {
    const leave = currentLeaves[i];

    // On traite uniquement les missions professionnelles
    if (leave.type !== 'mission_professionnelle') continue;

    const start = leave.approvedStartDate || leave.startDate;
    const end = leave.approvedEndDate || leave.endDate;

    const now = new Date();
    const currentHour = now.getHours();
    // Clôture automatique : date dépassée (todayStr > end) OU le jour même où la mission se termine après 17h/18h
    const isPastEnd = todayStr > end;
    const isSameDayEnded = todayStr === end && currentHour >= 18;

    // 1. CAS : MISSION TERMINÉE (Date dépassée ou fin de journée du jour de fin)
    if ((leave.status === 'approved' || leave.status === 'modified') && (isPastEnd || isSameDayEnded)) {
      console.log(`[MissionLifecycle] Mission ${leave.id} pour ${leave.employeeName} arrivée à terme (fin: ${end}). Clôture automatique...`);
      
      const finishedLeave: LeaveRequest = {
        ...leave,
        status: 'terminee',
        updatedAt: new Date().toISOString(),
      };
      currentLeaves[i] = finishedLeave;
      hasLeavesChanged = true;
      await saveDocument(COLLECTIONS.LEAVE_REQUESTS, finishedLeave);

      // Vérifier si l'employé a une autre mission en cours
      const hasOtherActiveMission = currentLeaves.some(
        (l) =>
          l.id !== leave.id &&
          l.employeeId === leave.employeeId &&
          l.type === 'mission_professionnelle' &&
          (l.status === 'approved' || l.status === 'modified') &&
          todayStr >= (l.approvedStartDate || l.startDate) &&
          todayStr <= (l.approvedEndDate || l.endDate)
      );

      if (!hasOtherActiveMission) {
        // Remettre l'employé en poste
        const empIdx = currentEmployees.findIndex((e) => String(e.id) === String(leave.employeeId));
        if (empIdx >= 0) {
          const emp = currentEmployees[empIdx];
          if (emp.employmentStatus === 'en_mission' || emp.status === 'en_mission') {
            const updatedEmp: Employee = {
              ...emp,
              employmentStatus: 'en_poste',
              status: 'en_poste',
              updatedAt: new Date().toISOString(),
            };
            currentEmployees[empIdx] = updatedEmp;
            hasEmployeesChanged = true;
            await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);

            // Rétablir aussi le compte utilisateur
            const userIdx = currentUsers.findIndex(
              (u) =>
                (emp.userId && String(u.id) === String(emp.userId)) ||
                (emp.email && u.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
                (u.employeeId && String(u.employeeId) === String(emp.id))
            );

            if (userIdx >= 0) {
              const u = currentUsers[userIdx];
              const updatedU: AppUser = {
                ...u,
                employmentStatus: 'en_poste',
              };
              currentUsers[userIdx] = updatedU;
              hasUsersChanged = true;
              await saveDocument(COLLECTIONS.USERS, updatedU);
            }

            // Notification Push & Log
            pushNotificationBridgeService.sendPush({
              title: `Mission Terminée : ${emp.name}`,
              message: `La mission professionnelle de ${emp.name} est officiellement terminée. Le collaborateur et son compte utilisateur ont été automatiquement replacés en statut « En poste ».`,
              senderName: 'Système RH Citrine',
              type: 'attendance',
              link: 'collaborators',
            });

            const notif: NotificationLog = {
              id: `notif-mission-end-${leave.id}-${Date.now()}`,
              type: 'system',
              recipient: 'Direction & Collaborateurs',
              title: `Fin de Mission : ${emp.name}`,
              content: `La mission de ${emp.name} (${start} au ${end}) a pris fin. Statut collaborateur et compte utilisateur basculés automatiquement à « En poste ».`,
              payload: JSON.stringify({
                source: 'mission_lifecycle',
                employeeId: emp.id,
                leaveId: leave.id,
                action: 'returned_to_post',
              }),
              timestamp: new Date().toISOString(),
              read: false,
            };

            if (onAddNotification) {
              onAddNotification(notif);
            } else {
              await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
            }

            logSystemAudit({
              authorName: 'Système Automatique RH',
              authorRole: 'admin',
              targetName: emp.name,
              targetEmployeeId: emp.id,
              operationType: 'status_change',
              operationLabel: 'Fin de Mission Automatique',
              details: `Mission ${leave.id} échue au ${end}. Statut collaborateur et compte utilisateur repassés à "en_poste".`,
              level: 'info',
            });
          }
        }
      }
    }

    // 2. CAS : MISSION EN COURS AUJOURD'HUI (Start <= todayStr <= End)
    else if ((leave.status === 'approved' || leave.status === 'modified') && todayStr >= start && todayStr <= end) {
      const empIdx = currentEmployees.findIndex((e) => String(e.id) === String(leave.employeeId));
      if (empIdx >= 0) {
        const emp = currentEmployees[empIdx];
        if (emp.employmentStatus !== 'en_mission') {
          console.log(`[MissionLifecycle] Activation du statut en_mission pour ${emp.name} (mission ${leave.id})...`);
          
          const updatedEmp: Employee = {
            ...emp,
            employmentStatus: 'en_mission',
            status: 'en_mission',
            updatedAt: new Date().toISOString(),
          };
          currentEmployees[empIdx] = updatedEmp;
          hasEmployeesChanged = true;
          await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);

          const userIdx = currentUsers.findIndex(
            (u) =>
              (emp.userId && String(u.id) === String(emp.userId)) ||
              (emp.email && u.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
              (u.employeeId && String(u.employeeId) === String(emp.id))
          );

          if (userIdx >= 0) {
            const u = currentUsers[userIdx];
            const updatedU: AppUser = {
              ...u,
              employmentStatus: 'en_mission',
            };
            currentUsers[userIdx] = updatedU;
            hasUsersChanged = true;
            await saveDocument(COLLECTIONS.USERS, updatedU);
          }
        }
      }
    }
  }

  if (hasLeavesChanged && onUpdateLeaveRequests) {
    onUpdateLeaveRequests(currentLeaves);
  }
  if (hasEmployeesChanged && onUpdateEmployees) {
    onUpdateEmployees(currentEmployees);
  }
  if (hasUsersChanged && onUpdateUsers) {
    onUpdateUsers(currentUsers);
  }

  return {
    updatedLeaves: currentLeaves,
    updatedEmployees: currentEmployees,
    updatedUsers: currentUsers,
  };
}

/**
 * Clôture manuelle immédiate d'une mission (par le manager ou l'employé) :
 * - Passe la mission à "terminee"
 * - Restaure le statut de l'employé à "en_poste"
 * - Restaure le compte utilisateur à "en_poste"
 * - Émet une notification push et log d'audit
 */
export async function terminateMission(
  leaveId: string,
  leaveRequests: LeaveRequest[],
  employees: Employee[],
  users: AppUser[],
  actorName: string = 'Responsable RH',
  onUpdateLeaveRequests?: (leaves: LeaveRequest[]) => void,
  onUpdateEmployees?: (employees: Employee[]) => void,
  onUpdateUsers?: (users: AppUser[]) => void,
  onAddNotification?: (n: NotificationLog) => void
): Promise<{ success: boolean; error?: string }> {
  try {
    const leaveIndex = leaveRequests.findIndex((l) => l.id === leaveId);
    if (leaveIndex < 0) {
      return { success: false, error: 'Mission introuvable.' };
    }

    const leave = leaveRequests[leaveIndex];
    const now = new Date().toISOString();

    const finishedLeave: LeaveRequest = {
      ...leave,
      status: 'terminee',
      updatedAt: now,
    };

    const updatedLeaves = [...leaveRequests];
    updatedLeaves[leaveIndex] = finishedLeave;
    await saveDocument(COLLECTIONS.LEAVE_REQUESTS, finishedLeave);
    if (onUpdateLeaveRequests) onUpdateLeaveRequests(updatedLeaves);

    // Vérifier si l'employé a une autre mission active
    const todayStr = now.split('T')[0];
    const hasOtherActiveMission = updatedLeaves.some(
      (l) =>
        l.id !== leave.id &&
        l.employeeId === leave.employeeId &&
        l.type === 'mission_professionnelle' &&
        (l.status === 'approved' || l.status === 'modified') &&
        todayStr >= (l.approvedStartDate || l.startDate) &&
        todayStr <= (l.approvedEndDate || l.endDate)
    );

    if (!hasOtherActiveMission) {
      const empIdx = employees.findIndex((e) => String(e.id) === String(leave.employeeId));
      if (empIdx >= 0) {
        const emp = employees[empIdx];
        const updatedEmp: Employee = {
          ...emp,
          employmentStatus: 'en_poste',
          status: 'en_poste',
          updatedAt: now,
        };
        const updatedEmps = [...employees];
        updatedEmps[empIdx] = updatedEmp;
        await saveDocument(COLLECTIONS.EMPLOYEES, updatedEmp);
        if (onUpdateEmployees) onUpdateEmployees(updatedEmps);

        // Utilisateur associé
        const userIdx = users.findIndex(
          (u) =>
            (emp.userId && String(u.id) === String(emp.userId)) ||
            (emp.email && u.email && u.email.toLowerCase() === emp.email.toLowerCase()) ||
            (u.employeeId && String(u.employeeId) === String(emp.id))
        );

        if (userIdx >= 0) {
          const u = users[userIdx];
          const updatedU: AppUser = {
            ...u,
            employmentStatus: 'en_poste',
          };
          const updatedUsers = [...users];
          updatedUsers[userIdx] = updatedU;
          await saveDocument(COLLECTIONS.USERS, updatedU);
          if (onUpdateUsers) onUpdateUsers(updatedUsers);
        }

        // Notification push
        pushNotificationBridgeService.sendPush({
          title: `Mission Clôturée : ${emp.name}`,
          message: `La mission professionnelle de ${emp.name} a été marquée comme terminée par ${actorName}. Statut remis à « En poste ».`,
          senderName: actorName,
          type: 'attendance',
          link: 'collaborators',
        });

        const notif: NotificationLog = {
          id: `notif-mission-term-${leave.id}-${Date.now()}`,
          type: 'system',
          recipient: emp.name || emp.email || 'Direction & Collaborateurs',
          title: `Mission Terminée : ${emp.name}`,
          content: `La mission (${leave.startDate} au ${leave.endDate}) a été clôturée. Le collaborateur et son compte sont repassés à « En poste ».`,
          payload: JSON.stringify({
            source: 'mission_lifecycle',
            employeeId: emp.id,
            leaveId: leave.id,
            action: 'returned_to_post',
            closedBy: actorName,
          }),
          timestamp: now,
          read: false,
        };

        if (onAddNotification) {
          onAddNotification(notif);
        } else {
          await saveDocument(COLLECTIONS.NOTIFICATIONS, notif);
        }

        logSystemAudit({
          authorName: actorName,
          authorRole: 'admin',
          targetName: emp.name,
          targetEmployeeId: emp.id,
          operationType: 'status_change',
          operationLabel: 'Clôture de Mission',
          details: `Mission ${leave.id} clôturée manuellement par ${actorName}. Statut collaborateur et compte utilisateur repassés à "en_poste".`,
          level: 'info',
        });
      }
    }

    return { success: true };
  } catch (err: any) {
    console.error('Erreur lors de la clôture de mission:', err);
    return { success: false, error: err?.message || 'Erreur lors de la clôture.' };
  }
}
