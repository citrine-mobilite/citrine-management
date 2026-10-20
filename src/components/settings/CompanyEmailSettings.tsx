import React, { useState } from 'react';
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
  Info
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
    smtpPort: moduleConfig.smtpPort || 465,
    smtpSecure: moduleConfig.smtpSecure !== false,
    smtpUser: moduleConfig.smtpUser || '',
    smtpPass: moduleConfig.smtpPass || '',
    smtpFrom: moduleConfig.smtpFrom || 'Citrine SARL RH <info@citrine-mobilite.com>',
    hrNotificationEmail: moduleConfig.hrNotificationEmail || 'info@citrine-mobilite.com',
  });

  const [testRecipient, setTestRecipient] = useState(
    moduleConfig.hrNotificationEmail || moduleConfig.smtpUser || 'direction@citrine-mobilite.com'
  );
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    status: 'idle' | 'success' | 'error';
    message?: string;
    simulated?: boolean;
  }>({ status: 'idle' });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanyModuleConfig = {
      ...moduleConfig,
      ...formData,
    };
    onUpdateModuleConfig(updated);
    if (showToast) {
      showToast('Configuration E-mail & SMTP enregistrée avec succès.', 'success');
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
        testRecipient
      );

      if (res.success) {
        setTestResult({
          status: 'success',
          simulated: res.simulated,
          message: res.simulated
            ? 'Test simulé avec succès en local (aucun serveur SMTP configuré : les identifiants SMTP doivent être renseignés ci-dessus pour un envoi réel direct).'
            : 'Connexion SMTP établie avec succès ! Le message de test a été envoyé et rattaché au fil de test.',
        });
        if (showToast) {
          showToast(res.simulated ? 'Test validé en mode simulation.' : 'E-mail de test envoyé avec succès !', 'success');
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
          <div className="p-2.5 bg-emerald-50 text-[#2A7B76] rounded-2xl border border-emerald-100">
            <Mail className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-serif font-bold text-base text-stone-900">
              Serveur E-mail & Threading par Collaborateur
            </h3>
            <p className="text-xs text-stone-500">
              Envoi d'e-mails professionnels gratuits via votre compte SMTP propre avec groupement automatique en fils de discussion.
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
                ? 'bg-emerald-600 text-white shadow-xs' 
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
            }`}
          >
            {formData.enableEmailNotifications ? 'Activées' : 'Désactivées'}
          </button>
        </div>
      </div>

      {/* Explication du Threading unique */}
      <div className="bg-gradient-to-r from-emerald-50/60 via-stone-50 to-emerald-50/40 p-4 rounded-3xl border border-emerald-100 flex items-start gap-3">
        <div className="p-2 bg-emerald-100/70 text-emerald-800 rounded-xl shrink-0">
          <Layers className="h-4 w-4" />
        </div>
        <div className="space-y-1 text-xs">
          <h4 className="font-bold text-emerald-900">
            Principe des Fils de Discussion Unifiés (Threading RH)
          </h4>
          <p className="text-stone-600 leading-relaxed">
            Pour chaque collaborateur, l'application génère un objet fixe <code>[Citrine RH] Collaborateur : &lt;Nom&gt;</code> ainsi que des en-têtes RFC <code>In-Reply-To</code> et <code>References</code> persistants.
            Dans Gmail ou Outlook, le manager dispose d'<strong>une seule conversation chronologique par employé</strong> regroupant ses missions, validations de congés et alertes, sans jamais encombrer la boîte de réception avec des e-mails épars.
          </p>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne Paramètres SMTP */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2">
              <Server className="h-4 w-4 text-[#2A7B76]" />
              Paramètres du Serveur SMTP de l'Entreprise (0 FCFA)
            </h4>
            <span className="text-[10px] text-stone-400 font-mono">Protocole Nodemailer</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-stone-700">Hôte Serveur SMTP (Host) *</label>
              <input
                type="text"
                value={formData.smtpHost}
                onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                placeholder="ex: mail.citrine-mobilite.com ou smtp.gmail.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Port SMTP *</label>
              <input
                type="number"
                value={formData.smtpPort}
                onChange={(e) => setFormData({ ...formData, smtpPort: Number(e.target.value) })}
                placeholder="465 ou 587"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Utilisateur / Adresse Mail Pro *</label>
              <input
                type="text"
                value={formData.smtpUser}
                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                placeholder="ex: rh@citrine-mobilite.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Mot de Passe ou Mot de passe d'Application *</label>
              <input
                type="password"
                value={formData.smtpPass}
                onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Nom & Adresse Expéditeur (Header From) *</label>
              <input
                type="text"
                value={formData.smtpFrom}
                onChange={(e) => setFormData({ ...formData, smtpFrom: e.target.value })}
                placeholder='Citrine SARL RH <rh@citrine-mobilite.com>'
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">E-mail de la Direction RH (Copie par défaut)</label>
              <input
                type="email"
                value={formData.hrNotificationEmail}
                onChange={(e) => setFormData({ ...formData, hrNotificationEmail: e.target.value })}
                placeholder="direction@citrine-mobilite.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="smtpSecureCheckbox"
              checked={formData.smtpSecure}
              onChange={(e) => setFormData({ ...formData, smtpSecure: e.target.checked })}
              className="h-4 w-4 rounded border-stone-300 text-[#2A7B76] focus:ring-[#2A7B76]"
            />
            <label htmlFor="smtpSecureCheckbox" className="text-xs text-stone-700 font-medium cursor-pointer">
              Connexion sécurisée SSL/TLS (activé par défaut sur port 465)
            </label>
          </div>

          <div className="pt-3 border-t border-stone-100 flex items-center justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#2A7B76] hover:bg-[#20635F] text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <CheckCircle2 className="h-4 w-4" />
              Enregistrer la Configuration SMTP
            </button>
          </div>
        </div>

        {/* Colonne Test de Connexion & Diagnostics */}
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4 text-xs">
            <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
              <Send className="h-4 w-4 text-[#2A7B76]" />
              Tester la délivrabilité & le fil
            </h4>

            <p className="text-stone-500 leading-relaxed">
              Envoyez un e-mail d'essai immédiat pour vérifier la liaison SMTP et vous assurer que votre client de messagerie (Gmail/Outlook) regroupe bien les messages.
            </p>

            <div className="space-y-1.5">
              <label className="font-bold text-stone-700">Adresse de réception du test :</label>
              <input
                type="email"
                value={testRecipient}
                onChange={(e) => setTestRecipient(e.target.value)}
                placeholder="votre-email@exemple.com"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-stone-900 text-xs outline-none focus:ring-2 focus:ring-[#2A7B76]"
              />
            </div>

            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={isTesting}
              className="w-full py-2.5 px-4 bg-emerald-50 text-[#2A7B76] hover:bg-emerald-100 border border-emerald-200 rounded-xl font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Envoyer un E-mail de Test
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
                      {testResult.status === 'success' ? 'Résultat du test' : 'Erreur de transmission'}
                    </span>
                    <p className="mt-0.5">{testResult.message}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-stone-50 p-5 rounded-3xl border border-stone-200/80 space-y-2 text-xs">
            <span className="font-bold text-stone-800 flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#2A7B76]" />
              Zéro Frais d'Abonnement
            </span>
            <p className="text-stone-500 text-[11px] leading-relaxed">
              Ce système utilise la connexion SMTP native de votre boîte mail d'entreprise. Vous n'avez aucun compte payant ni carte bancaire à fournir pour l'envoi des notifications.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
