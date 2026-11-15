import React from 'react';
import { IllustrationProps } from './humaanTypes';

export const HumaanFinance: React.FC<IllustrationProps> = ({ className = 'w-28 h-28', size }) => {
  return (
    <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined}>
      <circle cx="90" cy="90" r="75" fill="#10B981" fillOpacity="0.08" />
      <g transform="translate(50, 35)">
        <path d="M20 50 C20 40 55 40 55 50 L52 85 L23 85 Z" fill="#0D9488" />
        <circle cx="37" cy="25" r="12" fill="#D49B74" />
        <path d="M28 25 C28 15 46 15 46 23 Z" fill="#0F172A" />
      </g>
      <rect x="100" y="55" width="36" height="46" rx="6" fill="#FFFFFF" stroke="#0D9488" strokeWidth="2" />
      <line x1="108" y1="68" x2="128" y2="68" stroke="#10B981" strokeWidth="3" strokeLinecap="round" />
      <line x1="108" y1="80" x2="120" y2="80" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
};

export const HumaanSecurity: React.FC<IllustrationProps> = ({ className = 'w-28 h-28', size }) => {
  return (
    <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined}>
      <circle cx="90" cy="90" r="75" fill="#8B5CF6" fillOpacity="0.08" />
      <path d="M90 35 L120 48 V75 C120 100 90 120 90 120 C90 120 60 100 60 75 V48 Z" fill="#2A7B76" fillOpacity="0.2" stroke="#2A7B76" strokeWidth="3" />
      <circle cx="90" cy="72" r="16" fill="#2A7B76" />
      <path d="M84 72 L88 76 L96 68" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

export const HumaanPeople: React.FC<IllustrationProps> = ({ className = 'w-28 h-28', size }) => {
  return (
    <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined}>
      <circle cx="90" cy="90" r="75" fill="#6366F1" fillOpacity="0.08" />
      <g transform="translate(60, 40)">
        <path d="M15 50 C15 38 45 38 45 50 L42 85 L18 85 Z" fill="#4F46E5" />
        <circle cx="30" cy="26" r="12" fill="#D49B74" />
        <path d="M21 26 C21 15 39 15 39 25 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

export const HumaanShield: React.FC<IllustrationProps> = ({ className = 'w-28 h-28', size }) => {
  return (
    <svg viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined}>
      <circle cx="90" cy="90" r="75" fill="#EF4444" fillOpacity="0.08" />
      <path d="M90 40 L115 52 V76 C115 96 90 115 90 115 C90 115 65 96 65 76 V52 Z" fill="#DC2626" fillOpacity="0.25" stroke="#DC2626" strokeWidth="3" />
      <circle cx="90" cy="72" r="14" fill="#DC2626" />
      <path d="M85 72 L89 76 L96 68" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
