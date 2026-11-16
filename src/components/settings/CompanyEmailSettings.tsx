import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { clientMailService } from '../../services/clientMailService';
import { executeOperationWithLoading } from '../../utils/sweetAlert';
import { SmtpServerFieldsForm, SmtpFormDataState } from './email/SmtpServerFieldsForm';
import { SmtpTestConnectionCard } from './email/SmtpTestConnectionCard';

interface CompanyEmailSettingsProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => Promise<void> | void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyEmailSettings: React.FC<CompanyEmailSettingsProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
  showToast,
}) => {
  const [formData, setFormData] = useState<SmtpFormDataState>({
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
    return () => {
      isMounted = false;
    };
  }, []);

  const parsedHrEmails = formData.hrNotificationEmail
    .split(/[,;\n\r\t]+/)
    .map((e) => e.trim().replace(/^<|>$/g, ''))
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await executeOperationWithLoading({
        loadingTitle: 'Enregistrement SMTP...',
        loadingText: 'Veuillez patienter pendant la mise à jour des paramètres SMTP et RH...',
        action: async () => {
          const saveRes = await clientMailService.saveMailConfig({
            ...formData,
            smtpPort: Number(formData.smtpPort),
          });
          if (!saveRes.success) {
            throw new Error(saveRes.error || 'Échec de la sauvegarde de la configuration e-mail.');
          }
          const updated: CompanyModuleConfig = {
            ...moduleConfig,
            ...formData,
            smtpPort: Number(formData.smtpPort),
          };
          await onUpdateModuleConfig(updated);
          return saveRes;
        },
        successTitle: 'Configuration enregistrée !',
        successMessage: 'Les paramètres SMTP & RH ont été mis à jour avec succès en base de données.',
        errorMessage: 'Erreur lors de la sauvegarde de la configuration SMTP.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEmailNotifications = async () => {
    const nextState = !formData.enableEmailNotifications;
    const res = await executeOperationWithLoading({
      loadingTitle: 'Mise à jour des notifications...',
      loadingText: 'Veuillez patienter pendant la sauvegarde...',
      action: async () => {
        await onUpdateModuleConfig({ ...moduleConfig, enableEmailNotifications: nextState });
      },
      successTitle: nextState ? 'Notifications activées !' : 'Notifications désactivées !',
      successMessage: nextState
        ? 'Les envois automatiques par e-mail sont activés.'
        : 'Les envois automatiques par e-mail sont désactivés.',
    });
    if (res.success) {
      setFormData((prev) => ({ ...prev, enableEmailNotifications: nextState }));
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
        showToast?.('E-mail de test envoyé avec succès !', 'success');
      } else {
        const rawError = res.error || 'Échec de la connexion au serveur SMTP.';
        console.error('❌ [TEST SMTP ÉCHEC] Véritable exception :', { error: rawError, fullResponse: res });
        setTestResult({ status: 'error', message: rawError });
        showToast?.(rawError, 'error');
      }
    } catch (err: any) {
      const rawException = err?.message || String(err);
      console.error('💥 [TEST SMTP EXCEPTION CLIENT]:', err);
      setTestResult({ status: 'error', message: rawException });
      showToast?.(rawException, 'error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
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
              {isLoadingConfig && <RefreshCw className="h-3.5 w-3.5 text-stone-400 animate-spin" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-stone-500">Notifications actives :</span>
          <button
            type="button"
            onClick={handleToggleEmailNotifications}
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

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SmtpServerFieldsForm
          formData={formData}
          setFormData={setFormData}
          parsedHrEmails={parsedHrEmails}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          isSaving={isSaving}
        />

        <SmtpTestConnectionCard
          testRecipient={testRecipient}
          setTestRecipient={setTestRecipient}
          isTesting={isTesting}
          onTestSmtp={handleTestSmtp}
          testResult={testResult}
        />
      </form>
    </div>
  );
};
