import React, { useState, useEffect, useMemo } from 'react';
import { Contact2, LogIn, Search, Settings, Calendar } from 'lucide-react';
import { 
  VisitorLog, 
  VisitorPurpose, 
  AppUser, 
  Employee,
  PersonType 
} from '../../types';
import { 
  subscribeToVisitorLogs, 
  saveVisitorLog 
} from '../../services/visitorLogService';
import { 
  subscribeToBuildingSupervisors, 
  BuildingSupervisor 
} from '../../services/supervisorService';
import { VisitorsKpiCards } from './VisitorsKpiCards';
import { VisitorDetailModal } from './VisitorDetailModal';
import { NewVisitorModal } from './NewVisitorModal';
import { VisitorsTable } from './VisitorsTable';
import { SupervisorConfigModal } from './SupervisorConfigModal';
import { SearchableSelect, SelectOption } from '../common/SearchableSelect';

interface VisitorsPanelProps {
  currentUser?: AppUser | null;
  employees: Employee[];
  onAddNotification?: (n: any) => void;
  showToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const VisitorsPanel: React.FC<VisitorsPanelProps> = ({
  currentUser,
  employees,
  onAddNotification,
  showToast,
}) => {
  const [visitors, setVisitors] = useState<VisitorLog[]>([]);
  const [supervisors, setSupervisors] = useState<BuildingSupervisor[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtres demandés : type, statut, date (site retiré)
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [personTypeFilter, setPersonTypeFilter] = useState<string>('all');
  
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSupervisorsModalOpen, setIsSupervisorsModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null);

  useEffect(() => {
    const unsubVisitors = subscribeToVisitorLogs(setVisitors);
    const unsubSupervisors = subscribeToBuildingSupervisors(setSupervisors);
    return () => {
      unsubVisitors();
      unsubSupervisors();
    };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const currentOnSite = visitors.filter((v) => v.status === 'sur_site').length;
  const todayDeparted = visitors.filter((v) => v.status === 'sorti' && v.checkInDate === todayStr).length;
  const pendingApprovals = visitors.filter((v) => v.status === 'attente_validation' || v.status === 'attendu').length;
  const todayTotal = visitors.filter((v) => v.checkInDate === todayStr).length;

  const filteredVisitors = visitors.filter((v) => {
    const matchSearch = 
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.visitorCompany && v.visitorCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.vehiclePlate && v.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.hostEmployeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.supervisorName && v.supervisorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (v.idCardNumber && v.idCardNumber.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    const matchType = personTypeFilter === 'all' || (v.personType || 'visiteur') === personTypeFilter;

    // Filtre par date
    const matchDate =
      dateFilter === 'all'
        ? true
        : dateFilter === 'today'
        ? v.checkInDate === todayStr
        : v.checkInDate === selectedDate;

    return matchSearch && matchStatus && matchType && matchDate;
  });

  const handleQuickCheckOut = async (visitor: VisitorLog) => {
    try {
      const now = new Date();
      const checkOutTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const updated: VisitorLog = {
        ...visitor,
        status: 'sorti',
        checkOutTime,
      };
      await saveVisitorLog(updated);
      showToast?.(`Sortie enregistrée pour ${visitor.visitorName} à ${checkOutTime}.`, 'success');
      onAddNotification?.({
        title: 'Sortie Enregistrée',
        message: `${visitor.visitorName} a quitté ${visitor.siteLocation} (Badge ${visitor.badgeNumber} restitué).`,
        type: 'info',
      });
    } catch {
      showToast?.('Erreur lors de l\'enregistrement de sortie.', 'error');
    }
  };

  const handleQuickCheckIn = async (visitor: VisitorLog) => {
    try {
      const now = new Date();
      const checkInTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const updated: VisitorLog = {
        ...visitor,
        status: 'sur_site',
        checkInTime,
        checkOutTime: undefined,
      };
      await saveVisitorLog(updated);
      showToast?.(`Arrivée confirmée pour ${visitor.visitorName} à ${checkInTime}.`, 'success');
    } catch {
      showToast?.('Erreur lors de l\'enregistrement d\'arrivée.', 'error');
    }
  };

  const handleAuthorizeAccess = async (visitor: VisitorLog) => {
    try {
      const updated: VisitorLog = {
        ...visitor,
        status: 'sur_site',
        authorizationConfirmed: true,
      };
      await saveVisitorLog(updated);
      showToast?.(`Accès autorisé pour ${visitor.visitorName}. Badge ${visitor.badgeNumber} remis.`, 'success');
      onAddNotification?.({
        title: 'Accès Bâtiment Autorisé',
        message: `${visitor.visitorName} (${visitor.visitorCompany}) a reçu l'autorisation d'accès.`,
        type: 'info',
      });
    } catch {
      showToast?.('Erreur lors de la validation d\'accès.', 'error');
    }
  };

  const handleRejectAccess = async (visitor: VisitorLog) => {
    try {
      const updated: VisitorLog = {
        ...visitor,
        status: 'refuse',
        authorizationConfirmed: false,
      };
      await saveVisitorLog(updated);
      showToast?.(`Accès refusé pour ${visitor.visitorName}.`, 'error');
    } catch {
      showToast?.('Erreur lors du refus d\'accès.', 'error');
    }
  };

  const handleCreateVisitor = async (visitorData: Partial<VisitorLog>) => {
    if (!visitorData.visitorName || !visitorData.visitorPhone) {
      showToast?.('Nom et téléphone obligatoires.', 'error');
      return;
    }

    try {
      const selectedHost = employees.find((emp) => emp.id === visitorData.hostEmployeeId);
      const now = new Date();
      const checkInTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const checkInDate = now.toISOString().split('T')[0];

      const pType: PersonType = visitorData.personType || 'visiteur';

      const visitorToSave: VisitorLog = {
        id: `vis-${Date.now()}`,
        personType: pType,
        workerDomain: pType === 'travailleur' ? visitorData.workerDomain : undefined,
        supervisorName: pType === 'travailleur' ? visitorData.supervisorName : undefined,
        interventionPerimeter: pType === 'travailleur' ? visitorData.interventionPerimeter : undefined,
        isPreAuthorized: visitorData.isPreAuthorized,
        authorizationConfirmed: visitorData.authorizationConfirmed,
        visitorName: visitorData.visitorName,
        visitorCompany: visitorData.visitorCompany || (pType === 'travailleur' ? 'Prestataire BTP' : 'Particulier'),
        visitorPhone: visitorData.visitorPhone,
        idCardNumber: visitorData.idCardNumber || '',
        siteLocation: visitorData.siteLocation || 'Siège Japoma (Carrefour Matango)',
        purpose: (visitorData.purpose as VisitorPurpose) || 'rdv_commercial',
        hostEmployeeId: selectedHost?.id || '',
        hostEmployeeName: selectedHost ? selectedHost.name : (visitorData.hostEmployeeName || (pType === 'travailleur' ? (visitorData.supervisorName || 'Superviseur Bâtiment') : 'Accueil Citrine')),
        hostDepartment: selectedHost?.department || (pType === 'travailleur' ? 'Technique & Bâtiment' : 'Général'),
        badgeNumber: visitorData.badgeNumber || `BADGE-${String(visitors.length + 1).padStart(2, '0')}`,
        vehiclePlate: visitorData.vehiclePlate || '',
        checkInTime,
        checkInDate,
        status: visitorData.status || 'sur_site',
        notes: visitorData.notes || '',
        createdAt: now.toISOString(),
      };

      await saveVisitorLog(visitorToSave);
      setIsNewModalOpen(false);

      if (visitorToSave.status === 'sur_site') {
        showToast?.(`${pType === 'travailleur' ? 'Travailleur' : 'Visiteur'} ${visitorToSave.visitorName} autorisé et enregistré !`, 'success');
      } else {
        showToast?.(`${visitorToSave.visitorName} enregistré en attente d'accord à l'accueil.`, 'success');
      }

      onAddNotification?.({
        title: pType === 'travailleur' ? 'Arrivée Travailleur Bâtiment' : 'Arrivée Visiteur',
        message: `${visitorToSave.visitorName} (${visitorToSave.visitorCompany}) est enregistré sur le site ${visitorToSave.siteLocation}.`,
        type: 'info',
      });
    } catch {
      showToast?.('Erreur lors de l\'enregistrement.', 'error');
    }
  };

  // Options Select2 (SearchableSelect) pour les filtres
  const typeFilterOptions: SelectOption[] = [
    { value: 'all', label: 'Tous les flux (Visiteurs & Travailleurs)' },
    { value: 'visiteur', label: '👤 Visiteurs uniquement', description: 'Visites de tiers / Rendez-vous' },
    { value: 'travailleur', label: '🔧 Travailleurs uniquement', description: 'Intervenants sous supervision' },
  ];

  const statusFilterOptions: SelectOption[] = [
    { value: 'all', label: 'Tous les statuts' },
    { value: 'sur_site', label: '🟢 Sur site (Autorisé)' },
    { value: 'attente_validation', label: '🟡 En attente accord accueil' },
    { value: 'sorti', label: '⚪ Sorti' },
    { value: 'attendu', label: '🔵 Attendu' },
    { value: 'refuse', label: '🔴 Accès refusé' },
  ];

  const dateFilterOptions: SelectOption[] = [
    { value: 'all', label: '📅 Toutes les dates' },
    { value: 'today', label: `📅 Aujourd'hui (${todayStr})` },
    { value: 'custom', label: '📅 Choisir une date précise...' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-xl border border-[#2A7B76]/20">
            <Contact2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-stone-800">Contrôle des Accès & Sécurité du Bâtiment</h1>
              <span className="text-[10px] font-bold bg-amber-50 text-amber-900 px-2 py-0.5 rounded-full border border-amber-200">
                Siège Japoma (Carrefour Matango)
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Registre d'émargement : Visiteurs externes & Travailleurs sous supervision technique (BD Supabase)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton pour modifier la liste des superviseurs */}
          <button
            type="button"
            onClick={() => setIsSupervisorsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition cursor-pointer border border-stone-200"
            title="Gérer les superviseurs enregistrés en base de données"
          >
            <Settings className="w-4 h-4 text-stone-500" />
            <span>Gérer les Superviseurs ({supervisors.length})</span>
          </button>

          {/* Bouton pour enregistrer une arrivée */}
          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-xl shadow-xs transition cursor-pointer"
          >
            <LogIn className="w-4 h-4" /> Enregistrer une Arrivée
          </button>
        </div>
      </div>

      <VisitorsKpiCards
        currentOnSite={currentOnSite}
        todayDeparted={todayDeparted}
        expectedVisitors={pendingApprovals}
        todayTotal={todayTotal}
      />

      {/* Barre de Filtres avec Select 2 (SearchableSelect) & Filtre de Dates */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Recherche textuelle */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom, entreprise, badge, superviseur, CNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-stone-200 focus:outline-none focus:border-[#2A7B76] bg-stone-50/50"
            />
          </div>

          {/* Filtre Type (Select2) */}
          <div className="w-full lg:w-64">
            <SearchableSelect
              options={typeFilterOptions}
              value={personTypeFilter}
              onChange={(val) => setPersonTypeFilter(String(val))}
              placeholder="Filtrer par type..."
              searchPlaceholder="Rechercher un type..."
              size="sm"
            />
          </div>

          {/* Filtre Statut (Select2) */}
          <div className="w-full lg:w-56">
            <SearchableSelect
              options={statusFilterOptions}
              value={statusFilter}
              onChange={(val) => setStatusFilter(String(val))}
              placeholder="Filtrer par statut..."
              searchPlaceholder="Rechercher un statut..."
              size="sm"
            />
          </div>

          {/* Filtre Date (Select2) */}
          <div className="w-full lg:w-56">
            <SearchableSelect
              options={dateFilterOptions}
              value={dateFilter}
              onChange={(val) => setDateFilter(String(val))}
              placeholder="Filtrer par date..."
              searchPlaceholder="Date..."
              size="sm"
            />
          </div>

          {/* Sélecteur de date spécifique si 'custom' est sélectionné */}
          {dateFilter === 'custom' && (
            <div className="flex items-center gap-1.5 bg-stone-50 px-3 py-1 rounded-xl border border-stone-200 animate-in fade-in">
              <Calendar className="w-4 h-4 text-[#2A7B76]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-transparent text-stone-800 font-semibold focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {/* Table avec pagination par 25 & Bouton Détails */}
      <VisitorsTable
        visitors={filteredVisitors}
        onSelectVisitor={setSelectedVisitor}
        onQuickCheckOut={handleQuickCheckOut}
        onQuickCheckIn={handleQuickCheckIn}
        onAuthorizeAccess={handleAuthorizeAccess}
        onRejectAccess={handleRejectAccess}
      />

      {/* Modal Nouvel Enregistrement (avec sélection travailleur récurrent sans CNI & Select 2) */}
      {isNewModalOpen && (
        <NewVisitorModal
          employees={employees}
          visitorsCount={visitors.length}
          knownWorkers={visitors}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateVisitor}
        />
      )}

      {/* Modal de Configuration des Superviseurs (directement en base de données) */}
      {isSupervisorsModalOpen && (
        <SupervisorConfigModal
          currentSupervisors={supervisors}
          onClose={() => setIsSupervisorsModalOpen(false)}
          onSaved={() => {
            showToast?.('Liste des superviseurs mise à jour en base de données.', 'success');
          }}
        />
      )}

      {/* Modal Détails Complet */}
      {selectedVisitor && (
        <VisitorDetailModal
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
        />
      )}
    </div>
  );
};

export default VisitorsPanel;
