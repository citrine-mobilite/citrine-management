import React, { useState } from 'react';
import { Check, Copy, RefreshCw, ShieldCheck, AlertTriangle } from 'lucide-react';
import type {
  BackupConnectionTestResult,
  BackupEnvironmentStatus,
  EnvVarDiagnosticItem,
} from '../../types/backupTypes';

interface BackupPipelineDiagnosticsProps {
  environment: BackupEnvironmentStatus | null;
  testingConnections: boolean;
  connectionResult: BackupConnectionTestResult | null;
  onTestConnections: () => void;
}

const GROUP_LABELS: Record<EnvVarDiagnosticItem['group'], { title: string; subtitle: string }> = {
  cpanel: {
    title: '01. Source cPanel HeroCab',
    subtitle: 'Export SQL natif en HTTPS via API Token (aucun port MySQL 3306 ouvert sur Internet)',
  },
  google_drive: {
    title: '02. Destination Google Drive',
    subtitle: 'Refresh Token OAuth pour Gmail personnel ou Service Account JSON pour Drive partagé Workspace',
  },
  github_actions: {
    title: '03. Moteur Niveau 2 (MySQL 8 Temporaire)',
    subtitle: 'Exécution quotidienne à 00h00 (Douala) et test de ré-importation réel sur GitHub Actions',
  },
  security: {
    title: '04. Sécurité Webhook & Cron',
    subtitle: 'Signature cryptographique des rapports de sauvegarde envoyés vers Citrine Management',
  },
};

const PIPELINE_STEPS = [
  {
    index: '01',
    title: 'Export SQL cPanel',
    detail: 'Téléchargement sécurisé /getsqlbackup/<db>.sql.gz en HTTPS authentifié par cPanel API Token.',
  },
  {
    index: '02',
    title: 'Contrôle GZIP & SQL',
    detail: 'Vérification CRC32, présence de CREATE TABLE, marqueur -- Dump completed et rejet des erreurs HTML.',
  },
  {
    index: '03',
    title: 'Restauration MySQL temporaire',
    detail: 'Import complet dans un conteneur MySQL 8 jetable + SHOW TABLES & CHECK TABLE (Niveau 2).',
  },
  {
    index: '04',
    title: 'Transfert & MD5 Google Drive',
    detail: 'Upload dans votre dossier Drive dédié puis comparaison octet par octet du md5Checksum renvoyé par Google.',
  },
  {
    index: '05',
    title: 'Purge > 45 jours sécurisée',
    detail: 'Suppression des archives expirées uniquement après validation complète, avec plancher minimal garanti.',
  },
];

export const BackupPipelineDiagnostics: React.FC<BackupPipelineDiagnosticsProps> = ({
  environment,
  testingConnections,
  connectionResult,
  onTestConnections,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = async (key: string) => {
    try {
      await navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {}
  };

  const groups: Array<EnvVarDiagnosticItem['group']> = [
    'cpanel',
    'google_drive',
    'github_actions',
    'security',
  ];

  const variables = environment?.variables || [];

  return (
    <div className="space-y-6">
      {/* 5-Stage Anti-Corruption Pipeline */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-stone-900">
              Chaîne de vérification anti-corruption (Niveau 2)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Chaque sauvegarde quotidienne (00h00 Douala) ou manuelle passe par ces 5 contrôles successifs avant toute purge
            </p>
          </div>
          <button
            type="button"
            onClick={onTestConnections}
            disabled={testingConnections}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-800 bg-stone-50 hover:bg-stone-100 border border-stone-200 rounded-lg transition disabled:opacity-50 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 text-[#2A7B76] ${testingConnections ? 'animate-spin' : ''}`} />
            <span>{testingConnections ? 'Test en cours…' : 'Tester les connexions'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-stone-200">
          {PIPELINE_STEPS.map((step) => (
            <div key={step.index} className="p-4 space-y-1.5">
              <div className="text-xs font-mono font-semibold text-[#2A7B76]">{step.index}.</div>
              <h3 className="text-sm font-semibold text-stone-900">{step.title}</h3>
              <p className="text-xs text-stone-500 leading-relaxed">{step.detail}</p>
            </div>
          ))}
        </div>

        {/* Live connection check results */}
        {connectionResult && (
          <div className="border-t border-stone-200 bg-stone-50/60 px-5 py-4 space-y-2.5">
            <div className="text-xs font-semibold text-stone-800">
              Résultat du test de connectivité
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {connectionResult.checks.cpanel.ok ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" />
                  )}
                  <span className={connectionResult.checks.cpanel.ok ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                    cPanel HeroCab · {connectionResult.checks.cpanel.ok ? 'Connecté' : 'Non prêt'}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">{connectionResult.checks.cpanel.message}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {connectionResult.checks.googleDrive.ok ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" />
                  )}
                  <span className={connectionResult.checks.googleDrive.ok ? 'text-[#16A34A]' : 'text-[#DC2626]'}>
                    Google Drive · {connectionResult.checks.googleDrive.ok ? 'Connecté' : 'Non prêt'}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">{connectionResult.checks.googleDrive.message}</p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  {connectionResult.checks.githubActions.ok ? (
                    <ShieldCheck className="h-3.5 w-3.5 text-[#16A34A]" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-[#D97706]" />
                  )}
                  <span className={connectionResult.checks.githubActions.ok ? 'text-[#16A34A]' : 'text-[#D97706]'}>
                    GitHub Actions Niveau 2 · {connectionResult.checks.githubActions.ok ? 'Actif' : 'À configurer'}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed">{connectionResult.checks.githubActions.message}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Read-Only Environment Variables Readiness Matrix */}
      <section className="bg-white border border-stone-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200">
          <h2 className="text-base font-semibold text-stone-900">
            Variables d’environnement requises (lecture seule)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Définissez ces variables dans votre hébergement serveur (Vercel) et dans les secrets GitHub Actions. Aucune clé secrète n’est jamais affichée ni saisie dans l’interface web.
          </p>
        </div>

        <div className="divide-y divide-stone-200">
          {groups.map((groupKey) => {
            const groupItems = variables.filter((v) => v.group === groupKey);
            const meta = GROUP_LABELS[groupKey];
            return (
              <div key={groupKey} className="p-5 space-y-3">
                <div>
                  <h3 className="text-sm font-semibold text-stone-900">{meta.title}</h3>
                  <p className="text-xs text-stone-500 mt-0.5">{meta.subtitle}</p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse table-fixed min-w-[760px]">
                    <thead>
                      <tr className="border-b border-stone-200 text-[11px] font-medium text-stone-500">
                        <th className="py-2 pr-4 w-[290px] whitespace-nowrap">Variable</th>
                        <th className="py-2 px-4 w-[115px] whitespace-nowrap">État serveur</th>
                        <th className="py-2 px-4 w-[210px] whitespace-nowrap">Usage</th>
                        <th className="py-2 pl-4 whitespace-nowrap">Détail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-xs">
                      {groupItems.map((item) => (
                        <tr key={item.key} className="hover:bg-stone-50/70">
                          <td className="py-2.5 pr-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleCopyKey(item.key)}
                              className="inline-flex items-center gap-1.5 font-mono font-medium text-stone-900 hover:text-[#2A7B76] transition cursor-pointer"
                              title="Copier le nom de la variable"
                            >
                              <span>{item.key}</span>
                              {copiedKey === item.key ? (
                                <Check className="h-3 w-3 text-[#16A34A]" />
                              ) : (
                                <Copy className="h-3 w-3 text-stone-400" />
                              )}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 whitespace-nowrap font-medium">
                            {item.configured ? (
                              <span className="text-[#16A34A]">Configurée</span>
                            ) : item.optional ? (
                              <span className="text-stone-400">Optionnelle</span>
                            ) : (
                              <span className="text-[#D97706]">Manquante</span>
                            )}
                          </td>
                          <td className="py-2.5 px-4 text-stone-700 whitespace-nowrap">{item.requiredFor}</td>
                          <td className="py-2.5 pl-4 text-stone-500">{item.hint}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
