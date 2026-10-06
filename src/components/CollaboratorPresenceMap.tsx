import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Presence } from '../types';
import { 
  Calendar, 
  MapPin, 
  Play, 
  Coffee, 
  RotateCcw, 
  Home, 
  Filter, 
  Layers, 
  Navigation,
  AlertTriangle,
  Clock,
  Sparkles
} from 'lucide-react';

interface CollaboratorPresenceMapProps {
  presences: Presence[];
  employeeName: string;
  avatarUrl?: string;
}

type FilterPeriod = 'month' | 'year' | 'day' | 'range' | 'all';
type MapLayerType = 'standard' | 'satellite' | 'dark' | 'topo';

interface MapBadgePoint {
  id: string;
  presenceDate: string;
  formattedDate: string;
  time: string;
  type: 'arrival' | 'pauseStart' | 'pauseEnd' | 'departure';
  label: string;
  locationName: string;
  lat: number;
  lng: number;
  isWeekend: boolean;
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
    name: 'Topographique (Esri Topo)',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Citrine Management Hero'
  }
};

export const CollaboratorPresenceMap: React.FC<CollaboratorPresenceMapProps> = ({
  presences,
  employeeName,
  avatarUrl
}) => {
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('month');
  const [singleDate, setSingleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [selectedLayer, setSelectedLayer] = useState<MapLayerType>('standard');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<{ [key: string]: L.Marker }>({});

  // Fix Leaflet default icon paths issues in bundlers
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  // Dates helpers
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const monthNamesFr = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ];

  const currentMonthLabel = `${monthNamesFr[currentMonth]} ${currentYear}`;

  // Filter presences based on user selection
  const filteredPresences = presences.filter(p => {
    if (!p.date) return false;
    const pDate = new Date(p.date);
    if (isNaN(pDate.getTime())) return false;

    if (filterPeriod === 'month') {
      return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
    } else if (filterPeriod === 'year') {
      return pDate.getFullYear() === currentYear;
    } else if (filterPeriod === 'day') {
      return p.date === singleDate;
    } else if (filterPeriod === 'range') {
      if (startDate && p.date < startDate) return false;
      if (endDate && p.date > endDate) return false;
      return true;
    }
    return true; // 'all'
  });

  // Count weekend presences
  const weekendCount = filteredPresences.filter(p => {
    const d = new Date(p.date).getDay();
    return d === 0 || d === 6; // 0=Sunday, 6=Saturday
  }).length;

  // Extract all individual clock points
  const points: MapBadgePoint[] = [];

  filteredPresences.forEach((p, pIdx) => {
    const pDateObj = new Date(p.date);
    const dayOfWeek = pDateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const formattedDate = pDateObj.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const clockEvents = [
      { type: 'arrival' as const, time: p.arrivalTime, label: 'Arrivée' },
      { type: 'pauseStart' as const, time: p.pauseStart, label: 'Début Pause' },
      { type: 'pauseEnd' as const, time: p.pauseEnd, label: 'Retour Pause' },
      { type: 'departure' as const, time: p.departureTime, label: 'Départ' },
    ];

    clockEvents.forEach((evt, evtIdx) => {
      if (!evt.time) return;

      const clockLoc = p.clockLocations?.[evt.type];
      const lat = clockLoc?.latitude ?? p.latitude;
      const lng = clockLoc?.longitude ?? p.longitude;
      const locationName = clockLoc?.zoneName || p.location;

      if (lat === undefined || lng === undefined) {
        return; // Do not display marker if there's no real location data
      }

      // Disperse points slightly so markers on same location don't overlap completely
      let dispLat = lat;
      let dispLng = lng;
      const offsetFactor = (pIdx * 4 + evtIdx) * 0.00035;
      dispLat += (evtIdx % 2 === 0 ? 1 : -1) * offsetFactor;
      dispLng += (evtIdx > 1 ? 1 : -1) * offsetFactor;

      points.push({
        id: `${p.id || p.date}-${evt.type}`,
        presenceDate: p.date,
        formattedDate,
        time: evt.time,
        type: evt.type,
        label: evt.label,
        locationName: locationName || `GPS: ${lat.toFixed(5)}°, ${lng.toFixed(5)}°`,
        lat: dispLat,
        lng: dispLng,
        isWeekend
      });
    });
  });

  // Helper for custom Leaflet DivIcon with Avatar
  const getCustomMarkerIcon = (type: MapBadgePoint['type'], isSelected: boolean, isWeekend: boolean) => {
    let colorHex = '#10b981'; // emerald
    let iconSymbol = '▶';

    if (type === 'arrival') {
      colorHex = '#10b981';
      iconSymbol = '▶';
    } else if (type === 'pauseStart') {
      colorHex = '#d97706';
      iconSymbol = '☕';
    } else if (type === 'pauseEnd') {
      colorHex = '#2563eb';
      iconSymbol = '↺';
    } else if (type === 'departure') {
      colorHex = '#e11d48';
      iconSymbol = '🏠';
    }

    const ringClass = isSelected 
      ? 'z-50' 
      : isWeekend 
        ? 'hover:scale-110 z-40' 
        : 'hover:scale-110 z-30';
        
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
      <div class="${ringClass}" style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <div style="
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background: white;
          padding: 2px;
          box-shadow: ${isSelected ? '0 0 0 4px #e11d48, 0 6px 16px rgba(0,0,0,0.35)' : isWeekend ? '0 0 0 2px #a855f7, 0 3px 10px rgba(0,0,0,0.22)' : '0 3px 10px rgba(0,0,0,0.22)'};
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${avatarHtml}
        </div>
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          background-color: ${colorHex};
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
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        ">
          ${iconSymbol}
        </div>
      </div>
    `;

    return L.divIcon({
      html,
      className: 'custom-leaflet-marker',
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
      popupAnchor: [0, -size / 2]
    });
  };

  // Map Initialization & Updates
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Create Leaflet instance once
      const map = L.map(mapContainerRef.current, {
        center: [4.0481, 9.6922],
        zoom: 12,
        zoomControl: true
      });

      if (map.attributionControl) {
        map.attributionControl.setPrefix('Citrine Management Hero');
      }

      const initialLayer = MAP_LAYERS[selectedLayer];
      const tileLayer = L.tileLayer(initialLayer.url, {
        attribution: initialLayer.attribution,
        maxZoom: 19
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Remove old markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    if (points.length > 0) {
      const bounds = L.latLngBounds([]);

      points.forEach(pt => {
        const isSelected = selectedPointId === pt.id;
        const marker = L.marker([pt.lat, pt.lng], {
          icon: getCustomMarkerIcon(pt.type, isSelected, pt.isWeekend)
        }).addTo(map);

        const popupHtml = `
          <div style="font-family: system-ui, sans-serif; padding: 4px; min-width: 190px;">
            <div style="font-size: 10px; text-transform: uppercase; font-weight: 800; color: #888; margin-bottom: 2px; display: flex; items-center; justify-content: space-between;">
              <span>${pt.formattedDate}</span>
              ${pt.isWeekend ? '<span style="color:#7e22ce; font-weight:bold;">⚡ Week-end</span>' : ''}
            </div>
            <div style="font-size: 13px; font-weight: 800; color: #111; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
              <span>${pt.label}</span>
              <span style="background-color: #f3f4f6; color: #111; padding: 2px 6px; border-radius: 6px; font-size: 11px; font-family: monospace;">
                ${pt.time}
              </span>
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #be123c; margin-bottom: 4px;">
              📍 Zone : ${pt.locationName}
            </div>
            <div style="font-size: 9px; font-family: monospace; color: #666; background: #f9fafb; padding: 4px; border-radius: 4px; border: 1px solid #eee;">
              GPS: ${pt.lat.toFixed(4)}°, ${pt.lng.toFixed(4)}°
            </div>
          </div>
        `;

        marker.bindPopup(popupHtml);
        marker.on('click', () => setSelectedPointId(pt.id));

        markersRef.current[pt.id] = marker;
        bounds.extend([pt.lat, pt.lng]);
      });

      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [filterPeriod, singleDate, startDate, endDate, points.length]);

  // Handle Layer Tile Switch
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const newLayerConfig = MAP_LAYERS[selectedLayer];
    const newTileLayer = L.tileLayer(newLayerConfig.url, {
      attribution: newLayerConfig.attribution,
      maxZoom: 19
    }).addTo(map);

    tileLayerRef.current = newTileLayer;
  }, [selectedLayer]);

  // Handle click on any individual badge from a date row
  const handleFocusBadge = (ptId: string, lat: number, lng: number) => {
    setSelectedPointId(ptId);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15, { animate: true });
      const marker = markersRef.current[ptId];
      if (marker) {
        marker.openPopup();
      }
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* 1. FILTER & PERIOD SELECTION BAR */}
      <div className="bg-stone-50 p-3.5 rounded-2xl border border-stone-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-green-600 shrink-0" />
            <span className="text-xs font-bold text-stone-800">Période des badges :</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-xl border border-stone-200 text-xs font-semibold">
            <button
              onClick={() => setFilterPeriod('month')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterPeriod === 'month'
                  ? 'bg-green-900 text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>Mois ({currentMonthLabel})</span>
            </button>

            <button
              onClick={() => setFilterPeriod('year')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterPeriod === 'year'
                  ? 'bg-green-900 text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>Année ({currentYear})</span>
            </button>

            <button
              onClick={() => setFilterPeriod('day')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterPeriod === 'day'
                  ? 'bg-green-900 text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Journée unique</span>
            </button>

            <button
              onClick={() => setFilterPeriod('range')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterPeriod === 'range'
                  ? 'bg-green-900 text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>Plage de dates</span>
            </button>

            <button
              onClick={() => setFilterPeriod('all')}
              className={`px-2.5 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                filterPeriod === 'all'
                  ? 'bg-green-900 text-white font-bold shadow-2xs'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              <span>Tout</span>
            </button>
          </div>
        </div>

        {/* Dynamic Inputs for 'day' or 'range' */}
        {filterPeriod === 'day' && (
          <div className="pt-2 border-t border-stone-200 flex items-center gap-3 animate-fadeIn">
            <span className="text-xs font-bold text-stone-700">Choisir le jour :</span>
            <input
              type="date"
              value={singleDate}
              onChange={(e) => setSingleDate(e.target.value)}
              className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-green-600"
            />
          </div>
        )}

        {filterPeriod === 'range' && (
          <div className="pt-2 border-t border-stone-200 flex flex-wrap items-center gap-3 animate-fadeIn">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700">Du :</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-green-600"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-700">Au :</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-white border border-stone-300 rounded-xl px-3 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-green-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. MAP CONTROLS & WEEKEND WARNING BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-stone-800 flex items-center gap-1.5">
            <MapPin className="h-4 w-4 text-green-600" />
            {points.length} badge{points.length > 1 ? 's' : ''} géolocalisé{points.length > 1 ? 's' : ''} ({filteredPresences.length} jour{filteredPresences.length > 1 ? 's' : ''})
          </span>

          {weekendCount > 0 && (
            <span className="bg-purple-100 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 animate-pulse">
              <AlertTriangle className="h-3 w-3 text-purple-700 shrink-0" />
              <span>{weekendCount} présence{weekendCount > 1 ? 's' : ''} le Week-end (Exceptionnel)</span>
            </span>
          )}
        </div>

        {/* MAP TILE LAYER SWITCHER (4 LAYERS) */}
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-300">
          <Layers className="h-3.5 w-3.5 text-stone-500 ml-1 shrink-0" />
          <span className="text-[10px] font-bold text-stone-500 hidden md:inline">Fonds de carte :</span>
          
          <button
            onClick={() => setSelectedLayer('standard')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              selectedLayer === 'standard' ? 'bg-white text-stone-900 shadow-2xs border border-stone-200' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="OpenStreetMap Standard"
          >
            Standard
          </button>

          <button
            onClick={() => setSelectedLayer('satellite')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              selectedLayer === 'satellite' ? 'bg-white text-stone-900 shadow-2xs border border-stone-200' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Esri World Satellite"
          >
            Satellite
          </button>

          <button
            onClick={() => setSelectedLayer('dark')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              selectedLayer === 'dark' ? 'bg-white text-stone-900 shadow-2xs border border-stone-200' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="CartoDB Dark Matter"
          >
            Sombre
          </button>

          <button
            onClick={() => setSelectedLayer('topo')}
            className={`px-2 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
              selectedLayer === 'topo' ? 'bg-white text-stone-900 shadow-2xs border border-stone-200' : 'text-stone-600 hover:text-stone-900'
            }`}
            title="Esri Topographic"
          >
            Relief
          </button>
        </div>
      </div>

      {/* 3. LEAFLET MAP CONTAINER */}
      <div className="relative rounded-2xl overflow-hidden border border-stone-300 shadow-sm">
        <div ref={mapContainerRef} className="w-full h-[330px] bg-stone-100 z-10" />

        {points.length === 0 && (
          <div className="absolute inset-0 bg-stone-50/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
            <MapPin className="h-10 w-10 text-stone-300 mb-2 animate-bounce" />
            <p className="text-xs font-bold text-stone-700">Aucun pointage géolocalisé pour cette période</p>
            <p className="text-[11px] text-stone-400 mt-1">
              Modifiez la sélection de dates ci-dessus pour afficher d'autres badges.
            </p>
          </div>
        )}
      </div>

      {/* 4. SINGLE ROW PER DATE WITH ALL 4 BADGES (Arrivée, Pause, Reprise, Départ) */}
      <div className="space-y-2">
        <p className="text-[11px] font-bold text-stone-700 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 text-green-600" />
            Historique par journée — 1 ligne contient les 4 pointages (cliquez sur un badge pour le cibler sur la carte) :
          </span>
          <span className="text-[10px] font-normal text-stone-400 lowercase">
            ({filteredPresences.length} jours affichés)
          </span>
        </p>

        {filteredPresences.length === 0 ? (
          <div className="text-center py-6 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-400">
            Aucun enregistrement de présence disponible pour cette période.
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[260px] overflow-y-auto custom-scrollbar pr-1">
            {filteredPresences.map((p, idx) => {
              const pDateObj = new Date(p.date);
              const dayOfWeek = pDateObj.getDay();
              const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

              const formattedDate = pDateObj.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              });

              // Extract badge points for this specific presence
              const arrivalPt = points.find(pt => pt.presenceDate === p.date && pt.type === 'arrival');
              const pauseStartPt = points.find(pt => pt.presenceDate === p.date && pt.type === 'pauseStart');
              const pauseEndPt = points.find(pt => pt.presenceDate === p.date && pt.type === 'pauseEnd');
              const departurePt = points.find(pt => pt.presenceDate === p.date && pt.type === 'departure');

              return (
                <div
                  key={p.id || `row-${p.date}-${idx}`}
                  className={`p-3 rounded-2xl border transition-all space-y-2 ${
                    isWeekend
                      ? 'bg-purple-50/50 border-purple-200 hover:border-purple-300'
                      : 'bg-white border-stone-200 hover:border-green-200 hover:shadow-2xs'
                  }`}
                >
                  {/* Row Top Bar: Date, Status, Weekend Badge */}
                  <div className="flex items-center justify-between text-xs gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-green-600 shrink-0" />
                      <span className="font-bold text-stone-900 capitalize">
                        {formattedDate}
                      </span>

                      {isWeekend && (
                        <span className="bg-purple-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                          <Sparkles className="h-2.5 w-2.5 text-amber-300" />
                          <span>Travail Week-end ({dayOfWeek === 0 ? 'Dimanche' : 'Samedi'})</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.status === 'present' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                        p.status === 'late' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                        'bg-green-100 text-green-800 border border-green-200'
                      }`}>
                        {p.status === 'present' ? 'PRÉSENT' : p.status === 'late' ? 'EN RETARD' : 'ABSENT'}
                      </span>
                    </div>
                  </div>

                  {/* Row Grid: The 4 Badges (Arrivée, Pause, Reprise, Départ) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {/* 1. ARRIVÉE */}
                    <button
                      type="button"
                      disabled={!arrivalPt}
                      onClick={() => arrivalPt && handleFocusBadge(arrivalPt.id, arrivalPt.lat, arrivalPt.lng)}
                      className={`p-2 rounded-xl border text-left transition ${
                        arrivalPt
                          ? 'bg-emerald-50/80 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 cursor-pointer'
                          : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-emerald-900">
                        <span className="flex items-center gap-1">
                          <Play className="h-2.5 w-2.5 text-emerald-600 shrink-0 fill-emerald-600" />
                          Arrivée
                        </span>
                        <span className="font-mono">{p.arrivalTime || '--:--'}</span>
                      </div>
                      {arrivalPt ? (
                        <div className="text-[9px] font-bold text-emerald-800 flex items-center gap-0.5 mt-1 truncate" title={arrivalPt.locationName}>
                          <MapPin className="h-2.5 w-2.5 text-green-600 shrink-0" />
                          <span className="truncate">{arrivalPt.locationName}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-stone-400 mt-1">Non badgé</div>
                      )}
                    </button>

                    {/* 2. DEBUT PAUSE */}
                    <button
                      type="button"
                      disabled={!pauseStartPt}
                      onClick={() => pauseStartPt && handleFocusBadge(pauseStartPt.id, pauseStartPt.lat, pauseStartPt.lng)}
                      className={`p-2 rounded-xl border text-left transition ${
                        pauseStartPt
                          ? 'bg-amber-50/80 border-amber-200 hover:bg-amber-100 hover:border-amber-300 cursor-pointer'
                          : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-amber-900">
                        <span className="flex items-center gap-1">
                          <Coffee className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                          Pause
                        </span>
                        <span className="font-mono">{p.pauseStart || '--:--'}</span>
                      </div>
                      {pauseStartPt ? (
                        <div className="text-[9px] font-bold text-amber-800 flex items-center gap-0.5 mt-1 truncate" title={pauseStartPt.locationName}>
                          <MapPin className="h-2.5 w-2.5 text-green-600 shrink-0" />
                          <span className="truncate">{pauseStartPt.locationName}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-stone-400 mt-1">Non badgé</div>
                      )}
                    </button>

                    {/* 3. RETOUR PAUSE */}
                    <button
                      type="button"
                      disabled={!pauseEndPt}
                      onClick={() => pauseEndPt && handleFocusBadge(pauseEndPt.id, pauseEndPt.lat, pauseEndPt.lng)}
                      className={`p-2 rounded-xl border text-left transition ${
                        pauseEndPt
                          ? 'bg-blue-50/80 border-blue-200 hover:bg-blue-100 hover:border-blue-300 cursor-pointer'
                          : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-blue-900">
                        <span className="flex items-center gap-1">
                          <RotateCcw className="h-2.5 w-2.5 text-blue-600 shrink-0" />
                          Reprise
                        </span>
                        <span className="font-mono">{p.pauseEnd || '--:--'}</span>
                      </div>
                      {pauseEndPt ? (
                        <div className="text-[9px] font-bold text-blue-800 flex items-center gap-0.5 mt-1 truncate" title={pauseEndPt.locationName}>
                          <MapPin className="h-2.5 w-2.5 text-green-600 shrink-0" />
                          <span className="truncate">{pauseEndPt.locationName}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-stone-400 mt-1">Non badgé</div>
                      )}
                    </button>

                    {/* 4. DÉPART */}
                    <button
                      type="button"
                      disabled={!departurePt}
                      onClick={() => departurePt && handleFocusBadge(departurePt.id, departurePt.lat, departurePt.lng)}
                      className={`p-2 rounded-xl border text-left transition ${
                        departurePt
                          ? 'bg-green-50/80 border-green-200 hover:bg-green-100 hover:border-green-300 cursor-pointer'
                          : 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold text-green-900">
                        <span className="flex items-center gap-1">
                          <Home className="h-2.5 w-2.5 text-green-600 shrink-0" />
                          Départ
                        </span>
                        <span className="font-mono">{p.departureTime || '--:--'}</span>
                      </div>
                      {departurePt ? (
                        <div className="text-[9px] font-bold text-green-800 flex items-center gap-0.5 mt-1 truncate" title={departurePt.locationName}>
                          <MapPin className="h-2.5 w-2.5 text-green-600 shrink-0" />
                          <span className="truncate">{departurePt.locationName}</span>
                        </div>
                      ) : (
                        <div className="text-[9px] text-stone-400 mt-1">Non badgé</div>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
