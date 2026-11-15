import React from 'react';
import { X, UserCheck, Wrench, ShieldCheck, CheckCircle2, History } from 'lucide-react';
import { VisitorLog, Employee } from '../../types';
import { SearchableSelect } from '../common/SearchableSelect';
import { useNewVisitorLogic } from './newVisitor/useNewVisitorLogic';
import { VisitorIdentitySection } from './newVisitor/VisitorIdentitySection';
import { VisitorAuthorizationSection } from './newVisitor/VisitorAuthorizationSection';

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
  const logic = useNewVisitorLogic({
    employees,
    visitorsCount,
    knownWorkers,
    onSubmit,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 border border-stone-200 shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-start justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#2A7B76]/10 text-[#2A7B76] rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900">Contrôle des Accès Bâtiment Citrine</h3>
              <p className="text-[11px] text-stone-500">
                Siège Japoma (Carrefour Matango) • Registre Numérique d&apos;Émargement
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="font-bold text-xs text-stone-700 mb-1.5 block">
            Catégorie de la personne extérieure :
          </label>
          <div className="grid grid-cols-2 gap-2 bg-stone-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => logic.handlePersonTypeChange('visiteur')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                logic.personType === 'visiteur'
                  ? 'bg-white text-[#2A7B76] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserCheck className="w-4 h-4 text-[#2A7B76]" />
              <span>Visiteur (Rendez-vous / Client)</span>
            </button>
            <button
              type="button"
              onClick={() => logic.handlePersonTypeChange('travailleur')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                logic.personType === 'travailleur'
                  ? 'bg-white text-amber-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Wrench className="w-4 h-4 text-amber-700" />
              <span>Travailleur Immeuble (Supervisé)</span>
            </button>
          </div>
        </div>

        {logic.personType === 'travailleur' && logic.uniqueKnownWorkers.length > 0 && (
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
              options={logic.knownWorkersOptions}
              value={logic.selectedKnownWorkerId}
              onChange={logic.handleSelectKnownWorker}
              placeholder="Rechercher un travailleur existant (nom, entreprise)..."
              searchPlaceholder="Taper le nom ou entreprise du travailleur..."
              size="sm"
            />

            {logic.isExistingWorkerSelected && (
              <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 p-2 rounded-lg border border-emerald-200 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Profil chargé automatiquement : la CNI a déjà été contrôlée et archivée.</span>
              </p>
            )}
          </div>
        )}

        <form onSubmit={logic.handleSubmit} className="space-y-3.5 text-xs">
          <VisitorIdentitySection
            personType={logic.personType}
            formData={logic.formData}
            setFormData={logic.setFormData}
            isExistingWorkerSelected={logic.isExistingWorkerSelected}
          />

          <VisitorAuthorizationSection
            personType={logic.personType}
            employees={employees}
            formData={logic.formData}
            setFormData={logic.setFormData}
            domainOptions={logic.domainOptions}
            supervisorOptions={logic.supervisorOptions}
            hostEmployeeOptions={logic.hostEmployeeOptions}
            isPreAuthorized={logic.isPreAuthorized}
            setIsPreAuthorized={logic.setIsPreAuthorized}
            dualValidationOk={logic.dualValidationOk}
            setDualValidationOk={logic.setDualValidationOk}
            hostConfirmed={logic.hostConfirmed}
            setHostConfirmed={logic.setHostConfirmed}
            computedStatus={logic.computedStatus}
            onDomainChange={logic.handleDomainChange}
          />

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
                {logic.computedStatus === 'sur_site' ? "Enregistrer l'Entrée & Valider" : 'Enregistrer en Attente Accueil'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
