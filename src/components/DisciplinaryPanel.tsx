import React, { useState } from 'react';
import { Scale, Plus, Search, UserCheck, Trophy, Layers, LayoutGrid, Table, ShieldAlert } from 'lucide-react';
import { DisciplinaryIncident, Employee, AppUser, EmployeeRecognition } from '../types';
import { DisciplinaryStats } from './disciplinary/DisciplinaryStats';
import { DisciplinaryIncidentCard } from './disciplinary/DisciplinaryIncidentCard';
import { DisciplinaryTableView } from './disciplinary/DisciplinaryTableView';
import { DisciplinaryCreateModal } from './disciplinary/DisciplinaryCreateModal';
import { DisciplinaryDetailView } from './disciplinary/DisciplinaryDetailView';
import { EmployeeDisciplinarySummary } from './disciplinary/EmployeeDisciplinarySummary';
import { RecognitionPanel } from './disciplinary/RecognitionPanel';

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
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [searchTerm, setSearchTerm] = useState('');
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

  const handleAddIncident = (newIncident: DisciplinaryIncident) => {
    onUpdateIncidents([newIncident, ...incidents]);
    if (showToast) showToast('Nouveau fait disciplinaire consigné avec succès.');
  };

  const handleUpdateIncident = (updated: DisciplinaryIncident) => {
    onUpdateIncidents(incidents.map((i) => (i.id === updated.id ? updated : i)));
    setSelectedIncident(updated);
    if (showToast) showToast('Dossier disciplinaire mis à jour.');
  };

  const handleAddRecognition = (rec: EmployeeRecognition) => {
    setRecognitions([rec, ...recognitions]);
    if (showToast) showToast('Distinction ou titre décerné avec succès !');
  };

  const filteredIncidents = incidents.filter(
    (i) =>
      i.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="space-y-6">
      {/* Clean Banner with Aligned Primary Action */}
      <div className="bg-[#2A7B76] rounded-3xl p-6 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Scale className="h-6 w-6 text-emerald-200" />
          <h2 className="font-serif font-bold text-xl sm:text-2xl text-white">
            Conseil de Discipline & Sanctions
          </h2>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-5 py-2.5 bg-white text-[#2A7B76] hover:bg-emerald-50 rounded-2xl text-xs font-extrabold transition shadow-md cursor-pointer flex items-center gap-2 shrink-0"
          >
            <Plus className="h-4 w-4 text-[#2A7B76]" />
            <span>Consigner un Fait / Sanction</span>
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* KPI Stats */}
        <DisciplinaryStats incidents={incidents} />

        {/* Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-center justify-between bg-white p-4 rounded-2xl border border-stone-200/80 shadow-2xs gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher par titre, motif ou collaborateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-stone-50 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-[#2A7B76] outline-none"
            />
          </div>

          <div className="flex items-center bg-stone-100 p-1 rounded-2xl border border-stone-200 text-xs shrink-0">
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'cards' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Cartes
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'table' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Table className="h-3.5 w-3.5" /> Tableau
            </button>
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
          </div>
        ) : (
          <DisciplinaryTableView
            incidents={filteredIncidents}
            onSelectIncident={(inc) => setSelectedIncident(inc)}
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
