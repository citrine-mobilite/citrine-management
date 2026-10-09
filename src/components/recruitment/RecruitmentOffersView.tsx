import React from 'react';
import { Building2 } from 'lucide-react';
import { JobOffer, JobApplication } from '../../types';

interface RecruitmentOffersViewProps {
  offers: JobOffer[];
  applications: JobApplication[];
  onSelectOffer: (offerId: string) => void;
}

export const RecruitmentOffersView: React.FC<RecruitmentOffersViewProps> = ({
  offers,
  applications,
  onSelectOffer,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {offers.map((offer) => {
        const offerAppsCount = applications.filter((a) => a.jobOfferId === offer.id).length;
        return (
          <div
            key={offer.id}
            className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider bg-teal-50 text-[#2A7B76] border border-teal-200">
                  {offer.contractType}
                </span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                    offer.status === 'ouvert'
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-600'
                  }`}
                >
                  {offer.status}
                </span>
              </div>

              <h3 className="text-sm font-bold text-stone-900">{offer.title}</h3>
              <p className="text-xs text-stone-500 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                {offer.department} • {offer.location}
              </p>

              <p className="text-xs text-stone-600 line-clamp-2">{offer.description}</p>

              {offer.requirements && offer.requirements.length > 0 && (
                <div className="space-y-1 pt-1">
                  <p className="text-[11px] font-semibold text-stone-700">Prérequis clés :</p>
                  <ul className="text-[11px] text-stone-500 list-disc list-inside space-y-0.5">
                    {offer.requirements.slice(0, 2).map((r, i) => (
                      <li key={i} className="truncate">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-stone-800">
                  {offerAppsCount} candidat{offerAppsCount > 1 ? 's' : ''}
                </p>
                <p className="text-[10px] text-stone-400">Postes : {offer.openingsCount}</p>
              </div>

              <button
                onClick={() => onSelectOffer(offer.id)}
                className="px-3 py-1.5 text-xs font-medium text-[#2A7B76] hover:bg-teal-50 rounded-lg transition cursor-pointer"
              >
                Voir les candidats
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
