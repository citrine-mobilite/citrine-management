import React from 'react';
import { IllustrationProps } from './humaanTypes';

export const HumaanPersonal: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Espace Personnel">
      <ellipse cx="110" cy="148" rx="70" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="80" r="65" fill="#2A7B76" fillOpacity="0.15" />
      <rect x="30" y="112" width="160" height="6" rx="3" fill="#E2E8F0" />
      <rect x="75" y="85" width="45" height="28" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
      <polygon points="68,113 127,113 122,110 73,110" fill="#94A3B8" />
      <circle cx="97" cy="99" r="4" fill="#F3D079" />
      <rect x="135" y="98" width="12" height="14" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <path d="M147 101 C150 101 150 108 147 108" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
      <g transform="translate(70, 20)">
        <circle cx="28" cy="22" r="14" fill="#D49B74" />
        <path d="M16 20 C16 9 38 8 38 18 C38 22 34 24 28 24 Z" fill="#0F172A" />
        <path d="M16 42 C16 33 46 33 46 42 L43 85 L18 85 Z" fill="#2A7B76" />
        <path d="M16 46 L3 68 L15 76" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" />
        <path d="M44 46 L54 68 L42 76" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" />
        <circle cx="15" cy="76" r="4" fill="#D49B74" />
        <circle cx="42" cy="76" r="4" fill="#D49B74" />
      </g>
      <g transform="translate(145, 30)">
        <rect width="45" height="26" rx="8" fill="#10B981" />
        <path d="M12 13 L17 18 L26 9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="34" cy="13" r="3" fill="#F3D079" />
      </g>
    </svg>
  );
};

export const HumaanLeaves: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Congés et Permissions">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="165" cy="45" r="24" fill="#F3D079" fillOpacity="0.3" />
      <circle cx="165" cy="45" r="14" fill="#F3D079" />
      <path d="M35 140 Q 55 90 95 80 Q 75 110 55 140 Z" fill="#10B981" fillOpacity="0.4" />
      <path d="M40 140 Q 75 105 115 110 Q 85 125 60 140 Z" fill="#059669" fillOpacity="0.5" />
      <g transform="translate(130, 85)">
        <rect x="0" y="10" width="28" height="42" rx="6" fill="#D4A82F" stroke="#B45309" strokeWidth="1.5" />
        <line x1="8" y1="20" x2="20" y2="20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="28" x2="20" y2="28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 10 L9 0 L19 0 L19 10" stroke="#78350F" strokeWidth="2" fill="none" />
        <circle cx="6" cy="54" r="3" fill="#1E293B" />
        <circle cx="22" cy="54" r="3" fill="#1E293B" />
      </g>
      <g transform="translate(65, 30)">
        <circle cx="30" cy="20" r="13" fill="#C6865A" />
        <path d="M19 18 C19 8 40 8 40 18 C40 22 36 24 30 24 Z" fill="#1C1917" />
        <rect x="23" y="18" width="6" height="4" rx="1" fill="#0F172A" />
        <rect x="31" y="18" width="6" height="4" rx="1" fill="#0F172A" />
        <line x1="28" y1="20" x2="32" y2="20" stroke="#0F172A" strokeWidth="1" />
        <path d="M18 38 C18 30 44 30 44 38 L42 78 L20 78 Z" fill="#0D9488" />
        <path d="M18 42 L5 56 L-8 48" stroke="#0D9488" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 42 L58 56 L65 78" stroke="#0D9488" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 78 L18 108 L26 108 L28 85 L34 85 L36 108 L44 108 L42 78 Z" fill="#F8FAFC" />
        <rect x="14" y="108" width="13" height="6" rx="2" fill="#D4A82F" />
        <rect x="35" y="108" width="13" height="6" rx="2" fill="#D4A82F" />
      </g>
    </svg>
  );
};

export const HumaanStatistics: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Statistiques & Assiduité">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="75" r="55" fill="#10B981" fillOpacity="0.12" />
      <g transform="translate(100, 35)">
        <rect width="90" height="70" rx="10" fill="#FFFFFF" fillOpacity="0.25" stroke="#FFFFFF" strokeWidth="1.5" />
        <rect x="15" y="45" width="12" height="18" rx="3" fill="#F3D079" />
        <rect x="35" y="32" width="12" height="31" rx="3" fill="#10B981" />
        <rect x="55" y="20" width="12" height="43" rx="3" fill="#2A7B76" />
        <path d="M18 42 Q 40 24 70 12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <polygon points="70,8 74,15 67,16" fill="#FFFFFF" />
      </g>
      <g transform="translate(45, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 39 10 39 18 C39 23 35 24 30 24 Z" fill="#0F172A" />
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#1F625E" />
        <path d="M44 44 L68 38 L84 48" stroke="#1F625E" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="84" cy="48" r="4" fill="#D49B74" />
        <path d="M18 44 L5 62 L20 68" stroke="#1F625E" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="58" width="18" height="14" rx="2" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

export const HumaanCollaborators: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Collaborateurs">
      <ellipse cx="110" cy="148" rx="75" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="75" r="60" fill="#F3D079" fillOpacity="0.15" />
      <g transform="translate(40, 30)">
        <circle cx="28" cy="20" r="13" fill="#D49B74" />
        <path d="M17 18 C17 8 38 8 38 18 C38 22 34 24 28 24 Z" fill="#1E293B" />
        <path d="M16 38 C16 30 42 30 42 38 L38 85 L18 85 Z" fill="#2A7B76" />
        <path d="M42 42 L58 56" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" />
        <path d="M16 42 L8 60 L18 68" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 85 L16 118 L24 118 L26 92 L30 92 L32 118 L40 118 L38 85 Z" fill="#334155" />
      </g>
      <g transform="translate(115, 30)">
        <circle cx="28" cy="20" r="13" fill="#C6865A" />
        <circle cx="28" cy="12" r="11" fill="#0F172A" />
        <path d="M16 38 C16 30 42 30 42 38 L40 85 L18 85 Z" fill="#D4A82F" />
        <path d="M16 42 L-2 48 L-6 36" stroke="#D4A82F" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-6" cy="36" r="4" fill="#C6865A" />
        <path d="M42 42 L48 64" stroke="#D4A82F" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 85 L16 118 L24 118 L26 92 L30 92 L32 118 L40 118 L40 85 Z" fill="#1E293B" />
      </g>
      <polygon points="108,45 111,54 120,57 111,60 108,69 105,60 96,57 105,54" fill="#FFFFFF" />
    </svg>
  );
};
