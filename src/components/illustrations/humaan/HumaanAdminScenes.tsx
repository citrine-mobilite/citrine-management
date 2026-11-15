import React from 'react';
import { IllustrationProps } from './humaanTypes';

export const HumaanHse: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Registre HSE & Incidents">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#EF4444" fillOpacity="0.12" />
      <g transform="translate(125, 35)">
        <path d="M25 5 L50 15 V38 C50 60 25 75 25 75 C25 75 0 60 0 38 V15 Z" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2.5" />
        <rect x="22" y="25" width="6" height="24" rx="2" fill="#10B981" />
        <rect x="13" y="34" width="24" height="6" rx="2" fill="#10B981" />
      </g>
      <g transform="translate(50, 25)">
        <circle cx="30" cy="26" r="13" fill="#D49B74" />
        <path d="M15 24 Q 30 6 45 24 Z" fill="#F59E0B" />
        <rect x="12" y="22" width="36" height="4" rx="2" fill="#D97706" />
        <path d="M18 44 C18 36 44 36 44 44 L40 88 L20 88 Z" fill="#F59E0B" />
        <line x1="22" y1="52" x2="38" y2="52" stroke="#FFFFFF" strokeWidth="3" />
        <line x1="22" y1="64" x2="38" y2="64" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M18 48 L8 68 L20 74" stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
        <path d="M44 48 L56 68 L44 74" stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
        <path d="M20 88 L18 122 L26 122 L28 96 L32 96 L34 122 L42 122 L40 88 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

export const HumaanReception: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Accueil & Visiteurs Siège">
      <ellipse cx="110" cy="148" rx="70" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="70" r="55" fill="#2A7B76" fillOpacity="0.12" />
      <rect x="35" y="98" width="150" height="25" rx="6" fill="#FFFFFF" fillOpacity="0.3" stroke="#FFFFFF" strokeWidth="1.5" />
      <rect x="45" y="104" width="30" height="12" rx="2" fill="#F3D079" />
      <g transform="translate(80, 22)">
        <circle cx="30" cy="22" r="13" fill="#C6865A" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#0F172A" />
        <path d="M27 27 Q 30 30 33 27" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M18 40 C18 32 44 32 44 40 L40 78 L20 78 Z" fill="#2A7B76" />
        <rect x="26" y="46" width="8" height="10" rx="1" fill="#FFFFFF" />
        <line x1="28" y1="48" x2="32" y2="48" stroke="#10B981" strokeWidth="1" />
        <path d="M44 44 L60 30 L66 18" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="66" cy="16" r="4" fill="#C6865A" />
        <path d="M18 44 L10 58 L20 68" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

export const HumaanUsers: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Gestion des Utilisateurs & Rôles">
      <ellipse cx="110" cy="148" rx="65" ry="7" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="75" r="52" fill="#2A7B76" fillOpacity="0.15" />
      <g transform="translate(145, 30)">
        <path d="M15 5 L30 12 V25 C30 38 15 48 15 48 C15 48 0 38 0 25 V12 Z" fill="#D4A82F" fillOpacity="0.9" />
        <circle cx="15" cy="22" r="5" fill="#1E293B" />
        <path d="M15 27 V35" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      <g transform="translate(55, 20)">
        <path d="M25 90 L22 135 C22 138 32 138 32 135 L35 100 L43 100 L46 135 C46 138 56 138 56 135 L53 90 Z" fill="#1E293B" />
        <rect x="18" y="133" width="15" height="5" rx="2" fill="#0F172A" />
        <rect x="44" y="133" width="15" height="5" rx="2" fill="#0F172A" />
        <path d="M18 42 C18 34 58 34 58 42 L54 92 C54 94 22 94 22 92 Z" fill="#2A7B76" />
        <path d="M32 40 L38 56 L44 40" fill="#F3D079" />
        <path d="M18 42 L8 65 L24 72" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="22" y="66" width="14" height="18" rx="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
        <circle cx="29" cy="72" r="3" fill="#D4A82F" />
        <path d="M58 42 L76 54 L92 48" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="94" cy="47" r="3" fill="#D49B74" />
        <rect x="34" y="28" width="8" height="10" rx="2" fill="#D49B74" />
        <circle cx="38" cy="22" r="13" fill="#D49B74" />
        <path d="M26 22 C26 10 50 10 50 20 C48 18 42 16 36 16 C30 16 27 19 26 22 Z" fill="#0F172A" />
      </g>
    </svg>
  );
};

export const HumaanAudit: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Journaux & Audit">
      <ellipse cx="110" cy="148" rx="65" ry="7" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="72" r="50" fill="#0284C7" fillOpacity="0.12" />
      <g transform="translate(130, 25)">
        <rect width="65" height="48" rx="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.5" fill="#EF4444" />
        <circle cx="18" cy="10" r="2.5" fill="#F59E0B" />
        <circle cx="26" cy="10" r="2.5" fill="#10B981" />
        <line x1="10" y1="20" x2="45" y2="20" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="28" x2="55" y2="28" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="36" x2="35" y2="36" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g transform="translate(50, 22)">
        <path d="M26 88 L22 133 C22 136 32 136 32 133 L35 98 L43 98 L46 133 C46 136 56 136 56 133 L52 88 Z" fill="#334155" />
        <rect x="18" y="131" width="15" height="5" rx="2" fill="#0F172A" />
        <rect x="44" y="131" width="15" height="5" rx="2" fill="#0F172A" />
        <path d="M18 42 C18 34 56 34 56 42 L52 90 C52 92 22 92 22 90 Z" fill="#0F766E" />
        <path d="M31 40 L37 54 L43 40" fill="#FFFFFF" />
        <path d="M18 44 L6 62 L22 74" stroke="#0F766E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="65" width="20" height="24" rx="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
        <line x1="22" y1="72" x2="32" y2="72" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="78" x2="34" y2="78" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="83" x2="28" y2="83" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M56 44 L72 58 L85 52" stroke="#0F766E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="87" cy="51" r="3.5" fill="#C6865A" />
        <rect x="33" y="28" width="8" height="10" rx="2" fill="#C6865A" />
        <circle cx="37" cy="22" r="13" fill="#C6865A" />
        <path d="M26 20 C26 10 49 10 49 18 C47 16 42 14 36 14 C30 14 27 17 26 20 Z" fill="#0F172A" />
        <rect x="30" y="19" width="6" height="5" rx="1" fill="none" stroke="#0F172A" strokeWidth="1" />
        <rect x="38" y="19" width="6" height="5" rx="1" fill="none" stroke="#0F172A" strokeWidth="1" />
        <line x1="36" y1="21" x2="38" y2="21" stroke="#0F172A" strokeWidth="1" />
      </g>
    </svg>
  );
};

export const HumaanSettings: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Configuration Entreprise & Paramètres">
      <ellipse cx="110" cy="148" rx="65" ry="7" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="72" r="50" fill="#D4A82F" fillOpacity="0.15" />
      <g transform="translate(142, 28)">
        <circle cx="20" cy="20" r="16" fill="#D4A82F" fillOpacity="0.8" />
        <circle cx="20" cy="20" r="8" fill="#14423F" />
        <rect x="18" y="1" width="4" height="6" rx="1" fill="#D4A82F" />
        <rect x="18" y="33" width="4" height="6" rx="1" fill="#D4A82F" />
        <rect x="1" y="18" width="6" height="4" rx="1" fill="#D4A82F" />
        <rect x="33" y="18" width="6" height="4" rx="1" fill="#D4A82F" />
      </g>
      <g transform="translate(52, 22)">
        <path d="M26 88 L22 133 C22 136 32 136 32 133 L35 98 L43 98 L46 133 C46 136 56 136 56 133 L52 88 Z" fill="#1E293B" />
        <rect x="18" y="131" width="15" height="5" rx="2" fill="#0F172A" />
        <rect x="44" y="131" width="15" height="5" rx="2" fill="#0F172A" />
        <path d="M18 42 C18 34 56 34 56 42 L52 90 C52 92 22 92 22 90 Z" fill="#2A7B76" />
        <path d="M31 40 L37 54 L43 40" fill="#D4A82F" />
        <path d="M18 44 L6 60 L18 70" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="19" cy="71" r="3" fill="#D49B74" />
        <path d="M56 44 L76 46 L95 38" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="97" cy="37" r="4" fill="#D49B74" />
        <rect x="33" y="28" width="8" height="10" rx="2" fill="#D49B74" />
        <circle cx="37" cy="22" r="13" fill="#D49B74" />
        <path d="M26 20 C26 10 49 10 49 18 C47 16 42 14 36 14 C30 14 27 17 26 20 Z" fill="#0F172A" />
      </g>
    </svg>
  );
};
