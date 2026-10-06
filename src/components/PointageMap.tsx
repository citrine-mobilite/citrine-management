import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Presence, Employee } from '../types';
import { MapPin, Layers, Navigation, Calendar, User, Clock } from 'lucide-react';

interface PointageMapProps {
  presences: Presence[];
  employees: Employee[];
  selectedDate: string;
  selectedEmployeeId?: string;
  onDateChange?: (newDate: string) => void;
  className?: string;
}

type MapLayerType = 'standard' | 'satellite' | 'dark' | 'topo';

interface PointageMarker {
  id: string;
  employeeId: string;
  employeeName: string;
  avatarUrl?: string;
  date: string;
  time: string;
  type: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure';
  label: string;
  locationName: string;
  lat: number;
  lng: number;
}

const MAP_LAYERS: Record<MapLayerType, { name: string; url: string; attribution: string }> = {
  standard: {
    name: 'Standard (OpenStreetMap)',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: 'Citrine Management Hero'
  },
  satellite: {
    name: 'Satellite (Esri World Imagery)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Citrine Management Hero'
  },
  dark: {
    name: 'Sombre (CartoDB Dark)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: 'Citrine Management Hero'
  },
  topo: {
    name: 'Relief (Esri Topo)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Citrine Management Hero'
  }
};

export const PointageMap: React.FC<PointageMapProps> = ({
  presences,
  employees,
  selectedDate,
  selectedEmployeeId,
  onDateChange,
  className = ''
}) => {
  const [selectedLayer, setSelectedLayer] = useState<MapLayerType>('standard');
  const [activePointId, setActivePointId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Fix Leaflet marker icons in React bundlers
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Format date in French for display
  const formatFrenchDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const year = parseInt(parts[0], 10);
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const monthsFr = [
      'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
      'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
    ];
    if (isNaN(year) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) {
      return dateStr;
    }
    const dayFormatted = day === 1 ? '1er' : day;
    return `${dayFormatted} ${monthsFr[monthIdx]} ${year}`;
  };

  // Filter presences for selected date
  const targetPresences = presences.filter(p => {
    if (selectedDate && p.date !== selectedDate) return false;
    if (selectedEmployeeId && p.employeeId !== selectedEmployeeId) return false;
    return true;
  });

  // Extract all clock points
  const points: PointageMarker[] = [];

  targetPresences.forEach((p, pIdx) => {
    const emp = employees.find(e => e.id === p.employeeId);
    const empName = emp ? emp.name : 'Collaborateur';
    const avatarUrl = emp ? emp.avatarUrl : undefined;

    const events = [
      { type: 'arrival' as const, time: p.arrivalTime, label: 'Arrivée' },
      { type: 'pauseStart' as const, time: p.pauseStart, label: 'Début Pause' },
      { type: 'pauseEnd' as const, time: p.pauseEnd, label: 'Retour Pause' },
      { type: 'departure' as const, time: p.departureTime, label: 'Départ' },
    ];

    events.forEach((evt, evtIdx) => {
      if (!evt.time) return;

      const clockLoc = p.clockLocations?.[evt.type];
      const lat = clockLoc?.latitude ?? p.latitude;
      const lng = clockLoc?.longitude ?? p.longitude;
      const locationName = clockLoc?.zoneName || p.location;

      if (lat === undefined || lng === undefined) {
        return; // Do not display marker if there's no real location data
      }

      // Slight dispersion so markers don't overlap completely if at same spot
      let dispLat = lat;
      let dispLng = lng;
      const offset = (pIdx * 3 + evtIdx) * 0.00035;
      dispLat += (evtIdx % 2 === 0 ? 1 : -1) * offset;
      dispLng += (evtIdx > 1 ? 1 : -1) * offset;

      points.push({
        id: `${p.employeeId}-${p.date}-${evt.type}`,
        employeeId: p.employeeId,
        employeeName: empName,
        avatarUrl,
        date: p.date,
        time: evt.time,
        type: evt.type,
        label: evt.label,
        locationName: locationName || `GPS: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
        lat: dispLat,
        lng: dispLng
      });
    });
  });

  // Helper for custom Marker Icon with Employee Profile Avatar
  const getCustomMarkerIcon = (
    type: PointageMarker['type'],
    employeeName: string,
    avatarUrl?: string,
    isSelected: boolean = false
  ) => {
    let badgeBg = '#10b981'; // emerald
    let badgeIcon = '▶';

    if (type === 'arrival') {
      badgeBg = '#10b981';
      badgeIcon = '▶';
    } else if (type === 'pauseStart') {
      badgeBg = '#d97706';
      badgeIcon = '☕';
    } else if (type === 'pauseEnd') {
      badgeBg = '#2563eb';
      badgeIcon = '↺';
    } else if (type === 'departure') {
      badgeBg = '#e11d48';
      badgeIcon = '🏠';
    }

    const initials = employeeName
      .split(' ')
      .map(n => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'EMP';

    const size = isSelected ? 42 : 36;
    const avatarSize = isSelected ? 38 : 32;

    const avatarHtml = avatarUrl ? `
      <img src="${avatarUrl}" alt="${employeeName}" style="
        width: ${avatarSize}px;
        height: ${avatarSize}px;
        border-radius: 50%;
        object-fit: cover;
        display: block;
      " onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='flex';" />
      <div style="
        display: none;
        width: ${avatarSize}px;
        height: ${avatarSize}px;
        border-radius: 50%;
        background: linear-gradient(135deg, #be123c, #9f1239);
        color: white;
        font-weight: 800;
        font-size: 11px;
        align-items: center;
        justify-content: center;
      ">${initials}</div>
    ` : `
      <div style="
        width: ${avatarSize}px;
        height: ${avatarSize}px;
        border-radius: 50%;
        background: linear-gradient(135deg, #be123c, #881337);
        color: white;
        font-weight: 800;
        font-size: 11px;
        display: flex;
        align-items: center;
        justify-content: center;
        letter-spacing: -0.5px;
      ">${initials}</div>
    `;

    const html = `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: white;
          padding: 2px;
          box-shadow: ${isSelected ? '0 0 0 4px #e11d48, 0 6px 16px rgba(0,0,0,0.35)' : '0 3px 10px rgba(0,0,0,0.22)'};
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        ">
          ${avatarHtml}
        </div>
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          background-color: ${badgeBg};
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 8px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.25);
        ">
          ${badgeIcon}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-employee-marker-icon',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  // Map Initialization & Marker Updating
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [4.0481, 9.6922],
        zoom: 12,
        zoomControl: true
      });

      if (map.attributionControl) {
        map.attributionControl.setPrefix('Citrine Management Hero');
      }

      const layerConfig = MAP_LAYERS[selectedLayer];
      const tileLayer = L.tileLayer(layerConfig.url, {
        attribution: layerConfig.attribution,
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Trigger map resize check
    setTimeout(() => {
      map.invalidateSize();
    }, 150);

    // Remove existing markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    if (points.length > 0) {
      const bounds = L.latLngBounds([]);

      points.forEach(pt => {
        const isSelected = activePointId === pt.id;
        const marker = L.marker([pt.lat, pt.lng], {
          icon: getCustomMarkerIcon(pt.type, pt.employeeName, pt.avatarUrl, isSelected)
        }).addTo(map);

        const initials = pt.employeeName
          .split(' ')
          .map(n => n[0])
          .filter(Boolean)
          .slice(0, 2)
          .join('')
          .toUpperCase() || 'EMP';

        const avatarSnippet = pt.avatarUrl
          ? `<img src="${pt.avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #fda4af;" />`
          : `<div style="width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #be123c, #881337); color: white; font-weight: 800; font-size: 11px; display: flex; align-items: center; justify-content: center;">${initials}</div>`;

        const popupHtml = `
          <div style="font-family: system-ui, -apple-system, sans-serif; padding: 2px; min-width: 180px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px; border-bottom: 1px solid #ffe4e6; padding-bottom: 6px;">
              ${avatarSnippet}
              <div>
                <div style="font-size: 12px; font-weight: 800; color: #1e293b; line-height: 1.2;">${pt.employeeName}</div>
                <div style="font-size: 10px; font-weight: 700; color: #881337;">${pt.label}</div>
              </div>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #be123c; margin-bottom: 4px; display: flex; align-items: center; gap: 4px;">
              ⏰ Heure : <span style="font-family: monospace; font-size: 12px; font-weight: 800; color: #0f172a;">${pt.time}</span>
            </div>
            <div style="font-size: 10px; font-weight: 600; color: #047857; margin-bottom: 4px;">
              📍 Zone : ${pt.locationName}
            </div>
            <div style="font-size: 9px; font-family: monospace; color: #64748b; background: #f8fafc; padding: 4px; border-radius: 6px; border: 1px solid #e2e8f0;">
              GPS: ${pt.lat.toFixed(4)}°, ${pt.lng.toFixed(4)}°
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => setActivePointId(pt.id));

        markersRef.current[pt.id] = marker;
        bounds.extend([pt.lat, pt.lng]);
      });

      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14 });
    } else {
      // Default view on Douala
      map.setView([4.0481, 9.6922], 12);
    }
  }, [selectedDate, selectedEmployeeId, presences, activePointId]);

  // Handle tile switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const config = MAP_LAYERS[selectedLayer];
    const newTileLayer = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [selectedLayer]);

  return (
    <div className={`space-y-2 rounded-2xl border border-green-100/80 bg-white p-3 shadow-xs ${className}`}>
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-green-100 pb-2 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-1.5 font-bold text-green-950">
          <MapPin className="h-4 w-4 text-green-500 shrink-0" />
          <span>Lieux des pointages du {formatFrenchDate(selectedDate)}</span>
        </div>
        <div className="flex items-center gap-2">
          {onDateChange && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) {
                  onDateChange(e.target.value);
                }
              }}
              className="text-xs font-bold text-stone-800 bg-green-50/60 border border-green-200 rounded-lg px-2 py-0.5 focus:outline-green-500 font-mono cursor-pointer"
            />
          )}
          <span className="bg-green-50 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-green-100">
            {points.length} badge{points.length > 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative rounded-xl overflow-hidden border border-green-100 shadow-2xs">
        <div ref={mapContainerRef} className="w-full h-[230px] bg-stone-100 z-10" />

        {points.length === 0 && (
          <div className="absolute inset-0 bg-stone-50/90 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-20">
            <MapPin className="h-7 w-7 text-stone-300 mb-1" />
            <p className="text-xs font-bold text-stone-700">Aucun pointage géolocalisé</p>
            <p className="text-[10px] text-stone-400 mt-0.5">
              pour le {formatFrenchDate(selectedDate)}
            </p>
          </div>
        )}
      </div>

      {/* Badges list chips below map */}
      {points.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {points.map(pt => {
            const empInitials = pt.employeeName
              .split(' ')
              .map(n => n[0])
              .filter(Boolean)
              .slice(0, 2)
              .join('')
              .toUpperCase();

            return (
              <button
                key={pt.id}
                onClick={() => {
                  setActivePointId(pt.id);
                  if (mapInstanceRef.current) {
                    mapInstanceRef.current.setView([pt.lat, pt.lng], 15, { animate: true });
                    const marker = markersRef.current[pt.id];
                    if (marker) marker.openPopup();
                  }
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  activePointId === pt.id
                    ? 'bg-green-600 text-white border-green-700 ring-2 ring-green-300'
                    : pt.type === 'arrival' ? 'bg-emerald-50 text-emerald-900 border-emerald-200 hover:bg-emerald-100' :
                      pt.type === 'pauseStart' ? 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100' :
                      pt.type === 'pauseEnd' ? 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100' :
                      'bg-green-50 text-green-900 border-green-200 hover:bg-green-100'
                }`}
              >
                {pt.avatarUrl ? (
                  <img src={pt.avatarUrl} alt={pt.employeeName} className="w-4 h-4 rounded-full object-cover border border-white shrink-0" />
                ) : (
                  <span className="w-4 h-4 rounded-full bg-green-800 text-white text-[8px] font-black flex items-center justify-center shrink-0">
                    {empInitials}
                  </span>
                )}
                <span>{pt.employeeName.split(' ')[0]} ({pt.label} {pt.time})</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
