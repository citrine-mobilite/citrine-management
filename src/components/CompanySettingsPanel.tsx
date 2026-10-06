import React, { useState } from 'react';
import { 
  Settings, 
  Layers, 
  DollarSign, 
  FileText, 
  Send, 
  Terminal, 
  CheckCircle2, 
  Sparkles,
  Users,
  ShieldCheck,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  QrCode,
  Wifi,
  MapPin,
  Plus,
  Trash2,
  Printer,
  Tablet,
  Save,
  Building,
  Lock,
  RefreshCw,
  Package,
  Compass,
  Calendar,
  Building2,
  Scale,
  Database,
  Server,
  HardDriveDownload,
  AlertTriangle,
  BarChart3,
  PhoneCall
} from 'lucide-react';
import { CompanyModuleConfig, Employee, Presence, NotificationLog } from '../types';
import Badge16CodeManager from './Badge16CodeManager';
import { COMPANY_HQ_LOCATION, updateCompanyHQLocation } from '../utils/geolocation';
import OfficeQRCodeModal from './OfficeQRCodeModal';
import KioskClockingModal from './KioskClockingModal';
import { getCustomHolidays, addCustomHoliday, removeCustomHoliday } from '../utils/cameroonHolidays';
import { initializeFullFirestoreDatabase, InitDatabaseResult } from '../services/dbInitService';

interface CompanySettingsPanelProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  employeeCount: number;
  employees?: Employee[];
  presences?: Presence[];
  onUpdatePresences?: (presences: Presence[]) => void;
  onAddNotification?: (log: NotificationLog) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export default function CompanySettingsPanel({
  moduleConfig,
  onUpdateModuleConfig,
  employeeCount,
  employees = [],
  presences = [],
  onUpdatePresences = () => {},
  onAddNotification = () => {},
  showToast
}: CompanySettingsPanelProps) {
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showKioskModal, setShowKioskModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'modules' | 'collaborators' | 'partners' | 'security' | 'database'>('modules');

  // Database initialization / reconstruction state
  const [isSeedingDb, setIsSeedingDb] = useState(false);
  const [seedResult, setSeedResult] = useState<InitDatabaseResult | null>(null);
  const [showSeedConfirm, setShowSeedConfirm] = useState(false);

  const handleRebuildDatabase = async () => {
    setIsSeedingDb(true);
    setSeedResult(null);
    try {
      const result = await initializeFullFirestoreDatabase({ overwriteExisting: false });
      setSeedResult(result);
      if (result.success && showToast) {
        showToast('Base de données Firestore reconstruite et initialisée avec succès !', 'success');
      } else if (!result.success && showToast) {
        showToast(result.message || 'Erreur lors de l\'initialisation', 'error');
      }
    } catch (err: any) {
      setSeedResult({
        success: false,
        message: err?.message || 'Erreur inconnue',
        counts: { users: 0, employees: 0, departments: 0, tasks: 0, reminders: 0, inventory: 0, partners: 0, companySettings: 0 }
      });
      if (showToast) showToast('Échec de la reconstruction de la base.', 'error');
    } finally {
      setIsSeedingDb(false);
      setShowSeedConfirm(false);
    }
  };

  // Collaborator settings state
  const [workStartInput, setWorkStartInput] = useState(moduleConfig.workStartTime || '08:00');
  const [lateThresholdInput, setLateThresholdInput] = useState(moduleConfig.lateThresholdTime || '08:15');
  const [defaultSalaryInput, setDefaultSalaryInput] = useState<string>(
    moduleConfig.defaultSalary ? String(moduleConfig.defaultSalary) : ''
  );

  // QR Secret Code state
  const [secretInput, setSecretInput] = useState(moduleConfig.qrCodeSecret || '');

  // Wi-Fi / IP inputs state
  const [newWifiIp, setNewWifiIp] = useState('');
  const [allowedIPs, setAllowedIPs] = useState<string[]>(moduleConfig.allowedOfficeIPs || []);

  // Site Locations state
  const [sites, setSites] = useState<Array<{ name: string; address: string; lat: number; lng: number }>>(
    moduleConfig.siteLocations || []
  );
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddr, setNewSiteAddr] = useState('');

  // HQ Location State
  const [hqNameInput, setHqNameInput] = useState(moduleConfig.hqName || '');
  const [hqAddressInput, setHqAddressInput] = useState(moduleConfig.hqAddress || '');
  const [hqLatInput, setHqLatInput] = useState<string>(moduleConfig.hqLatitude ? String(moduleConfig.hqLatitude) : '0');
  const [hqLngInput, setHqLngInput] = useState<string>(moduleConfig.hqLongitude ? String(moduleConfig.hqLongitude) : '0');
  const [detectingGps, setDetectingGps] = useState(false);

  // Custom Holidays State
  const [customHolidaysList, setCustomHolidaysList] = useState<Array<{ date: string; name: string }>>(() => getCustomHolidays());
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');

  const handleAddHoliday = () => {
    if (!newHolidayDate || !newHolidayName.trim()) {
      if (showToast) showToast('Veuillez renseigner la date et le nom du jour férié', 'error');
      return;
    }
    addCustomHoliday(newHolidayDate, newHolidayName.trim());
    setCustomHolidaysList(getCustomHolidays());
    setNewHolidayDate('');
    setNewHolidayName('');
    if (showToast) showToast('Jour férié exceptionnel déclaré avec succès !', 'success');
  };

  const handleDeleteHoliday = (date: string) => {
    removeCustomHoliday(date);
    setCustomHolidaysList(getCustomHolidays());
    if (showToast) showToast('Jour férié exceptionnel supprimé', 'success');
  };

  // Sync state if moduleConfig prop changes (e.g. loaded from Firestore)
  React.useEffect(() => {
    setSecretInput(moduleConfig.qrCodeSecret || '');
    setAllowedIPs(moduleConfig.allowedOfficeIPs || []);
    setSites(moduleConfig.siteLocations || []);
    setHqNameInput(moduleConfig.hqName || '');
    setHqAddressInput(moduleConfig.hqAddress || '');
    setHqLatInput(moduleConfig.hqLatitude ? String(moduleConfig.hqLatitude) : '0');
    setHqLngInput(moduleConfig.hqLongitude ? String(moduleConfig.hqLongitude) : '0');
    setWorkStartInput(moduleConfig.workStartTime || '08:00');
    setLateThresholdInput(moduleConfig.lateThresholdTime || '08:15');
    setDefaultSalaryInput(moduleConfig.defaultSalary ? String(moduleConfig.defaultSalary) : '');
  }, [moduleConfig]);

  const handleSaveHQLocation = () => {
    const lat = parseFloat(hqLatInput) || 0;
    const lng = parseFloat(hqLngInput) || 0;
    const name = hqNameInput.trim();
    const address = hqAddressInput.trim();

    const updated = {
      ...moduleConfig,
      hqName: name,
      hqAddress: address,
      hqLatitude: lat,
      hqLongitude: lng
    };

    updateCompanyHQLocation({
      name,
      address,
      latitude: lat,
      longitude: lng
    });

    onUpdateModuleConfig(updated);
    triggerSuccess('Localisation du siège social enregistrée avec succès !');
  };

  const handleSaveCollaboratorSettings = () => {
    const updated = {
      ...moduleConfig,
      workStartTime: workStartInput.trim() || '08:00',
      lateThresholdTime: lateThresholdInput.trim() || '08:15',
      defaultSalary: defaultSalaryInput ? Number(defaultSalaryInput) : 0
    };
    onUpdateModuleConfig(updated);
    triggerSuccess('Paramètres collaborateurs et horaires enregistrés !');
  };

  const handleDetectCurrentGPS = () => {
    if (!navigator.geolocation) return;
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setHqLatInput(String(pos.coords.latitude));
        setHqLngInput(String(pos.coords.longitude));
        setDetectingGps(false);
      },
      () => {
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const toggleModule = (key: keyof CompanyModuleConfig) => {
    const updated = {
      ...moduleConfig,
      [key]: !moduleConfig[key]
    };
    onUpdateModuleConfig(updated);
    triggerSuccess('Configuration du module mise à jour !');
  };

  const handleSaveQRSecret = () => {
    const updated = {
      ...moduleConfig,
      qrCodeSecret: secretInput.trim()
    };
    onUpdateModuleConfig(updated);
    triggerSuccess('Code secret QR / Sécurité enregistré !');
  };

  const handleAddWifiIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWifiIp.trim()) return;
    const updatedList = [...allowedIPs, newWifiIp.trim()];
    setAllowedIPs(updatedList);
    setNewWifiIp('');

    onUpdateModuleConfig({
      ...moduleConfig,
      allowedOfficeIPs: updatedList
    });
    triggerSuccess('Adresse IP autorisée ajoutée !');
  };

  const handleRemoveWifiIp = (index: number) => {
    const updatedList = allowedIPs.filter((_, i) => i !== index);
    setAllowedIPs(updatedList);
    onUpdateModuleConfig({
      ...moduleConfig,
      allowedOfficeIPs: updatedList
    });
    triggerSuccess('Adresse IP retirée avec succès !');
  };

  const handleAddSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim() || !newSiteAddr.trim()) return;
    const newSite = {
      name: newSiteName.trim(),
      address: newSiteAddr.trim(),
      lat: COMPANY_HQ_LOCATION.latitude,
      lng: COMPANY_HQ_LOCATION.longitude
    };
    const updatedSites = [...sites, newSite];
    setSites(updatedSites);
    setNewSiteName('');
    setNewSiteAddr('');

    onUpdateModuleConfig({
      ...moduleConfig,
      siteLocations: updatedSites
    });
    triggerSuccess('Nouveau site de travail ajouté !');
  };

  const handleRemoveSite = (index: number) => {
    const updatedSites = sites.filter((_, i) => i !== index);
    setSites(updatedSites);
    onUpdateModuleConfig({
      ...moduleConfig,
      siteLocations: updatedSites
    });
    triggerSuccess('Site de travail retiré avec succès !');
  };

  const handleActivateAll = () => {
    onUpdateModuleConfig({
      ...moduleConfig,
      enableFinances: true,
      enableDocuments: true,
      enableCommunications: true,
      enableLogs: true,
      enableInventory: true,
      enablePartners: true,
      enableOrgChart: true,
      enableDiscipline: true,
      enableStatistics: true,
      enableTeamCalls: true,
      enableCalls: true
    });
    triggerSuccess('Tous les modules ont été activés !');
  };

  const handleSimplifyForSmallTeam = () => {
    onUpdateModuleConfig({
      ...moduleConfig,
      enableFinances: false,
      enableDocuments: false,
      enableCommunications: false,
      enableLogs: false,
      enableInventory: false,
      enablePartners: false,
      enableOrgChart: false,
      enableDiscipline: true,
      enableStatistics: true,
      enableTeamCalls: true,
      enableCalls: true
    });
    triggerSuccess('Mode Équipe Restreinte activé !');
  };

  const triggerSuccess = (msg: string = 'Paramètres enregistrés avec succès !') => {
    setSavedSuccess(true);
    if (showToast) {
      showToast(msg, 'success');
    }
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const activeCount = Object.values(moduleConfig).filter(Boolean).length;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(secretInput)}`;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-[#F0FAFA] rounded-3xl p-6 sm:p-8 text-stone-900 border border-cyan-200/90 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 tracking-tight">
            Configuration des Modules Citrine Management
          </h1>

          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={handleSimplifyForSmallTeam}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                activeCount === 0 
                  ? 'bg-emerald-700 text-white shadow-sm' 
                  : 'bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200/90'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>Mode Équipe Restreinte (Essentiel)</span>
            </button>
            <button
              onClick={handleActivateAll}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-2xs ${
                activeCount === 4 
                  ? 'bg-emerald-700 text-white shadow-sm' 
                  : 'bg-white hover:bg-emerald-50 text-stone-700 border border-stone-200/90'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Mode Entreprise Étendue (Tous les modules)</span>
            </button>
          </div>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-900 text-xs font-semibold shadow-sm animate-fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Paramètres mis à jour ! Le menu et les configurations ont été réorganisés automatiquement.</span>
          </div>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 bg-stone-100 p-1.5 rounded-2xl border border-stone-200 shadow-inner">
        <button
          onClick={() => setActiveTab('modules')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'modules'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <Layers className="h-4 w-4 text-emerald-400" />
          <span>🧩 Modules</span>
        </button>

        <button
          onClick={() => setActiveTab('collaborators')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'collaborators'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <Users className="h-4 w-4 text-emerald-400" />
          <span>👥 Collaborateurs</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'security'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <QrCode className="h-4 w-4 text-emerald-400" />
          <span>🔒 Sécurité & QR</span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`py-3 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'database'
              ? 'bg-emerald-900 text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
          }`}
        >
          <Database className="h-4 w-4 text-emerald-400" />
          <span>🗄️ Base de Données</span>
        </button>
      </div>

      {activeTab === 'modules' && (
        <>
          {/* Modules Toggles Grid */}
          <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
            <div>
              <h2 className="text-lg font-serif font-bold text-green-950 flex items-center gap-2">
                <Layers className="h-5 w-5 text-green-600" />
                <span>Activation / Masquage des Modules Avancés</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Module 1: Gestion des Inventaires */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableInventory 
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableInventory ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Gestion des Inventaires</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Suivi de la désignation du produit, des quantités en stock, de l'état (neuf, bon état, endommagé...) et des emplacements.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Gestion complète du parc matériel et équipements.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enableInventory')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableInventory ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableInventory ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module: Gestion des Partenaires */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enablePartners 
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enablePartners ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Gestion des Partenaires</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Annuaire des partenaires (motomen, taximen, particuliers, fournisseurs, prestataires), statuts et export CSV.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Réseau et relations partenaires.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enablePartners')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enablePartners ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enablePartners ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module 2: Finances & Salaires */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableFinances 
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableFinances ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Finances & Salaires</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Gestion des fiches de paie, salaires de base, primes, acomptes et transactions de charges.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Recommandé dès 15-20 collaborateurs.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enableFinances')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableFinances ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableFinances ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module 2: Génération de Documents */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableDocuments 
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableDocuments ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Procédures & Documents</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Générateur automatique de contrats de travail, attestations d'emploi et modèles RH.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Utile pour le recrutement et la conformité administrative.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enableDocuments')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableDocuments ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableDocuments ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module 3: Communications */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableCommunications 
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableCommunications ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <Send className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Communications Automatisées</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Module d'envoi de messages WhatsApp Cloud API et notifications d'alertes par email.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Avis d'absences et rapports journaliers WhatsApp.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enableCommunications')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableCommunications ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableCommunications ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module 4: Journal & Audit */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableLogs 
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableLogs ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <Terminal className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Journal & Audit System</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Console d'historique technique, logs de notification et traçabilité globale.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Pour la vérification technique et l'audit.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enableLogs')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableLogs ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableLogs ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>


              {/* Module 6: Organigramme & Structure */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableOrgChart 
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableOrgChart ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Organigramme & Structure</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Visualisation hiérarchique dynamique de l'entreprise, cartographie des départements et annuaire d'équipe.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Indispensable pour clarifier la gouvernance et le reporting.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enableOrgChart')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableOrgChart ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableOrgChart ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module 7: Discipline & Sanctions */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableDiscipline !== false
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableDiscipline !== false ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <Scale className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Discipline & Sanctions RH</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Journal officiel des manquements, registre des sanctions légales et génération automatique de lettres disciplinaires PDF.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Protection juridique et conformité avec le Code du Travail.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enableDiscipline')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableDiscipline !== false ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableDiscipline !== false ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module 8: Statistiques & Assiduité */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableStatistics !== false
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableStatistics !== false ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <BarChart3 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Statistiques & Assiduité</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Tableaux de bord d'analyse de ponctualité, taux de présence, retards et métriques de performance de l'équipe.
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Indicateurs clés de performance et rapports RH.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleModule('enableStatistics')}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableStatistics !== false ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableStatistics !== false ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>

              {/* Module 9: Appels d'Équipe & VoIP */}
              <div className={`p-5 rounded-2xl border transition-all ${
                moduleConfig.enableTeamCalls !== false && moduleConfig.enableCalls !== false
                  ? 'bg-green-50/50 border-green-200 shadow-2xs' 
                  : 'bg-stone-50/50 border-stone-200 opacity-80'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl text-white ${moduleConfig.enableTeamCalls !== false && moduleConfig.enableCalls !== false ? 'bg-green-600' : 'bg-stone-400'}`}>
                      <PhoneCall className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm">Appels d'Équipe & VoIP</h3>
                      <p className="text-stone-500 text-xs mt-0.5 leading-relaxed">
                        Communication interne gratuite et sécurisée en temps réel (appels audio et vidéo entre collaborateurs).
                      </p>
                      <div className="mt-2 text-[10px] text-stone-400">
                        Coordination instantanée sans coût téléphonique externe.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newState = !(moduleConfig.enableTeamCalls !== false && moduleConfig.enableCalls !== false);
                      onUpdateModuleConfig({
                        ...moduleConfig,
                        enableTeamCalls: newState,
                        enableCalls: newState
                      });
                    }}
                    className="cursor-pointer shrink-0 text-green-600 hover:text-green-700"
                    title={moduleConfig.enableTeamCalls !== false && moduleConfig.enableCalls !== false ? "Désactiver le module" : "Activer le module"}
                  >
                    {moduleConfig.enableTeamCalls !== false && moduleConfig.enableCalls !== false ? (
                      <ToggleRight className="h-8 w-8 text-green-600" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-stone-300" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>


        </>
      )}

      {activeTab === 'collaborators' && (
        <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in">
          <div>
            <h2 className="text-lg font-serif font-bold text-green-950 flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              <span>Paramètres des Collaborateurs, Horaires & Pointage</span>
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Configurez les paramètres globaux applicables lors de la création de nouveaux collaborateurs et du calcul automatique des retards.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Work start time */}
            <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200">
              <label className="text-xs font-bold text-stone-800 uppercase block">
                Heure Officielle de Prise de Poste (Début)
              </label>
              <p className="text-[11px] text-stone-500">
                Tout pointage d'arrivée enregistré avant cette heure sera automatiquement ajusté à cette heure exacte.
              </p>
              <input
                type="time"
                value={workStartInput}
                onChange={(e) => setWorkStartInput(e.target.value)}
                className="w-full text-sm font-mono p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-green-500 font-bold"
              />
            </div>

            {/* Late threshold time */}
            <div className="space-y-2 bg-green-50/50 p-4 rounded-2xl border border-green-200">
              <label className="text-xs font-bold text-green-950 uppercase block flex items-center justify-between">
                <span>Seuil d'Heure de Retard</span>
                <span className="text-[10px] bg-green-200 text-green-900 font-bold px-2 py-0.5 rounded-full">Variable Éditable</span>
              </label>
              <p className="text-[11px] text-stone-600">
                L'arrivée est considérée comme <strong className="text-green-700">En Retard</strong> strictement à partir de l'heure définie ci-dessous.
              </p>
              <input
                type="time"
                value={lateThresholdInput}
                onChange={(e) => setLateThresholdInput(e.target.value)}
                className="w-full text-sm font-mono p-2.5 bg-white border border-green-300 rounded-xl focus:outline-green-500 font-bold text-green-900"
              />
            </div>

            {/* Default Salary */}
            <div className="space-y-2 bg-stone-50 p-4 rounded-2xl border border-stone-200 md:col-span-2">
              <label className="text-xs font-bold text-stone-800 uppercase block">
                Salaire Brut de Base par Défaut (XAF)
              </label>
              <p className="text-[11px] text-stone-500">
                Spécifiez un montant pré-rempli lors de la création d'un nouveau collaborateur (laissez vide si non applicable par défaut).
              </p>
              <input
                type="number"
                placeholder="Ex. 350000 (ou laisser vide)"
                value={defaultSalaryInput}
                onChange={(e) => setDefaultSalaryInput(e.target.value)}
                className="w-full text-sm p-2.5 bg-white border border-stone-300 rounded-xl focus:outline-green-500"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              onClick={handleSaveCollaboratorSettings}
              className="bg-green-950 hover:bg-green-900 text-white font-bold text-xs px-6 py-3 rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer"
            >
              <Save className="h-4 w-4 text-green-400" />
              <span>Enregistrer les paramètres collaborateurs</span>
            </button>
          </div>

          {/* DECLARATION DE JOURS FERIES EXCEPTIONNELS */}
          <div className="bg-stone-50 rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6 mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-4">
              <div>
                <h3 className="text-base font-serif font-bold text-green-950 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>Jours Fériés Exceptionnels & Personnalisés</span>
                </h3>
                <p className="text-stone-500 text-xs mt-1">
                  En plus des jours fériés légaux du Cameroun et des weekends, déclarez ici des jours fériés exceptionnels (ponts, fermetures spéciales). Aucun retard ou sanction ne sera appliqué ces jours-là.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold self-start sm:self-auto">
                {customHolidaysList.length} Férié(s) Déclaré(s)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 uppercase">Date du jour férié</label>
                <input
                  type="date"
                  value={newHolidayDate}
                  onChange={(e) => setNewHolidayDate(e.target.value)}
                  className="w-full text-sm p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-green-500 font-mono"
                />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-bold text-stone-700 uppercase">Intitulé / Nom du jour férié</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ex. Fête patronale / Pont spécial"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    className="flex-1 text-sm p-2.5 bg-stone-50 border border-stone-300 rounded-xl focus:outline-green-500"
                  />
                  <button
                    onClick={handleAddHoliday}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Déclarer</span>
                  </button>
                </div>
              </div>
            </div>

            {customHolidaysList.length > 0 ? (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-stone-600 uppercase tracking-wider">Jours fériés exceptionnels enregistrés :</h4>
                <div className="divide-y divide-stone-200 border border-stone-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                  {customHolidaysList.map((h) => (
                    <div key={h.date} className="flex items-center justify-between p-3.5 hover:bg-stone-50 transition">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs bg-green-50 text-green-800 px-2.5 py-1 rounded-lg border border-green-200">
                          {h.date}
                        </span>
                        <span className="text-xs font-bold text-stone-800">{h.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(h.date)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title="Supprimer ce jour férié"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-stone-400 italic text-center py-4 bg-white/50 rounded-2xl border border-dashed border-stone-300">
                Aucun jour férié exceptionnel déclaré pour le moment.
              </p>
            )}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-6 animate-fade-in">
          {/* SECTION 0: CODES DE BADGEAGE 16 CARACTÈRES (RESPONSABLE) */}
          <Badge16CodeManager showToast={showToast} />

          {/* SECTION 1: MODULE DE GÉNÉRATION & IMPRESSION DE QR CODE (ADMINISTRATION) */}
          <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
              <div>
                <h2 className="text-lg font-serif font-bold text-green-950 flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-green-600" />
                  <span>Affiche QR Code Officiel à Imprimer pour la Porte d'Entrée</span>
                </h2>
                <p className="text-stone-500 text-xs mt-1">
                  Téléchargez ou imprimez cette affiche. À l'arrivée, le collaborateur scanne ce QR Code avec son smartphone pour badger instantanément.
                </p>
              </div>
              <span className="px-3 py-1 bg-green-50 text-green-900 border border-green-200 rounded-full text-xs font-bold self-start sm:self-auto">
                Sécurité Pointage QR
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* Left: Interactive QR Code Image Preview */}
              <div className="md:col-span-4 bg-gradient-to-br from-green-50 to-stone-50 p-6 rounded-2xl border border-green-200 flex flex-col items-center justify-center text-center space-y-3">
                <div className="bg-white p-3 rounded-2xl shadow-md border border-green-200">
                  <img src={qrImageUrl} alt="QR Code Entreprise" className="w-32 h-32 object-contain" />
                </div>
                <div className="text-[11px] font-mono font-bold text-green-950 bg-white px-3 py-1 rounded-lg border border-green-200">
                  {secretInput}
                </div>
              </div>

              {/* Right: Secret Code Configuration Form */}
              <div className="md:col-span-8 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700">Code Secret Unique QR Code :</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={secretInput}
                      onChange={(e) => setSecretInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
                      placeholder="ex: CITRINE-HQ-8829"
                    />
                    <button
                      onClick={handleSaveQRSecret}
                      className="px-4 py-2.5 bg-green-900 hover:bg-green-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
                    >
                      <Save className="h-4 w-4" />
                      <span>Enregistrer Secret</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-400">
                    Toutes les affiches imprimées et téléphones réutiliseront ce jeton secret pour la certification du site.
                  </p>
                </div>



                <div className="pt-2 flex flex-wrap gap-3">
                  <button
                    onClick={() => setShowQRModal(true)}
                    className="px-4 py-2.5 bg-green-900 hover:bg-green-950 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <Printer className="h-4 w-4 text-green-300" />
                    <span>Imprimer / Télécharger l'Affiche QR Porte</span>
                  </button>

                  <button
                    onClick={() => setShowKioskModal(true)}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm"
                  >
                    <Tablet className="h-4 w-4 text-emerald-200" />
                    <span>Ouvrir la Borne QR Code (Mode Tablette)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CONTRÔLE ET LOGIQUE ANTI-FRAUDE IP / APPAREIL */}
          <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-serif font-bold text-green-950 flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-600" />
                <span>Sécurité Traçabilité IP & Empreinte Appareil (Journalier)</span>
              </h2>
              <p className="text-stone-500 text-xs mt-1">
                Le système enregistre automatiquement l'adresse IP et l'identifiant unique du smartphone lors de chaque scan du QR code.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-green-50/60 rounded-2xl border border-green-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-green-950">
                  <Lock className="h-4 w-4 text-green-600" />
                  <span>Blocage du Pointage par Procuration</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Si le même téléphone tente le même jour d'effectuer le pointage pour l'Employé B, la transaction est instantanément bloquée avec une alerte de sécurité.
                </p>
              </div>

              <div className="p-4 bg-green-50/60 rounded-2xl border border-green-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-green-950">
                  <RefreshCw className="h-4 w-4 text-green-600" />
                  <span>Réinitialisation Automatique à Minuit</span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Le lendemain, l'association IP / Appareil est réinitialisée. Un smartphone pourra ainsi être réutilisé pour un autre utilisateur le jour suivant si nécessaire.
                </p>
              </div>
            </div>

            {/* Wi-Fi Networks Info */}
            <div className="p-4 bg-stone-50 border border-stone-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-800 flex items-center gap-2">
                  <Wifi className="h-4 w-4 text-green-600" />
                  <span>Réseaux Wi-Fi Entreprise Capturés ({allowedIPs.length})</span>
                </label>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  Captures Réseau Actives
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {allowedIPs.map((item, idx) => (
                  <div key={idx} className="p-2.5 bg-white border border-stone-200 rounded-xl flex items-center justify-between text-xs font-mono font-bold text-stone-800 shadow-2xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="truncate">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: SITES PHYSIQUES & COORDONNÉES GPS DU SIÈGE */}
          <div className="bg-white rounded-3xl border border-green-100 p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="border-b border-stone-100 pb-4">
              <h2 className="text-lg font-serif font-bold text-green-950 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-green-600" />
                <span>Sites Physiques et Localisation GPS Exacte du Siège</span>
              </h2>
              <p className="text-stone-500 text-xs mt-1">
                Position exacte de référence enregistrée pour les calculs de distance lors des pointages mobiles.
              </p>
            </div>

            {/* Main HQ Location Editable Form */}
            <div className="p-5 bg-gradient-to-br from-stone-900 to-green-950 text-white rounded-3xl space-y-4 shadow-md border border-green-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2 font-bold text-sm text-green-300">
                  <Building className="h-4.5 w-4.5" />
                  <span>Modification du Lieu & Position GPS du Siège</span>
                </div>
                <button
                  type="button"
                  onClick={handleDetectCurrentGPS}
                  disabled={detectingGps}
                  className="px-3 py-1.5 bg-green-900/80 hover:bg-green-800 text-green-100 rounded-xl text-xs font-bold border border-green-700/50 transition cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <MapPin className="h-3.5 w-3.5 text-green-400 animate-pulse" />
                  <span>{detectingGps ? 'Détection GPS en cours...' : '📍 Détecter ma Position Actuelle'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-bold">Nom du Lieu / Siège :</label>
                  <input
                    type="text"
                    value={hqNameInput}
                    onChange={(e) => setHqNameInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-900/80 border border-stone-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-green-500"
                    placeholder="ex: Bureau Principal - Douala III"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-bold">Adresse Physique Complexe :</label>
                  <input
                    type="text"
                    value={hqAddressInput}
                    onChange={(e) => setHqAddressInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-900/80 border border-stone-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-green-500"
                    placeholder="ex: Douala III, Cameroun"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-mono">Latitude GPS (° N) :</label>
                  <input
                    type="text"
                    value={hqLatInput}
                    onChange={(e) => setHqLatInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-900/80 border border-stone-700 rounded-xl text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-green-500"
                    placeholder="ex: 4.0157005"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-stone-300 font-mono">Longitude GPS (° E) :</label>
                  <input
                    type="text"
                    value={hqLngInput}
                    onChange={(e) => setHqLngInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-stone-900/80 border border-stone-700 rounded-xl text-xs font-mono font-bold text-emerald-300 focus:outline-none focus:border-green-500"
                    placeholder="ex: 9.8199832"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveHQLocation}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md"
                >
                  <Save className="h-4 w-4" />
                  <span>Enregistrer la Position GPS du Siège</span>
                </button>
              </div>
            </div>

            {/* Add Site Form */}
            <form onSubmit={handleAddSite} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <input
                type="text"
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="Nom du Site (ex: Bureau Annexe Bonanjo)"
                className="sm:col-span-5 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <input
                type="text"
                value={newSiteAddr}
                onChange={(e) => setNewSiteAddr(e.target.value)}
                placeholder="Adresse / Ville (ex: Bonanjo, Douala)"
                className="sm:col-span-5 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20"
              />
              <button
                type="submit"
                className="sm:col-span-2 px-4 py-2.5 bg-green-900 hover:bg-green-950 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>Ajouter Site</span>
              </button>
            </form>

            {/* Registered Sites List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700">Sites Enregistrés ({sites.length}) :</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sites.map((st, i) => (
                  <div key={i} className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-stone-900">{st.name}</h4>
                      <p className="text-[11px] text-stone-500">{st.address}</p>
                    </div>
                    {i > 0 && (
                      <button
                        onClick={() => handleRemoveSite(i)}
                        className="p-1 text-stone-400 hover:text-green-600 transition cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'database' && (
        <div className="space-y-6 animate-fade-in">
          {/* Main Database Reconstruction Card */}
          <div className="bg-[#F0FAFA] rounded-3xl p-6 sm:p-8 border border-cyan-200/90 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white text-emerald-700 rounded-2xl flex items-center justify-center border border-cyan-200 shadow-2xs">
                  <Database className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-stone-900">
                    Reconstruction & Initialisation Firestore
                  </h2>
                </div>
              </div>

              {!showSeedConfirm ? (
                <button
                  onClick={() => setShowSeedConfirm(true)}
                  disabled={isSeedingDb}
                  className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Server className="h-4 w-4" />
                  <span>Reconstruire / Peupler la Base</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRebuildDatabase}
                    disabled={isSeedingDb}
                    className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSeedingDb ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    <span>Confirmer la Reconstruction</span>
                  </button>
                  <button
                    onClick={() => setShowSeedConfirm(false)}
                    disabled={isSeedingDb}
                    className="px-3 py-2.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 font-bold text-xs border border-stone-200 transition cursor-pointer"
                  >
                    Annuler
                  </button>
                </div>
              )}
            </div>

            {showSeedConfirm && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Confirmation requise</p>
                  <p className="text-amber-800">
                    Cette opération va vérifier et créer toutes les collections Firestore nécessaires (Utilisateurs, Collaborateurs, Départements, Tâches, Rappels, Inventaire, Paramètres). Vos documents existants seront préservés et fusionnés.
                  </p>
                </div>
              </div>
            )}

            {seedResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-3 ${
                seedResult.success 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-sm">
                  {seedResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span>{seedResult.message}</span>
                </div>

                {seedResult.success && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/60">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Comptes Utilisateurs</span>
                      <strong className="text-base text-emerald-800">{seedResult.counts.users}</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Collaborateurs</span>
                      <strong className="text-base text-emerald-800">{seedResult.counts.employees}</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Départements</span>
                      <strong className="text-base text-emerald-800">{seedResult.counts.departments}</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Tâches & Jalons</span>
                      <strong className="text-base text-emerald-800">{seedResult.counts.tasks}</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Rappels de Gestion</span>
                      <strong className="text-base text-emerald-800">{seedResult.counts.reminders}</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Inventaire & Matériel</span>
                      <strong className="text-base text-emerald-800">{seedResult.counts.inventory}</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Partenaires</span>
                      <strong className="text-base text-emerald-800">{seedResult.counts.partners}</strong>
                    </div>
                    <div className="bg-white/80 p-2.5 rounded-xl border border-emerald-100 text-center">
                      <span className="text-[10px] text-stone-500 block uppercase font-bold">Paramètres Entreprise</span>
                      <strong className="text-base text-emerald-800">1</strong>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Firestore Collections Blueprint Status */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs space-y-4">
            <h3 className="text-lg font-serif font-bold text-stone-900 flex items-center gap-2">
              <Layers className="h-5 w-5 text-emerald-600" />
              <span>Cartographie des Collections Firestore</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { name: 'users', label: 'Comptes Utilisateurs', desc: 'Identifiants, rôles, hash PBKDF2' },
                { name: 'employees', label: 'Fiches Collaborateurs', desc: 'Postes, salaires, coordonnées' },
                { name: 'presences', label: 'Pointages & Horaires', desc: 'Arrivées, pauses, départs, GPS' },
                { name: 'tasks', label: 'Tâches & Sous-tâches', desc: 'Affectations, échéances, statuts' },
                { name: 'reminders', label: 'Rappels & Échéances', desc: 'Alertes fiscales, RH et compta' },
                { name: 'inventory_items', label: 'Inventaires & Stocks', desc: 'Matériel, quantités, valorisation' },
                { name: 'partners', label: 'Annuaire Partenaires', desc: 'Clients pro, prestataires, contrats' },
                { name: 'company_settings', label: 'Configuration Générale', desc: 'Horaires, tolérances, modules' }
              ].map((col) => (
                <div key={col.name} className="p-3.5 bg-stone-50 border border-stone-200/80 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-800">/{col.name}</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-2xs" title="Prêt" />
                  </div>
                  <h4 className="text-xs font-bold text-stone-900">{col.label}</h4>
                  <p className="text-[10px] text-stone-500 leading-tight">{col.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modals rendered directly within Admin Settings */}
      <OfficeQRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrSecret={secretInput}
        onLaunchKiosk={() => setShowKioskModal(true)}
      />

      <KioskClockingModal
        isOpen={showKioskModal}
        onClose={() => setShowKioskModal(false)}
        employees={employees}
        presences={presences}
        onUpdatePresences={onUpdatePresences}
        onAddNotification={onAddNotification}
        qrSecret={secretInput}
      />
    </div>
  );
}
