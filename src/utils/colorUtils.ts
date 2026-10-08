export interface SoftColorTheme {
  bg: string;          // Tailwind bg/text classes (e.g., 'bg-emerald-50 text-emerald-800 border-emerald-200')
  badge: string;       // Shorthand for smaller badges
  text: string;        // Text color class
  border: string;      // Border color class
  bgRaw: string;       // HEX background color for Map Pins
  textRaw: string;     // HEX text color for Map Pins
}

const SOFT_COLORS: SoftColorTheme[] = [
  { 
    bg: 'bg-emerald-50 text-emerald-850 border-emerald-200/80', 
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    text: 'text-emerald-800', 
    border: 'border-emerald-200',
    bgRaw: '#ecfdf5', 
    textRaw: '#065f46' 
  },
  { 
    bg: 'bg-blue-50 text-blue-850 border-blue-200/80', 
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
    text: 'text-blue-800', 
    border: 'border-blue-200',
    bgRaw: '#eff6ff', 
    textRaw: '#1e40af' 
  },
  { 
    bg: 'bg-amber-50 text-amber-850 border-amber-200/80', 
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    text: 'text-amber-800', 
    border: 'border-amber-200',
    bgRaw: '#fef3c7', 
    textRaw: '#92400e' 
  },
  { 
    bg: 'bg-purple-50 text-purple-850 border-purple-200/80', 
    badge: 'bg-purple-50 text-purple-700 border-purple-100',
    text: 'text-purple-800', 
    border: 'border-purple-200',
    bgRaw: '#f3e8ff', 
    textRaw: '#6b21a8' 
  },
  { 
    bg: 'bg-rose-50 text-rose-850 border-rose-200/80', 
    badge: 'bg-rose-50 text-rose-700 border-rose-100',
    text: 'text-rose-800', 
    border: 'border-rose-200',
    bgRaw: '#fff1f2', 
    textRaw: '#9f1239' 
  },
  { 
    bg: 'bg-teal-50 text-teal-850 border-teal-200/80', 
    badge: 'bg-teal-50 text-teal-700 border-teal-100',
    text: 'text-teal-800', 
    border: 'border-teal-200',
    bgRaw: '#f0fdfa', 
    textRaw: '#115e59' 
  },
  { 
    bg: 'bg-indigo-50 text-indigo-850 border-indigo-200/80', 
    badge: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    text: 'text-indigo-800', 
    border: 'border-indigo-200',
    bgRaw: '#e0e7ff', 
    textRaw: '#3730a3' 
  },
  { 
    bg: 'bg-orange-50 text-orange-850 border-orange-200/80', 
    badge: 'bg-orange-50 text-orange-700 border-orange-100',
    text: 'text-orange-800', 
    border: 'border-orange-200',
    bgRaw: '#fff7ed', 
    textRaw: '#9a3412' 
  },
];

/**
 * Deterministically returns a soft color theme based on the employee's name.
 */
export function getEmployeeSoftColor(name: string): SoftColorTheme {
  let hash = 0;
  const cleanName = name || 'Collaborateur';
  for (let i = 0; i < cleanName.length; i++) {
    hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % SOFT_COLORS.length;
  return SOFT_COLORS[index];
}
