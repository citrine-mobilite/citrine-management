import React from 'react';
import { IllustrationProps } from './humaanTypes';

export const HumaanAlerts: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Alertes et Rappels">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#EF4444" fillOpacity="0.1" />
      <g transform="translate(130, 35)">
        <path d="M25 12 C14 12 10 24 8 40 L4 46 C2 50 6 54 12 54 L38 54 C44 54 48 50 46 46 L42 40 C40 24 36 12 25 12 Z" fill="#F3D079" stroke="#D4A82F" strokeWidth="1.5" />
        <circle cx="25" cy="58" r="6" fill="#D4A82F" />
        <path d="M52 24 C58 32 58 44 52 52" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M60 16 C70 28 70 48 60 60" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" fill="none" />
      </g>
      <g transform="translate(50, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#0F172A" />
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#2A7B76" />
        <path d="M44 44 L66 42 L80 44" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" />
        <circle cx="80" cy="44" r="4" fill="#D49B74" />
        <path d="M18 44 L8 60 L18 72" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

export const HumaanDiscipline: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Conseil de Discipline">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#6366F1" fillOpacity="0.12" />
      <g transform="translate(125, 30)">
        <line x1="30" y1="15" x2="30" y2="70" stroke="#F3D079" strokeWidth="3" />
        <line x1="10" y1="25" x2="50" y2="25" stroke="#F3D079" strokeWidth="2.5" />
        <line x1="12" y1="25" x2="6" y2="45" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="12" y1="25" x2="18" y2="45" stroke="#E2E8F0" strokeWidth="1" />
        <path d="M4 45 Q 12 55 20 45 Z" fill="#F3D079" />
        <line x1="48" y1="25" x2="42" y2="45" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="48" y1="25" x2="54" y2="45" stroke="#E2E8F0" strokeWidth="1" />
        <path d="M40 45 Q 48 55 56 45 Z" fill="#F3D079" />
        <rect x="22" y="68" width="16" height="5" rx="2" fill="#F3D079" />
      </g>
      <g transform="translate(50, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#1E293B" />
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#0F172A" />
        <polygon points="31,40 33,54 31,65 29,54" fill="#DC2626" />
        <path d="M44 44 L56 60 L46 72" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 44 L6 60 L18 70" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#334155" />
      </g>
    </svg>
  );
};

export const HumaanDocuments: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Documents RH">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#2A7B76" fillOpacity="0.15" />
      <g transform="translate(125, 30)">
        <rect width="45" height="60" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
        <line x1="8" y1="12" x2="30" y2="12" stroke="#2A7B76" strokeWidth="3" strokeLinecap="round" />
        <line x1="8" y1="20" x2="36" y2="20" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="28" x2="36" y2="28" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="36" x2="26" y2="36" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="46" r="7" fill="#F3D079" />
        <path d="M29 46 L31 48 L35 44" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      <g transform="translate(55, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#0F172A" />
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#2A7B76" />
        <path d="M18 44 L30 65 L44 65" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" />
        <rect x="25" y="52" width="30" height="24" rx="4" fill="#D4A82F" stroke="#B45309" strokeWidth="1.5" />
        <line x1="30" y1="60" x2="48" y2="60" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

export const HumaanInventory: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Inventaire et Stock">
      <ellipse cx="110" cy="148" rx="70" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#F59E0B" fillOpacity="0.12" />
      <g transform="translate(120, 60)">
        <rect x="0" y="25" width="45" height="35" rx="4" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        <line x1="22" y1="25" x2="22" y2="60" stroke="#B45309" strokeWidth="2" />
        <rect x="8" y="0" width="35" height="26" rx="3" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
        <line x1="25" y1="0" x2="25" y2="26" stroke="#D97706" strokeWidth="2" />
        <rect x="15" y="6" width="12" height="6" rx="1" fill="#FFFFFF" fillOpacity="0.6" />
      </g>
      <g transform="translate(45, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#1E293B" />
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#2563EB" />
        <path d="M18 44 L28 66 L42 66" stroke="#2563EB" strokeWidth="7" strokeLinecap="round" />
        <rect x="36" y="52" width="22" height="28" rx="3" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.5" />
        <line x1="40" y1="60" x2="52" y2="60" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="67" x2="50" y2="67" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#0F172A" />
      </g>
    </svg>
  );
};
