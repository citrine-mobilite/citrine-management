import React from 'react';

interface IllustrationProps {
  className?: string;
  size?: number | string;
}

/**
 * HumaanDashboardHero:
 * Illustration vectorielle de style "Humaaans" / Modern Flat Characters
 * Représente deux collaborateurs en interaction : l'un avec un ordinateur portable,
 * l'autre présentant un tableau de bord et des indicateurs de réussite.
 */
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
      {/* Background soft ambient shapes */}
      <circle cx="190" cy="120" r="100" fill="url(#hero-ambient-glow)" opacity="0.4" />
      <circle cx="280" cy="70" r="40" fill="#F3D079" opacity="0.25" />
      <path d="M40 210 Q 190 195 340 210" stroke="#ffffff" strokeOpacity="0.25" strokeWidth="3" strokeDasharray="6 6" />

      {/* Floating mini KPI cards (Dashboard context) */}
      <g opacity="0.9" transform="translate(150, 30)">
        <rect width="80" height="42" rx="12" fill="#ffffff" fillOpacity="0.2" stroke="#ffffff" strokeOpacity="0.4" strokeWidth="1.5" />
        <rect x="10" y="10" width="30" height="6" rx="3" fill="#F3D079" />
        <rect x="10" y="22" width="50" height="4" rx="2" fill="#ffffff" fillOpacity="0.7" />
        <circle cx="65" cy="18" r="6" fill="#10B981" />
        <path d="M63 18 L65 20 L68 16" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* Person 1 (Standing, holding tablet/laptop - Citrine colors) */}
      <g transform="translate(60, 40)">
        {/* Shadow */}
        <ellipse cx="60" cy="170" rx="36" ry="8" fill="#000000" fillOpacity="0.15" />

        {/* Legs / Trousers */}
        <path d="M48 115 L44 165 C44 168 56 168 56 165 L57 125 L65 125 L66 165 C66 168 78 168 78 165 L74 115 Z" fill="#1E293B" />
        {/* Shoes */}
        <rect x="40" y="163" width="18" height="7" rx="3" fill="#0F172A" />
        <rect x="65" y="163" width="18" height="7" rx="3" fill="#0F172A" />

        {/* Torso / Jacket */}
        <path d="M38 60 C38 48 84 48 84 60 L80 118 C80 120 42 120 42 118 Z" fill="#2A7B76" />
        {/* Shirt Collar V-neck */}
        <path d="M54 52 L61 68 L68 52" fill="#F3D079" stroke="#E2E8F0" strokeWidth="1" />

        {/* Left Arm with Tablet */}
        <path d="M38 60 L24 85 L44 95" stroke="#2A7B76" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="20" y="80" width="32" height="22" rx="4" fill="#0F172A" stroke="#E2E8F0" strokeWidth="1.5" />
        <line x1="25" y1="88" x2="45" y2="88" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <line x1="25" y1="94" x2="38" y2="94" stroke="#F3D079" strokeWidth="2" strokeLinecap="round" />

        {/* Right Arm waving slightly */}
        <path d="M84 60 L98 82 L90 102" stroke="#2A7B76" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />

        {/* Neck */}
        <rect x="56" y="44" width="10" height="12" fill="#D49B74" rx="3" />

        {/* Head */}
        <circle cx="61" cy="36" r="16" fill="#D49B74" />
        {/* Hair - Modern stylish cut */}
        <path d="M47 34 C47 20 75 18 75 30 C75 33 72 36 67 36 C64 36 61 32 55 33 C50 34 48 37 47 34 Z" fill="#0F172A" />
        {/* Glasses */}
        <rect x="52" y="32" width="8" height="6" rx="2" fill="none" stroke="#0F172A" strokeWidth="1.2" />
        <rect x="63" y="32" width="8" height="6" rx="2" fill="none" stroke="#0F172A" strokeWidth="1.2" />
        <line x1="60" y1="35" x2="63" y2="35" stroke="#0F172A" strokeWidth="1.2" />
        {/* Smile */}
        <path d="M57 44 Q 61 47 65 44" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {/* Person 2 (Gesturing enthusiastically, seated/leaning comfortably) */}
      <g transform="translate(230, 45)">
        {/* Shadow */}
        <ellipse cx="50" cy="165" rx="32" ry="7" fill="#000000" fillOpacity="0.15" />

        {/* Legs */}
        <path d="M38 115 L32 160 C32 163 44 163 44 160 L48 125 L56 125 L60 160 C60 163 72 163 72 160 L66 115 Z" fill="#334155" />
        <rect x="28" y="158" width="17" height="6" rx="3" fill="#F8FAFC" />
        <rect x="58" y="158" width="17" height="6" rx="3" fill="#F8FAFC" />

        {/* Torso - Stylish Amber / Ochre Sweater */}
        <path d="M32 58 C32 46 72 46 72 58 L68 116 C68 118 34 118 34 116 Z" fill="#D4A82F" />

        {/* Arms - Left Arm pointing forward */}
        <path d="M32 60 L10 75 L-8 62" stroke="#D4A82F" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" />
        {/* Hand with thumbs up */}
        <circle cx="-10" cy="60" r="5" fill="#C6865A" />
        <line x1="-10" y1="60" x2="-10" y2="52" stroke="#C6865A" strokeWidth="3" strokeLinecap="round" />

        {/* Right Arm bent */}
        <path d="M72 60 L85 82 L75 100" stroke="#D4A82F" strokeWidth="10" strokeLinecap="round" />

        {/* Neck */}
        <rect x="48" y="44" width="9" height="10" fill="#C6865A" rx="2" />

        {/* Head */}
        <circle cx="52" cy="34" r="15" fill="#C6865A" />
        {/* Hair - Curly Afro puff / topknot */}
        <circle cx="52" cy="22" r="13" fill="#1C1917" />
        <circle cx="43" cy="28" r="9" fill="#1C1917" />
        <circle cx="61" cy="28" r="9" fill="#1C1917" />
        {/* Smile */}
        <path d="M49 41 Q 53 44 57 41" stroke="#451A03" strokeWidth="1.2" strokeLinecap="round" />
        {/* Earring */}
        <circle cx="37" cy="35" r="2" fill="#FDE047" />
      </g>

      {/* Floating sparkles & check stars */}
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

/**
 * HumaanTaskCheck:
 * Collaborateur dynamique cochant une tâche avec un grand marqueur émeraude.
 * Idéal pour les tâches, sous-tâches, ou confirmation.
 */
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
      {/* Background soft circle */}
      <circle cx="80" cy="80" r="70" fill="#2A7B76" fillOpacity="0.08" />
      
      {/* Target clipboard background */}
      <rect x="85" y="35" width="55" height="75" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
      <rect x="100" y="28" width="25" height="10" rx="3" fill="#94A3B8" />
      <line x1="95" y1="52" x2="125" y2="52" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
      <line x1="95" y1="66" x2="125" y2="66" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />
      <line x1="95" y1="80" x2="115" y2="80" stroke="#E2E8F0" strokeWidth="3" strokeLinecap="round" />

      {/* Big Green Checkmark being drawn */}
      <path d="M75 75 L95 95 L135 45" stroke="#10B981" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      {/* Character drawing the checkmark */}
      <g transform="translate(15, 20)">
        {/* Legs */}
        <path d="M40 95 L36 125 C36 128 46 128 46 125 L48 100 L54 100 L56 125 C56 128 66 128 66 125 L62 95 Z" fill="#1E293B" />
        
        {/* Torso */}
        <path d="M34 50 C34 40 68 40 68 50 L64 96 L38 96 Z" fill="#2A7B76" />
        
        {/* Arm holding stylus */}
        <path d="M64 54 L85 68 L78 80" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" />
        <circle cx="85" cy="70" r="4" fill="#D49B74" />
        {/* Stylus */}
        <line x1="82" y1="72" x2="94" y2="62" stroke="#F3D079" strokeWidth="3" strokeLinecap="round" />

        {/* Head */}
        <circle cx="51" cy="28" r="13" fill="#D49B74" />
        {/* Hair */}
        <path d="M40 28 C40 16 62 16 62 26 C62 30 55 30 50 30 Z" fill="#0F172A" />
      </g>
    </svg>
  );
};

/**
 * HumaanRelaxedState:
 * Personnage détendu buvant un café, serein car toutes les tâches sont achevées
 * ou les rappels sont tous à jour.
 */
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

      {/* Mini desk / plant */}
      <rect x="25" y="125" width="130" height="6" rx="3" fill="#CBD5E1" />
      
      {/* Plant pot */}
      <path d="M125 125 L128 105 L142 105 L145 125 Z" fill="#D4A82F" />
      <path d="M135 105 Q 130 90 120 95 Q 135 98 135 105" fill="#10B981" />
      <path d="M135 105 Q 145 88 152 96 Q 140 98 135 105" fill="#059669" />

      {/* Relaxed character */}
      <g transform="translate(45, 30)">
        {/* Torso */}
        <path d="M25 45 C25 35 60 35 60 45 L58 85 L27 85 Z" fill="#3B82F6" />
        {/* Coffee Mug */}
        <rect x="58" y="55" width="12" height="14" rx="2" fill="#F8FAFC" stroke="#64748B" strokeWidth="1" />
        <path d="M70 58 C74 58 74 66 70 66" stroke="#64748B" strokeWidth="1.5" fill="none" />
        {/* Steam */}
        <path d="M62 50 Q 64 45 61 40" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" fill="none" />

        {/* Arms */}
        <path d="M25 48 L15 65 L30 72" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" />
        <path d="M60 48 L65 58" stroke="#3B82F6" strokeWidth="7" strokeLinecap="round" />

        {/* Head */}
        <circle cx="42" cy="24" r="13" fill="#D49B74" />
        <path d="M31 24 C31 12 53 12 53 22 C53 26 48 26 40 26 Z" fill="#334155" />
        {/* Peaceful eyes / smile */}
        <path d="M38 24 Q 41 27 44 24" stroke="#7C2D12" strokeWidth="1" strokeLinecap="round" fill="none" />
        <path d="M40 30 Q 43 33 47 30" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </g>

      {/* Check bubble */}
      <circle cx="45" cy="50" r="14" fill="#10B981" />
      <path d="M39 50 L43 54 L51 46" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

/**
 * HumaanTeamCelebration:
 * Illustration d'accomplissement ou rendement avec 2 personnes célébrant une mission.
 */
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
      
      {/* Star / Trophy glow */}
      <polygon points="120,25 125,40 140,42 128,52 132,67 120,58 108,67 112,52 100,42 115,40" fill="#F3D079" />

      {/* Person Left high fiving */}
      <g transform="translate(40, 35)">
        <path d="M25 50 C25 40 55 40 55 50 L52 90 L28 90 Z" fill="#2A7B76" />
        <path d="M55 50 L75 32" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" />
        <circle cx="40" cy="26" r="12" fill="#D49B74" />
        <path d="M30 26 C30 15 50 15 50 25 Z" fill="#1E293B" />
      </g>

      {/* Person Right high fiving */}
      <g transform="translate(130, 35)">
        <path d="M25 50 C25 40 55 40 55 50 L52 90 L28 90 Z" fill="#0284C7" />
        <path d="M25 50 L5 32" stroke="#0284C7" strokeWidth="8" strokeLinecap="round" />
        <circle cx="40" cy="26" r="12" fill="#C6865A" />
        <circle cx="40" cy="18" r="10" fill="#0F172A" />
      </g>

      {/* High five burst effect */}
      <circle cx="120" cy="65" r="4" fill="#F3D079" />
      <line x1="120" y1="57" x2="120" y2="53" stroke="#F3D079" strokeWidth="2" strokeLinecap="round" />
      <line x1="127" y1="61" x2="131" y2="58" stroke="#F3D079" strokeWidth="2" strokeLinecap="round" />
      <line x1="113" y1="61" x2="109" y2="58" stroke="#F3D079" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};
/**
 * HumaanInnovation:
 * Collaboration créative pour les idées, sondages et projets.
 */
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

/**
 * HumaanFinance:
 * Illustration financière / comptabilité et dépenses.
 */
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

/**
 * HumaanSecurity:
 * Illustration sécurité, pointage et contrôle d'accès.
 */
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
/**
 * HumaanPeople:
 * Illustration recrutement et gestion des collaborateurs.
 */
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

/**
 * HumaanShield:
 * Illustration HSE, sécurité et discipline.
 */
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
