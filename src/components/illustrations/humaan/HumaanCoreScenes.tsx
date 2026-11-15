import React from 'react';
import { IllustrationProps } from './humaanTypes';

export const HumaanDashboardHero: React.FC<IllustrationProps> = ({ className = 'w-48 h-36', size }) => {
  return (
    <svg
      viewBox="0 0 380 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Illustration équipe Citrine"
    >
      <circle cx="190" cy="120" r="100" fill="url(#hero-ambient-glow)" opacity="0.4" />
      <circle cx="280" cy="70" r="40" fill="#F3D079" opacity="0.25" />
      <path d="M40 210 Q 190 195 340 210" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="3" strokeDasharray="6 6" />

      <g opacity="0.9" transform="translate(150, 30)">
        <rect width="80" height="42" rx="12" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
        <rect x="10" y="10" width="30" height="6" rx="3" fill="#F3D079" />
        <rect x="10" y="22" width="50" height="4" rx="2" fill="#ffffff" fillOpacity="0.7" />
        <circle cx="65" cy="18" r="6" fill="#10B981" />
        <path d="M63 18 L65 20 L68 16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      <g transform="translate(60, 40)">
        <ellipse cx="60" cy="170" rx="36" ry="8" fill="#000000" fillOpacity="0.15" />
        <path d="M48 115 L44 165 C44 168 56 168 56 165 L57 125 L65 125 L66 165 C66 168 78 168 78 165 L74 115 Z" fill="#1E293B" />
        <rect x="40" y="163" width="18" height="7" rx="3" fill="#0F172A" />
        <rect x="65" y="163" width="18" height="7" rx="3" fill="#0F172A" />
        <path d="M38 60 C38 48 84 48 84 60 L80 118 C80 120 42 120 42 118 Z" fill="#2A7B76" />
        <path d="M54 52 L61 68 L68 52" fill="#F3D079" stroke="#E2E8F0" strokeWidth="1" />
        <path d="M38 60 L24 85 L44 95" stroke="#2A7B76" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="20" y="80" width="32" height="22" rx="4" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1="25" y1="88" x2="45" y2="88" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <line x1="25" y1="94" x2="38" y2="94" stroke="#F3D079" strokeWidth="2" strokeLinecap="round" />
        <path d="M84 60 L98 82 L90 102" stroke="#2A7B76" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="56" y="44" width="10" height="12" fill="#D49B74" rx="3" />
        <circle cx="61" cy="36" r="16" fill="#D49B74" />
        <path d="M47 34 C47 20 75 18 75 30 C75 33 72 36 67 36 C64 36 61 32 55 33 C50 34 48 37 47 34 Z" fill="#0F172A" />
        <rect x="52" y="32" width="8" height="6" rx="2" fill="none" stroke="#0F172A" strokeWidth="1.2" />
        <rect x="63" y="32" width="8" height="6" rx="2" fill="none" stroke="#0F172A" strokeWidth="1.2" />
        <line x1="60" y1="35" x2="63" y2="35" stroke="#0F172A" strokeWidth="1.2" />
        <path d="M57 44 Q 61 47 65 44" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      <g transform="translate(230, 45)">
        <ellipse cx="50" cy="165" rx="32" ry="7" fill="#000000" fillOpacity="0.15" />
        <path d="M38 115 L32 160 C32 163 44 163 44 160 L48 125 L56 125 L60 160 C60 163 72 163 72 160 L66 115 Z" fill="#334155" />
        <rect x="28" y="158" width="17" height="6" rx="3" fill="#F8FAFC" />
        <rect x="58" y="158" width="17" height="6" rx="3" fill="#F8FAFC" />
        <path d="M32 58 C32 46 72 46 72 58 L68 116 C68 118 34 118 34 116 Z" fill="#D4A82F" />
        <path d="M32 60 L10 75 L-8 62" stroke="#D4A82F" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-10" cy="60" r="5" fill="#C6865A" />
        <line x1="-10" y1="60" x2="-10" y2="52" stroke="#C6865A" strokeWidth="3" strokeLinecap="round" />
        <path d="M72 60 L85 82 L75 100" stroke="#D4A82F" strokeWidth="10" strokeLinecap="round" />
        <rect x="48" y="44" width="9" height="10" fill="#C6865A" rx="2" />
        <circle cx="52" cy="34" r="15" fill="#C6865A" />
        <circle cx="52" cy="22" r="13" fill="#1C1917" />
        <circle cx="43" cy="28" r="9" fill="#1C1917" />
        <circle cx="61" cy="28" r="9" fill="#1C1917" />
        <path d="M49 41 Q 53 44 57 41" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" />
        <circle cx="37" cy="35" r="2" fill="#FDE047" />
      </g>

      <g transform="translate(195, 110)">
        <polygon points="12,0 15,9 24,12 15,15 12,24 9,15 0,12 9,9" fill="#F3D079" />
      </g>
      <g transform="translate(45, 120)">
        <polygon points="8,0 10,6 16,8 10,10 8,16 6,10 0,8 6,6" fill="#A7F3D0" opacity="0.8" />
      </g>

      <defs>
        <radialGradient id="hero-ambient-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#2A7B76" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
};

export const HumaanTaskCheck: React.FC<IllustrationProps> = ({ className = 'w-24 h-24', size }) => {
  return (
    <svg
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Illustration validation de tâche"
    >
      <circle cx="80" cy="80" r="70" fill="#2A7B76" fillOpacity="0.08" />
      <rect x="85" y="35" width="55" height="75" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="100" y="28" width="25" height="10" rx="3" fill="#94A3B8" />
      <line x1="95" y1="52" x2="125" y2="52" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
      <line x1="95" y1="66" x2="125" y2="66" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
      <line x1="95" y1="80" x2="115" y2="80" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
      <path d="M75 75 L95 95 L135 45" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      <g transform="translate(15, 20)">
        <path d="M40 95 L36 125 C36 128 46 128 46 125 L48 100 L54 100 L56 125 C56 128 66 128 66 125 L62 95 Z" fill="#1E293B" />
        <path d="M34 50 C34 40 68 40 68 50 L64 96 L38 96 Z" fill="#2A7B76" />
        <path d="M64 54 L85 68 L78 80" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" />
        <circle cx="85" cy="70" r="4" fill="#D49B74" />
        <line x1="82" y1="72" x2="94" y2="62" stroke="#F3D079" strokeWidth="3" strokeLinecap="round" />
        <circle cx="51" cy="28" r="13" fill="#D49B74" />
        <path d="M40 28 C40 16 62 16 62 26 C62 30 55 30 50 30 Z" fill="#0F172A" />
      </g>
    </svg>
  );
};
