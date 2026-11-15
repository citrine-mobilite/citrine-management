import React from 'react';
import { Send, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface SmtpTestConnectionCardProps {
  testRecipient: string;
  setTestRecipient: (v: string) => void;
  isTesting: boolean;
  onTestSmtp: () => void;
  testResult: {
    status: 'idle' | 'success' | 'error';
    message?: string;
    recipients?: string[];
  };
}

export const SmtpTestConnectionCard: React.FC<SmtpTestConnectionCardProps> = ({
  testRecipient,
  setTestRecipient,
  isTesting,
  onTestSmtp,
  testResult,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs space-y-4 text-xs">
        <h4 className="font-serif font-bold text-sm text-stone-900 flex items-center gap-2 pb-2 border-b border-stone-100">
          <Send className="h-4 w-4 text-[#1F625E]" />
          Tester l'envoi réel
        </h4>

        <p className="text-stone-500 leading-relaxed">
          Envoie instantanément l'e-mail officiel du lundi matin (modèle « Bon début de semaine » avec illustration Humaans et charte Material Design) pour valider vos paramètres SMTP.
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
          onClick={onTestSmtp}
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
              Envoyer l'E-mail de Bonjour du Lundi (Test)
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
    </div>
  );
};
