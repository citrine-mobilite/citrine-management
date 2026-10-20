import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  UserCheck, 
  Trophy, 
  Layers, 
  LayoutGrid, 
  Table, 
  ShieldAlert,
  Filter,
  Calendar,
  RotateCcw,
  User,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { DisciplinaryIncident, Employee, AppUser, EmployeeRecognition, DisciplinaryStatus } from '../types';
import { DisciplinaryStats } from './disciplinary/DisciplinaryStats';
import { DisciplinaryIncidentCard } from './disciplinary/DisciplinaryIncidentCard';
import { DisciplinaryTableView } from './disciplinary/DisciplinaryTableView';
import { DisciplinaryCreateModal } from './disciplinary/DisciplinaryCreateModal';
import { DisciplinaryDetailView } from './disciplinary/DisciplinaryDetailView';
import { EmployeeDisciplinarySummary } from './disciplinary/EmployeeDisciplinarySummary';
import { RecognitionPanel } from './disciplinary/RecognitionPanel';
import { logSystemAudit } from '../services/adminAuditService';
import { showSuccessAlert, showErrorAlert } from '../utils/sweetAlert';

interface DisciplinaryPanelProps {
  incidents: DisciplinaryIncident[];
  onUpdateIncidents: (incidents: DisciplinaryIncident[]) => void;
  employees: Employee[];
  currentUser: AppUser | null;
  currentRole?: string;
  onAddNotification?: (type: 'whatsapp' | 'email' | 'system', title: string, content: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function DisciplinaryPanel({
  incidents = [],
  onUpdateIncidents,
  employees = [],
  currentUser,
  showToast,
}: DisciplinaryPanelProps) {
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | DisciplinaryStatus>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [employeeFilter, setEmployeeFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  const [selectedIncident, setSelectedIncident] = useState<DisciplinaryIncident | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Default Recognitions State
  const [recognitions, setRecognitions] = useState<EmployeeRecognition[]>(() => [
    {
      id: 'rec-1',
      employeeId: employees[0]?.id || 'emp-1',
      employeeName: employees[0] ? (employees[0].name || `${employees[0].firstName || ''} ${employees[0].lastName || ''}`.trim()) : 'Kouam Marc',
      employeeRole: 'Conducteur d\'Engins',
      type: 'employe_du_mois',
      title: 'Employé du Mois d\'Octobre 2026',
      description: 'Discipline exemplaire, réactivité sur chantier et respect scrupuleux des consignes de sécurité.',
      period: 'Octobre 2026',
      awardedAt: '2026-10-01',
      awardedBy: 'Direction des Ressources Humaines',
      bonusAmount: 50000,
      badgeIcon: 'Trophy',
    },
    {
      id: 'rec-2',
      employeeId: employees[1]?.id || 'emp-2',
      employeeName: employees[1] ? (employees[1].name || `${employees[1].firstName || ''} ${employees[1].lastName || ''}`.trim()) : 'Tchamba Sarah',
      employeeRole: 'Chef de Projets',
      type: 'trophee',
      title: 'Prix de la Rigueur & Management',
      description: 'Livraison dans les délais de l\'ensemble des projets du trimestre sans aucun retard.',
      period: 'Q3 2026',
      awardedAt: '2026-09-15',
      awardedBy: 'Direction Générale',
      bonusAmount: 100000,
      badgeIcon: 'Medal',
    },
  ]);

  const handleAddIncident = async (newIncident: DisciplinaryIncident) => {
    try {
      onUpdateIncidents([newIncident, ...incidents]);
      
      // Log dans le journal d'audit
      logSystemAudit({
        authorName: currentUser?.name || 'Responsable RH',
        authorRole: currentUser?.role || 'admin',
        targetName: newIncident.employeeName,
        targetEmployeeId: newIncident.employeeId,
        operationType: 'conseil_discipline',
        operationLabel: `Ouverture dossier disciplinaire [${newIncident.id}]`,
        details: `${newIncident.title} — Gravité: ${newIncident.severity.toUpperCase()}. Signalé par ${newIncident.reportedBy}`,
        level: newIncident.severity === 'critique' || newIncident.severity === 'grave' ? 'warning' : 'info',
      });

      if (showToast) showToast('Nouveau fait disciplinaire consigné avec succès.');
      await showSuccessAlert('Incident enregistré !', `Le dossier disciplinaire pour "${newIncident.employeeName}" a été ouvert.`);
    } catch (err: any) {
      await showErrorAlert('Erreur', err?.message || 'Erreur lors de l\'enregistrement de l\'incident.');
    }
  };

  const handleUpdateIncident = async (updated: DisciplinaryIncident) => {
    try {
      onUpdateIncidents(incidents.map((i) => (i.id === updated.id ? updated : i)));
      setSelectedIncident(updated);

      // Log dans le journal d'audit
      logSystemAudit({
        authorName: currentUser?.name || 'Responsable RH',
        authorRole: currentUser?.role || 'admin',
        targetName: updated.employeeName,
        targetEmployeeId: updated.employeeId,
        operationType: 'conseil_discipline',
        operationLabel: `Mise à jour dossier disciplinaire [${updated.id}]`,
        details: `Statut : ${updated.status}. Sanction : ${updated.sanctionType || 'En délibéré'}.`,
        level: updated.status === 'sanctionne' ? 'warning' : 'info',
      });

      if (showToast) showToast('Dossier disciplinaire mis à jour.');
      await showSuccessAlert('Dossier mis à jour !', `Le dossier disciplinaire pour "${updated.employeeName}" a été mis à jour.`);
    } catch (err: any) {
      await showErrorAlert('Erreur', err?.message || 'Erreur lors de la mise à jour du dossier.');
    }
  };

  const handleUpdateStatus = (incident: DisciplinaryIncident, newStatus: DisciplinaryStatus) => {
    const updated: DisciplinaryIncident = {
      ...incident,
      status: newStatus,
      updatedAt: new Date().toISOString(),
      history: [
        ...(incident.history || []),
        {
          id: `h-${Date.now()}`,
          date: new Date().toISOString(),
          action: `Changement de statut : ${newStatus.toUpperCase()}`,
          authorName: currentUser?.name || 'Responsable RH',
          notes: `Statut de la procédure mis à jour vers ${newStatus}.`,
        },
      ],
    };
    handleUpdateIncident(updated);
  };

  const handleAddRecognition = async (rec: EmployeeRecognition) => {
    try {
      setRecognitions([rec, ...recognitions]);
      if (showToast) showToast('Distinction ou titre décerné avec succès !');
      await showSuccessAlert('Distinction décernée !', `La distinction a été attribuée avec succès.`);
    } catch (err: any) {
      await showErrorAlert('Erreur', err?.message || 'Erreur lors de l\'attribution de la distinction.');
    }
  };

  // Filtrage combiné (Recherche, Statut, Gravité, Collaborateur, Période)
  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      // 1. Recherche plein texte
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        i.title.toLowerCase().includes(q) ||
        i.employeeName.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        (i.reportedBy && i.reportedBy.toLowerCase().includes(q));

      // 2. Filtre statut
      const matchStatus = statusFilter === 'all' || i.status === statusFilter;

      // 3. Filtre gravité
      const matchSeverity = severityFilter === 'all' || i.severity === severityFilter;

      // 4. Filtre collaborateur
      const matchEmployee = employeeFilter === 'all' || i.employeeId === employeeFilter;

      // 5. Filtre période
      let matchPeriod = true;
      const iDate = new Date(i.date);
      const now = new Date();
      if (periodFilter === 'this_month') {
        matchPeriod = i.date.startsWith(now.toISOString().slice(0, 7));
      } else if (periodFilter === '3_months') {
        const diffMonths = (now.getFullYear() - iDate.getFullYear()) * 12 + (now.getMonth() - iDate.getMonth());
        matchPeriod = diffMonths <= 3;
      } else if (periodFilter === 'this_year') {
        matchPeriod = iDate.getFullYear() === now.getFullYear();
      }

      return matchSearch && matchStatus && matchSeverity && matchEmployee && matchPeriod;
    });
  }, [incidents, searchTerm, statusFilter, severityFilter, employeeFilter, periodFilter]);

  // Counts for tabs
  const openCount = incidents.filter((i) => i.status === 'ouvert' || i.status === 'en_instruction').length;
  const convoqueCount = incidents.filter((i) => i.status === 'convoque' || i.status === 'delibere').length;
  const sanctionneCount = incidents.filter((i) => i.status === 'sanctionne').length;
  const classeCount = incidents.filter((i) => i.status === 'classe').length;

  // IF AN INCIDENT IS SELECTED: RENDER FULL PAGE DETAIL VIEW!
  if (selectedIncident) {
    return (
      <DisciplinaryDetailView
        incident={selectedIncident}
        onBack={() => setSelectedIncident(null)}
        onUpdateIncident={handleUpdateIncident}
        currentUserName={currentUser?.name || 'Responsable RH'}
        currentUserRole={currentUser?.role || 'Administrateur'}
      />
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Clean Banner with Primary Action */}
      <div className="bg-gradient-to-r from-[#2A7B76] via-[#20635F] to-emerald-950 rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 backdrop-blur-xs rounded-xl border border-white/15">
              <Scale className="h-6 w-6 text-emerald-200" />
            </div>
            <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
              Conseil de Discipline &amp; Sanctions
            </h2>
          </div>
          <p className="text-xs text-emerald-100/90 pl-1 max-w-2xl">
            Tenue du registre disciplinaire, instruction des manquements, convocations au conseil et sanctions contractuelles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-2xl text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4 text-[#2A7B76]" />
            <span>+ Convoquer Conseil / Consigner Fait</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Stats */}
        <DisciplinaryStats incidents={incidents} />

        {/* Quick Filter Tabs for Procedural Stages */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `Tous les dossiers (${incidents.length})` },
            { id: 'ouvert', label: `À instruire (${openCount})` },
            { id: 'convoque', label: `Convoqués au Conseil (${convoqueCount})` },
            { id: 'sanctionne', label: `Sanctions prononcées (${sanctionneCount})` },
            { id: 'classe', label: `Classés sans suite (${classeCount})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition whitespace-nowrap cursor-pointer shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-[#2A7B76] text-white shadow-sm'
                  : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Comprehensive Filter Toolbar */}
        <div className="bg-white p-4 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher par titre, motif, collaborateur, rapporteur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs shrink-0 self-end sm:self-auto">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Table className="h-3.5 w-3.5" /> Tableau (Conseil)
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Cartes
              </button>
            </div>
          </div>

          {/* Multi-Filters Row */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100 text-xs">
            {/* 1. Filtre Gravité */}
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-stone-400" />
              <span className="text-[10px] font-bold text-stone-400">Gravité :</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Toutes les gravités</option>
                <option value="critique">🚨 Critique</option>
                <option value="grave">⚠️ Grave</option>
                <option value="moyen">Moyen</option>
                <option value="faible">Faible</option>
              </select>
            </div>

            {/* 2. Filtre Collaborateur */}
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
              <User className="h-3.5 w-3.5 text-stone-400" />
              <span className="text-[10px] font-bold text-stone-400">Collaborateur :</span>
              <select
                value={employeeFilter}
                onChange={(e) => setEmployeeFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer max-w-[180px]"
              >
                <option value="all">Tous les collaborateurs</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Filtre Période */}
            <div className="flex items-center gap-1 bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-stone-400" />
              <span className="text-[10px] font-bold text-stone-400">Période :</span>
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value)}
                className="bg-transparent font-bold text-stone-700 text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">Toutes dates</option>
                <option value="this_month">Ce mois-ci</option>
                <option value="3_months">3 derniers mois</option>
                <option value="this_year">Cette année</option>
              </select>
            </div>

            {/* Reset button */}
            {(statusFilter !== 'all' || severityFilter !== 'all' || employeeFilter !== 'all' || periodFilter !== 'all' || searchTerm) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('all');
                  setSeverityFilter('all');
                  setEmployeeFilter('all');
                  setPeriodFilter('all');
                  setSearchTerm('');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 font-bold transition cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Effacer filtres</span>
              </button>
            )}
          </div>
        </div>

        {/* Cards or Table view */}
        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredIncidents.map((incident) => (
              <DisciplinaryIncidentCard
                key={incident.id}
                incident={incident}
                onSelect={(inc) => setSelectedIncident(inc)}
              />
            ))}
            {filteredIncidents.length === 0 && (
              <div className="col-span-full bg-white p-12 rounded-3xl border border-stone-200 text-center text-stone-400 italic">
                Aucun dossier disciplinaire ne correspond à votre recherche.
              </div>
            )}
          </div>
        ) : (
          <DisciplinaryTableView
            incidents={filteredIncidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}
      </div>

      {/* Create Modal */}
      <DisciplinaryCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        employees={employees}
        onSubmit={handleAddIncident}
        authorName={currentUser?.name || 'Responsable RH'}
      />
    </div>
  );
}
