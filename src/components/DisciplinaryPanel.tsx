import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  AlertTriangle, 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  User, 
  Calendar, 
  MapPin, 
  MessageSquare, 
  ChevronRight, 
  FileCheck, 
  X, 
  Trash2, 
  Edit3, 
  ArrowRight,
  Send,
  Building,
  AlertOctagon,
  HelpCircle,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  DisciplinaryIncident, 
  Employee, 
  IncidentCategory, 
  IncidentSeverity, 
  SanctionType, 
  DisciplinaryStatus, 
  AppUser 
} from '../types';
import { downloadDisciplinaryLetterPdf } from '../services/pdfExportService';
import { SearchableSelect } from './common/SearchableSelect';

interface DisciplinaryPanelProps {
  incidents: DisciplinaryIncident[];
  onUpdateIncidents: (incidents: DisciplinaryIncident[]) => void;
  employees: Employee[];
  currentUser: AppUser | null;
  currentRole: string;
  onAddNotification?: (type: 'whatsapp' | 'email' | 'system', title: string, content: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const CATEGORY_LABELS: Record<IncidentCategory, { label: string; desc: string }> = {
  absence_injustifiee: { label: 'Absence Injustifiée', desc: 'Non-présentation au poste sans justificatif valable' },
  retard_repete: { label: 'Retards Répétés', desc: 'Retards chroniques perturbant le service' },
  insubordination: { label: 'Insubordination / Refus', desc: 'Refus d’exécuter une consigne professionnelle' },
  negligence_materiel: { label: 'Négligence Matériel', desc: 'Dégradation ou perte d’équipements confiés' },
  faute_professionnelle: { label: 'Faute Professionnelle', desc: 'Erreur grave, manquement aux règles de gestion' },
  comportement_inadapte: { label: 'Comportement Inapproprié', desc: 'Manquement au respect mutuel ou altercation' },
  autre: { label: 'Autre Manquement', desc: 'Fait divers contraire au règlement intérieur' }
};

const SEVERITY_BADGES: Record<IncidentSeverity, { label: string; bg: string; text: string; border: string }> = {
  faible: { label: 'Faible', bg: 'bg-stone-100', text: 'text-stone-700', border: 'border-stone-300' },
  moyen: { label: 'Moyen', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  grave: { label: 'Grave', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
  critique: { label: 'Critique', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' }
};

const SANCTION_LABELS: Record<SanctionType, { label: string; docType?: 'explication' | 'avertissement' | 'mise_en_demeure' }> = {
  explication_ecrite: { label: 'Demande d\'explications', docType: 'explication' },
  rappel_a_l_ordre: { label: 'Rappel à l\'ordre verbal', docType: undefined },
  avertissement: { label: 'Avertissement écrit officiel', docType: 'avertissement' },
  mise_en_demeure: { label: 'Mise en demeure formelle', docType: 'mise_en_demeure' },
  mise_a_pied: { label: 'Mise à pied conservatoire', docType: 'mise_en_demeure' },
  licenciement_faute: { label: 'Procédure de licenciement', docType: 'mise_en_demeure' },
  classe_sans_suite: { label: 'Dossier classé sans suite', docType: undefined }
};

export default function DisciplinaryPanel({
  incidents = [],
  onUpdateIncidents,
  employees = [],
  currentUser,
  currentRole,
  onAddNotification,
  showToast
}: DisciplinaryPanelProps) {
  const isManager = currentRole === 'Administrateur' || currentRole === 'Responsable';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');

  // Modals & Active states
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<DisciplinaryIncident | null>(null);
  const [isEditingResponse, setIsEditingResponse] = useState(false);
  const [responseText, setResponseText] = useState('');

  // Form state for creating a new incident
  const [formData, setFormData] = useState<{
    employeeId: string;
    date: string;
    incidentTime: string;
    category: IncidentCategory;
    severity: IncidentSeverity;
    title: string;
    description: string;
    location: string;
    witnesses: string;
    legalDeadlineDays: number;
  }>({
    employeeId: employees[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    category: 'retard_repete',
    severity: 'moyen',
    title: '',
    description: '',
    location: 'Bureaux Citrine (HQ)',
    witnesses: '',
    legalDeadlineDays: 3
  });

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      // Search
      const matchesSearch = 
        inc.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.description.toLowerCase().includes(searchTerm.toLowerCase());

      // Filters
      const matchesSeverity = filterSeverity === 'all' || inc.severity === filterSeverity;
      const matchesCategory = filterCategory === 'all' || inc.category === filterCategory;
      const matchesStatus = filterStatus === 'all' || inc.status === filterStatus;
      const matchesEmp = selectedEmployeeFilter === 'all' || inc.employeeId === selectedEmployeeFilter;

      return matchesSearch && matchesSeverity && matchesCategory && matchesStatus && matchesEmp;
    });
  }, [incidents, searchTerm, filterSeverity, filterCategory, filterStatus, selectedEmployeeFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = incidents.length;
    const ouverts = incidents.filter(i => i.status === 'ouvert' || i.status === 'en_instruction').length;
    const sanctionnes = incidents.filter(i => i.status === 'sanctionne').length;
    const gravesOuCritiques = incidents.filter(i => i.severity === 'grave' || i.severity === 'critique').length;
    return { total, ouverts, sanctionnes, gravesOuCritiques };
  }, [incidents]);

  // Handle Save New Incident
  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      showToast?.('Veuillez renseigner un titre et une description des faits.', 'error');
      return;
    }

    const targetEmp = employees.find(e => e.id === formData.employeeId);
    const newIncident: DisciplinaryIncident = {
      id: `disc-${Date.now()}`,
      employeeId: formData.employeeId,
      employeeName: targetEmp?.name || 'Salarié Inconnu',
      employeeRole: targetEmp?.roleType || 'Employé',
      employeeDepartment: targetEmp?.department || 'Opérations',
      date: formData.date,
      incidentTime: formData.incidentTime,
      category: formData.category,
      severity: formData.severity,
      title: formData.title,
      description: formData.description,
      location: formData.location,
      witnesses: formData.witnesses,
      reportedBy: currentUser?.name || 'Direction RH',
      reportedByRole: currentUser?.role || 'Responsable',
      status: 'ouvert',
      legalDeadlineDays: formData.legalDeadlineDays,
      createdAt: new Date().toISOString(),
      officialLetterRef: `DISC-${Date.now().toString().slice(-6)}-${new Date().getFullYear()}`
    };

    const updated = [newIncident, ...incidents];
    onUpdateIncidents(updated);
    setIsNewModalOpen(false);
    showToast?.(`Incident disciplinaire enregistré pour ${newIncident.employeeName}`, 'success');

    // Notify
    if (onAddNotification) {
      onAddNotification(
        'system',
        '🚨 Procédure Disciplinaire Ouverte',
        `Un constat de manquement (${CATEGORY_LABELS[formData.category].label}) a été ouvert à l'encontre de ${newIncident.employeeName}.`
      );
    }

    // Reset Form
    setFormData({
      employeeId: employees[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      incidentTime: new Date().toTimeString().slice(0, 5),
      category: 'retard_repete',
      severity: 'moyen',
      title: '',
      description: '',
      location: 'Bureaux Citrine (HQ)',
      witnesses: '',
      legalDeadlineDays: 3
    });
  };

  // Handle Apply Sanction
  const handleApplySanction = (incidentId: string, sanction: SanctionType, details?: string) => {
    const updated = incidents.map(inc => {
      if (inc.id === incidentId) {
        const isClosed = sanction === 'classe_sans_suite';
        return {
          ...inc,
          sanctionType: sanction,
          sanctionDate: new Date().toISOString().split('T')[0],
          sanctionDetails: details || inc.sanctionDetails,
          status: (isClosed ? 'classe' : 'sanctionne') as DisciplinaryStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return inc;
    });

    onUpdateIncidents(updated);
    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident(updated.find(i => i.id === incidentId) || null);
    }
    showToast?.(`Sanction enregistrée : ${SANCTION_LABELS[sanction].label}`, 'success');
  };

  // Handle Save Employee Response
  const handleSaveResponse = (incidentId: string) => {
    if (!responseText.trim()) return;

    const updated = incidents.map(inc => {
      if (inc.id === incidentId) {
        return {
          ...inc,
          employeeResponse: responseText,
          status: 'en_instruction' as DisciplinaryStatus,
          updatedAt: new Date().toISOString()
        };
      }
      return inc;
    });

    onUpdateIncidents(updated);
    if (selectedIncident && selectedIncident.id === incidentId) {
      setSelectedIncident(updated.find(i => i.id === incidentId) || null);
    }
    setIsEditingResponse(false);
    showToast?.('Explications enregistrées et versées au dossier', 'success');
  };

  // Handle Delete Incident
  const handleDeleteIncident = (incidentId: string) => {
    if (!window.confirm('Êtes-vous certain de vouloir supprimer ce dossier disciplinaire ?')) return;
    const updated = incidents.filter(i => i.id !== incidentId);
    onUpdateIncidents(updated);
    if (selectedIncident?.id === incidentId) setSelectedIncident(null);
    showToast?.('Dossier disciplinaire supprimé', 'info');
  };

  // Download PDF Letter
  const handleDownloadLetter = (incident: DisciplinaryIncident, letterType: 'explication' | 'avertissement' | 'mise_en_demeure') => {
    const targetEmp = employees.find(e => e.id === incident.employeeId) || {
      id: incident.employeeId,
      name: incident.employeeName,
      roleType: incident.employeeRole,
      department: incident.employeeDepartment
    };

    downloadDisciplinaryLetterPdf(incident, targetEmp as any, letterType);
    showToast?.(`Lettre officielle A4 (${letterType}) générée avec succès`, 'success');
  };

  return (
    <div className="space-y-4" id="disciplinary-management-panel">
      {/* 1. Header Banner & Quick Actions */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-stone-200/80 shadow-2xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-lg sm:text-xl font-bold font-serif text-stone-900 tracking-tight">
              Registre des Incidents & Sanctions Disciplinaires
            </h1>
          </div>

          {isManager && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-2 shadow-2xs transition active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Ouvrir un Dossier Disciplinaire</span>
            </button>
          )}
        </div>

        {/* 2. Statistical KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-stone-100">
          <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-2xs">
            <span className="text-[11px] text-stone-500 font-medium block">Total Dossiers</span>
            <span className="text-xl font-bold text-stone-900 font-serif mt-0.5 block">{stats.total}</span>
          </div>
          <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60">
            <span className="text-[11px] text-amber-800 font-medium block">En Instruction / Ouvert</span>
            <span className="text-xl font-bold text-amber-900 font-serif mt-0.5 block">{stats.ouverts}</span>
          </div>
          <div className="bg-rose-50/60 p-3 rounded-xl border border-rose-200/60">
            <span className="text-[11px] text-rose-800 font-medium block">Faits Graves / Critiques</span>
            <span className="text-xl font-bold text-rose-900 font-serif mt-0.5 block">{stats.gravesOuCritiques}</span>
          </div>
          <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/60">
            <span className="text-[11px] text-emerald-800 font-medium block">Sanctionnés / Traités</span>
            <span className="text-xl font-bold text-emerald-900 font-serif mt-0.5 block">{stats.sanctionnes}</span>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <input
            type="text"
            placeholder="Rechercher par collaborateur, motif ou fait..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Employee Filter */}
          <div className="w-48">
            <SearchableSelect
              value={selectedEmployeeFilter}
              onChange={setSelectedEmployeeFilter}
              options={[
                { value: 'all', label: 'Tous les collaborateurs' },
                ...employees.map(emp => ({
                  value: emp.id,
                  label: emp.name,
                  description: emp.roleType || 'Collaborateur'
                }))
              ]}
              placeholder="Collaborateur"
              searchPlaceholder="Filtrer collaborateur..."
              size="sm"
            />
          </div>

          {/* Severity Filter */}
          <div className="w-36">
            <SearchableSelect
              value={filterSeverity}
              onChange={setFilterSeverity}
              options={[
                { value: 'all', label: 'Toutes gravités' },
                { value: 'faible', label: '🟢 Faible', badge: 'Faible' },
                { value: 'moyen', label: '🟡 Moyen', badge: 'Moyen' },
                { value: 'grave', label: '🟠 Grave', badge: 'Grave', badgeColor: 'bg-orange-100 text-orange-800' },
                { value: 'critique', label: '🔴 Critique', badge: 'Critique', badgeColor: 'bg-red-100 text-red-800' }
              ]}
              placeholder="Gravité"
              searchPlaceholder="Filtrer gravité..."
              size="sm"
            />
          </div>

          {/* Category Filter */}
          <div className="w-44">
            <SearchableSelect
              value={filterCategory}
              onChange={setFilterCategory}
              options={[
                { value: 'all', label: 'Toutes catégories' },
                ...Object.entries(CATEGORY_LABELS).map(([catKey, info]) => ({
                  value: catKey,
                  label: info.label
                }))
              ]}
              placeholder="Catégorie"
              searchPlaceholder="Filtrer catégorie..."
              size="sm"
            />
          </div>

          {/* Status Filter */}
          <div className="w-40">
            <SearchableSelect
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'all', label: 'Tous statuts' },
                { value: 'ouvert', label: 'Ouvert' },
                { value: 'en_instruction', label: 'En instruction' },
                { value: 'sanctionne', label: 'Sanctionné' },
                { value: 'classe', label: 'Classé sans suite' }
              ]}
              placeholder="Statut"
              searchPlaceholder="Filtrer statut..."
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* 4. Incidents Table / Cards */}
      {filteredIncidents.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 border border-stone-200/80 text-center space-y-3">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-stone-800">Aucun manquement disciplinaire trouvé</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            {searchTerm || filterSeverity !== 'all' || filterCategory !== 'all' 
              ? "Aucun dossier ne correspond à vos critères de recherche actuels."
              : "L'ensemble des collaborateurs respecte les procédures et le règlement intérieur."}
          </p>
        </div>
          ) : (
            <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4">Date</th>
                      <th className="py-3.5 px-4">Collaborateur</th>
                      <th className="py-3.5 px-4">Motif & Catégorie</th>
                      <th className="py-3.5 px-4">Gravité</th>
                      <th className="py-3.5 px-4">Procédure / Sanction</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredIncidents.map((incident) => {
                      const severityStyle = SEVERITY_BADGES[incident.severity];
                      const categoryInfo = CATEGORY_LABELS[incident.category] || { label: incident.category, desc: '' };

                      return (
                        <tr key={incident.id} className="hover:bg-stone-50/80 transition group">
                          {/* Date */}
                          <td className="py-3 px-4 whitespace-nowrap font-mono text-stone-600 text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-stone-400" />
                              <span>{new Date(incident.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </td>

                          {/* Collaborateur */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-stone-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                                {incident.employeeName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-stone-900 text-xs">
                                  {incident.employeeName}
                                </div>
                                <div className="text-[10px] text-stone-400 capitalize">
                                  {incident.employeeRole} • {incident.employeeDepartment}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Title */}
                          <td className="py-3 px-4 max-w-xs">
                            <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 inline-block mb-1">
                              {categoryInfo.label}
                            </span>
                            <div className="font-bold text-stone-900 text-xs truncate">
                              {incident.title}
                            </div>
                            <p className="text-[11px] text-stone-500 line-clamp-1 italic mt-0.5">
                              "{incident.description}"
                            </p>
                          </td>

                          {/* Gravite Badge */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${severityStyle.bg} ${severityStyle.text} ${severityStyle.border}`}>
                              {severityStyle.label}
                            </span>
                          </td>

                          {/* Procedure / Sanction */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            {incident.sanctionType ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-800 bg-stone-100 px-2.5 py-1 rounded-lg border border-stone-200">
                                <FileCheck className="h-3 w-3 text-stone-600" />
                                {SANCTION_LABELS[incident.sanctionType]?.label || incident.sanctionType}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                <Clock className="h-3 w-3 text-amber-600" />
                                Explication ({incident.legalDeadlineDays || 3}j)
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedIncident(incident);
                                  setResponseText(incident.employeeResponse || '');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition shadow-2xs active:scale-95 cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5" />
                                <span>Gérer</span>
                              </button>

                              <button
                                onClick={() => handleDownloadLetter(incident, incident.sanctionType === 'avertissement' ? 'avertissement' : incident.sanctionType === 'mise_en_demeure' ? 'mise_en_demeure' : 'explication')}
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 transition cursor-pointer"
                                title="Télécharger la lettre officielle PDF A4"
                              >
                                <Download className="h-3.5 w-3.5 text-emerald-600" />
                              </button>

                              {isManager && (
                                <button
                                  onClick={() => handleDeleteIncident(incident.id)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                  title="Supprimer ce dossier"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

      {/* 5. MODAL: Create New Incident */}
      <AnimatePresence>
        {isNewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-6"
            >
              <div className="flex items-center justify-between border-b border-stone-100 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full">
                    <ShieldAlert className="h-3.5 w-3.5" /> Nouveau Constat RH
                  </div>
                  <h2 className="text-xl font-bold font-serif text-stone-900">
                    Ouvrir un Dossier Disciplinaire
                  </h2>
                </div>
                <button
                  onClick={() => setIsNewModalOpen(false)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleCreateIncident} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Select Collaborator */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Collaborateur concerné *
                    </label>
                    <select
                      value={formData.employeeId}
                      onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      required
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} ({emp.roleType || 'Employé'} - {emp.department || 'Opérations'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Nature du manquement *
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as IncidentCategory })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none"
                    >
                      {Object.entries(CATEGORY_LABELS).map(([catKey, info]) => (
                        <option key={catKey} value={catKey}>{info.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date & Time */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Date des faits *
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                      required
                    />
                  </div>

                  {/* Severity */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Degré de gravité *
                    </label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value as IncidentSeverity })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm font-medium"
                    >
                      <option value="faible">Faible (Rappel simple)</option>
                      <option value="moyen">Moyen (Demande d'explication)</option>
                      <option value="grave">Grave (Avertissement formel)</option>
                      <option value="critique">Critique (Mise en demeure / Sanction lourde)</option>
                    </select>
                  </div>
                </div>

                {/* Title */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Titre / Résumé du motif *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Absences répétées non justifiées le lundi matin"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    required
                  />
                </div>

                {/* Description of facts */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1.5">
                    Description factuelle et chronologique des faits constatés *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Précisez les circonstances exactes, les horaires constatés, les impacts sur le service..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm leading-relaxed"
                    required
                  />
                </div>

                {/* Location & Witnesses */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Lieu de survenance
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Bureaux Douala Akwa ou Site Client"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1.5">
                      Témoins éventuels
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Chef de Projet, Collègues de bureau"
                      value={formData.witnesses}
                      onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2.5 border border-stone-200 text-stone-700 hover:bg-stone-50 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition cursor-pointer"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Enregistrer et Ouvrir le Dossier</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: Detailed Incident View & Legal PDF Generation */}
      <AnimatePresence>
        {selectedIncident && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 sm:p-8 space-y-6"
            >
              {/* Header */}
              <div className="flex items-start justify-between border-b border-stone-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-stone-400 font-bold">
                      {selectedIncident.officialLetterRef || `Réf: ${selectedIncident.id}`}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${SEVERITY_BADGES[selectedIncident.severity].bg} ${SEVERITY_BADGES[selectedIncident.severity].text} ${SEVERITY_BADGES[selectedIncident.severity].border}`}>
                      Gravité {selectedIncident.severity}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-serif text-stone-900">
                    {selectedIncident.title}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Collaborator Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-stone-50 rounded-2xl border border-stone-200/70">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Salarié Impliqué</span>
                  <div className="text-sm font-bold text-stone-900">{selectedIncident.employeeName}</div>
                  <div className="text-xs text-stone-500">{selectedIncident.employeeRole} • {selectedIncident.employeeDepartment}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Constaté par</span>
                  <div className="text-sm font-bold text-stone-900">{selectedIncident.reportedBy}</div>
                  <div className="text-xs text-stone-500">Date : {new Date(selectedIncident.date).toLocaleDateString('fr-FR')} {selectedIncident.incidentTime && `à ${selectedIncident.incidentTime}`}</div>
                </div>
              </div>

              {/* Description of Facts */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider">
                  Exposé des Faits Constatés
                </h4>
                <div className="p-4 bg-white rounded-2xl border border-stone-200 text-xs text-stone-800 leading-relaxed whitespace-pre-wrap font-sans">
                  {selectedIncident.description}
                </div>
                {selectedIncident.location && (
                  <div className="text-[11px] text-stone-500 flex items-center gap-1 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-stone-400" />
                    Lieu : {selectedIncident.location}
                  </div>
                )}
              </div>

              {/* Employee Response / Justification */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase text-stone-500 tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
                    Explications & Justificatifs du Salarié
                  </h4>
                  {!isEditingResponse && (
                    <button
                      onClick={() => setIsEditingResponse(true)}
                      className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" /> Modifier / Ajouter
                    </button>
                  )}
                </div>

                {isEditingResponse ? (
                  <div className="space-y-2">
                    <textarea
                      rows={3}
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Saisissez les explications apportées par l'employé ou transcrivez son audition..."
                      className="w-full p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs text-stone-800"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setIsEditingResponse(false)}
                        className="px-3 py-1 text-xs text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleSaveResponse(selectedIncident.id)}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-200/60 text-xs text-stone-800 italic">
                    {selectedIncident.employeeResponse || "Aucune justification écrite n'a encore été enregistrée pour ce dossier."}
                  </div>
                )}
              </div>

              {/* Legal Letters PDF Downloader Box */}
              <div className="bg-stone-900 text-white p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <FileCheck className="h-4 w-4" /> Génération de Lettres Officielles A4
                    </h4>
                    <p className="text-[11px] text-stone-300">
                      Exportez les courriers réglementaires conformes au Code du Travail avec en-têtes et cachets RH.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <button
                    onClick={() => handleDownloadLetter(selectedIncident, 'explication')}
                    className="p-3 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-left transition cursor-pointer space-y-1"
                  >
                    <span className="text-xs font-bold text-amber-400 block flex items-center gap-1">
                      <Download className="h-3 w-3" /> Demande d'Explications
                    </span>
                    <span className="text-[10px] text-stone-400 block">Délai impératif de 72h pour réponse</span>
                  </button>

                  <button
                    onClick={() => handleDownloadLetter(selectedIncident, 'avertissement')}
                    className="p-3 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-left transition cursor-pointer space-y-1"
                  >
                    <span className="text-xs font-bold text-rose-400 block flex items-center gap-1">
                      <Download className="h-3 w-3" /> Lettre d'Avertissement
                    </span>
                    <span className="text-[10px] text-stone-400 block">Notification formelle au dossier</span>
                  </button>

                  <button
                    onClick={() => handleDownloadLetter(selectedIncident, 'mise_en_demeure')}
                    className="p-3 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-left transition cursor-pointer space-y-1"
                  >
                    <span className="text-xs font-bold text-red-400 block flex items-center gap-1">
                      <Download className="h-3 w-3" /> Mise en Demeure
                    </span>
                    <span className="text-[10px] text-stone-400 block">Dernier recours avant rupture</span>
                  </button>
                </div>
              </div>

              {/* Sanction Decision Section (Managers only) */}
              {isManager && (
                <div className="space-y-3 pt-2 border-t border-stone-100">
                  <h4 className="text-xs font-bold uppercase text-stone-700 tracking-wider">
                    Prononcé de la Sanction Disciplinaire
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleApplySanction(selectedIncident.id, 'explication_ecrite')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${selectedIncident.sanctionType === 'explication_ecrite' ? 'bg-amber-600 text-white border-amber-600' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                    >
                      Explications
                    </button>
                    <button
                      onClick={() => handleApplySanction(selectedIncident.id, 'avertissement')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${selectedIncident.sanctionType === 'avertissement' ? 'bg-rose-600 text-white border-rose-600' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                    >
                      Avertissement
                    </button>
                    <button
                      onClick={() => handleApplySanction(selectedIncident.id, 'mise_en_demeure')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${selectedIncident.sanctionType === 'mise_en_demeure' ? 'bg-red-700 text-white border-red-700' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                    >
                      Mise en Demeure
                    </button>
                    <button
                      onClick={() => handleApplySanction(selectedIncident.id, 'classe_sans_suite')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer ${selectedIncident.sanctionType === 'classe_sans_suite' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'}`}
                    >
                      Classer Sans Suite
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
