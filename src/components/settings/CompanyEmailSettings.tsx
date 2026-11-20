import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { CompanyModuleConfig } from '../../types';
import { clientMailService } from '../../services/clientMailService';
import { parseRecipientEmailList } from '../../utils/taskSheetRecipientsHelper';
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
  const [isToggling, setIsToggling] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
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
          const resolvedHrEmail = cfg.hrNotificationEmail || moduleConfig.hrNotificationEmail || 'Doleres.Kenne@citrine-mobilite.com';
          setFormData((prev) => ({
            ...prev,
            enableEmailNotifications:
              cfg.enableEmailNotifications !== undefined
                ? Boolean(cfg.enableEmailNotifications)
                : prev.enableEmailNotifications,
            smtpHost: cfg.smtpHost || prev.smtpHost || 'smtp.gmail.com',
            smtpPort: cfg.smtpPort || prev.smtpPort || 587,
            smtpSecure: cfg.smtpSecure !== undefined ? Boolean(cfg.smtpSecure) : prev.smtpSecure,
            smtpUser: cfg.smtpUser || prev.smtpUser,
            smtpPass: cfg.smtpPass || prev.smtpPass,
            smtpFrom: cfg.smtpFrom || prev.smtpFrom,
            smtpSenderName: cfg.smtpSenderName || prev.smtpSenderName || 'Landry Moutongo',
            hrNotificationEmail: resolvedHrEmail,
          }));

          setTestRecipient((prevRecipient) => {
            if (prevRecipient) return prevRecipient;
            const firstEmail = parseRecipientEmailList(resolvedHrEmail)[0];
            return firstEmail || '';
          });
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

  const parsedHrEmails = parseRecipientEmailList(formData.hrNotificationEmail);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    setIsSaving(true);
    setSaveFeedback(null);
    try {
      const payload = {
        ...formData,
        smtpPort: Number(formData.smtpPort),
      };
      const saveRes = await clientMailService.saveMailConfig(payload);
      if (!saveRes.success) {
        throw new Error(saveRes.error || 'Échec de la sauvegarde de la configuration e-mail.');
      }
      const updated: CompanyModuleConfig = {
        ...moduleConfig,
        ...payload,
      };
      await onUpdateModuleConfig(updated);
      const okMsg = 'Les destinataires TaskSheets & paramètres SMTP ont été mis à jour en base de données.';
      setSaveFeedback({ type: 'success', message: okMsg });
      showToast?.(okMsg, 'success');
    } catch (err: any) {
      const errMsg = err?.message || 'Erreur lors de la sauvegarde de la configuration SMTP.';
      setSaveFeedback({ type: 'error', message: errMsg });
      showToast?.(errMsg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEmailNotifications = async () => {
    if (isToggling) return;
    const nextState = !formData.enableEmailNotifications;
    setIsToggling(true);
    setSaveFeedback(null);
    try {
      const saveRes = await clientMailService.saveMailConfig({
        ...formData,
        enableEmailNotifications: nextState,
        smtpPort: Number(formData.smtpPort),
      });
      if (!saveRes.success) {
        throw new Error(saveRes.error || 'Impossible de mettre à jour les notifications.');
      }
      await onUpdateModuleConfig({ ...moduleConfig, enableEmailNotifications: nextState });
      setFormData((prev) => ({ ...prev, enableEmailNotifications: nextState }));
      showToast?.(
        nextState
          ? 'Les envois automatiques par e-mail sont activés.'
          : 'Les envois automatiques par e-mail sont désactivés.',
        'success'
      );
    } catch (err: any) {
      showToast?.(err?.message || 'Erreur lors de la mise à jour des notifications.', 'error');
    } finally {
      setIsToggling(false);
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
                Serveur E-mail & Destinataires (TaskSheets & RH)
              </h3>
              {isLoadingConfig && <RefreshCw className="h-3.5 w-3.5 text-stone-400 animate-spin" />}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Liste des destinataires recevant les TaskSheets (manuelles et automatiques), alertes RH et paramètres SMTP.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-stone-500">Notifications actives :</span>
          <button
            type="button"
            disabled={isToggling}
            onClick={handleToggleEmailNotifications}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-60 ${
              formData.enableEmailNotifications
                ? 'bg-[#1F625E] text-white shadow-xs'
                : 'bg-stone-200 text-stone-600 hover:bg-stone-300'
            }`}
          >
            {isToggling ? 'Mise à jour...' : formData.enableEmailNotifications ? 'Activées' : 'Désactivées'}
          </button>
        </div>
      </div>

      {saveFeedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 ${
            saveFeedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {saveFeedback.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{saveFeedback.message}</span>
        </div>
      )}

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
