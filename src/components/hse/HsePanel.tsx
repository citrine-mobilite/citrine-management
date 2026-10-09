import React, { useState, useEffect } from 'react';
import { ShieldAlert, AlertTriangle, Search } from 'lucide-react';
import { 
  HseIncident, 
  HseIncidentType, 
  HseSeverity, 
  HseCorrectiveAction,
  AppUser, 
  Employee 
} from '../../types';
import { 
  subscribeToHseIncidents, 
  saveHseIncident 
} from '../../services/hseService';
import { HseKpiBanner } from './HseKpiBanner';
import { HseIncidentsGrid } from './HseIncidentsGrid';
import { HseDetailModal } from './HseDetailModal';
import { NewHseIncidentModal } from './NewHseIncidentModal';

interface HsePanelProps {
  currentUser?: AppUser | null;
  employees: Employee[];
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const HsePanel: React.FC<HsePanelProps> = ({
  currentUser,
  onAddNotification,
  showToast,
}) => {
  const [incidents, setIncidents] = useState<HseIncident[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<HseIncident | null>(null);

  useEffect(() => {
    const unsub = subscribeToHseIncidents(setIncidents);
    return () => unsub();
  }, []);

  const isAdminOrManager = currentUser?.role === 'administrateur' || currentUser?.role === 'responsable';

  const daysWithoutLostTimeAccident = 142;
  const nearMissesCount = incidents.filter((i) => i.type === 'presque_accident' || i.type === 'situation_dangereuse').length;
  const allActions = incidents.flatMap((i) => i.correctiveActions || []);
  const completedActionsCount = allActions.filter((a) => a.isCompleted).length;
  const resolutionRate = allActions.length > 0 ? Math.round((completedActionsCount / allActions.length) * 100) : 100;
  const closedCount = incidents.filter((i) => i.status === 'cloture').length;

  const filteredIncidents = incidents.filter((inc) => {
    const matchSearch = 
      inc.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.zonePrecise && inc.zonePrecise.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchSite = selectedSite === 'all' || inc.site === selectedSite;
    const matchSev = selectedSeverity === 'all' || inc.severity === selectedSeverity;
    const matchStat = selectedStatus === 'all' || inc.status === selectedStatus;
    return matchSearch && matchSite && matchSev && matchStat;
  });

  const handleToggleAction = async (incident: HseIncident, actionId: string) => {
    try {
      const updatedActions = (incident.correctiveActions || []).map((a) => {
        if (a.id === actionId) {
          const nextState = !a.isCompleted;
          return {
            ...a,
            isCompleted: nextState,
            completedAt: nextState ? new Date().toISOString() : undefined,
          };
        }
        return a;
      });

      const allDone = updatedActions.length > 0 && updatedActions.every((a) => a.isCompleted);
      const updatedIncident: HseIncident = {
        ...incident,
        correctiveActions: updatedActions,
        status: allDone ? 'cloture' : 'actions_lancees',
      };

      await saveHseIncident(updatedIncident);
      setSelectedIncident(updatedIncident);
      showToast?.('Action corrective mise à jour.', 'success');
    } catch {
      showToast?.('Erreur lors de la mise à jour.', 'error');
    }
  };

  const handleAddAction = async (incident: HseIncident, action: HseCorrectiveAction) => {
    try {
      const updatedIncident: HseIncident = {
        ...incident,
        status: 'actions_lancees',
        correctiveActions: [...(incident.correctiveActions || []), action],
      };
      await saveHseIncident(updatedIncident);
      setSelectedIncident(updatedIncident);
      showToast?.('Action corrective ajoutée au plan.', 'success');
    } catch {
      showToast?.('Erreur lors de l\'ajout de l\'action.', 'error');
    }
  };

  const handleCreateIncident = async (incidentData: Partial<HseIncident>) => {
    if (!incidentData.title || !incidentData.description) {
      showToast?.('Veuillez renseigner un titre et une description.', 'error');
      return;
    }

    try {
      const incToSave: HseIncident = {
        id: `hse-${Date.now()}`,
        reference: `HSE-2026-${String(incidents.length + 13).padStart(4, '0')}`,
        site: incidentData.site || 'Base Logistique Japoma',
        zonePrecise: incidentData.zonePrecise || 'Zone générale',
        type: (incidentData.type as HseIncidentType) || 'presque_accident',
        severity: (incidentData.severity as HseSeverity) || 'faible',
        date: incidentData.date || new Date().toISOString().split('T')[0],
        time: incidentData.time || '10:00',
        title: incidentData.title,
        description: incidentData.description,
        reportedBy: currentUser?.name || 'Agent Citrine',
        reportedByRole: currentUser?.role || 'Collaborateur',
        immediateActionTaken: incidentData.immediateActionTaken || '',
        status: 'signale',
        correctiveActions: [],
        createdAt: new Date().toISOString(),
      };

      await saveHseIncident(incToSave);
      setIsNewModalOpen(false);
      showToast?.('Signalement HSE enregistré avec succès !', 'success');
      onAddNotification?.({
        title: 'Nouveau Signalement HSE',
        message: `${incToSave.reference} : "${incToSave.title}" sur le site de ${incToSave.site}.`,
        type: incToSave.severity === 'grave' || incToSave.severity === 'critique' ? 'warning' : 'info',
      });
    } catch {
      showToast?.('Erreur lors de l\'enregistrement.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800">Registre Hygiène, Sécurité & Environnement (HSE)</h1>
            <p className="text-xs text-stone-500">
              Prévention des risques, signalement des presque-accidents et plans d'actions correctives (CAPA)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
        >
          <AlertTriangle className="w-4 h-4" /> Déclarer un Incident / Danger
        </button>
      </div>

      <HseKpiBanner
        daysWithoutLostTimeAccident={daysWithoutLostTimeAccident}
        totalIncidentsCount={incidents.length}
        nearMissesCount={nearMissesCount}
        resolutionRate={resolutionRate}
        completedActionsCount={completedActionsCount}
        totalActionsCount={allActions.length}
        closedIncidentsCount={closedCount}
      />

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par référence, description, zone, cause racine..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <select
          value={selectedSite}
          onChange={(e) => setSelectedSite(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Tous les sites</option>
          <option value="Base Logistique Japoma">Base Japoma</option>
          <option value="Siège Akwa">Siège Akwa</option>
          <option value="Atelier Mécanique Japoma">Atelier Mécanique</option>
          <option value="Chantier / Route">Chantier / Route</option>
        </select>

        <select
          value={selectedSeverity}
          onChange={(e) => setSelectedSeverity(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Toutes gravités</option>
          <option value="faible">Faible</option>
          <option value="modere">Modéré</option>
          <option value="grave">Grave</option>
          <option value="critique">Critique</option>
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Tous les statuts</option>
          <option value="signale">Signalé</option>
          <option value="en_cours_analyse">En cours d'analyse</option>
          <option value="actions_lancees">Actions lancées</option>
          <option value="cloture">Clôturé</option>
        </select>
      </div>

      <HseIncidentsGrid
        incidents={filteredIncidents}
        onSelectIncident={setSelectedIncident}
      />

      {selectedIncident && (
        <HseDetailModal
          incident={selectedIncident}
          isAdminOrManager={isAdminOrManager}
          onClose={() => setSelectedIncident(null)}
          onToggleAction={handleToggleAction}
          onAddAction={handleAddAction}
        />
      )}

      {isNewModalOpen && (
        <NewHseIncidentModal
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateIncident}
        />
      )}
    </div>
  );
};

export default HsePanel;
