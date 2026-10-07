import React, { useState, useMemo } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  User, 
  Calendar, 
  ArrowRight, 
  FileText, 
  Search,
  Check,
  X,
  MapPin,
  FileSpreadsheet,
  RotateCcw,
  Download
} from 'lucide-react';
import { Presence, Employee, EmergencyDeclaration, EmergencyType } from '../types';
import { saveDocument, COLLECTIONS } from '../services/firestoreService';
import { exportTableToExcel, exportTableToPDF } from '../utils/tableExportUtils';
import { SearchableSelect } from './common/SearchableSelect';

interface PresenceRequestsViewProps {
  presences: Presence[];
  employees: Employee[];
  onUpdatePresences: (updated: Presence[]) => void;
  showToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

type RequestItemType = 'emergency' | 'correction' | 'departure';

interface RequestItem {
  id: string; // Unique combined ID for keying
  presenceId: string;
  employeeId: string;
  employee: Employee | null;
  date: string;
  type: RequestItemType;
  subType?: string; // EmergencyType or field name
  details: string; // Detail string (e.g. times, or GPS location info)
  reason: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
  rawEmergency?: EmergencyDeclaration; // If it's an emergency
}

export default function PresenceRequestsView({
  presences,
  employees,
  onUpdatePresences,
  showToast
}: PresenceRequestsViewProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'emergency' | 'correction' | 'departure'>('all');

  // Decision Modal State for Mandatory Motif
  const [decisionModalItem, setDecisionModalItem] = useState<RequestItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<'approved' | 'rejected' | null>(null);
  const [decisionMotif, setDecisionMotif] = useState('');
  const [selectedDetailRequest, setSelectedDetailRequest] = useState<RequestItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Convert all presence requests (emergencies, corrections, departures) into a flat list of RequestItems
  const allRequests = useMemo(() => {
    const list: RequestItem[] = [];

    presences.forEach(p => {
      const emp = employees.find(e => e.id === p.employeeId) || null;

      // 1. Process Emergencies
      if (p.emergencies && p.emergencies.length > 0) {
        p.emergencies.forEach((e, idx) => {
          list.push({
            id: `emg-${e.id || `${p.id}-${idx}`}`,
            presenceId: p.id,
            employeeId: p.employeeId,
            employee: emp,
            date: p.date,
            type: 'emergency',
            subType: e.type,
            details: `Heure déclarée: ${e.timeString || '--:--'}`,
            reason: e.reason,
            timestamp: e.timestamp || `${p.date}T08:00:00Z`,
            status: e.status || 'pending',
            rawEmergency: e
          });
        });
      }

      // 2. Process Correction Reason (Manual Adjustments)
      if (p.correctionReason) {
        // Skip if this correctionReason was auto-generated from an emergency declaration to avoid duplicate cards
        const isFromEmergency = (p.emergencies || []).some(e => 
          p.correctionReason?.includes(e.reason) || 
          p.correctionReason?.startsWith('[Urgence')
        );
        if (!isFromEmergency) {
          list.push({
            id: `corr-${p.id}`,
            presenceId: p.id,
            employeeId: p.employeeId,
            employee: emp,
            date: p.date,
            type: 'correction',
            details: `Arrivée: ${p.arrivalTime || '--:--'} | Pause: ${p.pauseStart || '--:--'} à ${p.pauseEnd || '--:--'}`,
            reason: p.correctionReason,
            timestamp: p.updatedAt || `${p.date}T08:00:00Z`,
            status: p.correctionReasonStatus || 'pending'
          });
        }
      }

      // 3. Process Departure Reason
      if (p.departureReason) {
        // Skip if this departureReason was auto-generated from an emergency declaration
        const isFromEmergency = (p.emergencies || []).some(e => 
          p.departureReason?.includes(e.reason) || 
          e.type === 'depart_anticipe'
        );
        if (!isFromEmergency) {
          list.push({
            id: `dept-${p.id}`,
            presenceId: p.id,
            employeeId: p.employeeId,
            employee: emp,
            date: p.date,
            type: 'departure',
            details: `Départ: ${p.departureTime || '--:--'}`,
            reason: p.departureReason,
            timestamp: p.updatedAt || `${p.date}T17:00:00Z`,
            status: p.departureReasonStatus || 'pending'
          });
        }
      }
    });

    // Sort chronologically descending
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [presences, employees]);

  // Filter requests based on tabs, search and type filters
  const filteredRequests = useMemo(() => {
    return allRequests.filter(req => {
      // Tab check
      const matchesTab = activeTab === 'pending' ? req.status === 'pending' : req.status !== 'pending';
      if (!matchesTab) return false;

      // Type check
      if (filterType !== 'all' && req.type !== filterType) return false;

      // Search check
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const empName = req.employee?.name.toLowerCase() || '';
        const empEmail = req.employee?.email.toLowerCase() || '';
        const reasonText = req.reason.toLowerCase();
        const dateText = req.date;
        return empName.includes(query) || empEmail.includes(query) || reasonText.includes(query) || dateText.includes(query);
      }

      return true;
    });
  }, [allRequests, activeTab, filterType, searchTerm]);

  // Initiate decision with modal prompting for mandatory motif
  const handleInitiateDecision = (req: RequestItem, decision: 'approved' | 'rejected') => {
    setDecisionModalItem(req);
    setDecisionAction(decision);
    setDecisionMotif('');
  };

  const handleConfirmDecision = async () => {
    if (!decisionModalItem || !decisionAction) return;
    if (!decisionMotif.trim()) {
      if (showToast) {
        showToast('Veuillez saisir obligatoirement un motif pour cette décision.', 'error');
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const req = decisionModalItem;
      const decision = decisionAction;
      const motif = decisionMotif.trim();

      // 1. Find the actual presence record to update (by ID or fallback by employeeId & date)
      let targetPresenceIndex = presences.findIndex(p => p.id === req.presenceId);
      if (targetPresenceIndex === -1) {
        targetPresenceIndex = presences.findIndex(p => p.employeeId === req.employeeId && p.date === req.date);
      }

      const updatedPresences = [...presences];
      let targetPresence: Presence;

      if (targetPresenceIndex === -1) {
        targetPresence = {
          id: req.presenceId || `pres-${req.employeeId}-${req.date}`,
          employeeId: req.employeeId,
          date: req.date,
          arrivalTime: null,
          pauseStart: null,
          pauseEnd: null,
          departureTime: null,
          status: 'present',
          emergencies: req.rawEmergency ? [{ ...req.rawEmergency, status: decision, reviewReason: motif }] : [],
          updatedAt: new Date().toISOString()
        };
        updatedPresences.push(targetPresence);
        targetPresenceIndex = updatedPresences.length - 1;
      } else {
        targetPresence = { ...updatedPresences[targetPresenceIndex] };
      }

      if (req.type === 'emergency') {
        if (targetPresence.emergencies && targetPresence.emergencies.length > 0) {
          targetPresence.emergencies = targetPresence.emergencies.map(e => {
            if (
              (req.rawEmergency?.id && e.id === req.rawEmergency.id) ||
              (e.type === req.subType && e.reason === req.reason) ||
              (e.reason === req.reason)
            ) {
              return { ...e, status: decision, reviewReason: motif };
            }
            return e;
          });
        } else if (req.rawEmergency) {
          targetPresence.emergencies = [{ ...req.rawEmergency, status: decision, reviewReason: motif }];
        }

        if (req.subType === 'retard' || req.subType === 'pause_anticipee' || req.subType === 'rallonge_pause') {
          targetPresence.correctionReasonStatus = decision;
        } else if (req.subType === 'depart_anticipe') {
          targetPresence.departureReasonStatus = decision;
        }
      } else if (req.type === 'correction') {
        targetPresence.correctionReasonStatus = decision;
        if (targetPresence.emergencies) {
          targetPresence.emergencies = targetPresence.emergencies.map(e => {
            if (e.type === 'retard' || e.type === 'pause_anticipee' || e.type === 'rallonge_pause') {
              return { ...e, status: decision, reviewReason: motif };
            }
            return e;
          });
        }
      } else if (req.type === 'departure') {
        targetPresence.departureReasonStatus = decision;
        if (targetPresence.emergencies) {
          targetPresence.emergencies = targetPresence.emergencies.map(e => {
            if (e.type === 'depart_anticipe') {
              return { ...e, status: decision, reviewReason: motif };
            }
            return e;
          });
        }
      }

      targetPresence.updatedAt = new Date().toISOString();
      updatedPresences[targetPresenceIndex] = targetPresence;
      
      onUpdatePresences(updatedPresences);
      await saveDocument(COLLECTIONS.PRESENCES, targetPresence);

      const label = decision === 'approved' ? 'approuvée' : 'rejetée';
      const typeLabel = req.type === 'emergency' ? 'L\'urgence' : req.type === 'correction' ? 'La correction' : 'La justification';
      if (showToast) {
        showToast(`${typeLabel} de ${req.employee?.name || 'l\'employé'} a été ${label} (Motif : ${motif}).`, decision === 'approved' ? 'success' : 'info');
      }
    } catch (err) {
      console.error(err);
      if (showToast) {
        showToast("Une erreur est survenue lors de l'enregistrement de la décision.", "error");
      }
    } finally {
      setIsSubmitting(false);
      setDecisionModalItem(null);
      setDecisionAction(null);
      setDecisionMotif('');
    }
  };

  // Export handlers
  const handleExportExcel = () => {
    const data = filteredRequests.map(r => ({
      'Collaborateur': r.employee?.name || 'Inconnu',
      'Rôle': r.employee?.roleType || '',
      'Type': r.type,
      'Sous-Type': r.subType || '',
      'Date': r.date,
      'Motif Déclaré': r.reason,
      'Statut': r.status,
      'Date Déclaration': r.timestamp
    }));
    exportTableToExcel(data, 'Rapport_Demandes_Urgences_Presences');
  };

  const handleExportPDF = () => {
    const headers = ['Collaborateur', 'Type', 'Date', 'Motif Déclaré', 'Statut'];
    const rows = filteredRequests.map(r => [
      r.employee?.name || 'Inconnu',
      r.type,
      r.date,
      r.reason,
      r.status
    ]);
    exportTableToPDF('Rapport des Demandes & Urgences', headers, rows, 'Rapport_Demandes_Urgences_Presences');
  };

  // Human readable subTypes
  const getSubtypeLabel = (req: RequestItem) => {
    if (req.type === 'emergency') {
      switch (req.subType) {
        case 'retard': return 'Urgence Retard';
        case 'pause_anticipee': return 'Pause Anticipée';
        case 'rallonge_pause': return 'Rallonge Pause';
        case 'depart_anticipe': return 'Départ Anticipé';
        default: return 'Urgence Signalée';
      }
    }
    if (req.type === 'correction') return 'Correction Heures';
    if (req.type === 'departure') return 'Départ Motif';
    return 'Justification';
  };

  const getSubtypeColor = (req: RequestItem) => {
    if (req.type === 'emergency') {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (req.type === 'correction') {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-purple-50 text-purple-700 border-purple-200';
  };

  return (
    <div className="space-y-6">
      {/* Search & Tabs bar */}
      <div className="bg-white border border-stone-200/80 rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Tabs */}
        <div className="flex gap-2 bg-stone-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-white text-stone-800 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>En attente ({allRequests.filter(r => r.status === 'pending').length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white text-stone-800 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5 text-green-500" />
            <span>Historique ({allRequests.filter(r => r.status !== 'pending').length})</span>
          </button>
        </div>

        {/* Right: Search & Filters & Export Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Export Excel */}
          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-emerald-200"
            title="Exporter en Excel"
          >
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Excel</span>
          </button>

          {/* Export PDF */}
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-stone-200"
            title="Exporter en PDF"
          >
            <Download className="h-3.5 w-3.5" />
            <span>PDF</span>
          </button>

          {/* Filter Type */}
          <div className="w-48">
            <SearchableSelect
              value={filterType}
              onChange={(val) => setFilterType(val as any)}
              options={[
                { value: 'all', label: 'Tous types' },
                { value: 'emergency', label: '🚨 Urgences uniquement', badge: 'Urgences', badgeColor: 'bg-red-100 text-red-800' },
                { value: 'correction', label: '📋 Corrections heures', badge: 'Horaires', badgeColor: 'bg-blue-100 text-blue-800' },
                { value: 'departure', label: '🚪 Départs motifs', badge: 'Départ', badgeColor: 'bg-amber-100 text-amber-800' }
              ]}
              size="sm"
              placeholder="Filtrer type..."
              searchPlaceholder="Rechercher type..."
            />
          </div>

          {/* Search text */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Rechercher collaborateur, motif..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-4 py-1.5 w-full md:w-64 bg-stone-50 border border-stone-200 text-xs rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-green-500 font-medium"
            />
          </div>
        </div>
      </div>

      {/* Requests Datatable */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white border border-stone-200/60 rounded-2xl p-12 text-center shadow-2xs">
          <FileText className="h-10 w-10 text-stone-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-stone-500">
            {activeTab === 'pending' 
              ? 'Aucune demande en attente d\'approbation pour le moment !' 
              : 'Aucune demande archivée dans l\'historique.'}
          </p>
          <p className="text-xs text-stone-400 mt-1">
            Les déclarations d'urgence et les motifs saisis s'affichent automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-600 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Collaborateur</th>
                  <th className="py-3.5 px-4">Type de Demande</th>
                  <th className="py-3.5 px-4">Journée & Détails</th>
                  <th className="py-3.5 px-4">Motif Déclaré</th>
                  <th className="py-3.5 px-4">Statut</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-xs text-stone-800 font-medium">
                {filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={req.employee?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces'}
                          alt={req.employee?.name}
                          className="w-8 h-8 rounded-full object-cover border border-stone-200 shadow-2xs shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <div className="font-bold text-stone-900">{req.employee?.name || 'Inconnu'}</div>
                          <div className="text-[10px] text-stone-400">{req.employee?.roleType || 'Collaborateur'}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wide border ${getSubtypeColor(req)}`}>
                        {getSubtypeLabel(req)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 space-y-0.5">
                      <div className="flex items-center gap-1 text-stone-500 text-[11px]">
                        <Calendar className="h-3 w-3 text-stone-400 shrink-0" />
                        <span>{req.date}</span>
                      </div>
                      <div className="text-stone-700 text-[11px] font-normal truncate max-w-xs">
                        {req.details}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 max-w-xs">
                      <p className="text-xs text-stone-700 bg-amber-50/60 border border-amber-100 p-2 rounded-xl italic truncate" title={req.reason}>
                        "{req.reason}"
                      </p>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                        req.status === 'approved' 
                          ? 'bg-green-50 text-green-700 border border-green-200' 
                          : req.status === 'rejected'
                          ? 'bg-red-50 text-red-700 border border-red-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {req.status === 'approved' ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>Approuvée</span>
                          </>
                        ) : req.status === 'rejected' ? (
                          <>
                            <XCircle className="h-3 w-3 text-red-600" />
                            <span>Rejetée</span>
                          </>
                        ) : (
                          <>
                            <Clock className="h-3 w-3 text-amber-600" />
                            <span>En attente</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Detail Button */}
                        <button
                          onClick={() => setSelectedDetailRequest(req)}
                          className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-stone-200"
                          title="Afficher les détails"
                        >
                          <FileText className="h-3.5 w-3.5 text-stone-500" />
                          <span>Détails</span>
                        </button>

                        {req.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleInitiateDecision(req, 'rejected')}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer border border-red-200"
                              title="Rejeter"
                            >
                              <X className="h-3.5 w-3.5" />
                              <span>Rejeter</span>
                            </button>
                            <button
                              onClick={() => handleInitiateDecision(req, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                              title="Approuver"
                            >
                              <Check className="h-3.5 w-3.5" />
                              <span>Approuver</span>
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleInitiateDecision(req, req.status === 'approved' ? 'rejected' : 'approved')}
                            className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border border-stone-200"
                            title={req.status === 'approved' ? 'Changer pour Rejeter' : 'Changer pour Approuver'}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>{req.status === 'approved' ? 'Rejeter' : 'Approuver'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedDetailRequest && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-bold text-stone-900 font-serif flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-600" />
                Détails de la Demande / Urgence
              </h3>
              <button 
                onClick={() => setSelectedDetailRequest(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Employee info */}
              <div className="flex items-center gap-3 bg-stone-50 p-3.5 rounded-2xl border border-stone-100">
                <img
                  src={selectedDetailRequest.employee?.avatarUrl || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=faces'}
                  alt={selectedDetailRequest.employee?.name}
                  className="w-12 h-12 rounded-full object-cover border border-stone-200 shadow-2xs"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">{selectedDetailRequest.employee?.name}</h4>
                  <p className="text-stone-500">{selectedDetailRequest.employee?.roleType || 'Collaborateur'} • {selectedDetailRequest.employee?.email}</p>
                </div>
              </div>

              {/* Request Specs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Type de Demande</span>
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wide border ${getSubtypeColor(selectedDetailRequest)}`}>
                    {getSubtypeLabel(selectedDetailRequest)}
                  </span>
                </div>

                <div className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                  <span className="text-[10px] font-bold text-stone-400 uppercase block mb-1">Journée concernée</span>
                  <span className="font-bold text-stone-800 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-stone-400" />
                    {selectedDetailRequest.date}
                  </span>
                </div>
              </div>

              <div className="bg-stone-50 p-3 rounded-xl border border-stone-100 space-y-1">
                <span className="text-[10px] font-bold text-stone-400 uppercase block">Précisions / Horaires</span>
                <p className="font-medium text-stone-800">{selectedDetailRequest.details}</p>
              </div>

              <div className="bg-amber-50/60 p-3.5 rounded-xl border border-amber-100 space-y-1">
                <span className="text-[10px] font-bold text-amber-800 uppercase block">Motif déclaré par le collaborateur</span>
                <p className="text-xs text-stone-800 italic font-medium">"{selectedDetailRequest.reason}"</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-stone-500 pt-2 border-t border-stone-100">
                <span>Date de déclaration : {new Date(selectedDetailRequest.timestamp).toLocaleString('fr-FR')}</span>
                <span className={`px-2 py-0.5 rounded-md font-bold uppercase ${
                  selectedDetailRequest.status === 'approved' ? 'bg-green-100 text-green-800' : selectedDetailRequest.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedDetailRequest.status}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSelectedDetailRequest(null)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Fermer
              </button>
              {selectedDetailRequest.status === 'pending' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const req = selectedDetailRequest;
                      setSelectedDetailRequest(null);
                      handleInitiateDecision(req, 'rejected');
                    }}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Rejeter
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const req = selectedDetailRequest;
                      setSelectedDetailRequest(null);
                      handleInitiateDecision(req, 'approved');
                    }}
                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                  >
                    Approuver
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Motif Decision Modal */}
      {decisionModalItem && decisionAction && (
        <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 font-serif flex items-center gap-2">
                <AlertTriangle className={`h-4 w-4 ${decisionAction === 'approved' ? 'text-green-600' : 'text-red-600'}`} />
                {decisionAction === 'approved' ? 'Approuver la demande' : 'Rejeter la demande'}
              </h3>
              <button 
                onClick={() => setDecisionModalItem(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-stone-600">
                Vous êtes sur le point de <strong className={decisionAction === 'approved' ? 'text-green-700' : 'text-red-700'}>
                  {decisionAction === 'approved' ? 'approuver' : 'rejeter'}
                </strong> la demande de <strong>{decisionModalItem.employee?.name}</strong>.
              </p>
              
              <div className="space-y-1">
                <label className="font-bold text-stone-700 uppercase tracking-wider text-[10px] block">
                  Motif de la décision <span className="text-red-500">* (Obligatoire)</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={decisionMotif}
                  onChange={(e) => setDecisionMotif(e.target.value)}
                  placeholder="Saisissez obligatoirement le motif ou commentaire de validation/rejet..."
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-800 focus:bg-white focus:border-green-600 outline-none font-medium"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDecisionModalItem(null)}
                className="px-4 py-2 text-stone-600 hover:bg-stone-100 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmDecision}
                className={`px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-2 ${
                  isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                } ${
                  decisionAction === 'approved' ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20' : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>Confirmer la décision</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
