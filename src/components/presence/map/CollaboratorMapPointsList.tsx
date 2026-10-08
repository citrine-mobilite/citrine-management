import React from 'react';
import { MapPin, Clock, Play, Home } from 'lucide-react';
import { MapBadgePoint } from './collaboratorMapUtils';

interface CollaboratorMapPointsListProps {
  points: MapBadgePoint[];
  onSelectPoint?: (pt: MapBadgePoint) => void;
}

export const CollaboratorMapPointsList: React.FC<CollaboratorMapPointsListProps> = ({
  points,
  onSelectPoint,
}) => {
  return (
    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
      {points.length === 0 ? (
        <div className="p-6 text-center text-stone-400 text-xs italic bg-stone-50 rounded-2xl border border-stone-200">
          Aucun pointage géolocalisé pour cette période.
        </div>
      ) : (
        points.map((pt) => (
          <div
            key={pt.id}
            onClick={() => onSelectPoint?.(pt)}
            className="p-3 bg-white hover:bg-stone-50 rounded-2xl border border-stone-200 transition flex items-center justify-between gap-3 text-xs cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                  pt.type === 'arrival'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-[#2A7B76]/10 text-[#2A7B76]'
                }`}
              >
                {pt.type === 'arrival' ? <Play className="h-3 w-3 fill-emerald-700" /> : <Home className="h-3 w-3" />}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-stone-900 group-hover:text-[#2A7B76] transition truncate">
                  {pt.label} • {pt.formattedDate}
                </div>
                <div className="text-[10px] text-stone-400 flex items-center gap-1 truncate">
                  <MapPin className="h-2.5 w-2.5 text-[#2A7B76]" />
                  <span className="truncate">{pt.locationName}</span>
                </div>
              </div>
            </div>

            <span className="font-mono font-bold text-xs text-stone-800 shrink-0">
              {pt.time}
            </span>
          </div>
        ))
      )}
    </div>
  );
};
