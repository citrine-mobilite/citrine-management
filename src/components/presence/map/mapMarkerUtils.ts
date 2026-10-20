import L from 'leaflet';
import { Presence, Employee } from '../../../types';
import { getEmployeeSoftColor } from '../../../utils/colorUtils';

export interface PointageMarker {
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

export function extractPointageMarkers(
  presences: Presence[],
  employees: Employee[],
  selectedDate: string,
  selectedEmployeeId?: string,
  mapPeriod: 'day' | 'week' | 'month' | 'all' | 'custom' = 'day',
  customFilterQuery?: string,
  customStartDate?: string,
  customEndDate?: string
): PointageMarker[] {
  const markers: PointageMarker[] = [];
  const targetDateObj = new Date(selectedDate || Date.now());

  const filtered = presences.filter((p) => {
    if (!p.date) return false;
    if (selectedEmployeeId && selectedEmployeeId !== 'all' && p.employeeId !== selectedEmployeeId) return false;

    const pDateObj = new Date(p.date);
    const diffTime = targetDateObj.getTime() - pDateObj.getTime();
    const diffDays = diffTime / (1000 * 3600 * 24);

    if (mapPeriod === 'day') {
      return p.date === selectedDate;
    } else if (mapPeriod === 'week') {
      return diffDays >= 0 && diffDays <= 7;
    } else if (mapPeriod === 'month') {
      return diffDays >= 0 && diffDays <= 30;
    } else if (mapPeriod === 'custom') {
      if (!customStartDate && !customEndDate) return true;
      if (customStartDate && p.date < customStartDate) return false;
      if (customEndDate && p.date > customEndDate) return false;
      return true;
    }
    return true; // 'all'
  });

  filtered.forEach((p, idx) => {
    const emp = employees.find((e) => e.id === p.employeeId);
    const empName = emp?.name || p.employeeName || 'Collaborateur';
    const avatar = emp?.avatarUrl;

    const lat = (typeof p.latitude === 'number' && p.latitude !== 0) ? p.latitude : (4.0511 + (idx * 0.001));
    const lng = (typeof p.longitude === 'number' && p.longitude !== 0) ? p.longitude : (9.7679 + (idx * 0.001));

    if (p.arrivalTime) {
      markers.push({
        id: `${p.id}-arr`,
        employeeId: p.employeeId,
        employeeName: empName,
        avatarUrl: avatar,
        date: p.date,
        time: p.arrivalTime,
        type: 'arrival',
        label: 'Arrivée',
        locationName: p.location || 'Bureau',
        lat,
        lng,
      });
    }
    if (p.departureTime) {
      markers.push({
        id: `${p.id}-dep`,
        employeeId: p.employeeId,
        employeeName: empName,
        avatarUrl: avatar,
        date: p.date,
        time: p.departureTime,
        type: 'departure',
        label: 'Départ',
        locationName: p.location || 'Bureau',
        lat: lat + 0.0002,
        lng: lng + 0.0002,
      });
    }
  });

  return markers.filter((m) => {
    if (!customFilterQuery || !customFilterQuery.trim()) return true;
    const q = customFilterQuery.toLowerCase();
    return (
      m.employeeName.toLowerCase().includes(q) ||
      m.locationName.toLowerCase().includes(q) ||
      m.label.toLowerCase().includes(q) ||
      m.time.toLowerCase().includes(q)
    );
  });
}

export function createLeafletCustomIcon(marker: PointageMarker): L.DivIcon {
  const softTheme = getEmployeeSoftColor(marker.employeeName);
  const color = softTheme.textRaw;
  const bgColor = softTheme.bgRaw;

  return L.divIcon({
    className: 'custom-pointage-pin',
    html: `
      <div style="background-color: ${bgColor}; color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2.5px solid ${color}; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.2); font-weight: bold; font-size: 11px;">
        ${marker.avatarUrl ? `<img src="${marker.avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;" />` : marker.employeeName.slice(0, 2).toUpperCase()}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}
