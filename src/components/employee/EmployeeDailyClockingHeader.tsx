import React from 'react';
import { Clock, QrCode, Sparkles } from 'lucide-react';
import { AppUser, Employee } from '../../types';
import { getHolidayInfo } from '../../utils/cameroonHolidays';
import { getTimeBasedGreeting } from '../../utils/dateUtils';

interface EmployeeDailyClockingHeaderProps {
  currentUser: AppUser | null;
  employeeProfile: Employee;
  todayStr: string;
  currentDateStr: string;
  liveTimeString: string;
  setShowOfficeQRModal: (val: boolean) => void;
}

export const EmployeeDailyClockingHeader: React.FC<EmployeeDailyClockingHeaderProps> = ({
  currentUser,
  employeeProfile,
  todayStr,
  currentDateStr,
  liveTimeString,
  setShowOfficeQRModal,
}) => {
  const greeting = React.useMemo(() => {
    const mainGreeting = getTimeBasedGreeting();
    let desc = "Passez une excellente matinée de travail. Prêt à démarrer ?";
    let style = "bg-emerald-50/70 border-emerald-200/80 text-emerald-950";
    let iconColor = "text-emerald-600";

    if (mainGreeting === "Bon après-midi") {
      desc = "Continuez sur cette lancée productive ! Bon après-midi au poste.";
      style = "bg-sky-50/70 border-sky-200/80 text-sky-950";
      iconColor = "text-sky-600";
    } else if (mainGreeting === "Bonsoir") {
      desc = "J'espère que votre journée s'est bien déroulée. N'oubliez pas de badger votre départ !";
      style = "bg-teal-50/70 border-teal-200/80 text-teal-950";
      iconColor = "text-[#2A7B76]";
    } else if (mainGreeting === "Bonne nuit") {
      desc = "L'application est en veille pour la nuit. Reposez-vous bien !";
      style = "bg-stone-100/80 border-stone-200 text-stone-900";
      iconColor = "text-stone-500";
    }

    return { mainGreeting, desc, style, iconColor };
  }, [liveTimeString]);

  const holiday = getHolidayInfo(currentDateStr);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-[#2A7B76] tracking-wider flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Pointage Quotidien en Direct
            </span>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-ping" />
              Live: {liveTimeString}
            </span>
          </div>
          <h2 className="text-lg font-serif font-bold text-stone-900 mt-0.5">
            Enregistrer mes heures de travail
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-stone-50 text-stone-900 border border-stone-200 font-mono font-bold text-xs px-3 py-1.5 rounded-xl hidden sm:inline-block">
            {new Date(todayStr).toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {currentUser?.role !== 'employé' && (
            <button
              onClick={() => setShowOfficeQRModal(true)}
              className="px-3.5 py-2 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-sm shrink-0"
            >
              <QrCode className="h-4 w-4 text-emerald-200" />
              <span>Affiche QR Code Accueil</span>
            </button>
          )}
        </div>
      </div>

      {holiday && (
        <div className="bg-amber-50 border border-amber-200 text-amber-950 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-3xs">
          <div className="flex items-start gap-2.5">
            <span className="text-xl">🇨🇲</span>
            <div>
              <h4 className="text-xs font-bold text-amber-900">
                Jour férié national au Cameroun : {holiday.name}
              </h4>
              <p className="text-[10px] text-amber-800 mt-0.5">
                Aujourd'hui est un jour férié officiel. Le pointage est strictement facultatif.
              </p>
            </div>
          </div>
          <span className="text-[9px] bg-amber-200/60 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-1 rounded-xl self-start sm:self-auto shrink-0 uppercase tracking-wide">
            Absence non pénalisée
          </span>
        </div>
      )}

      {/* Dynamic Contextual Welcoming Header Banner */}
      <div className={`p-4 rounded-2xl border ${greeting.style} flex items-start gap-3 transition-all duration-300`}>
        <Sparkles className={`h-5 w-5 ${greeting.iconColor} shrink-0 mt-0.5`} />
        <div className="space-y-0.5">
          <h3 className="text-xs font-bold font-serif">
            {greeting.mainGreeting} {employeeProfile.name} !
          </h3>
          <p className="text-[11px] opacity-90">{greeting.desc}</p>
        </div>
      </div>
    </div>
  );
};
