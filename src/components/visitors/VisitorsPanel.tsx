import React, { useState, useEffect } from 'react';
import { Contact2, LogIn, Search } from 'lucide-react';
import { 
  VisitorLog, 
  VisitorPurpose, 
  AppUser, 
  Employee 
} from '../../types';
import { 
  subscribeToVisitorLogs, 
  saveVisitorLog 
} from '../../services/visitorLogService';
import { VisitorsKpiCards } from './VisitorsKpiCards';
import { VisitorDetailModal } from './VisitorDetailModal';
import { NewVisitorModal } from './NewVisitorModal';
import { VisitorsTable } from './VisitorsTable';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [siteFilter, setSiteFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorLog | null>(null);

  useEffect(() => {
    const unsub = subscribeToVisitorLogs(setVisitors);
    return () => unsub();
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];

  const currentOnSite = visitors.filter((v) => v.status === 'sur_site').length;
  const todayDeparted = visitors.filter((v) => v.status === 'sorti' && v.checkInDate === todayStr).length;
  const expectedVisitors = visitors.filter((v) => v.status === 'attendu').length;
  const todayTotal = visitors.filter((v) => v.checkInDate === todayStr).length;

  const filteredVisitors = visitors.filter((v) => {
    const matchSearch = 
      v.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.visitorCompany && v.visitorCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.vehiclePlate && v.vehiclePlate.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.hostEmployeeName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchSite = siteFilter === 'all' || v.siteLocation === siteFilter;
    const matchStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchSearch && matchSite && matchStatus;
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
        title: 'Sortie Visiteur',
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
      };
      await saveVisitorLog(updated);
      showToast?.(`Arrivée confirmée pour ${visitor.visitorName} à ${checkInTime}.`, 'success');
    } catch {
      showToast?.('Erreur lors de l\'enregistrement d\'arrivée.', 'error');
    }
  };

  const handleCreateVisitor = async (visitorData: Partial<VisitorLog>) => {
    if (!visitorData.visitorName || !visitorData.visitorPhone) {
      showToast?.('Nom et téléphone du visiteur obligatoires.', 'error');
      return;
    }

    try {
      const selectedHost = employees.find((emp) => emp.id === visitorData.hostEmployeeId);
      const now = new Date();
      const checkInTime = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      const checkInDate = now.toISOString().split('T')[0];

      const visitorToSave: VisitorLog = {
        id: `vis-${Date.now()}`,
        visitorName: visitorData.visitorName,
        visitorCompany: visitorData.visitorCompany || 'Particulier',
        visitorPhone: visitorData.visitorPhone,
        idCardNumber: visitorData.idCardNumber || '',
        siteLocation: visitorData.siteLocation || 'Base Logistique Japoma',
        purpose: (visitorData.purpose as VisitorPurpose) || 'rdv_commercial',
        hostEmployeeId: selectedHost?.id || '',
        hostEmployeeName: selectedHost ? selectedHost.name : (visitorData.hostEmployeeName || 'Accueil Citrine'),
        hostDepartment: selectedHost?.department || 'Général',
        badgeNumber: visitorData.badgeNumber || `BADGE-${String(visitors.length + 1).padStart(2, '0')}`,
        vehiclePlate: visitorData.vehiclePlate || '',
        checkInTime,
        checkInDate,
        status: 'sur_site',
        notes: visitorData.notes || '',
        createdAt: now.toISOString(),
      };

      await saveVisitorLog(visitorToSave);
      setIsNewModalOpen(false);
      showToast?.(`Visiteur ${visitorToSave.visitorName} enregistré à l'accueil !`, 'success');
      onAddNotification?.({
        title: 'Arrivée Visiteur',
        message: `${visitorToSave.visitorName} (${visitorToSave.visitorCompany}) est arrivé pour voir ${visitorToSave.hostEmployeeName}.`,
        type: 'info',
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
          <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
            <Contact2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-800">Registre d'Accueil & Visiteurs du Siège (Japoma / Akwa)</h1>
            <p className="text-xs text-stone-500">
              Gestion des entrées/sorties en temps réel, émargement, badges et sécurité d'accès des locaux
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#236863] rounded-xl shadow-xs transition cursor-pointer"
        >
          <LogIn className="w-4 h-4" /> Enregistrer une Arrivée Visiteur
        </button>
      </div>

      <VisitorsKpiCards
        currentOnSite={currentOnSite}
        todayDeparted={todayDeparted}
        expectedVisitors={expectedVisitors}
        todayTotal={todayTotal}
      />

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par visiteur, entreprise, badge, plaque ou hôte..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Tous les sites</option>
          <option value="Base Logistique Japoma">Base Logistique Japoma</option>
          <option value="Siège Akwa">Siège Akwa</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Tous les statuts</option>
          <option value="sur_site">Sur site (Actuel)</option>
          <option value="sorti">Sorti</option>
          <option value="attendu">Attendu</option>
        </select>
      </div>

      <VisitorsTable
        visitors={filteredVisitors}
        onSelectVisitor={setSelectedVisitor}
        onQuickCheckOut={handleQuickCheckOut}
        onQuickCheckIn={handleQuickCheckIn}
      />

      {selectedVisitor && (
        <VisitorDetailModal
          visitor={selectedVisitor}
          onClose={() => setSelectedVisitor(null)}
        />
      )}

      {isNewModalOpen && (
        <NewVisitorModal
          employees={employees}
          visitorsCount={visitors.length}
          onClose={() => setIsNewModalOpen(false)}
          onSubmit={handleCreateVisitor}
        />
      )}
    </div>
  );
};

export default VisitorsPanel;
