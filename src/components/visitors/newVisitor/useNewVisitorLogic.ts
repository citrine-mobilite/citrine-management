import React, { useState, useEffect, useMemo } from 'react';
import { VisitorLog, Employee, PersonType, WorkerDomain, VisitorStatus } from '../../../types';
import { subscribeToBuildingSupervisors, BuildingSupervisor } from '../../../services/supervisorService';
import { SelectOption } from '../../common/SearchableSelect';

interface UseNewVisitorLogicProps {
  employees: Employee[];
  visitorsCount: number;
  knownWorkers: VisitorLog[];
  onSubmit: (visitorData: Partial<VisitorLog>) => Promise<void>;
}

export const VISITOR_PURPOSE_OPTIONS: SelectOption[] = [
  { value: 'rdv_commercial', label: 'RDV Commercial / Vente' },
  { value: 'entretien_embauche', label: 'Entretien de Recrutement' },
  { value: 'livraison_colis', label: 'Livraison Colis / Fret' },
  { value: 'prestataire_technique', label: 'Visite Technique / Prestataire' },
  { value: 'partenaire_institutionnel', label: 'Partenaire (Yango / Gozem / État)' },
  { value: 'reunion_direction', label: 'Réunion de Direction' },
  { value: 'autre', label: 'Autre motif' },
];

export const VISITOR_SITE_OPTIONS: SelectOption[] = [
  { value: 'Siège Japoma (Carrefour Matango)', label: 'Siège Japoma (Carrefour Matango)' },
  { value: 'Base Logistique Japoma', label: 'Base Logistique Japoma' },
];

export function useNewVisitorLogic({
  employees,
  visitorsCount,
  knownWorkers,
  onSubmit,
}: UseNewVisitorLogicProps) {
  const [personType, setPersonType] = useState<PersonType>('visiteur');
  const [supervisors, setSupervisors] = useState<BuildingSupervisor[]>([]);
  const [selectedKnownWorkerId, setSelectedKnownWorkerId] = useState<string>('');
  const [isPreAuthorized, setIsPreAuthorized] = useState<boolean>(true);
  const [dualValidationOk, setDualValidationOk] = useState<boolean>(false);
  const [hostConfirmed, setHostConfirmed] = useState<boolean>(true);

  useEffect(() => {
    const unsub = subscribeToBuildingSupervisors(setSupervisors);
    return () => unsub();
  }, []);

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
    setFormData((prev) => ({ ...prev, personType: type }));
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
    }
    return hostConfirmed ? 'sur_site' : 'attente_validation';
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

  const knownWorkersOptions: SelectOption[] = useMemo(() => [
    { value: '', label: '-- Nouveau travailleur (Saisie complète) --' },
    ...uniqueKnownWorkers.map((w) => ({
      value: w.id,
      label: `${w.visitorName} (${w.visitorCompany || 'BTP'})`,
      description: `Domaine: ${w.workerDomain || 'Technique'} • CNI: ${w.idCardNumber || 'Archivée'}`,
    })),
  ], [uniqueKnownWorkers]);

  const domainOptions: SelectOption[] = useMemo(() => {
    const seen = new Set<string>();
    const list: SelectOption[] = [];
    for (const s of supervisors) {
      if (s.domain && !seen.has(s.domain)) {
        seen.add(s.domain);
        list.push({ value: s.domain, label: s.label || s.domain, description: `Superviseur : ${s.supervisorName}` });
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
        list.push({ value: val, label: val, description: `${s.label} ${s.phone ? `• Tél: ${s.phone}` : ''}` });
      }
    }
    return list;
  }, [supervisors]);

  const hostEmployeeOptions: SelectOption[] = useMemo(() => [
    { value: '', label: "-- Sélectionner l'hôte Citrine --" },
    ...employees.map((e) => ({
      value: e.id,
      label: e.name,
      description: `${e.department || 'Citrine'} ${e.role ? `• ${e.role}` : ''}`,
    })),
  ], [employees]);

  return {
    personType, selectedKnownWorkerId, isPreAuthorized, setIsPreAuthorized,
    dualValidationOk, setDualValidationOk, hostConfirmed, setHostConfirmed,
    uniqueKnownWorkers, formData, setFormData, computedStatus, isExistingWorkerSelected,
    knownWorkersOptions, domainOptions, supervisorOptions, hostEmployeeOptions,
    handlePersonTypeChange, handleSelectKnownWorker, handleDomainChange, handleSubmit,
  };
}
