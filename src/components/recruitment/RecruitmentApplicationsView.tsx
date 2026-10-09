import React from 'react';
import { Search, MapPin, Phone, ChevronRight } from 'lucide-react';
import { JobApplication, JobOffer, ApplicationStage } from '../../types';

export function getStageBadge(stage: ApplicationStage) {
  const stageMap: Record<ApplicationStage, { bg: string; text: string; label: string }> = {
    nouveau: { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Nouveau' },
    en_revue: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'En revue' },
    entretien_rh: { bg: 'bg-purple-50 border-purple-200', text: 'text-purple-700', label: 'Entretien RH' },
    entretien_technique: { bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-700', label: 'Entretien Tech' },
    offre_proposee: { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', label: 'Offre proposée' },
    embauche: { bg: 'bg-emerald-100 border-emerald-300', text: 'text-emerald-800', label: 'Embauché' },
    rejete: { bg: 'bg-stone-100 border-stone-200', text: 'text-stone-600', label: 'Non retenu' },
  };
  const s = stageMap[stage];
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.bg} ${s.text}`}>{s.label}</span>;
}

interface RecruitmentApplicationsViewProps {
  applications: JobApplication[];
  offers: JobOffer[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedStage: string;
  onStageFilterChange: (val: string) => void;
  selectedOfferFilter: string;
  onOfferFilterChange: (val: string) => void;
  onSelectApplication: (app: JobApplication) => void;
}

export const RecruitmentApplicationsView: React.FC<RecruitmentApplicationsViewProps> = ({
  applications,
  offers,
  searchTerm,
  onSearchChange,
  selectedStage,
  onStageFilterChange,
  selectedOfferFilter,
  onOfferFilterChange,
  onSelectApplication,
}) => {
  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row items-center gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Rechercher par nom, ville, poste ciblé..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-stone-200 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <select
          value={selectedStage}
          onChange={(e) => onStageFilterChange(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Toutes les étapes</option>
          <option value="nouveau">Nouveau</option>
          <option value="en_revue">En revue</option>
          <option value="entretien_rh">Entretien RH</option>
          <option value="entretien_technique">Entretien Tech</option>
          <option value="offre_proposee">Offre proposée</option>
          <option value="embauche">Embauché</option>
          <option value="rejete">Non retenu</option>
        </select>

        <select
          value={selectedOfferFilter}
          onChange={(e) => onOfferFilterChange(e.target.value)}
          className="px-3 py-2 text-xs rounded-lg border border-stone-200 bg-white text-stone-700"
        >
          <option value="all">Tous les postes</option>
          {offers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.title}
            </option>
          ))}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {applications.map((app) => (
          <div
            key={app.id}
            onClick={() => onSelectApplication(app)}
            className="bg-white p-5 rounded-xl border border-stone-200 hover:border-[#2A7B76]/50 shadow-xs hover:shadow-md transition cursor-pointer flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-bold text-stone-900">{app.candidateName}</h4>
                  <p className="text-xs font-medium text-[#2A7B76]">{app.jobOfferTitle}</p>
                </div>
                {getStageBadge(app.stage)}
              </div>
              <div className="space-y-1 text-xs text-stone-500">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-stone-400" />
                  {app.candidateCity || 'Douala'}
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  {app.candidatePhone}
                </p>
              </div>
            </div>
            <div className="pt-3 mt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-400">
              <span>{new Date(app.appliedAt).toLocaleDateString('fr-FR')}</span>
              <span className="font-semibold text-[#2A7B76] flex items-center gap-0.5">
                Détails <ChevronRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
