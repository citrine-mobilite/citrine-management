import React from 'react';
import { MapPin } from 'lucide-react';
import { Employee, Presence } from '../../types';
import { PointageMap } from '../PointageMap';
import { MapLayerControls, MapLayerType } from './map/MapLayerControls';

interface PresenceMapCardProps {
  isRestricted: boolean;
  myEmp?: Employee;
  presences: Presence[];
  filteredPresences: Presence[];
  employees: Employee[];
  clockableEmployees: Employee[];
  selectedDate: string;
  mapLayer: MapLayerType;
  onChangeMapLayer: (layer: MapLayerType) => void;
  mapPeriod: 'day' | 'week' | 'month' | 'all' | 'custom';
  onChangeMapPeriod: (period: 'day' | 'week' | 'month' | 'all' | 'custom') => void;
  mapCustomFilter: string;
  onChangeMapCustomFilter: (val: string) => void;
  mapStartDate: string;
  onChangeMapStartDate: (val: string) => void;
  mapEndDate: string;
  onChangeMapEndDate: (val: string) => void;
}

export const PresenceMapCard: React.FC<PresenceMapCardProps> = ({
  isRestricted,
  myEmp,
  presences,
  filteredPresences,
  employees,
  clockableEmployees,
  selectedDate,
  mapLayer,
  onChangeMapLayer,
  mapPeriod,
  onChangeMapPeriod,
  mapCustomFilter,
  onChangeMapCustomFilter,
  mapStartDate,
  onChangeMapStartDate,
  mapEndDate,
  onChangeMapEndDate,
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-stone-200/80 shadow-sm space-y-4 relative isolate z-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-[#2A7B76] rounded-xl border border-emerald-100">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-xs text-stone-900">
              Lieux des pointages du jour
            </h4>
            <p className="text-[10px] text-stone-400">
              Visualisation géographique des collaborateurs
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
            {(['day', 'week', 'month', 'all', 'custom'] as const).map((p) => {
              const labels = { day: 'Jour', week: 'Semaine', month: 'Mois', all: 'Tous', custom: 'Personnalisé' };
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onChangeMapPeriod(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                    mapPeriod === p
                      ? 'bg-[#2A7B76] text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-white'
                  }`}
                >
                  {labels[p]}
                </button>
              );
            })}
          </div>

          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {mapPeriod === 'day' ? `${filteredPresences.filter(x => x.arrivalTime).length} badges du jour` : mapPeriod === 'custom' ? `Du ${mapStartDate} au ${mapEndDate}` : `Période (${mapPeriod})`}
          </span>
          <MapLayerControls currentLayer={mapLayer} onSelectLayer={onChangeMapLayer} />
        </div>
      </div>

      {mapPeriod === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 bg-emerald-50/70 px-4 py-2.5 rounded-2xl border border-emerald-200 animate-in fade-in duration-200">
          <span className="text-[10px] font-extrabold text-emerald-900 uppercase tracking-wide flex items-center gap-1.5">
            <span>📅</span> Intervalle personnalisé :
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-600 font-bold">Date de début :</span>
            <input
              type="date"
              value={mapStartDate}
              onChange={(e) => onChangeMapStartDate(e.target.value)}
              className="bg-white px-3 py-1 rounded-xl text-xs font-bold border border-stone-200 text-stone-800 outline-none focus:ring-1 focus:ring-[#2A7B76]"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-stone-600 font-bold">Date de fin :</span>
            <input
              type="date"
              value={mapEndDate}
              onChange={(e) => onChangeMapEndDate(e.target.value)}
              className="bg-white px-3 py-1 rounded-xl text-xs font-bold border border-stone-200 text-stone-800 outline-none focus:ring-1 focus:ring-[#2A7B76]"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 bg-stone-50 px-4 py-2.5 rounded-2xl border border-stone-200">
        <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wide whitespace-nowrap flex items-center gap-1.5">
          <span>🔍</span> Recherche :
        </span>
        <input
          type="text"
          value={mapCustomFilter}
          onChange={(e) => onChangeMapCustomFilter(e.target.value)}
          placeholder="Filtrer par nom de collaborateur, lieu, heure ou type..."
          className="w-full bg-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-stone-200 outline-none focus:ring-1 focus:ring-[#2A7B76] text-stone-800"
        />
        {mapCustomFilter && (
          <button
            type="button"
            onClick={() => onChangeMapCustomFilter('')}
            className="text-[10px] text-stone-400 hover:text-stone-700 px-2 font-bold whitespace-nowrap cursor-pointer"
          >
            Effacer
          </button>
        )}
      </div>

      <div className="w-full h-[360px] rounded-2xl overflow-hidden border border-stone-200 bg-stone-100 relative isolate z-0">
        <PointageMap
          presences={isRestricted ? presences.filter(p => p.employeeId === myEmp?.id) : presences}
          employees={clockableEmployees}
          selectedDate={selectedDate}
          selectedEmployeeId={isRestricted ? myEmp?.id : undefined}
          currentLayer={mapLayer}
          onLayerChange={onChangeMapLayer}
          showInternalControls={false}
          mapPeriod={mapPeriod}
          customFilterQuery={mapCustomFilter}
          customStartDate={mapStartDate}
          customEndDate={mapEndDate}
          className="w-full h-full border-0 shadow-none min-h-[360px]"
        />
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {filteredPresences.map((p) => {
          const emp = employees.find((e) => e.id === p.employeeId);
          if (!emp) return null;
          return (
            <span key={p.id} className="inline-flex items-center gap-1 px-3 py-1.5 bg-stone-50 border border-stone-200/60 rounded-2xl text-[10px] font-bold text-stone-700">
              📍 {emp.name} ({p.arrivalTime ? `Arrivée ${p.arrivalTime}` : 'Départ'})
            </span>
          );
        })}
      </div>
    </div>
  );
};
