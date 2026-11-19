import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Presence } from '../types';
import { MapPin } from 'lucide-react';
import { extractCollaboratorMapPoints, createCollaboratorPointIcon, MapBadgePoint } from './presence/map/collaboratorMapUtils';
import { CollaboratorMapFilters } from './presence/map/CollaboratorMapFilters';
import { CollaboratorMapPointsList } from './presence/map/CollaboratorMapPointsList';
import { MapLayerControls, MapLayerType } from './presence/map/MapLayerControls';

interface CollaboratorPresenceMapProps {
  presences: Presence[];
  employeeName: string;
  avatarUrl?: string;
}

const TILE_URLS: Record<MapLayerType, string> = {
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
};

export function CollaboratorPresenceMap({
  presences,
  employeeName,
  avatarUrl,
}: CollaboratorPresenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [currentLayer, setCurrentLayer] = useState<MapLayerType>('standard');

  const [filterPeriod, setFilterPeriod] = useState<'month' | 'year' | 'day' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState<string>(() => new Date().toISOString().slice(0, 7));
  const [selectedDay, setSelectedDay] = useState<string>(() => new Date().toISOString().split('T')[0]);

  const points = extractCollaboratorMapPoints(presences, selectedMonth, filterPeriod, selectedDay);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [4.0511, 9.7679],
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const tiles = L.tileLayer(TILE_URLS[currentLayer], { maxZoom: 19 }).addTo(map);
      tileLayerRef.current = tiles;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(TILE_URLS[currentLayer]);
    }
  }, [currentLayer]);

  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();
    const latLngs: L.LatLngExpression[] = [];

    points.forEach((pt) => {
      const latLng: [number, number] = [pt.lat, pt.lng];
      latLngs.push(latLng);

      const icon = createCollaboratorPointIcon(pt);
      const marker = L.marker(latLng, { icon }).addTo(layerGroupRef.current!);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: #2A7B76;">${employeeName}</strong>
          <div style="font-size: 11px; margin-top: 2px;">${pt.label} à <b>${pt.time}</b> (${pt.formattedDate})</div>
          <div style="font-size: 10px; color: #888;">Lieu: ${pt.locationName}</div>
        </div>
      `);
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [points, employeeName]);

  const handleFocusPoint = (pt: MapBadgePoint) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([pt.lat, pt.lng], 16);
    }
  };

  return (
    <div className="space-y-4">
      <CollaboratorMapFilters
        filterPeriod={filterPeriod}
        setFilterPeriod={setFilterPeriod}
        selectedMonth={selectedMonth}
        setSelectedMonth={setSelectedMonth}
        selectedDay={selectedDay}
        setSelectedDay={setSelectedDay}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 relative isolate z-0 h-[380px] rounded-3xl overflow-hidden border border-stone-200 shadow-sm bg-stone-100">
          <div ref={mapContainerRef} className="w-full h-full relative z-0" />
          
          <div className="absolute top-3 right-3 z-10">
            <MapLayerControls currentLayer={currentLayer} onSelectLayer={setCurrentLayer} />
          </div>

          {/* Custom Attribution Badge */}
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200/60 text-[10px] text-stone-500 font-bold tracking-wide pointer-events-none select-none shadow-xs">
            Citrine Management
          </div>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-stone-200 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="font-serif font-bold text-xs text-stone-900 mb-3 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-[#2A7B76]" /> Historique des Lieux Badgés ({points.length})
            </h4>
            <CollaboratorMapPointsList points={points} onSelectPoint={handleFocusPoint} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default CollaboratorPresenceMap;
