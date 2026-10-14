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
  selectedEmployeeId?: string
): PointageMarker[] {
  const markers: PointageMarker[] = [];

  const filtered = presences.filter((p) => {
    if (selectedDate && p.date !== selectedDate) return false;
    if (selectedEmployeeId && selectedEmployeeId !== 'all' && p.employeeId !== selectedEmployeeId) return false;
    return true;
  });

  filtered.forEach((p) => {
    const emp = employees.find((e) => e.id === p.employeeId);
    const empName = emp?.name || 'Collaborateur';
    const avatar = emp?.avatarUrl;

    if (p.latitude && p.longitude) {
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
          lat: p.latitude,
          lng: p.longitude,
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
          lat: p.latitude + 0.0002, // slight offset for visibility if identical
          lng: p.longitude + 0.0002,
        });
      }
    }
  });

  return markers;
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
