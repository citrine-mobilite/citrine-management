import React from 'react';
import { Layers } from 'lucide-react';

export type MapLayerType = 'standard' | 'satellite' | 'topo';

interface MapLayerControlsProps {
  currentLayer: MapLayerType;
  onSelectLayer: (layer: MapLayerType) => void;
}

export const MapLayerControls: React.FC<MapLayerControlsProps> = ({
  currentLayer,
  onSelectLayer,
}) => {
  return (
    <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl border border-stone-200 shadow-2xs text-[11px] font-bold">
      <Layers className="h-3.5 w-3.5 text-[#2A7B76] ml-1.5 mr-0.5" />
      {[
        { id: 'standard', label: 'Plan' },
        { id: 'satellite', label: 'Satellite' },
        { id: 'topo', label: 'Relief' },
      ].map((l) => (
        <button
          key={l.id}
          onClick={() => onSelectLayer(l.id as MapLayerType)}
          className={`px-2 py-0.5 rounded-lg transition cursor-pointer ${
            currentLayer === l.id
              ? 'bg-[#2A7B76] text-white shadow-2xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
};
