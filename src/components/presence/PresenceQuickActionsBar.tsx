import React from 'react';
import { Clock, UserCheck, AlertTriangle, QrCode, KeyRound, DoorClosed, FileText, Mail } from 'lucide-react';

interface PresenceQuickActionsBarProps {
  isRestricted: boolean;
  activePresenceTab: 'presences' | 'requests' | 'incidents';
  onSelectTab: (tab: 'presences' | 'requests' | 'incidents') => void;
  pendingRequestsCount: number;
  incidentsCount: number;
  onOpenDynamicQr: () => void;
  onOpenStaticDoorQr: () => void;
  onOpenAdminClock: () => void;
  onOpenOfficeQr: () => void;
  onOpenWeeklyRecap: () => void;
}

export const PresenceQuickActionsBar: React.FC<PresenceQuickActionsBarProps> = ({
  isRestricted,
  activePresenceTab,
  onSelectTab,
  pendingRequestsCount,
  incidentsCount,
  onOpenDynamicQr,
  onOpenStaticDoorQr,
  onOpenAdminClock,
  onOpenOfficeQr,
  onOpenWeeklyRecap,
}) => {
  return (
    <>
      <div className="bg-white p-3 sm:p-4 rounded-3xl border border-stone-200/90 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full">
          <button
            onClick={onOpenDynamicQr}
            className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-[#2A7B76] to-emerald-700 hover:from-[#20635F] hover:to-emerald-800 text-white font-extrabold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            title="Générer un QR code dynamique renouvelé toutes les 30 secondes pour le pointage des employés"
          >
            <QrCode className="h-4 w-4 text-emerald-200 animate-pulse shrink-0" />
            <span>QR Code Dynamique</span>
          </button>

          <button
            onClick={onOpenStaticDoorQr}
            className="w-full py-3 px-3.5 rounded-2xl bg-teal-50 hover:bg-teal-100 text-[#2A7B76] font-bold text-xs border border-teal-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            title="Afficher ou configurer le QR code statique de porte ou d'entrée fixe"
          >
            <DoorClosed className="h-4 w-4 text-[#2A7B76] shrink-0" />
            <span>QR Porte / Bureau</span>
          </button>

          <button
            onClick={onOpenAdminClock}
            className="w-full py-3 px-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            title="Effectuer un pointage administratif pour le compte d'un collaborateur"
          >
            <UserCheck className="h-4 w-4 text-[#2A7B76] shrink-0" />
            <span>Badger Collaborateur</span>
          </button>

          <button
            onClick={onOpenOfficeQr}
            className="w-full py-3 px-3.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs border border-stone-200 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            title="Générer une clé d'accès sécurisée de 16 caractères valide 3 minutes"
          >
            <KeyRound className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Clé d'Accès (16 Car.)</span>
          </button>

          {!isRestricted && (
            <button
              onClick={onOpenWeeklyRecap}
              className="w-full py-3 px-3.5 rounded-2xl bg-gradient-to-r from-[#164e4b] to-[#0f3e3b] hover:from-[#0d3331] hover:to-[#072422] text-white font-extrabold text-xs shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-emerald-900/40"
              title="Envoyer manuellement le récapitulatif des présences de la semaine en cours aux responsables (tous les collaborateurs en copie)"
            >
              <Mail className="h-4 w-4 text-emerald-300 shrink-0" />
              <span>Récap. Semaine (en cours)</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 p-1.5 bg-stone-100/90 rounded-2xl border border-stone-200/80 w-fit flex-wrap">
        <button
          onClick={() => onSelectTab('presences')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activePresenceTab === 'presences' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Afficher la feuille des pointages du jour"
        >
          <Clock className="h-4 w-4 text-[#2A7B76]" />
          <span>Feuille des Pointages du Jour</span>
        </button>

        <button
          onClick={() => onSelectTab('requests')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activePresenceTab === 'requests' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Consulter et valider les demandes et justificatifs de présence"
        >
          <FileText className="h-4 w-4 text-emerald-600" />
          <span>Demandes & Justificatifs</span>
          {pendingRequestsCount > 0 && (
            <span className="bg-[#D4A82F] text-stone-900 font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-3xs animate-pulse">
              {pendingRequestsCount} en attente
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('incidents')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activePresenceTab === 'incidents' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
          }`}
          title="Consulter le registre des incidents et retards"
        >
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span>Registre des Incidents & Retards ({incidentsCount})</span>
        </button>
      </div>
    </>
  );
};
