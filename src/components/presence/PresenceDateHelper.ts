export function formatFrenchPointageTitle(dateStr: string): string {
  if (!dateStr) return 'Pointage du jour';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return 'Pointage du jour';

  const year = parseInt(parts[0], 10);
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const monthsFr = [
    'janvier',
    'février',
    'mars',
    'avril',
    'mai',
    'juin',
    'juillet',
    'août',
    'septembre',
    'octobre',
    'novembre',
    'décembre',
  ];

  if (isNaN(year) || isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11 || isNaN(day)) {
    return 'Pointage du jour';
  }

  const dayFormatted = day === 1 ? '1er' : day;
  return `Pointage du ${dayFormatted} ${monthsFr[monthIdx]} ${year}`;
}

export function isWeekFinishedForDate(
  dateStr: string,
  currentSimDate: string = '2026-07-08',
  currentSimTime: string = '08:45'
): boolean {
  if (!dateStr || !currentSimDate) return false;

  const parseYYYYMMDD = (str: string) => {
    const parts = str.split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    return new Date(y, m, d, 12, 0, 0);
  };

  const d = parseYYYYMMDD(dateStr);
  const simD = parseYYYYMMDD(currentSimDate);

  if (!d || !simD || isNaN(d.getTime()) || isNaN(simD.getTime())) return false;

  const day = d.getDay();
  const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.getFullYear(), d.getMonth(), diffToMonday, 0, 0, 0, 0);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6, 23, 59, 59, 999);

  return simD > sunday;
}
