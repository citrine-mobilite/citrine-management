import React from 'react';
import { IllustrationProps } from './humaanTypes';

export const HumaanRelaxedState: React.FC<IllustrationProps> = ({ className = 'w-28 h-28', size }) => {
  return (
    <svg
      viewBox="0 0 180 180"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Illustration tout est à jour"
    >
      <circle cx="90" cy="90" r="75" fill="#10B981" fillOpacity="0.08" />
      <rect x="25" y="125" width="130" height="6" rx="3" fill="#CBD5E1" />
      <path d="M125 125 L128 105 L142 105 L145 125 Z" fill="#D4A82F" />
      <path d="M135 105 Q 130 90 120 95 Q 135 98 135 105" fill="#10B981" />
      <path d="M135 105 Q 145 88 152 96 Q 140 98 135 105" fill="#059669" />

      <g transform="translate(45, 30)">
        <path d="M25 45 C25 35 60 35 60 45 L58 85 L27 85 Z" fill="#3B82F6" />
        <rect x="58" y="55" width="12" height="14" rx="2" fill="#F8FAFC" stroke="#64748B" strokeWidth="1" />
        <path d="M70 58 C74 58 74 66 70 66" stroke="#64748B" strokeWidth="1.5" fill="none" />
        <path d="M62 50 Q 64 45 61 40" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        <path d="M25 48 L15 65 L30 72" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" />
        <path d="M60 48 L65 58" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" />
        <circle cx="42" cy="24" r="13" fill="#D49B74" />
        <path d="M31 24 C31 12 53 12 53 22 C53 26 48 26 40 26 Z" fill="#334155" />
        <path d="M38 24 Q 41 27 44 24" stroke="#7C2D12" strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M40 30 Q 43 33 47 30" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>

      <circle cx="45" cy="50" r="14" fill="#10B981" />
      <path d="M39 50 L43 54 L51 46" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const HumaanTeamCelebration: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
      aria-label="Illustration célébration d'équipe"
    >
      <circle cx="120" cy="80" r="65" fill="#D4A82F" fillOpacity="0.12" />
      <polygon points="120,25 125,40 140,42 128,52 132,67 120,58 108,67 112,52 100,42 115,40" fill="#F3D079" />

      <g transform="translate(40, 35)">
        <path d="M25 50 C25 40 55 40 55 50 L52 90 L28 90 Z" fill="#2A7B76" />
        <path d="M55 50 L75 32" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" />
        <circle cx="40" cy="26" r="12" fill="#D49B74" />
        <path d="M30 26 C30 15 50 15 50 25 Z" fill="#1E293B" />
      </g>

      <g transform="translate(130, 35)">
        <path d="M25 50 C25 40 55 40 55 50 L52 90 L28 90 Z" fill="#0284C7" />
        <path d="M25 50 L5 32" stroke="#0284C7" strokeWidth="8" strokeLinecap="round" />
        <circle cx="40" cy="26" r="12" fill="#C6865A" />
        <circle cx="40" cy="18" r="10" fill="#0F172A" />
      </g>

      <circle cx="120" cy="65" r="4" fill="#F3D079" />
      <line x1="120" y1="57" x2="120" y2="53" stroke="#F3D079" strokeWidth="2" strokeLinecap="round" />
      <line x1="127" y1="61" x2="131" y2="58" stroke="#F3D079" strokeWidth="2" strokeLinecap="round" />
      <line x1="113" y1="61" x2="109" y2="58" stroke="#F3D079" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export const HumaanInnovation: React.FC<IllustrationProps> = ({ className = 'w-28 h-28', size }) => {
  return (
    <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined}>
      <circle cx="90" cy="90" r="75" fill="#3B82F6" fillOpacity="0.08" />
      <g transform="translate(45, 30)">
        <path d="M25 45 C25 35 60 35 60 45 L58 85 L27 85 Z" fill="#F59E0B" />
        <circle cx="42" cy="24" r="13" fill="#D49B74" />
        <path d="M31 24 C31 12 53 12 53 22 C53 26 48 26 40 26 Z" fill="#1E293B" />
      </g>
      <circle cx="120" cy="50" r="16" fill="#FCD34D" />
      <path d="M116 50 L120 54 L126 46" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
