import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Presence, Employee } from '../types';
import { MapPin, Calendar } from 'lucide-react';
import { extractPointageMarkers, createLeafletCustomIcon } from './presence/map/mapMarkerUtils';
import { MapLayerControls, MapLayerType } from './presence/map/MapLayerControls';

interface PointageMapProps {
  presences: Presence[];
  employees: Employee[];
  selectedDate: string;
  selectedEmployeeId?: string;
  onDateChange?: (newDate: string) => void;
  className?: string;
  currentLayer?: MapLayerType;
  onLayerChange?: (layer: MapLayerType) => void;
  showInternalControls?: boolean;
}

const TILE_URLS: Record<MapLayerType, string> = {
  standard: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
};

export const PointageMap: React.FC<PointageMapProps> = ({
  presences,
  employees,
  selectedDate,
  selectedEmployeeId,
  onDateChange,
  className = '',
  currentLayer: controlledLayer,
  onLayerChange,
  showInternalControls = false,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const [internalLayer, setInternalLayer] = useState<MapLayerType>('standard');

  const activeLayer = controlledLayer || internalLayer;
  const handleLayerSelect = (layer: MapLayerType) => {
    if (onLayerChange) {
      onLayerChange(layer);
    } else {
      setInternalLayer(layer);
    }
  };

  const markers = React.useMemo(() => extractPointageMarkers(presences, employees, selectedDate, selectedEmployeeId), [presences, employees, selectedDate, selectedEmployeeId]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const defaultCenter: [number, number] = [4.0511, 9.7679]; // Douala default
      const map = L.map(mapContainerRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: false,
        attributionControl: false,
      });

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const tiles = L.tileLayer(TILE_URLS[activeLayer], { 
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = tiles;

      const layerGroup = L.layerGroup().addTo(map);
      layerGroupRef.current = layerGroup;
      mapInstanceRef.current = map;

      // Invalidate size once rendered in DOM
      setTimeout(() => {
        map.invalidateSize();
      }, 200);
    }
  }, []);

  // Update tile layer
  useEffect(() => {
    if (mapInstanceRef.current && tileLayerRef.current) {
      tileLayerRef.current.setUrl(TILE_URLS[activeLayer]);
    }
  }, [activeLayer]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !layerGroupRef.current) return;

    layerGroupRef.current.clearLayers();
    const latLngs: L.LatLngExpression[] = [];

    markers.forEach((m) => {
      const latLng: [number, number] = [m.lat, m.lng];
      latLngs.push(latLng);

      const icon = createLeafletCustomIcon(m);
      const marker = L.marker(latLng, { icon }).addTo(layerGroupRef.current!);

      marker.bindPopup(`
        <div style="font-family: sans-serif; font-size: 12px; padding: 4px;">
          <strong style="color: #2A7B76;">${m.employeeName}</strong>
          <div style="font-size: 10px; color: #666; margin-top: 2px;">${m.label} à <b>${m.time}</b></div>
          <div style="font-size: 10px; color: #888;">Lieu: ${m.locationName}</div>
        </div>
      `);
    });

    if (latLngs.length > 0) {
      const bounds = L.latLngBounds(latLngs);
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [markers]);

  return (
    <div className={`relative isolate z-0 rounded-3xl overflow-hidden border border-stone-200 bg-stone-100 ${className}`}>
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[350px] relative z-0" />

      {/* Top Map Controls Toolbar (placed AFTER map container so it is naturally above canvas if enabled) */}
      {showInternalControls && (
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2 pointer-events-none">
          <div className="flex items-center gap-2 pointer-events-auto bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs font-bold text-stone-800">
            <MapPin className="h-3.5 w-3.5 text-[#2A7B76]" />
            <span>{markers.length} pointages</span>
          </div>

          <div className="pointer-events-auto">
            <MapLayerControls currentLayer={activeLayer} onSelectLayer={handleLayerSelect} />
          </div>
        </div>
      )}

      {/* Custom Attribution Badge */}
      <div className="absolute bottom-2.5 left-2.5 z-10 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg border border-stone-200/60 text-[10px] text-stone-500 font-bold tracking-wide pointer-events-none select-none shadow-xs">
        Citrine Management
      </div>
    </div>
  );
};

export default PointageMap;
