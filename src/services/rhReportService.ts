import { Employee, Presence, SalaryPayment } from '../types';
import { formatMinutesToHours, isLate } from '../utils/dateUtils';

export interface AttendanceMonthlyReport {
  employee: Employee;
  monthStr: string; // "YYYY-MM"
  monthLabel: string; // "Septembre 2026"
  workedDays: number;
  totalHoursFormatted: string;
  totalMinutes: number;
  totalLateOccurrences: number;
  totalLateMinutes: number;
  absenceDays: number;
  dailyRows: {
    date: string;
    dayLabel: string;
    status: 'present' | 'late' | 'absent';
    arrival: string;
    pauseStart: string;
    pauseEnd: string;
    departure: string;
    durationFormatted: string;
    location: string;
    method: string;
  }[];
  certificate: RhDigitalCertificate;
}

export interface RhDigitalCertificate {
  certificateId: string;
  documentType: 'attendance_report' | 'payslip';
  hashSha256: string;
  issuedAt: string;
  issuedBy: string;
  companyName: string;
  integrityVerified: boolean;
}

/**
 * Calcule la signature numérique SHA-256 scellant le document
 */
export async function generateDigitalCertificate(
  documentType: 'attendance_report' | 'payslip',
  payloadData: object,
  employeeId: string,
  issuer: string = "Direction des Ressources Humaines - Citrine Management"
): Promise<RhDigitalCertificate> {
  const timestamp = new Date().toISOString();
  const serialized = JSON.stringify({
    type: documentType,
    emp: employeeId,
    data: payloadData,
    issued: timestamp,
    issuer
  });

  const encoder = new TextEncoder();
  const data = encoder.encode(serialized);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  const shortId = hashHex.substring(0, 10).toUpperCase();

  return {
    certificateId: `CITRINE-CERT-${documentType === 'payslip' ? 'PAY' : 'PRES'}-${shortId}`,
    documentType,
    hashSha256: hashHex,
    issuedAt: timestamp,
    issuedBy: issuer,
    companyName: "Citrine Management Enterprise",
    integrityVerified: true
  };
}

/**
 * Génère le rapport mensuel d'assiduité et de présence certifié
 */
export async function buildMonthlyAttendanceReport(
  employee: Employee,
  allPresences: Presence[],
  monthStr: string = new Date().toISOString().slice(0, 7) // "YYYY-MM"
): Promise<AttendanceMonthlyReport> {
  const [yearNum, monthNum] = monthStr.split('-').map(Number);
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  
  const monthDate = new Date(yearNum, monthNum - 1, 1);
  const monthLabel = monthDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

  // Filtrer les présences du mois
  const empPresences = allPresences.filter(p => p.employeeId === employee.id && p.date.startsWith(monthStr));

  let workedDays = 0;
  let totalMinutes = 0;
  let totalLateOccurrences = 0;
  let totalLateMinutes = 0;
  let absenceDays = 0;

  const dailyRows: AttendanceMonthlyReport['dailyRows'] = [];

  // Parcourir chaque jour du mois
  for (let day = 1; day <= daysInMonth; day++) {
    const dayStr = String(day).padStart(2, '0');
    const dateKey = `${monthStr}-${dayStr}`;
    const dateObj = new Date(yearNum, monthNum - 1, day);
    const dayOfWeek = dateObj.getDay(); // 0 = Dimanche, 6 = Samedi
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dayLabel = dateObj.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
    const p = empPresences.find(item => item.date === dateKey);

    if (p) {
      workedDays++;
      let dayDurationMinutes = 0;

      // Calcul de la durée travaillée
      if (p.arrivalTime && p.departureTime) {
        const [ah, am] = p.arrivalTime.split(':').map(Number);
        const [dh, dm] = p.departureTime.split(':').map(Number);
        dayDurationMinutes = Math.max(0, (dh * 60 + dm) - (ah * 60 + am));
        
        // Déduire pause si présente
        if (p.pauseStart && p.pauseEnd) {
          const [psh, psm] = p.pauseStart.split(':').map(Number);
          const [peh, pem] = p.pauseEnd.split(':').map(Number);
          const pauseMins = Math.max(0, (peh * 60 + pem) - (psh * 60 + psm));
          dayDurationMinutes = Math.max(0, dayDurationMinutes - pauseMins);
        }
      } else if (p.arrivalTime) {
        // Journée partielle en cours
        dayDurationMinutes = 480; // Valeur par défaut 8h
      }

      totalMinutes += dayDurationMinutes;

      if (p.status === 'late' || (p.arrivalTime && isLate(p.arrivalTime, '08:00'))) {
        totalLateOccurrences++;
        if (p.arrivalTime) {
          const [h, m] = p.arrivalTime.split(':').map(Number);
          const arrivalMin = h * 60 + m;
          const lateMin = Math.max(0, arrivalMin - 480); // 08:00 = 480min
          totalLateMinutes += lateMin;
        }
      }

      const rowStatus: 'present' | 'late' | 'absent' = 
        p.status === 'present' ? 'present' :
        p.status === 'late' ? 'late' : 'absent';

      dailyRows.push({
        date: dateKey,
        dayLabel,
        status: rowStatus,
        arrival: p.arrivalTime || '--:--',
        pauseStart: p.pauseStart || '--:--',
        pauseEnd: p.pauseEnd || '--:--',
        departure: p.departureTime || '--:--',
        durationFormatted: formatMinutesToHours(dayDurationMinutes),
        location: p.clockLocations?.arrival?.zoneName || p.location || 'Douala, Japoma',
        method: p.clockingMethod === 'qr_code' ? 'QR Code Dynamique' :
                p.clockingMethod === 'gps' ? 'GPS Géolocalisé' :
                p.clockingMethod === 'kiosk_pin' ? 'Code PIN Kiosque' :
                p.clockingMethod === 'wifi_ip' ? 'IP Wi-Fi Bureau' : 'Standard'
      });
    } else {
      // Jour sans pointage
      if (!isWeekend && dateObj <= new Date()) {
        absenceDays++;
      }
      dailyRows.push({
        date: dateKey,
        dayLabel,
        status: 'absent',
        arrival: '--:--',
        pauseStart: '--:--',
        pauseEnd: '--:--',
        departure: '--:--',
        durationFormatted: isWeekend ? 'Repos' : 'Non pointé',
        location: isWeekend ? 'Week-end' : 'N/A',
        method: isWeekend ? 'Jour non ouvré' : 'Absence'
      });
    }
  }

  // Certificat numérique
  const certificate = await generateDigitalCertificate(
    'attendance_report',
    {
      monthStr,
      workedDays,
      totalMinutes,
      totalLateOccurrences,
      totalLateMinutes,
      absenceDays
    },
    employee.id
  );

  return {
    employee,
    monthStr,
    monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
    workedDays,
    totalHoursFormatted: formatMinutesToHours(totalMinutes),
    totalMinutes,
    totalLateOccurrences,
    totalLateMinutes,
    absenceDays,
    dailyRows,
    certificate
  };
}
