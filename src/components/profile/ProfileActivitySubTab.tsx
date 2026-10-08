import React from 'react';
import { Activity, Globe, Smartphone, Clock } from 'lucide-react';
import { ConnectionLog } from '../../types';

interface ProfileActivitySubTabProps {
  connectionLogs: ConnectionLog[];
  currentUserEmail: string;
}

export const ProfileActivitySubTab: React.FC<ProfileActivitySubTabProps> = ({
  connectionLogs,
  currentUserEmail,
}) => {
  const userLogs = connectionLogs.filter(
    (log) => log.userEmail?.toLowerCase() === currentUserEmail.toLowerCase()
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-[#2A7B76]" /> Historique des Connexions Récentes
        </h3>
        <span className="text-[10px] text-stone-400 font-mono font-bold">
          {userLogs.length} connexions
        </span>
      </div>

      <div className="border border-stone-200 rounded-2xl overflow-hidden divide-y divide-stone-100 bg-white">
        {userLogs.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-xs italic">
            Aucun journal d'activité enregistré pour le moment.
          </div>
        ) : (
          userLogs.slice(0, 10).map((log) => (
            <div key={log.id} className="p-3 hover:bg-stone-50/60 transition flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    log.status === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-stone-900 flex items-center gap-2">
                    <span>{log.authMethod === 'google' ? 'Connexion Google' : 'Connexion Mot de passe'}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                        log.status === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {log.status === 'success' ? 'Réussie' : 'Échouée'}
                    </span>
                  </div>
                  <p className="text-[10px] text-stone-400 truncate mt-0.5">
                    {log.location || 'Localisation non renseignée'} {log.ipAddress ? `• IP: ${log.ipAddress}` : ''}
                  </p>
                </div>
              </div>

              <span className="font-mono text-[10px] text-stone-400 shrink-0">
                {new Date(log.timestamp).toLocaleString('fr-FR')}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
