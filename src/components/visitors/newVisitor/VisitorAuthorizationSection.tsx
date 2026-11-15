import React from 'react';
import { Employee, PersonType, VisitorLog, VisitorPurpose, VisitorStatus } from '../../../types';
import { SearchableSelect, SelectOption } from '../../common/SearchableSelect';
import { VISITOR_PURPOSE_OPTIONS } from './useNewVisitorLogic';
import { VisitorBadgeSection } from './VisitorBadgeSection';

interface VisitorAuthorizationSectionProps {
  personType: PersonType;
  employees: Employee[];
  formData: Partial<VisitorLog>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<VisitorLog>>>;
  domainOptions: SelectOption[];
  supervisorOptions: SelectOption[];
  hostEmployeeOptions: SelectOption[];
  isPreAuthorized: boolean;
  setIsPreAuthorized: (v: boolean) => void;
  dualValidationOk: boolean;
  setDualValidationOk: (v: boolean) => void;
  hostConfirmed: boolean;
  setHostConfirmed: (v: boolean) => void;
  computedStatus: VisitorStatus;
  onDomainChange: (val: string | number) => void;
}

export const VisitorAuthorizationSection: React.FC<VisitorAuthorizationSectionProps> = ({
  personType,
  employees,
  formData,
  setFormData,
  domainOptions,
  supervisorOptions,
  hostEmployeeOptions,
  isPreAuthorized,
  setIsPreAuthorized,
  dualValidationOk,
  setDualValidationOk,
  hostConfirmed,
  setHostConfirmed,
  computedStatus,
  onDomainChange,
}) => {
  return (
    <>
      <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-200/70 space-y-3">
        <p className="font-bold text-stone-800 text-[11px] uppercase tracking-wider text-stone-500">
          2. Vérification de l&apos;autorisation d&apos;accès
        </p>

        {personType === 'travailleur' ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Domaine d&apos;intervention *</label>
                <SearchableSelect
                  options={domainOptions}
                  value={formData.workerDomain || 'electricite'}
                  onChange={onDomainChange}
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
              <label className="font-semibold text-stone-700 block mb-1">Périmètre autorisé dans l&apos;immeuble *</label>
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
                  options={VISITOR_PURPOSE_OPTIONS}
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

      <VisitorBadgeSection
        formData={formData}
        setFormData={setFormData}
        computedStatus={computedStatus}
      />
    </>
  );
};
