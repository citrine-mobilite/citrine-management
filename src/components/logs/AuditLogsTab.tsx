import React from 'react';
import { Search, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { AdminAccountOperation } from '../../services/adminAuditService';
import { getOperationBadge, getLevelBadge } from './logBadgesAndExport';

interface AuditLogsTabProps {
  auditList: AdminAccountOperation[];
  filteredAuditOps: AdminAccountOperation[];
  paginatedAuditOps: AdminAccountOperation[];
  searchTerm: string;
  onChangeSearch: (val: string) => void;
  auditFilterType: string;
  onChangeFilterType: (val: string) => void;
  auditFilterStatus: string;
  onChangeFilterStatus: (val: string) => void;
  auditFilterPeriod: string;
  onChangeFilterPeriod: (val: string) => void;
  auditStartDate: string;
  onChangeStartDate: (val: string) => void;
  auditEndDate: string;
  onChangeEndDate: (val: string) => void;
  auditPage: number;
  totalAuditPages: number;
  auditPerPage: number;
  onChangePage: (page: number) => void;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({
  auditList,
  filteredAuditOps,
  paginatedAuditOps,
  searchTerm,
  onChangeSearch,
  auditFilterType,
  onChangeFilterType,
  auditFilterStatus,
  onChangeFilterStatus,
  auditFilterPeriod,
  onChangeFilterPeriod,
  auditStartDate,
  onChangeStartDate,
  auditEndDate,
  onChangeEndDate,
  auditPage,
  totalAuditPages,
  auditPerPage,
  onChangePage,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Total Opérations</span>
          <span className="text-xl font-extrabold text-stone-900 font-mono mt-1 block">{auditList.length}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Rôles & Privilèges</span>
          <span className="text-xl font-extrabold text-amber-700 font-mono mt-1 block">
            {auditList.filter((o) => o.operationType === 'role_change').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Responsables & Équipes</span>
          <span className="text-xl font-extrabold text-blue-700 font-mono mt-1 block">
            {auditList.filter((o) => o.operationType === 'manager_change' || o.operationType === 'team_change').length}
          </span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Créations Récentes</span>
          <span className="text-xl font-extrabold text-emerald-700 font-mono mt-1 block">
            {auditList.filter((o) => o.operationType === 'creation').length}
          </span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:max-w-md">
            <Search className="h-4 w-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, auteur, cible, détails..."
              value={searchTerm}
              onChange={(e) => { onChangeSearch(e.target.value); onChangePage(1); }}
              className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-none focus:border-[#2A7B76]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-xs">
              <span className="text-[10px] font-bold text-stone-400">Type :</span>
              <select value={auditFilterType} onChange={(e) => { onChangeFilterType(e.target.value); onChangePage(1); }} className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer">
                <option value="all">Tous les types</option>
                <option value="tache_projet">Tâches &amp; Projets</option>
                <option value="presence_pointage">Pointage &amp; Présence</option>
                <option value="feuille_avancement_taches">TaskSheet (Avancement)</option>
                <option value="conge_permission">Congé &amp; Permission</option>
                <option value="finance_frais">Notes de Frais</option>
                <option value="salary_update">Salaire &amp; Paie</option>
                <option value="conseil_discipline">Conseil de Discipline</option>
                <option value="creation">Création de Compte</option>
                <option value="role_change">Changement de Rôle</option>
                <option value="manager_change">Responsable</option>
                <option value="team_change">Affectation Équipe</option>
                <option value="status_change">Statut &amp; Suspension</option>
                <option value="parametres_systeme">Paramètres Système</option>
                <option value="password_reset">Mot de passe</option>
                <option value="securite_connexion">Sécurité &amp; Connexion</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-xs">
              <span className="text-[10px] font-bold text-stone-400">Statut :</span>
              <select value={auditFilterStatus} onChange={(e) => { onChangeFilterStatus(e.target.value); onChangePage(1); }} className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer">
                <option value="all">Tous les statuts</option>
                <option value="success">✓ Succès</option>
                <option value="info">ℹ️ Information</option>
                <option value="warning">⚠️ Avertissement</option>
                <option value="error">✕ Erreur / Refus</option>
              </select>
            </div>

            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2 py-1 text-xs">
              <Calendar className="h-3 w-3 text-stone-400" />
              <span className="text-[10px] font-bold text-stone-400">Période :</span>
              <select value={auditFilterPeriod} onChange={(e) => { onChangeFilterPeriod(e.target.value); onChangePage(1); }} className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer">
                <option value="all">Toutes les périodes</option>
                <option value="today">Aujourd'hui</option>
                <option value="7days">7 derniers jours</option>
                <option value="30days">30 derniers jours</option>
                <option value="this_month">Ce mois-ci</option>
                <option value="custom">Date personnalisée...</option>
              </select>
            </div>

            {(auditFilterType !== 'all' || auditFilterStatus !== 'all' || auditFilterPeriod !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  onChangeFilterType('all');
                  onChangeFilterStatus('all');
                  onChangeFilterPeriod('all');
                  onChangeStartDate('');
                  onChangeEndDate('');
                  onChangeSearch('');
                  onChangePage(1);
                }}
                className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 font-bold transition cursor-pointer"
                title="Réinitialiser les filtres"
              >
                Effacer filtres
              </button>
            )}
          </div>
        </div>

        {auditFilterPeriod === 'custom' && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs animate-in fade-in">
            <span className="font-bold text-stone-600 text-[11px]">Plage de dates :</span>
            <input type="date" value={auditStartDate} onChange={(e) => onChangeStartDate(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs" />
            <span className="text-stone-400">à</span>
            <input type="date" value={auditEndDate} onChange={(e) => onChangeEndDate(e.target.value)} className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs" />
          </div>
        )}
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 text-[10px] uppercase font-bold border-b border-stone-200/80">
              <tr>
                <th className="py-3 px-4">Date & Heure</th>
                <th className="py-3 px-4">Auteur</th>
                <th className="py-3 px-4">Cible / Collaborateur</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Statut</th>
                <th className="py-3 px-4">Détails & Modifications</th>
                <th className="py-3 px-4 text-right">IP / Réseau</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-medium">
              {paginatedAuditOps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400 text-xs">
                    Aucune opération administrative ou système trouvée avec ces critères de filtre.
                  </td>
                </tr>
              ) : (
                paginatedAuditOps.map((op) => (
                  <tr key={op.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-stone-600 font-mono text-[11px]">
                      {new Date(op.timestamp).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-stone-900">{op.authorName}</span>
                      {op.authorRole && <span className="block text-[10px] text-stone-400 font-normal">{op.authorRole}</span>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-bold text-stone-800">
                        <span className="w-6 h-6 rounded-full bg-[#2A7B76]/10 text-[#2A7B76] flex items-center justify-center text-[10px]">
                          {op.targetName.slice(0, 2).toUpperCase()}
                        </span>
                        <span>{op.targetName}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">{getOperationBadge(op.operationType)}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{getLevelBadge(op.level)}</td>
                    <td className="py-3 px-4 text-stone-700">
                      <div className="space-y-0.5 max-w-md">
                        <span className="font-bold block text-stone-900">{op.operationLabel}</span>
                        <span className="text-[11px] text-stone-500 block leading-relaxed">{op.details}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-stone-400 font-mono text-[10px]">
                      {op.ipAddress || '197.234.221.14 (Douala, CM)'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredAuditOps.length > 0 && (
          <div className="px-5 py-3.5 bg-stone-50/70 border-t border-stone-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-stone-500 text-[11px]">
              Affichage de <span className="font-bold text-stone-800">{(auditPage - 1) * auditPerPage + 1}</span> à{' '}
              <span className="font-bold text-stone-800">{Math.min(auditPage * auditPerPage, filteredAuditOps.length)}</span> sur{' '}
              <span className="font-bold text-[#2A7B76]">{filteredAuditOps.length}</span> opérations ({auditPerPage} par page)
            </div>
            <div className="flex items-center gap-1.5">
              <button type="button" disabled={auditPage <= 1} onClick={() => onChangePage(Math.max(1, auditPage - 1))} className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 font-bold flex items-center gap-1 cursor-pointer text-[11px] shadow-2xs">
                <ChevronLeft className="h-3.5 w-3.5" />
                <span>Précédent</span>
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalAuditPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} type="button" onClick={() => onChangePage(p)} className={`min-w-[30px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${p === auditPage ? 'bg-[#2A7B76] text-white shadow-xs' : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100/80'}`}>
                    {p}
                  </button>
                ))}
              </div>
              <button type="button" disabled={auditPage >= totalAuditPages} onClick={() => onChangePage(Math.min(totalAuditPages, auditPage + 1))} className="px-3 py-1.5 rounded-xl border border-stone-200 bg-white text-stone-600 hover:bg-stone-50 disabled:opacity-40 font-bold flex items-center gap-1 cursor-pointer text-[11px] shadow-2xs">
                <span>Suivant</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
