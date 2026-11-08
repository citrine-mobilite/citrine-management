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

      {/* Floating ambient accents & geometric decor */}
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

/**
 * 1. HumaanPersonal (Espace Personnel)
 * Personnage en tenue professionnelle décontractée travaillant sur son ordinateur portable avec une tasse de café et une validation dynamique.
 */
export const HumaanPersonal: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Espace Personnel">
      <ellipse cx="110" cy="148" rx="70" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="80" r="65" fill="#2A7B76" fillOpacity="0.15" />
      {/* Desk */}
      <rect x="30" y="112" width="160" height="6" rx="3" fill="#E2E8F0" />
      {/* Laptop */}
      <rect x="75" y="85" width="45" height="28" rx="4" fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
      <polygon points="68,113 127,113 122,110 73,110" fill="#94A3B8" />
      <circle cx="97" cy="99" r="4" fill="#F3D079" />
      {/* Coffee mug */}
      <rect x="135" y="98" width="12" height="14" rx="2" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1" />
      <path d="M147 101 C150 101 150 108 147 108" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
      {/* Character */}
      <g transform="translate(70, 20)">
        <circle cx="28" cy="22" r="14" fill="#D49B74" />
        <path d="M16 20 C16 9 38 8 38 18 C38 22 34 24 28 24 Z" fill="#0F172A" />
        <path d="M16 42 C16 33 46 33 46 42 L43 85 L18 85 Z" fill="#2A7B76" />
        <path d="M16 46 L3 68 L15 76" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" />
        <path d="M44 46 L54 68 L42 76" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" />
        <circle cx="15" cy="76" r="4" fill="#D49B74" />
        <circle cx="42" cy="76" r="4" fill="#D49B74" />
      </g>
      {/* Floating Badge */}
      <g transform="translate(145, 30)">
        <rect width="45" height="26" rx="8" fill="#10B981" />
        <path d="M12 13 L17 18 L26 9" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="34" cy="13" r="3" fill="#F3D079" />
      </g>
    </svg>
  );
};

/**
 * 2. HumaanLeaves (Congés et Permissions)
 * Personnage décontracté prêt pour le voyage / repos avec valise cabine, feuille tropicale et soleil doré.
 */
export const HumaanLeaves: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Congés et Permissions">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      {/* Sun glow */}
      <circle cx="165" cy="45" r="24" fill="#F3D079" fillOpacity="0.3" />
      <circle cx="165" cy="45" r="14" fill="#F3D079" />
      {/* Palm leaf shape */}
      <path d="M35 140 Q 55 90 95 80 Q 75 110 55 140 Z" fill="#10B981" fillOpacity="0.4" />
      <path d="M40 140 Q 75 105 115 110 Q 85 125 60 140 Z" fill="#059669" fillOpacity="0.5" />
      {/* Trolley Suitcase */}
      <g transform="translate(130, 85)">
        <rect x="0" y="10" width="28" height="42" rx="6" fill="#D4A82F" stroke="#B45309" strokeWidth="1.5" />
        <line x1="8" y1="20" x2="20" y2="20" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="28" x2="20" y2="28" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 10 L9 0 L19 0 L19 10" stroke="#78350F" strokeWidth="2" fill="none" />
        <circle cx="6" cy="54" r="3" fill="#1E293B" />
        <circle cx="22" cy="54" r="3" fill="#1E293B" />
      </g>
      {/* Vacationer Character */}
      <g transform="translate(65, 30)">
        <circle cx="30" cy="20" r="13" fill="#C6865A" />
        <path d="M19 18 C19 8 40 8 40 18 C40 22 36 24 30 24 Z" fill="#1C1917" />
        {/* Sunglasses */}
        <rect x="23" y="18" width="6" height="4" rx="1" fill="#0F172A" />
        <rect x="31" y="18" width="6" height="4" rx="1" fill="#0F172A" />
        <line x1="28" y1="20" x2="32" y2="20" stroke="#0F172A" strokeWidth="1" />
        {/* Torso in tropical teal */}
        <path d="M18 38 C18 30 44 30 44 38 L42 78 L20 78 Z" fill="#0D9488" />
        {/* Arms stretched happily */}
        <path d="M18 42 L5 56 L-8 48" stroke="#0D9488" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 42 L58 56 L65 78" stroke="#0D9488" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        {/* Shorts & Legs */}
        <path d="M20 78 L18 108 L26 108 L28 85 L34 85 L36 108 L44 108 L42 78 Z" fill="#F8FAFC" />
        <rect x="14" y="108" width="13" height="6" rx="2" fill="#D4A82F" />
        <rect x="35" y="108" width="13" height="6" rx="2" fill="#D4A82F" />
      </g>
    </svg>
  );
};

/**
 * 3. HumaanStatistics (Statistiques et Assiduité)
 * Personnage présentant des graphiques ascendants, indicateurs de KPIs et cadran horaire.
 */
export const HumaanStatistics: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Statistiques & Assiduité">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="75" r="55" fill="#10B981" fillOpacity="0.12" />
      {/* Chart board */}
      <g transform="translate(100, 35)">
        <rect width="90" height="70" rx="10" fill="#FFFFFF" fillOpacity="0.25" stroke="#FFFFFF" strokeWidth="1.5" />
        {/* Bars */}
        <rect x="15" y="45" width="12" height="18" rx="3" fill="#F3D079" />
        <rect x="35" y="32" width="12" height="31" rx="3" fill="#10B981" />
        <rect x="55" y="20" width="12" height="43" rx="3" fill="#2A7B76" />
        {/* Upward Trend Arrow */}
        <path d="M18 42 Q 40 24 70 12" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <polygon points="70,8 74,15 67,16" fill="#FFFFFF" />
      </g>
      {/* Presenter Character */}
      <g transform="translate(45, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 39 10 39 18 C39 23 35 24 30 24 Z" fill="#0F172A" />
        {/* Torso */}
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#1F625E" />
        {/* Right Arm pointing to chart */}
        <path d="M44 44 L68 38 L84 48" stroke="#1F625E" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="84" cy="48" r="4" fill="#D49B74" />
        {/* Left Arm with tablet */}
        <path d="M18 44 L5 62 L20 68" stroke="#1F625E" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="58" width="18" height="14" rx="2" fill="#0F172A" stroke="#FFFFFF" strokeWidth="1" />
        {/* Trousers */}
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

/**
 * 4. HumaanCollaborators (Collaborateurs)
 * Duo dynamique de collaborateurs qui échangent dans la bonne humeur, symbolisant l'équipe.
 */
export const HumaanCollaborators: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Collaborateurs">
      <ellipse cx="110" cy="148" rx="75" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="75" r="60" fill="#F3D079" fillOpacity="0.15" />
      {/* Colleague 1 (Left) */}
      <g transform="translate(40, 30)">
        <circle cx="28" cy="20" r="13" fill="#D49B74" />
        <path d="M17 18 C17 8 38 8 38 18 C38 22 34 24 28 24 Z" fill="#1E293B" />
        <path d="M16 38 C16 30 42 30 42 38 L38 85 L18 85 Z" fill="#2A7B76" />
        <path d="M42 42 L58 56" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" />
        <path d="M16 42 L8 60 L18 68" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 85 L16 118 L24 118 L26 92 L30 92 L32 118 L40 118 L38 85 Z" fill="#334155" />
      </g>
      {/* Colleague 2 (Right) */}
      <g transform="translate(115, 30)">
        <circle cx="28" cy="20" r="13" fill="#C6865A" />
        <circle cx="28" cy="12" r="11" fill="#0F172A" />
        <path d="M16 38 C16 30 42 30 42 38 L40 85 L18 85 Z" fill="#D4A82F" />
        {/* Hand waving */}
        <path d="M16 42 L-2 48 L-6 36" stroke="#D4A82F" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="-6" cy="36" r="4" fill="#C6865A" />
        <path d="M42 42 L48 64" stroke="#D4A82F" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 85 L16 118 L24 118 L26 92 L30 92 L32 118 L40 118 L40 85 Z" fill="#1E293B" />
      </g>
      {/* Collaboration Sparkle */}
      <polygon points="108,45 111,54 120,57 111,60 108,69 105,60 96,57 105,54" fill="#FFFFFF" />
    </svg>
  );
};

/**
 * 5. HumaanAlerts (Alertes et Rappels)
 * Personnage attentif pointant vers une cloche dorée animée avec ondes de notifications.
 */
export const HumaanAlerts: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Alertes et Rappels">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#EF4444" fillOpacity="0.1" />
      {/* Big Golden Bell */}
      <g transform="translate(130, 35)">
        <path d="M25 12 C14 12 10 24 8 40 L4 46 C2 50 6 54 12 54 L38 54 C44 54 48 50 46 46 L42 40 C40 24 36 12 25 12 Z" fill="#F3D079" stroke="#D4A82F" strokeWidth="1.5" />
        <circle cx="25" cy="58" r="6" fill="#D4A82F" />
        {/* Bell sound waves */}
        <path d="M52 24 C58 32 58 44 52 52" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <path d="M60 16 C70 28 70 48 60 60" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 3" fill="none" />
      </g>
      {/* Vigilant Character */}
      <g transform="translate(50, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#0F172A" />
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#2A7B76" />
        {/* Pointing Arm */}
        <path d="M44 44 L66 42 L80 44" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" />
        <circle cx="80" cy="44" r="4" fill="#D49B74" />
        <path d="M18 44 L8 60 L18 72" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

/**
 * 6. HumaanDiscipline (Conseil de Discipline)
 * Personnage digne avec la balance de justice et registre officiel.
 */
export const HumaanDiscipline: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Conseil de Discipline">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#6366F1" fillOpacity="0.12" />
      {/* Scales of Justice */}
      <g transform="translate(125, 30)">
        <line x1="30" y1="15" x2="30" y2="70" stroke="#F3D079" strokeWidth="3" />
        <line x1="10" y1="25" x2="50" y2="25" stroke="#F3D079" strokeWidth="2.5" />
        {/* Left pan */}
        <line x1="12" y1="25" x2="6" y2="45" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="12" y1="25" x2="18" y2="45" stroke="#E2E8F0" strokeWidth="1" />
        <path d="M4 45 Q 12 55 20 45 Z" fill="#F3D079" />
        {/* Right pan */}
        <line x1="48" y1="25" x2="42" y2="45" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="48" y1="25" x2="54" y2="45" stroke="#E2E8F0" strokeWidth="1" />
        <path d="M40 45 Q 48 55 56 45 Z" fill="#F3D079" />
        <rect x="22" y="68" width="16" height="5" rx="2" fill="#F3D079" />
      </g>
      {/* Formal Character */}
      <g transform="translate(50, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#1E293B" />
        {/* Suit & Tie */}
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#0F172A" />
        <polygon points="31,40 33,54 31,65 29,54" fill="#DC2626" />
        <path d="M44 44 L56 60 L46 72" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 44 L6 60 L18 70" stroke="#0F172A" strokeWidth="7" strokeLinecap="round" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#334155" />
      </g>
    </svg>
  );
};

/**
 * 7. HumaanDocuments (Documents RH)
 * Personnage tenant un classeur et document officiel avec tampon de conformité.
 */
export const HumaanDocuments: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Documents RH">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#2A7B76" fillOpacity="0.15" />
      {/* Document Sheet with official seal */}
      <g transform="translate(125, 30)">
        <rect width="45" height="60" rx="5" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
        <line x1="8" y1="12" x2="30" y2="12" stroke="#2A7B76" strokeWidth="3" strokeLinecap="round" />
        <line x1="8" y1="20" x2="36" y2="20" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="28" x2="36" y2="28" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <line x1="8" y1="36" x2="26" y2="36" stroke="#E2E8F0" strokeWidth="2" strokeLinecap="round" />
        <circle cx="32" cy="46" r="7" fill="#F3D079" />
        <path d="M29 46 L31 48 L35 44" stroke="#78350F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Character Holding Folder */}
      <g transform="translate(55, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#0F172A" />
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#2A7B76" />
        {/* Arms holding folder */}
        <path d="M18 44 L30 65 L44 65" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" />
        {/* Folder */}
        <rect x="25" y="52" width="30" height="24" rx="4" fill="#D4A82F" stroke="#B45309" strokeWidth="1.5" />
        <line x1="30" y1="60" x2="48" y2="60" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

/**
 * 8. HumaanInventory (Inventaire et Stock)
 * Personnage en entrepôt gérant des cartons empilés et vérifiant l'inventaire.
 */
export const HumaanInventory: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Inventaire et Stock">
      <ellipse cx="110" cy="148" rx="70" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#F59E0B" fillOpacity="0.12" />
      {/* Stacked Parcels */}
      <g transform="translate(120, 60)">
        {/* Bottom Box */}
        <rect x="0" y="25" width="45" height="35" rx="4" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        <line x1="22" y1="25" x2="22" y2="60" stroke="#B45309" strokeWidth="2" />
        {/* Top Box */}
        <rect x="8" y="0" width="35" height="26" rx="3" fill="#F59E0B" stroke="#B45309" strokeWidth="1.5" />
        <line x1="25" y1="0" x2="25" y2="26" stroke="#D97706" strokeWidth="2" />
        <rect x="15" y="6" width="12" height="6" rx="1" fill="#FFFFFF" fillOpacity="0.6" />
      </g>
      {/* Stock Manager Character */}
      <g transform="translate(45, 30)">
        <circle cx="30" cy="22" r="13" fill="#D49B74" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#1E293B" />
        <path d="M18 40 C18 32 44 32 44 40 L40 85 L20 85 Z" fill="#2563EB" />
        {/* Arm holding clipboard */}
        <path d="M18 44 L28 66 L42 66" stroke="#2563EB" strokeWidth="7" strokeLinecap="round" />
        <rect x="36" y="52" width="22" height="28" rx="3" fill="#FFFFFF" stroke="#64748B" strokeWidth="1.5" />
        <line x1="40" y1="60" x2="52" y2="60" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />
        <line x1="40" y1="67" x2="50" y2="67" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <path d="M20 85 L18 118 L26 118 L28 92 L32 92 L34 118 L42 118 L40 85 Z" fill="#0F172A" />
      </g>
    </svg>
  );
};

/**
 * 9. HumaanHse (Registre HSE et Incidents)
 * Personnage portant un casque de sécurité (chantier) avec bouclier de protection et trousse de secours.
 */
export const HumaanHse: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Registre HSE & Incidents">
      <ellipse cx="110" cy="148" rx="65" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="150" cy="70" r="50" fill="#EF4444" fillOpacity="0.12" />
      {/* Safety Shield */}
      <g transform="translate(125, 35)">
        <path d="M25 5 L50 15 V38 C50 60 25 75 25 75 C25 75 0 60 0 38 V15 Z" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2.5" />
        {/* Cross */}
        <rect x="22" y="25" width="6" height="24" rx="2" fill="#10B981" />
        <rect x="13" y="34" width="24" height="6" rx="2" fill="#10B981" />
      </g>
      {/* Safety Character with Hard Hat */}
      <g transform="translate(50, 25)">
        <circle cx="30" cy="26" r="13" fill="#D49B74" />
        {/* Hardhat / Casque jaune */}
        <path d="M15 24 Q 30 6 45 24 Z" fill="#F59E0B" />
        <rect x="12" y="22" width="36" height="4" rx="2" fill="#D97706" />
        {/* High-vis Vest */}
        <path d="M18 44 C18 36 44 36 44 44 L40 88 L20 88 Z" fill="#F59E0B" />
        {/* Reflective stripes */}
        <line x1="22" y1="52" x2="38" y2="52" stroke="#FFFFFF" strokeWidth="3" />
        <line x1="22" y1="64" x2="38" y2="64" stroke="#FFFFFF" strokeWidth="3" />
        <path d="M18 48 L8 68 L20 74" stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
        <path d="M44 48 L56 68 L44 74" stroke="#F59E0B" strokeWidth="7" strokeLinecap="round" />
        <path d="M20 88 L18 122 L26 122 L28 96 L32 96 L34 122 L42 122 L40 88 Z" fill="#1E293B" />
      </g>
    </svg>
  );
};

/**
 * 10. HumaanReception (Accueil et Visiteurs Siège)
 * Personnage accueillant à la réception avec badge visiteur et salut chaleureux.
 */
export const HumaanReception: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Accueil & Visiteurs Siège">
      <ellipse cx="110" cy="148" rx="70" ry="8" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="70" r="55" fill="#2A7B76" fillOpacity="0.12" />
      {/* Reception Counter */}
      <rect x="35" y="98" width="150" height="25" rx="6" fill="#FFFFFF" fillOpacity="0.3" stroke="#FFFFFF" strokeWidth="1.5" />
      <rect x="45" y="104" width="30" height="12" rx="2" fill="#F3D079" />
      {/* Welcome Character */}
      <g transform="translate(80, 22)">
        <circle cx="30" cy="22" r="13" fill="#C6865A" />
        <path d="M19 20 C19 10 40 10 40 20 Z" fill="#0F172A" />
        {/* Friendly smile */}
        <path d="M27 27 Q 30 30 33 27" stroke="#7C2D12" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        {/* Uniform in Citrine Teal */}
        <path d="M18 40 C18 32 44 32 44 40 L40 78 L20 78 Z" fill="#2A7B76" />
        {/* ID Badge on chest */}
        <rect x="26" y="46" width="8" height="10" rx="1" fill="#FFFFFF" />
        <line x1="28" y1="48" x2="32" y2="48" stroke="#10B981" strokeWidth="1" />
        {/* Welcoming waving arm */}
        <path d="M44 44 L60 30 L66 18" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="66" cy="16" r="4" fill="#C6865A" />
        <path d="M18 44 L10 58 L20 68" stroke="#2A7B76" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
};

/**
 * 11. HumaanUsers (Utilisateurs et Rôles)
 * Administrateur configurant les rôles, permissions et accès des collaborateurs.
 */
export const HumaanUsers: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Gestion des Utilisateurs & Rôles">
      <ellipse cx="110" cy="148" rx="65" ry="7" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="75" r="52" fill="#2A7B76" fillOpacity="0.15" />
      {/* Shield & Key Icons */}
      <g transform="translate(145, 30)">
        <path d="M15 5 L30 12 V25 C30 38 15 48 15 48 C15 48 0 38 0 25 V12 Z" fill="#D4A82F" fillOpacity="0.9" />
        <circle cx="15" cy="22" r="5" fill="#1E293B" />
        <path d="M15 27 V35" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
      </g>
      {/* Administrator Character */}
      <g transform="translate(55, 20)">
        {/* Legs */}
        <path d="M25 90 L22 135 C22 138 32 138 32 135 L35 100 L43 100 L46 135 C46 138 56 138 56 135 L53 90 Z" fill="#1E293B" />
        {/* Shoes */}
        <rect x="18" y="133" width="15" height="5" rx="2" fill="#0F172A" />
        <rect x="44" y="133" width="15" height="5" rx="2" fill="#0F172A" />
        {/* Torso - Smart Teal Blazer */}
        <path d="M18 42 C18 34 58 34 58 42 L54 92 C54 94 22 94 22 92 Z" fill="#2A7B76" />
        <path d="M32 40 L38 56 L44 40" fill="#F3D079" />
        {/* Left Arm holding security badge */}
        <path d="M18 42 L8 65 L24 72" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="22" y="66" width="14" height="18" rx="2" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
        <circle cx="29" cy="72" r="3" fill="#D4A82F" />
        {/* Right Arm pointing to system access */}
        <path d="M58 42 L76 54 L92 48" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="94" cy="47" r="3" fill="#D49B74" />
        {/* Neck & Head */}
        <rect x="34" y="28" width="8" height="10" rx="2" fill="#D49B74" />
        <circle cx="38" cy="22" r="13" fill="#D49B74" />
        {/* Stylish Hair */}
        <path d="M26 22 C26 10 50 10 50 20 C48 18 42 16 36 16 C30 16 27 19 26 22 Z" fill="#0F172A" />
      </g>
    </svg>
  );
};

/**
 * 12. HumaanAudit (Journaux et Audit)
 * Spécialiste de la conformité inspectant la traçabilité des opérations, les journaux et les événements système.
 */
export const HumaanAudit: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Journaux & Audit">
      <ellipse cx="110" cy="148" rx="65" ry="7" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="72" r="50" fill="#0284C7" fillOpacity="0.12" />
      {/* Floating Audit Terminal Log */}
      <g transform="translate(130, 25)">
        <rect width="65" height="48" rx="8" fill="#0F172A" stroke="#38BDF8" strokeWidth="1.5" />
        <circle cx="10" cy="10" r="2.5" fill="#EF4444" />
        <circle cx="18" cy="10" r="2.5" fill="#F59E0B" />
        <circle cx="26" cy="10" r="2.5" fill="#10B981" />
        <line x1="10" y1="20" x2="45" y2="20" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="28" x2="55" y2="28" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
        <line x1="10" y1="36" x2="35" y2="36" stroke="#4ADE80" strokeWidth="2" strokeLinecap="round" />
      </g>
      {/* Auditor Character */}
      <g transform="translate(50, 22)">
        {/* Legs */}
        <path d="M26 88 L22 133 C22 136 32 136 32 133 L35 98 L43 98 L46 133 C46 136 56 136 56 133 L52 88 Z" fill="#334155" />
        <rect x="18" y="131" width="15" height="5" rx="2" fill="#0F172A" />
        <rect x="44" y="131" width="15" height="5" rx="2" fill="#0F172A" />
        {/* Torso - Dark Teal vest */}
        <path d="M18 42 C18 34 56 34 56 42 L52 90 C52 92 22 92 22 90 Z" fill="#0F766E" />
        <path d="M31 40 L37 54 L43 40" fill="#FFFFFF" />
        {/* Holding Audit Checklist / Magnifying Glass */}
        <path d="M18 44 L6 62 L22 74" stroke="#0F766E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="18" y="65" width="20" height="24" rx="3" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1" />
        <line x1="22" y1="72" x2="32" y2="72" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="78" x2="34" y2="78" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="22" y1="83" x2="28" y2="83" stroke="#64748B" strokeWidth="1.5" strokeLinecap="round" />
        {/* Right Arm with pointer */}
        <path d="M56 44 L72 58 L85 52" stroke="#0F766E" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="87" cy="51" r="3.5" fill="#C6865A" />
        {/* Neck & Head */}
        <rect x="33" y="28" width="8" height="10" rx="2" fill="#C6865A" />
        <circle cx="37" cy="22" r="13" fill="#C6865A" />
        {/* Hair with Glasses */}
        <path d="M26 20 C26 10 49 10 49 18 C47 16 42 14 36 14 C30 14 27 17 26 20 Z" fill="#0F172A" />
        <rect x="30" y="19" width="6" height="5" rx="1" fill="none" stroke="#0F172A" strokeWidth="1" />
        <rect x="38" y="19" width="6" height="5" rx="1" fill="none" stroke="#0F172A" strokeWidth="1" />
        <line x1="36" y1="21" x2="38" y2="21" stroke="#0F172A" strokeWidth="1" />
      </g>
    </svg>
  );
};

/**
 * 13. HumaanSettings (Configuration Entreprise / Paramètres du Site)
 * Ingénieur / Responsable ajustant les paramètres, les horaires, les modules et les règles de l'organisation.
 */
export const HumaanSettings: React.FC<IllustrationProps> = ({ className = 'w-36 h-28', size }) => {
  return (
    <svg viewBox="0 0 220 160" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={size ? { width: size, height: size } : undefined} aria-label="Configuration Entreprise & Paramètres">
      <ellipse cx="110" cy="148" rx="65" ry="7" fill="#000000" fillOpacity="0.12" />
      <circle cx="110" cy="72" r="50" fill="#D4A82F" fillOpacity="0.15" />
      {/* Gears / Settings Cog */}
      <g transform="translate(142, 28)">
        <circle cx="20" cy="20" r="16" fill="#D4A82F" fillOpacity="0.8" />
        <circle cx="20" cy="20" r="8" fill="#14423F" />
        <rect x="18" y="1" width="4" height="6" rx="1" fill="#D4A82F" />
        <rect x="18" y="33" width="4" height="6" rx="1" fill="#D4A82F" />
        <rect x="1" y="18" width="6" height="4" rx="1" fill="#D4A82F" />
        <rect x="33" y="18" width="6" height="4" rx="1" fill="#D4A82F" />
      </g>
      {/* Character tinkering with controls */}
      <g transform="translate(52, 22)">
        {/* Legs */}
        <path d="M26 88 L22 133 C22 136 32 136 32 133 L35 98 L43 98 L46 133 C46 136 56 136 56 133 L52 88 Z" fill="#1E293B" />
        <rect x="18" y="131" width="15" height="5" rx="2" fill="#0F172A" />
        <rect x="44" y="131" width="15" height="5" rx="2" fill="#0F172A" />
        {/* Torso - Citrine Ochre/Amber Jacket */}
        <path d="M18 42 C18 34 56 34 56 42 L52 90 C52 92 22 92 22 90 Z" fill="#2A7B76" />
        <path d="M31 40 L37 54 L43 40" fill="#D4A82F" />
        {/* Left Arm adjusting toggle */}
        <path d="M18 44 L6 60 L18 70" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="19" cy="71" r="3" fill="#D49B74" />
        {/* Right Arm operating gear */}
        <path d="M56 44 L76 46 L95 38" stroke="#2A7B76" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="97" cy="37" r="4" fill="#D49B74" />
        {/* Neck & Head */}
        <rect x="33" y="28" width="8" height="10" rx="2" fill="#D49B74" />
        <circle cx="37" cy="22" r="13" fill="#D49B74" />
        {/* Hair */}
        <path d="M26 20 C26 10 49 10 49 18 C47 16 42 14 36 14 C30 14 27 17 26 20 Z" fill="#0F172A" />
      </g>
    </svg>
  );
};


