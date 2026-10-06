/**
 * Cameroon Public Holidays Utility
 * Under Cameroonian Law (Loi n° 73/5 du 7 décembre 1973),
 * if a public holiday falls on a Sunday, the following Monday is a public holiday.
 */

// Helper to format date as YYYY-MM-DD in local timezone
export function formatDateStr(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// Meeus/Jones/Butcher Gregorian Easter Algorithm
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const L = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * L) / 451);
  const month = Math.floor((h + L - 7 * m + 114) / 31);
  const day = ((h + L - 7 * m + 114) % 31) + 1;
  
  // Create a UTC date at midnight to avoid timezone shifting
  return new Date(Date.UTC(year, month - 1, day));
}

// Map of Islamic moveable holidays (Eid al-Fitr, Eid al-Adha, Mawlid) for 2024 to 2028
// These are the official dates observed in Cameroon.
const ISLAMIC_HOLIDAYS: Record<number, string[]> = {
  2024: [
    '2024-04-10', // Eid al-Fitr (Fête du Ramadan)
    '2024-06-16', // Eid al-Adha (Fête de la Tabaski)
    '2024-09-15', // Mawlid (Naissance du Prophète)
  ],
  2025: [
    '2025-03-31', // Eid al-Fitr (Fête du Ramadan)
    '2025-06-06', // Eid al-Adha (Fête de la Tabaski)
    '2025-09-05', // Mawlid (Naissance du Prophète)
  ],
  2026: [
    '2026-03-20', // Eid al-Fitr (Fête du Ramadan)
    '2026-05-27', // Eid al-Adha (Fête de la Tabaski)
    '2026-08-25', // Mawlid (Naissance du Prophète)
  ],
  2027: [
    '2027-03-09', // Eid al-Fitr (Fête du Ramadan)
    '2027-05-17', // Eid al-Adha (Fête de la Tabaski)
    '2027-08-14', // Mawlid (Naissance du Prophète)
  ],
  2028: [
    '2028-02-27', // Eid al-Fitr (Fête du Ramadan)
    '2028-05-05', // Eid al-Adha (Fête de la Tabaski)
    '2028-08-02', // Mawlid (Naissance du Prophète)
  ],
};

export interface HolidayInfo {
  date: string;
  name: string;
  isObservedMonday?: boolean; // True if it fell on Sunday and is observed on Monday
}

export interface CustomHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

export function getCustomHolidays(): CustomHoliday[] {
  try {
    const stored = localStorage.getItem('citrine_custom_holidays');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {}
  return [];
}

export function addCustomHoliday(date: string, name: string): void {
  const current = getCustomHolidays();
  const filtered = current.filter(h => h.date !== date);
  filtered.push({ date, name });
  localStorage.setItem('citrine_custom_holidays', JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('citrine_custom_holidays_changed'));
}

export function removeCustomHoliday(date: string): void {
  const current = getCustomHolidays();
  const filtered = current.filter(h => h.date !== date);
  localStorage.setItem('citrine_custom_holidays', JSON.stringify(filtered));
  window.dispatchEvent(new CustomEvent('citrine_custom_holidays_changed'));
}

export function isWeekend(dateStr: string): boolean {
  if (!dateStr) return false;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
  const dateObj = new Date(y, m - 1, d, 12, 0, 0);
  const day = dateObj.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Get all public holidays for a given year in Cameroon
 */
export function getCameroonHolidays(year: number): Record<string, HolidayInfo> {
  const holidays: Record<string, HolidayInfo> = {};

  // 1. Fixed Holidays
  const fixedHolidays = [
    { month: 1, day: 1, name: "Jour de l'An" },
    { month: 2, day: 11, name: "Fête de la Jeunesse" },
    { month: 5, day: 1, name: "Fête du Travail" },
    { month: 5, day: 20, name: "Fête Nationale (Fête de l'Unité)" },
    { month: 8, day: 15, name: "Assomption" },
    { month: 12, day: 25, name: "Noël" }
  ];

  fixedHolidays.forEach(({ month, day, name }) => {
    const dStr = formatDateStr(year, month, day);
    holidays[dStr] = { date: dStr, name };
  });

  // 2. Moveable Christian Holidays (relative to Easter)
  const easter = getEasterDate(year);
  
  // Good Friday (Vendredi Saint) is 2 days before Easter
  const goodFridayDate = new Date(easter.getTime() - 2 * 24 * 60 * 60 * 1000);
  const gfStr = formatDateStr(year, goodFridayDate.getUTCMonth() + 1, goodFridayDate.getUTCDate());
  holidays[gfStr] = { date: gfStr, name: "Vendredi Saint" };

  // Easter Monday (Lundi de Pâques) is 1 day after Easter
  const easterMondayDate = new Date(easter.getTime() + 1 * 24 * 60 * 60 * 1000);
  const emStr = formatDateStr(year, easterMondayDate.getUTCMonth() + 1, easterMondayDate.getUTCDate());
  holidays[emStr] = { date: emStr, name: "Lundi de Pâques" };

  // Ascension is 39 days after Easter
  const ascensionDate = new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000);
  const ascStr = formatDateStr(year, ascensionDate.getUTCMonth() + 1, ascensionDate.getUTCDate());
  holidays[ascStr] = { date: ascStr, name: "Ascension" };

  // 3. Moveable Islamic Holidays
  const islamic = ISLAMIC_HOLIDAYS[year] || [];
  islamic.forEach((date, index) => {
    let name = "Fête Islamique";
    if (index === 0) name = "Fête du Ramadan (Eid al-Fitr)";
    else if (index === 1) name = "Fête de la Tabaski (Eid al-Adha)";
    else if (index === 2) name = "Mawlid (Naissance du Prophète)";
    holidays[date] = { date, name };
  });

  // 4. Apply Cameroon Law: If a holiday is on Sunday, the following Monday is a holiday too!
  const finalHolidays: Record<string, HolidayInfo> = { ...holidays };
  
  Object.keys(holidays).forEach((dateStr) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(day)) return;

    const d = new Date(y, m - 1, day, 12, 0, 0);
    const dayOfWeek = d.getDay(); // 0 is Sunday
    
    if (dayOfWeek === 0) {
      // Find Monday
      const mondayDate = new Date(y, m - 1, day + 1, 12, 0, 0);
      const mStr = formatDateStr(mondayDate.getFullYear(), mondayDate.getMonth() + 1, mondayDate.getDate());
      
      // If the Monday isn't already a holiday, mark it as observed holiday!
      if (!finalHolidays[mStr]) {
        finalHolidays[mStr] = {
          date: mStr,
          name: `${holidays[dateStr].name} (Férié reporté)`,
          isObservedMonday: true
        };
      }
    }
  });

  return finalHolidays;
}

/**
 * Check if a date string (YYYY-MM-DD) is a public holiday in Cameroon or custom declared
 */
export function isCameroonHoliday(dateStr: string): boolean {
  if (!dateStr) return false;
  const custom = getCustomHolidays();
  if (custom.some(h => h.date === dateStr)) return true;

  const year = parseInt(dateStr.split('-')[0], 10);
  if (isNaN(year)) return false;
  const yearHolidays = getCameroonHolidays(year);
  return !!yearHolidays[dateStr];
}

export function isNonWorkingDay(dateStr: string): boolean {
  return isWeekend(dateStr) || isCameroonHoliday(dateStr);
}

/**
 * Get public holiday information if the date is a holiday, otherwise null
 */
export function getHolidayInfo(dateStr: string): HolidayInfo | null {
  if (!dateStr) return null;
  const custom = getCustomHolidays();
  const foundCustom = custom.find(h => h.date === dateStr);
  if (foundCustom) {
    return { date: foundCustom.date, name: `${foundCustom.name} (Férié déclaré)` };
  }

  const year = parseInt(dateStr.split('-')[0], 10);
  if (isNaN(year)) return null;
  const yearHolidays = getCameroonHolidays(year);
  return yearHolidays[dateStr] || null;
}
