import L from 'leaflet';
import { Presence } from '../../../types';

export interface MapBadgePoint {
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

export function extractCollaboratorMapPoints(
  presences: Presence[],
  selectedMonth: string,
  filterPeriod: 'month' | 'year' | 'day' | 'all',
  selectedDay: string
): MapBadgePoint[] {
  const points: MapBadgePoint[] = [];

  const filtered = presences.filter((p) => {
    if (filterPeriod === 'month' && !p.date.startsWith(selectedMonth)) return false;
    if (filterPeriod === 'day' && p.date !== selectedDay) return false;
    if (filterPeriod === 'year' && !p.date.startsWith(selectedMonth.slice(0, 4))) return false;
    return true;
  });

  filtered.forEach((p) => {
    const dayOfWeek = new Date(p.date).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const formattedDate = new Date(p.date).toLocaleDateString('fr-FR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });

    if (p.latitude && p.longitude) {
      if (p.arrivalTime) {
        points.push({
          id: `${p.id}-arr`,
          presenceDate: p.date,
          formattedDate,
          time: p.arrivalTime,
          type: 'arrival',
          label: 'Arrivée',
          locationName: p.location || 'Bureau',
          lat: p.latitude,
          lng: p.longitude,
          isWeekend,
        });
      }
      if (p.departureTime) {
        points.push({
          id: `${p.id}-dep`,
          presenceDate: p.date,
          formattedDate,
          time: p.departureTime,
          type: 'departure',
          label: 'Départ',
          locationName: p.location || 'Bureau',
          lat: p.latitude + 0.00015,
          lng: p.longitude + 0.00015,
          isWeekend,
        });
      }
    }
  });

  return points;
}

export function createCollaboratorPointIcon(point: MapBadgePoint): L.DivIcon {
  const color = point.type === 'arrival' ? '#059669' : '#2A7B76';
  return L.divIcon({
    className: 'collaborator-point-pin',
    html: `
      <div style="background-color: ${color}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); font-weight: bold; font-size: 10px;">
        ${point.type === 'arrival' ? 'ARR' : 'DEP'}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}
