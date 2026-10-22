import React, { useState, useEffect, useMemo } from 'react';
import { X, UserCheck, Wrench, ShieldCheck, Clock, CheckCircle2, History } from 'lucide-react';
import { VisitorLog, VisitorPurpose, Employee, PersonType, WorkerDomain, VisitorStatus } from '../../types';
import { subscribeToBuildingSupervisors, BuildingSupervisor } from '../../services/supervisorService';
import { SearchableSelect, SelectOption } from '../common/SearchableSelect';

interface NewVisitorModalProps {
  employees: Employee[];
  visitorsCount: number;
  knownWorkers?: VisitorLog[];
  onClose: () => void;
  onSubmit: (visitorData: Partial<VisitorLog>) => Promise<void>;
}

export const NewVisitorModal: React.FC<NewVisitorModalProps> = ({
  employees,
  visitorsCount,
  knownWorkers = [],
  onClose,
  onSubmit,
}) => {
  const [personType, setPersonType] = useState<PersonType>('visiteur');
  const [supervisors, setSupervisors] = useState<BuildingSupervisor[]>([]);

  // Écouter les superviseurs directement depuis la BD
  useEffect(() => {
    const unsub = subscribeToBuildingSupervisors(setSupervisors);
    return () => unsub();
  }, []);

  // Sélection travailleur connu vs nouveau
  const [selectedKnownWorkerId, setSelectedKnownWorkerId] = useState<string>('');

  // Contrôles de validation selon logigramme
  const [isPreAuthorized, setIsPreAuthorized] = useState<boolean>(true);
  const [dualValidationOk, setDualValidationOk] = useState<boolean>(false);
  const [hostConfirmed, setHostConfirmed] = useState<boolean>(true);

  // Filtrer les travailleurs uniques déjà enregistrés dans le système
  const uniqueKnownWorkers: VisitorLog[] = useMemo(() => {
    const map = new Map<string, VisitorLog>();
    knownWorkers
      .filter((w) => w.personType === 'travailleur')
      .forEach((w) => {
        const key = w.visitorName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, w);
        }
      });
    return Array.from(map.values());
  }, [knownWorkers]);

  const [formData, setFormData] = useState<Partial<VisitorLog>>({
    personType: 'visiteur',
    workerDomain: 'electricite',
    supervisorName: '',
    interventionPerimeter: 'Locaux Techniques - Immeuble Citrine',
    visitorName: '',
    visitorCompany: '',
    visitorPhone: '',
    idCardNumber: '',
    siteLocation: 'Siège Japoma (Carrefour Matango)',
    purpose: 'rdv_commercial',
    hostEmployeeId: '',
    hostEmployeeName: '',
    badgeNumber: `BADGE-${String(visitorsCount + 1).padStart(2, '0')}`,
    vehiclePlate: '',
    notes: '',
  });

  // Quand les superviseurs chargent, initialiser le premier superviseur si non défini
  useEffect(() => {
    if (supervisors.length > 0 && !formData.supervisorName) {
      setFormData((prev) => ({
        ...prev,
        supervisorName: supervisors[0].supervisorName,
        workerDomain: (supervisors[0].domain as WorkerDomain) || 'electricite',
      }));
    }
  }, [supervisors, formData.supervisorName]);

  const handlePersonTypeChange = (type: PersonType) => {
    setPersonType(type);
    setSelectedKnownWorkerId('');
    setFormData((prev) => ({
      ...prev,
      personType: type,
    }));
  };

  const handleSelectKnownWorker = (workerId: string | number) => {
    const strId = String(workerId);
    setSelectedKnownWorkerId(strId);
    if (!strId) return;

    const matched = uniqueKnownWorkers.find((w) => String(w.id) === strId);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        visitorName: matched.visitorName,
        visitorCompany: matched.visitorCompany,
        visitorPhone: matched.visitorPhone,
        idCardNumber: matched.idCardNumber || 'CNI archivée',
        workerDomain: matched.workerDomain || 'electricite',
        supervisorName: matched.supervisorName || prev.supervisorName,
        interventionPerimeter: matched.interventionPerimeter || prev.interventionPerimeter,
        vehiclePlate: matched.vehiclePlate || prev.vehiclePlate,
      }));
      setIsPreAuthorized(true);
    }
  };

  const handleDomainChange = (domainVal: string | number) => {
    const domain = String(domainVal) as WorkerDomain;
    const matched = supervisors.find((s) => s.domain === domain);
    setFormData((prev) => ({
      ...prev,
      workerDomain: domain,
      supervisorName: matched ? matched.supervisorName : prev.supervisorName,
    }));
  };

  const computeAccessStatus = (): VisitorStatus => {
    if (personType === 'travailleur') {
      if (isPreAuthorized) return 'sur_site';
      return dualValidationOk ? 'sur_site' : 'attente_validation';
    } else {
      return hostConfirmed ? 'sur_site' : 'attente_validation';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalStatus = computeAccessStatus();

    await onSubmit({
      ...formData,
      personType,
      status: finalStatus,
      isPreAuthorized: personType === 'travailleur' ? isPreAuthorized : undefined,
      authorizationConfirmed: personType === 'travailleur' 
        ? (isPreAuthorized || dualValidationOk) 
        : hostConfirmed,
    });
  };

  const computedStatus = computeAccessStatus();
  const isExistingWorkerSelected = personType === 'travailleur' && Boolean(selectedKnownWorkerId);

  // Options pour SearchableSelect (Select2)
  const knownWorkersOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: '-- Nouveau travailleur (Saisie complète) --' },
      ...uniqueKnownWorkers.map((w) => ({
        value: w.id,
        label: `${w.visitorName} (${w.visitorCompany || 'BTP'})`,
        description: `Domaine: ${w.workerDomain || 'Technique'} • CNI: ${w.idCardNumber || 'Archivée'}`,
      })),
    ];
  }, [uniqueKnownWorkers]);

  const domainOptions: SelectOption[] = useMemo(() => {
    const seen = new Set<string>();
    const list: SelectOption[] = [];
    for (const s of supervisors) {
      if (s.domain && !seen.has(s.domain)) {
        seen.add(s.domain);
        list.push({
          value: s.domain,
          label: s.label || s.domain,
          description: `Superviseur : ${s.supervisorName}`,
        });
      }
    }
    return list;
  }, [supervisors]);

  const supervisorOptions: SelectOption[] = useMemo(() => {
    const seen = new Set<string>();
    const list: SelectOption[] = [];
    for (const s of supervisors) {
      const val = s.supervisorName?.trim();
      if (val && !seen.has(val)) {
        seen.add(val);
        list.push({
          value: val,
          label: val,
          description: `${s.label} ${s.phone ? `• Tél: ${s.phone}` : ''}`,
        });
      }
    }
    return list;
  }, [supervisors]);

  const hostEmployeeOptions: SelectOption[] = useMemo(() => {
    return [
      { value: '', label: '-- Sélectionner l\'hôte Citrine --' },
      ...employees.map((e) => ({
        value: e.id,
        label: e.name,
        description: `${e.department || 'Citrine'} ${e.role ? `• ${e.role}` : ''}`,
      })),
    ];
  }, [employees]);

  const purposeOptions: SelectOption[] = [
    { value: 'rdv_commercial', label: 'RDV Commercial / Vente' },
    { value: 'entretien_embauche', label: 'Entretien de Recrutement' },
    { value: 'livraison_colis', label: 'Livraison Colis / Fret' },
    { value: 'prestataire_technique', label: 'Visite Technique / Prestataire' },
    { value: 'partenaire_institutionnel', label: 'Partenaire (Yango / Gozem / État)' },
    { value: 'reunion_direction', label: 'Réunion de Direction' },
    { value: 'autre', label: 'Autre motif' },
  ];

  const siteOptions: SelectOption[] = [
    { value: 'Siège Japoma (Carrefour Matango)', label: 'Siège Japoma (Carrefour Matango)' },
    { value: 'Base Logistique Japoma', label: 'Base Logistique Japoma' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-stone-200 shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Entête */}
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Contrôle des Accès Bâtiment Citrine</h3>
              <p className="text-[11px] text-stone-500">
                Siège Japoma (Carrefour Matango) • Registre Numérique d'Émargement
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sélection Type : Visiteur vs Travailleur */}
        <div>
          <label className="font-bold text-xs text-stone-700 mb-1.5 block">
            Catégorie de la personne extérieure :
          </label>
          <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => handlePersonTypeChange('visiteur')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                personType === 'visiteur'
                  ? 'bg-white text-[#2A7B76] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#2A7B76]" />
              <span>Visiteur (Rendez-vous / Client)</span>
            </button>
            <button
              type="button"
              onClick={() => handlePersonTypeChange('travailleur')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                personType === 'travailleur'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-700" />
              <span>Travailleur Immeuble (Supervisé)</span>
            </button>
          </div>
        </div>

        {/* Pour Travailleur : Sélection d'un travailleur existant via SearchableSelect (Select 2) */}
        {personType === 'travailleur' && uniqueKnownWorkers.length > 0 && (
          <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                <History className="w-4 h-4 text-amber-700" />
                <span>Travailleur déjà enregistré dans le bâtiment ?</span>
              </label>
              <span className="text-[10px] text-amber-700 font-semibold bg-white px-2 py-0.5 rounded border border-amber-200">
                CNI déjà archivée
              </span>
            </div>

            <SearchableSelect
              options={knownWorkersOptions}
              value={selectedKnownWorkerId}
              onChange={handleSelectKnownWorker}
              placeholder="Rechercher un travailleur existant (nom, entreprise)..."
              searchPlaceholder="Taper le nom ou entreprise du travailleur..."
              size="sm"
            />

            {isExistingWorkerSelected && (
              <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Profil chargé automatiquement : la CNI a déjà été contrôlée et archivée.</span>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {/* Identité */}
          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/70 space-y-3">
            <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider text-stone-500">
              1. Identité de la personne
            </p>

            <div>
              <label className="font-semibold text-stone-700">Nom & Prénom *</label>
              <input
                type="text"
                required
                placeholder={personType === 'travailleur' ? "ex: Emmanuel Ndongo" : "ex: Patrick Manga"}
                value={formData.visitorName}
                onChange={(e) => setFormData({ ...formData, visitorName: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white focus:outline-none focus:border-[#2A7B76]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700">
                  {personType === 'travailleur' ? "Entreprise Prestataire *" : "Entreprise / Société"}
                </label>
                <input
                  type="text"
                  required={personType === 'travailleur'}
                  placeholder={personType === 'travailleur' ? "ex: SARL Élec Douala" : "ex: CTL Logistics"}
                  value={formData.visitorCompany}
                  onChange={(e) => setFormData({ ...formData, visitorCompany: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700">N° Téléphone *</label>
                <input
                  type="text"
                  required
                  placeholder="+237 6..."
                  value={formData.visitorPhone}
                  onChange={(e) => setFormData({ ...formData, visitorPhone: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-stone-700">
                    N° Pièce Identité (CNI / Passeport) {isExistingWorkerSelected ? '' : '*'}
                  </label>
                  {isExistingWorkerSelected && (
                    <span className="text-[10px] text-emerald-700 font-bold">Déjà validé</span>
                  )}
                </div>
                <input
                  type="text"
                  required={!isExistingWorkerSelected}
                  placeholder={isExistingWorkerSelected ? "CNI déjà archivée" : "ex: 118472948"}
                  value={formData.idCardNumber}
                  onChange={(e) => setFormData({ ...formData, idCardNumber: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700">Immatriculation Véhicule</label>
                <input
                  type="text"
                  placeholder="ex: LT 302 AD"
                  value={formData.vehiclePlate}
                  onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white uppercase font-mono"
                />
              </div>
            </div>
          </div>

          {/* Vérification de l'Autorisation */}
          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/70 space-y-3">
            <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider text-stone-500">
              2. Vérification de l'autorisation d'accès
            </p>

            {personType === 'travailleur' ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Domaine d'intervention *</label>
                    <SearchableSelect
                      options={domainOptions}
                      value={formData.workerDomain || 'electricite'}
                      onChange={handleDomainChange}
                      placeholder="Sélectionner le domaine..."
                      searchPlaceholder="Rechercher un domaine..."
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Superviseur Désigné (BD) *</label>
                    <SearchableSelect
                      options={supervisorOptions}
                      value={formData.supervisorName || ''}
                      onChange={(val) => setFormData({ ...formData, supervisorName: String(val) })}
                      placeholder="Sélectionner le superviseur..."
                      searchPlaceholder="Rechercher le superviseur..."
                      size="sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-stone-700 block mb-1">Périmètre autorisé dans l'immeuble *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: Local Technique RDC, Gaine 2ème étage..."
                    value={formData.interventionPerimeter}
                    onChange={(e) => setFormData({ ...formData, interventionPerimeter: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-white text-stone-800"
                  />
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <label className="font-bold text-amber-950 block">
                    Référencé sur la liste préalable transmise par le prestataire ?
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-800">
                      <input
                        type="radio"
                        name="preAuth"
                        checked={isPreAuthorized === true}
                        onChange={() => setIsPreAuthorized(true)}
                        className="text-[#2A7B76]"
                      />
                      <span>Oui, autorisé sur liste (Accès immédiat)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-800">
                      <input
                        type="radio"
                        name="preAuth"
                        checked={isPreAuthorized === false}
                        onChange={() => setIsPreAuthorized(false)}
                        className="text-amber-700"
                      />
                      <span>Non référencé</span>
                    </label>
                  </div>

                  {!isPreAuthorized && (
                    <div className="pt-2 border-t border-amber-200/80 space-y-1.5 animate-in fade-in">
                      <p className="text-[11px] text-amber-900 font-semibold">
                        ⚠️ Travailleur non référencé : Validations requises du Prestataire ET du Superviseur Citrine.
                      </p>
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-stone-900 bg-white p-2 rounded-lg border border-amber-300">
                        <input
                          type="checkbox"
                          checked={dualValidationOk}
                          onChange={(e) => setDualValidationOk(e.target.checked)}
                          className="h-4 w-4 rounded text-[#2A7B76]"
                        />
                        <span>Accord obtenu : Prestataire a validé ET Citrine a validé</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Personne visitée (Hôte Citrine) *</label>
                    <SearchableSelect
                      options={hostEmployeeOptions}
                      value={formData.hostEmployeeId || ''}
                      onChange={(val) => {
                        const strVal = String(val);
                        const emp = employees.find((e) => String(e.id) === strVal);
                        setFormData({
                          ...formData,
                          hostEmployeeId: strVal,
                          hostEmployeeName: emp ? emp.name : 'Direction Citrine',
                          hostDepartment: emp ? emp.department : 'Services Généraux',
                        });
                      }}
                      placeholder="Sélectionner l'hôte..."
                      searchPlaceholder="Rechercher par nom d'employé..."
                      size="sm"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-stone-700 block mb-1">Motif de la visite *</label>
                    <SearchableSelect
                      options={purposeOptions}
                      value={formData.purpose || 'rdv_commercial'}
                      onChange={(val) => setFormData({ ...formData, purpose: val as VisitorPurpose })}
                      placeholder="Sélectionner le motif..."
                      searchPlaceholder="Rechercher un motif..."
                      size="sm"
                    />
                  </div>
                </div>

                <div className="p-2.5 bg-stone-100 rounded-xl border border-stone-200 space-y-2">
                  <label className="font-bold text-stone-900 block">
                    Personne visitée contactée par le gardien : Confirme-t-elle la visite ?
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-800">
                      <input
                        type="radio"
                        name="hostConf"
                        checked={hostConfirmed === true}
                        onChange={() => setHostConfirmed(true)}
                        className="text-[#2A7B76]"
                      />
                      <span>Oui, visite confirmée (Accès accordé)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-800">
                      <input
                        type="radio"
                        name="hostConf"
                        checked={hostConfirmed === false}
                        onChange={() => setHostConfirmed(false)}
                        className="text-amber-700"
                      />
                      <span>Non / En attente (Attente accueil sans accès)</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Badge & Site */}
          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/70 space-y-3">
            <div className="flex items-center justify-between">
              <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider text-stone-500">
                3. Enregistrement & Badge
              </p>
              {computedStatus === 'sur_site' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Accès Autorisé
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                  <Clock className="w-3.5 h-3.5" />
                  Attente à l'accueil
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Site d'accueil *</label>
                <SearchableSelect
                  options={siteOptions}
                  value={formData.siteLocation || 'Siège Japoma (Carrefour Matango)'}
                  onChange={(val) => setFormData({ ...formData, siteLocation: String(val) })}
                  size="sm"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">N° de Badge remis *</label>
                <input
                  type="text"
                  required
                  placeholder="ex: BADGE-01"
                  value={formData.badgeNumber}
                  onChange={(e) => setFormData({ ...formData, badgeNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-200 rounded-xl bg-white font-mono uppercase font-bold text-stone-800"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-stone-700">Consignes / Remarques</label>
              <textarea
                rows={2}
                placeholder="Consignes, matériel apporté, etc."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-xl bg-white resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-stone-100">
            <div className="text-[11px] text-stone-500 italic">
              « Le registre PAPIER fait foi. Le registre NUMÉRIQUE sert de copie conforme. »
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#2A7B76] text-white rounded-xl font-bold hover:bg-[#22635f] transition cursor-pointer shadow-xs"
              >
                {computedStatus === 'sur_site' ? "Enregistrer l'Entrée & Valider" : "Enregistrer en Attente Accueil"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
