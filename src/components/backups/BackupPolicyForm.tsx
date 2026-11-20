import React, { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import type { BackupExecutionMode, BackupPolicySettings } from '../../types/backupTypes';

interface BackupPolicyFormProps {
  settings: BackupPolicySettings;
  smtpReady: boolean;
  saving: boolean;
  onSave: (patch: Partial<BackupPolicySettings>) => Promise<void>;
}

export const BackupPolicyForm: React.FC<BackupPolicyFormProps> = ({
  settings,
  smtpReady,
  saving,
  onSave,
}) => {
  const [databaseLabel, setDatabaseLabel] = useState(settings.databaseLabel);
  const [retentionDays, setRetentionDays] = useState(settings.retentionDays);
  const [minKeepValidBackups, setMinKeepValidBackups] = useState(settings.minKeepValidBackups);
  const [preferredMode, setPreferredMode] = useState<BackupExecutionMode>(settings.preferredMode);
  const [requiredTablesText, setRequiredTablesText] = useState(settings.requiredTables.join(', '));
  const [alertOnFailure, setAlertOnFailure] = useState(settings.alertOnFailure);
  const [alertOnSuccess, setAlertOnSuccess] = useState(settings.alertOnSuccess);
  const [alertEmails, setAlertEmails] = useState(settings.alertEmails);

  useEffect(() => {
    setDatabaseLabel(settings.databaseLabel);
    setRetentionDays(settings.retentionDays);
    setMinKeepValidBackups(settings.minKeepValidBackups);
    setPreferredMode(settings.preferredMode);
    setRequiredTablesText(settings.requiredTables.join(', '));
    setAlertOnFailure(settings.alertOnFailure);
    setAlertOnSuccess(settings.alertOnSuccess);
    setAlertEmails(settings.alertEmails);
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const requiredTables = requiredTablesText
      .split(/[,\n;]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    await onSave({
      databaseLabel,
      retentionDays: Number(retentionDays) || 45,
      minKeepValidBackups: Number(minKeepValidBackups) || 7,
      preferredMode,
      requiredTables,
      alertOnFailure,
      alertOnSuccess,
      alertEmails,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-200"
    >
      <div className="px-5 py-4">
        <h2 className="text-base font-semibold text-stone-900">Politique de rétention, vérification et alertes</h2>
        <p className="text-xs text-stone-500 mt-0.5">
          Paramètres métier enregistrés dans Citrine Management (sans aucune donnée sensible)
        </p>
      </div>

      {/* Retention & Mode */}
      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-700" htmlFor="bkp-db-label">
            Libellé de la base suivie
          </label>
          <input
            id="bkp-db-label"
            type="text"
            value={databaseLabel}
            onChange={(e) => setDatabaseLabel(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-700" htmlFor="bkp-mode">
            Moteur de déclenchement manuel par défaut
          </label>
          <select
            id="bkp-mode"
            value={preferredMode}
            onChange={(e) => setPreferredMode(e.target.value as BackupExecutionMode)}
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          >
            <option value="github_level2">
              Niveau 2 — GitHub Actions (restauration réelle dans MySQL 8 temporaire)
            </option>
            <option value="server_direct">
              Niveau 1 — Serveur direct (GZIP CRC32 + Structure SQL + MD5 Drive, idéal &lt; 30 Mo)
            </option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-700" htmlFor="bkp-retention">
            Durée de conservation sur Google Drive (jours)
          </label>
          <input
            id="bkp-retention"
            type="number"
            min={7}
            max={365}
            value={retentionDays}
            onChange={(e) => setRetentionDays(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
          <p className="text-[11px] text-stone-500">
            Les archives strictement plus anciennes que cette durée sont supprimées uniquement après une sauvegarde du jour validée.
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-700" htmlFor="bkp-min-keep">
            Plancher minimal de sauvegardes protégées
          </label>
          <input
            id="bkp-min-keep"
            type="number"
            min={1}
            max={30}
            value={minKeepValidBackups}
            onChange={(e) => setMinKeepValidBackups(Number(e.target.value))}
            className="w-full px-3 py-2 text-sm font-mono tabular-nums bg-white border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:border-[#2A7B76]"
          />
          <p className="text-[11px] text-stone-500">
            Garde-fou absolu : même si des fichiers dépassent {retentionDays} jours, ce nombre minimal d’archives récentes n’est jamais supprimé.
          </p>
        </div>
      </div>

      {/* Required Tables Check */}
      <div className="p-5 space-y-1.5">
        <label className="block text-xs font-medium text-stone-700" htmlFor="bkp-required-tables">
          Tables critiques HeroCab à vérifier obligatoirement (optionnel, séparées par virgules)
        </label>
        <input
          id="bkp-required-tables"
          type="text"
          value={requiredTablesText}
          onChange={(e) => setRequiredTablesText(e.target.value)}
          placeholder="ex: users, drivers, rides, payments"
          className="w-full px-3 py-2 text-sm font-mono bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#2A7B76]"
        />
        <p className="text-[11px] text-stone-500">
          Si l’une de ces tables est absente du dump SQL, la sauvegarde est marquée corrompue et la purge automatique est immédiatement bloquée.
        </p>
      </div>

      {/* SMTP Alerting */}
      <div className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Alertes e-mail (SMTP Citrine existant)</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {smtpReady
                ? 'Service SMTP actif — les alertes d’échec ou de corruption seront envoyées automatiquement.'
                : 'Configurez votre serveur SMTP dans Configuration Entreprise → E-mail & TaskSheets pour activer les alertes.'}
            </p>
          </div>
          <span className={`text-xs font-medium whitespace-nowrap ${smtpReady ? 'text-[#16A34A]' : 'text-[#D97706]'}`}>
            {smtpReady ? 'SMTP actif' : 'SMTP non configuré'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={alertOnFailure}
              onChange={(e) => setAlertOnFailure(e.target.checked)}
              className="mt-0.5 accent-[#2A7B76]"
            />
            <span>
              <strong className="font-semibold text-stone-900 block">Alerter en cas d’échec ou corruption</strong>
              Envoie un rapport d’erreur détaillé dès qu’un contrôle GZIP, MySQL temporaire ou MD5 Drive échoue.
            </span>
          </label>

          <label className="flex items-start gap-2.5 text-xs text-stone-700 cursor-pointer">
            <input
              type="checkbox"
              checked={alertOnSuccess}
              onChange={(e) => setAlertOnSuccess(e.target.checked)}
              className="mt-0.5 accent-[#2A7B76]"
            />
            <span>
              <strong className="font-semibold text-stone-900 block">Confirmer chaque sauvegarde réussie</strong>
              Envoie également un accusé de réception quotidien après validation sur Google Drive.
            </span>
          </label>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-stone-700" htmlFor="bkp-alert-emails">
            Destinataires des alertes Sauvegarde (laisser vide pour utiliser les destinataires RH configurés)
          </label>
          <input
            id="bkp-alert-emails"
            type="text"
            value={alertEmails}
            onChange={(e) => setAlertEmails(e.target.value)}
            placeholder="tech@citrine.cm, direction@citrine.cm"
            className="w-full px-3 py-2 text-sm bg-white border border-stone-200 rounded-lg text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#2A7B76]"
          />
        </div>
      </div>

      {/* Footer Submit */}
      <div className="px-5 py-3.5 bg-stone-50/70 flex items-center justify-between gap-4">
        <span className="text-xs text-stone-500">
          {settings.updatedAt
            ? `Dernière modification par ${settings.updatedBy || 'Administrateur'}`
            : 'Valeurs par défaut (45 jours · Niveau 2 MySQL temporaire)'}
        </span>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2A7B76] hover:bg-[#226460] disabled:opacity-60 rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Save className="h-3.5 w-3.5" />
          <span>{saving ? 'Enregistrement…' : 'Enregistrer la politique'}</span>
        </button>
      </div>
    </form>
  );
};
