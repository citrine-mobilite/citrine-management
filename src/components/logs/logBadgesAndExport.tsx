import React from 'react';
import { AdminAccountOperation } from '../../services/adminAuditService';
import { NotificationLog } from '../../types';
import { exportToExcel } from '../../services/excelExportService';
import { LogSubTab, SessionLogItem } from './sessionLogsConstants';

export function getOperationBadge(type: AdminAccountOperation['operationType']) {
  switch (type) {
    case 'conge_permission':
      return <span className="bg-teal-100 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Congé / Permission</span>;
    case 'conseil_discipline':
      return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Conseil Discipline</span>;
    case 'feuille_avancement_taches':
    case 'feuille_de_temps':
      return <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md text-[10px] font-bold">TaskSheet</span>;
    case 'presence_pointage':
      return <span className="bg-cyan-100 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Pointage &amp; Présence</span>;
    case 'tache_projet':
      return <span className="bg-violet-100 text-violet-800 border border-violet-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Tâche / Projet</span>;
    case 'finance_frais':
      return <span className="bg-lime-100 text-lime-800 border border-lime-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Note de Frais</span>;
    case 'parametres_systeme':
      return <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold">Paramètres Entreprise</span>;
    case 'securite_connexion':
      return <span className="bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Sécurité &amp; Connexion</span>;
    case 'salary_update':
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Salaire &amp; Finance</span>;
    case 'creation':
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Création Compte</span>;
    case 'role_change':
      return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Changement Rôle</span>;
    case 'manager_change':
      return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Responsable</span>;
    case 'team_change':
      return <span className="bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Affectation Équipe</span>;
    case 'status_change':
      return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Statut / Suspension</span>;
    case 'password_reset':
      return <span className="bg-stone-200 text-stone-800 border border-stone-300 px-2 py-0.5 rounded-md text-[10px] font-bold">Mot de Passe</span>;
    case 'access_key_regenerated':
      return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-md text-[10px] font-bold">Clé 16 Caractères</span>;
    default:
      return <span className="bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Opération Système</span>;
  }
}

export function getLevelBadge(level?: string) {
  switch (level) {
    case 'success':
      return <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Succès</span>;
    case 'warning':
      return <span className="bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Alerte</span>;
    case 'error':
      return <span className="bg-rose-100 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Erreur</span>;
    default:
      return <span className="bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md text-[10px] font-bold">Info</span>;
  }
}

export function exportSystemLogsToExcel(
  activeSubTab: LogSubTab,
  sessionLogs: SessionLogItem[],
  auditList: AdminAccountOperation[],
  notifications: NotificationLog[]
) {
  if (activeSubTab === 'system_events') {
    const headers = ['ID', 'Date & Heure', 'Auteur', 'Niveau', 'Événement', 'Détails', 'IP'];
    const rows = sessionLogs.map((s) => [
      s.id,
      new Date(s.timestamp).toLocaleString('fr-FR'),
      s.author,
      s.level.toUpperCase(),
      s.title,
      s.details,
      s.ipAddress || '',
    ]);
    exportToExcel('notifications_systeme.xls', 'Notifications & Événements Système Citrine', headers, rows);
  } else if (activeSubTab === 'audit_logs') {
    const headers = ['ID', 'Date', 'Auteur', 'Compte Cible', 'Type Opération', 'Intitulé', 'Détails', 'IP'];
    const rows = auditList.map((op) => [
      op.id,
      new Date(op.timestamp).toLocaleString('fr-FR'),
      op.authorName,
      op.targetName,
      op.operationType,
      op.operationLabel,
      op.details,
      op.ipAddress || 'Douala, CM',
    ]);
    exportToExcel('journaux_audit_operations.xls', 'Audit Logs des Opérations', headers, rows);
  } else {
    const headers = ['ID', 'Date & Heure', 'Type', 'Titre', 'Contenu', 'Statut'];
    const rows = notifications.map((n) => [
      n.id,
      new Date(n.timestamp).toLocaleString('fr-FR'),
      n.type,
      n.title,
      n.content,
      n.read ? 'Lue' : 'Non lue',
    ]);
    exportToExcel('notifications_diffusees.xls', 'Notifications Diffusées', headers, rows);
  }
}
