import React from 'react';
import { Server, Users, Check, Eye, EyeOff, RefreshCw, CheckCircle2 } from 'lucide-react';

export interface SmtpFormDataState {
  enableEmailNotifications: boolean;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  smtpSenderName: string;
  hrNotificationEmail: string;
}

interface SmtpServerFieldsFormProps {
  formData: SmtpFormDataState;
  setFormData: React.Dispatch<React.SetStateAction<SmtpFormDataState>>;
  parsedHrEmails: string[];
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  isSaving: boolean;
}

export const SmtpServerFieldsForm: React.FC<SmtpServerFieldsFormProps> = ({
  formData,
  setFormData,
  parsedHrEmails,
  showPassword,
  setShowPassword,
  isSaving,
}) => {
  return (
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

      <div className="p-4 rounded-2xl bg-stone-50/80 border border-stone-200 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-stone-800 text-xs flex items-center gap-1.5">
            <Users className="h-4 w-4 text-[#1F625E]" />
            Destinataires des TaskSheets & Notifications RH (HR_NOTIFICATION_EMAIL) *
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
        <p className="text-[11px] text-stone-500">
          Séparez plusieurs adresses par une virgule ou un point-virgule. Toutes ces adresses reçoivent les TaskSheets (manuelles et automatiques) ainsi que les notifications RH.
        </p>

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
  );
};
