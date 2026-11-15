import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { clientMailService } from '../../services/clientMailService';
import { showLoadingAlert, showSuccessAlert, showErrorAlert } from '../../services/sweetAlertService';
import { SmtpServerFieldsForm, SmtpFormDataState } from './email/SmtpServerFieldsForm';
import { SmtpTestConnectionCard } from './email/SmtpTestConnectionCard';

interface CompanyEmailSettingsProps {
  moduleConfig: CompanyModuleConfig;
  onUpdateModuleConfig: (config: CompanyModuleConfig) => void;
  showToast?: (message: string, type?: 'success' | 'error') => void;
}

export const CompanyEmailSettings: React.FC<CompanyEmailSettingsProps> = ({
  moduleConfig,
  onUpdateModuleConfig,
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
    showLoadingAlert({
      title: 'Enregistrement en cours...',
      text: 'Mise à jour des paramètres SMTP et RH sur le serveur...',
    });

    try {
      const saveRes = await clientMailService.saveMailConfig({
        ...formData,
        smtpPort: Number(formData.smtpPort),
      });

      const updated: CompanyModuleConfig = {
        ...moduleConfig,
        ...formData,
        smtpPort: Number(formData.smtpPort),
      };
      onUpdateModuleConfig(updated);

      setIsSaving(false);

      if (saveRes.success) {
        await showSuccessAlert(
          'Configuration enregistrée !',
          'Les paramètres SMTP & RH ont été mis à jour avec succès en base de données.'
        );
      } else {
        await showErrorAlert(
          'Avertissement de sauvegarde',
          'Sauvegardé localement. ' + (saveRes.error || '')
        );
      }
    } catch (err: any) {
      setIsSaving(false);
      await showErrorAlert('Erreur critique', 'Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtp = async () => {
    setIsTesting(true);
    setTestResult({ status: 'idle' });
    showLoadingAlert({
      title: 'Test SMTP en cours...',
      text: "Connexion au serveur de messagerie et envoi de l'e-mail de bonjour du lundi...",
    });

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

      setIsTesting(false);

      if (res.success) {
        console.log('✅ [TEST SMTP SUCCÈS] Réponse du serveur :', res);
        setTestResult({
          status: 'success',
          message: 'Connexion SMTP établie avec succès ! Le message réel de test a été transmis à la boîte de réception.',
          recipients: (res as any).recipients,
        });
        await showSuccessAlert(
          'E-mail de test envoyé avec succès !',
          'Connexion SMTP établie. Le message de bonjour du lundi a bien été transmis à votre boîte.'
        );
      } else {
        const rawError = res.error || 'Échec de la connexion au serveur SMTP.';
        console.error('❌ [TEST SMTP ÉCHEC] Véritable exception :', { error: rawError, fullResponse: res });
        setTestResult({ status: 'error', message: rawError });
        await showErrorAlert('Échec du Test SMTP', rawError);
      }
    } catch (err: any) {
      setIsTesting(false);
      const rawException = err?.message || String(err);
      console.error('💥 [TEST SMTP EXCEPTION CLIENT]:', err);
      setTestResult({ status: 'error', message: rawException });
      await showErrorAlert('Erreur de connexion', rawException);
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
