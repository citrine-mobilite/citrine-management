import React from 'react';
import { Clock, CheckCircle2 } from 'lucide-react';
import { VisitorLog, VisitorStatus } from '../../../types';
import { SearchableSelect } from '../../common/SearchableSelect';
import { VISITOR_SITE_OPTIONS } from './useNewVisitorLogic';

interface VisitorBadgeSectionProps {
  formData: Partial<VisitorLog>;
  setFormData: React.Dispatch<React.SetStateAction<Partial<VisitorLog>>>;
  computedStatus: VisitorStatus;
}

export const VisitorBadgeSection: React.FC<VisitorBadgeSectionProps> = ({
  formData,
  setFormData,
  computedStatus,
}) => {
  return (
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
            Attente à l&apos;accueil
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="font-semibold text-stone-700 block mb-1">Site d&apos;accueil *</label>
          <SearchableSelect
            options={VISITOR_SITE_OPTIONS}
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
  );
};
