import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Server, 
  Key, 
  Layers, 
  RefreshCw,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  UserCheck,
  Check,
  Users
} from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { clientMailService } from '../../services/clientMailService';

interface CompanyEmailSettingsProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyEmailSettings: React.FC<CompanyEmailSettingsProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}) => {
  const [formData, setFormData] = useState({
    enableEmailNotifications: moduleConfig.enableEmailNotifications !== false,
    smtpHost: moduleConfig.smtpHost || '',
    smtpPort: moduleConfig.smtpPort || 587,
    smtpSecure: Boolean(moduleConfig.smtpSecure),
    smtpUser: moduleConfig.smtpUser || '',
    smtpPass: moduleConfig.smtpPass || '',
    smtpFrom: moduleConfig.smtpFrom || '',
    smtpSenderName: moduleConfig.smtpSenderName || 'Landry Moutongo',
    hrNotificationEmail: moduleConfig.hrNotificationEmail || 'Doleres.Kenne@citrine-mobilite.com',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testRecipient, setTestRecipient] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
    recipients?: string[];
  }>({ status: 'idle' });

  // Chargement automatique des paramètres SMTP effectifs du serveur au montage
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoadingConfig(true);
        const res = await clientMailService.fetchMailConfig();
        if (isMounted && res.success && res.config) {
          const cfg = res.config;
          setFormData((prev) => ({
            ...prev,
            smtpHost: cfg.smtpHost || prev.smtpHost || 'smtp.gmail.com',
            smtpPort: cfg.smtpPort || prev.smtpPort || 587,
            smtpSecure: cfg.smtpSecure !== undefined ? Boolean(cfg.smtpSecure) : prev.smtpSecure,
            smtpUser: cfg.smtpUser || prev.smtpUser,
            smtpPass: cfg.smtpPass || prev.smtpPass,
            smtpFrom: cfg.smtpFrom || prev.smtpFrom,
            smtpSenderName: cfg.smtpSenderName || prev.smtpSenderName || 'Landry Moutongo',
            hrNotificationEmail: cfg.hrNotificationEmail || prev.hrNotificationEmail || 'Doleres.Kenne@citrine-mobilite.com',
          }));

          if (!testRecipient) {
            const firstEmail = (cfg.hrNotificationEmail || formData.hrNotificationEmail || '').split(/[,;\s]+/)[0];
            if (firstEmail) setTestRecipient(firstEmail.trim());
          }
        }
      } catch (e) {
        console.warn('Notice fetch mail config:', e);
      } finally {
        if (isMounted) setIsLoadingConfig(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Détection des adresses email valides dans le champ multi-emails
  const parsedHrEmails = formData.hrNotificationEmail
    .split(/[,;\n\r\t]+/)
    .map(e => e.trim().replace(/^<|>$/g, ''))
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // 1. Sauvegarde côté serveur en base de données (accessible et prioritaire pour les non-développeurs)
      const saveRes = await clientMailService.saveMailConfig({
        ...formData,
        smtpPort: Number(formData.smtpPort),
      });

      // 2. Mise à jour de l'état applicatif React local
      const updated: CompanyModuleConfig = {
        ...moduleConfig,
        ...formData,
        smtpPort: Number(formData.smtpPort),
      };
      onUpdateModuleConfig(updated);

      if (saveRes.success) {
        if (showToast) {
          showToast('Configuration SMTP & RH enregistrée avec succès en base de données.', 'success');
        }
      } else {
        if (showToast) {
          showToast('Sauvegardé localement. ' + (saveRes.error || ''), 'error');
        }
      }
    } catch (err: any) {
      if (showToast) {
        showToast('Erreur lors de la sauvegarde : ' + err.message, 'error');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle' });

    try {
      const res = await clientMailService.testConnection(
        {
          host: formData.smtpHost,
          port: Number(formData.smtpPort),
          secure: formData.smtpSecure,
          user: formData.smtpUser,
          pass: formData.smtpPass,
          from: formData.smtpFrom,
        },
        testRecipient || formData.hrNotificationEmail
      );

      if (res.success) {
        setTestResult({
          status: 'success',
          message: 'Connexion SMTP établie avec succès ! Le message réel de test a été transmis à la boîte de réception.',
          recipients: (res as any).recipients,
        });
        if (showToast) {
          showToast('E-mail de test réel envoyé avec succès !', 'success');
        }
      } else {
        setTestResult({
          status: 'error',
          message: res.error || 'Échec de la connexion au serveur SMTP.',
        });
        if (showToast) {
          showToast(res.error || 'Erreur SMTP.', 'error');
        }
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Erreur réseau.',
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-50 text-[#1F625E] rounded-2xl border border-emerald-100">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Serveur E-mail & Notifications RH (Production Réelle)
              </h3>
              {isLoadingConfig && (
                <RefreshCw className="h-3.5 w-3.5 text-stone-400 animate-spin" />
              )}
            </div>
            <p className="text-xs text-stone-500">
              Configuration modifiable directement par l'équipe Citrine Mobilité sans nécessiter de développeur.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-stone-500">Notifications actives :</span>
          <button
            type="button"
            onClick={() => {
              const nextState = !formData.enableEmailNotifications;
              setFormData({ ...formData, enableEmailNotifications: nextState });
              onUpdateModuleConfig({ ...moduleConfig, enableEmailNotifications: nextState });
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              formData.enableEmailNotifications 
                ? 'bg-[#1F625E] text-white shadow-xs' 
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
            }`}
          >
            {formData.enableEmailNotifications ? 'Activées' : 'Désactivées'}
          </button>
        </div>
      </div>

      {/* Règle stricte de confidentialité */}
      <div className="bg-gradient-to-r from-teal-50 via-emerald-50/50 to-stone-50 p-4 rounded-3xl border border-teal-200/80 flex items-start gap-3">
        <div className="p-2 bg-[#1F625E] text-white rounded-xl shrink-0 shadow-xs">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-[#1F625E] flex items-center gap-1.5">
            Règle Stricte de Confidentialité & Non-Dispersion
          </h4>
          <p className="text-stone-700 leading-relaxed">
            <strong>Personne en dehors des adresses spécifiées dans « E-mails de Notification RH » ne recevra d'e-mails</strong> (ni les employés, ni d'autres collaborateurs). Les rapports journaliers, fiches de temps et alertes sont strictement acheminés vers ces adresses déclarées.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Paramètres SMTP */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-[#1F625E]" />
              Paramètres du Serveur SMTP Citrine Mobilité
            </h4>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-200">
              Sauvegarde en Base de Données
            </span>
          </div>

          {/* Destinataires RH (Multi-Email) */}
          <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
                <Users className="h-4 w-4 text-[#1F625E]" />
                E-mails de Notification RH (HR_NOTIFICATION_EMAIL) *
              </label>
              <span className="text-[10px] font-bold text-[#1F625E] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                {parsedHrEmails.length} adresse{parsedHrEmails.length > 1 ? 's' : ''} détectée{parsedHrEmails.length > 1 ? 's' : ''}
              </span>
            </div>
            <input
              type="text"
              value={formData.hrNotificationEmail}
              onChange={(e) => setFormData({ ...formData, hrNotificationEmail: e.target.value })}
              placeholder="ex: Doleres.Kenne@citrine-mobilite.com, direction@citrine-mobilite.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#1F625E] font-medium"
            />
            <p className="text-[11px] text-stone-500 leading-normal">
              Vous pouvez renseigner <strong>un ou plusieurs e-mails</strong> séparés par des virgules (,) ou des points-virgules (;). <strong>Seules ces adresses</strong> recevront les fiches de temps et notifications RH.
            </p>

            {/* Badges d'affichage direct des e-mails reconnus */}
            {parsedHrEmails.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {parsedHrEmails.map((email, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-teal-200 text-[#1F625E] font-mono text-[11px] shadow-2xs font-semibold"
                  >
                    <Check className="h-3 w-3 text-emerald-600" />
                    {email}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-stone-700">Hôte Serveur SMTP (Host) *</label>
              <input
                type="text"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#1F625E]"
              />
              <span className="text-[10px] text-stone-400">Pour Gmail : <code>smtp.gmail.com</code></span>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Port SMTP *</label>
              <input
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                placeholder="587 ou 465"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#1F625E]"
              />
              <span className="text-[10px] text-stone-400">Standard : <code>587</code> (TLS)</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Utilisateur SMTP (Compte Expéditeur) *</label>
              <input
                type="text"
                value={formData.smtpUser}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="citrinemobilite@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#1F625E]"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-700">Mot de Passe d'Application (16 caractères) *</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-[#1F625E] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  {showPassword ? 'Masquer' : 'Afficher'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.smtpPass}
                onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#1F625E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Nom de l'Expéditeur affiché (Sender Name)</label>
              <input
                type="text"
                value={formData.smtpSenderName}
                onChange={(e) => setFormData({ ...formData, smtpSenderName: e.target.value })}
                placeholder="Landry Moutongo ou Citrine Mobilité RH"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#1F625E]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Adresse d'Expéditeur (Header FROM)</label>
              <input
                type="text"
                value={formData.smtpFrom}
                onChange={(e) => setFormData({ ...formData, smtpFrom: e.target.value })}
                placeholder="citrinemobilite@gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#1F625E]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="smtpSecureCheckbox"
              checked={formData.smtpSecure}
              onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-[#1F625E] focus:ring-[#1F625E]"
            />
            <label htmlFor="smtpSecureCheckbox" className="text-xs text-stone-700 font-medium cursor-pointer">
              Connexion sécurisée SSL directe (cocher uniquement pour le port 465 ; laisser décoché pour le port 587 avec STARTTLS)
            </label>
          </div>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              Modifications effectives immédiatement pour tous les envois automatiques.
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#1F625E] hover:bg-[#164e4a] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Sauvegarde en cours...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Enregistrer les Modifications
                </>
              )}
            </button>
          </div>
        </div>

        {/* Colonne Test de Connexion & Diagnostics */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4 text-xs">
            <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <Send className="h-4 w-4 text-[#1F625E]" />
              Tester l'envoi réel
            </h4>

            <p className="text-stone-500 leading-relaxed">
              Vérifiez la bonne transmission de l'e-mail vers votre boîte sans passer par les courriels indésirables.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Adresse de réception du test :</label>
              <input
                type="text"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="Doleres.Kenne@citrine-mobilite.com"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#1F625E]"
              />
            </div>

            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={isTesting}
              className="w-full py-2.5 px-4 bg-teal-50 text-[#1F625E] hover:bg-teal-100 border border-teal-200 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Envoi du test en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer un E-mail de Test Réel
                </>
              )}
            </button>

            {testResult.status !== 'idle' && (
              <div
                className={`p-3.5 rounded-2xl border text-xs leading-relaxed ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {testResult.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold block">
                      {testResult.status === 'success' ? 'Envoi Réel Réussi' : 'Erreur de transmission'}
                    </span>
                    <p className="mt-0.5">{testResult.message}</p>
                    {testResult.recipients && testResult.recipients.length > 0 && (
                      <p className="mt-1 text-[11px] font-mono text-emerald-800">
                        Destinataires : {testResult.recipients.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-stone-50 p-5 rounded-3xl border border-stone-200/80 space-y-2 text-xs">
            <span className="font-bold text-stone-800 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#1F625E]" />
              Autonomie Complète de l'Entreprise
            </span>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Toutes les modifications saisies ici sont directement enregistrées en base de données. Même sans développeur, les responsables RH peuvent changer le mot de passe, l'expéditeur ou la liste des destinataires à tout moment en toute autonomie.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
