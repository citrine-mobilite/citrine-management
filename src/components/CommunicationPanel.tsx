import React, { useState } from 'react';
import { Send, BellRing, Users, AlertCircle, CheckCircle2, ShieldCheck, Smartphone, Info } from 'lucide-react';
import { Employee, Role } from '../types';
import { motion } from 'motion/react';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface CommunicationPanelProps {
  employees: Employee[];
  currentRole: Role;
  onAddNotification?: (type: 'whatsapp' | 'email' | 'system', title: string, content: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function CommunicationPanel({ employees, currentRole, onAddNotification, showToast }: CommunicationPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string>('all');
  const [priority, setPriority] = useState<'normal' | 'urgent' | 'convocation'>('normal');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);

  const { sendPushNotification, permission } = usePushNotifications();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSending(true);
    setSendSuccess(null);

    try {
      const targetName = selectedTarget === 'all' 
        ? "Tous les collaborateurs (Diffusion générale)" 
        : employees.find(emp => emp.id === selectedTarget)?.name || "Collaborateur";

      const priorityPrefix = priority === 'urgent' 
        ? "🚨 [URGENT] " 
        : priority === 'convocation' 
        ? "📋 [CONVOCATION RH] " 
        : "📢 ";

      const fullTitle = `${priorityPrefix}${subject.trim() || 'Communication Interne'}`;
      const fullContent = `${message.trim()} (Destinataire: ${targetName})`;

      // 1. Log in internal notification system
      if (onAddNotification) {
        onAddNotification('system', fullTitle, fullContent);
      }

      // 2. Trigger native push notification via Service Worker
      sendPushNotification({
        title: fullTitle,
        body: message.trim(),
        icon: '/pwa-192x192.png',
        tag: `comm-${Date.now()}`
      });

      const successMsg = `Message diffusé avec succès à : ${targetName}`;
      setSendSuccess(successMsg);
      if (showToast) showToast(successMsg, 'success');

      setSubject('');
      setMessage('');
    } catch (err: any) {
      if (showToast) showToast(err?.message || "Erreur lors de l'envoi", "error");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-stone-900 flex items-center gap-2">
            <Send className="h-5 w-5 text-emerald-600" />
            Communications Internes & Diffusion Directe
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Summary & Quick Guidelines */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-stone-200 space-y-4">
            <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Canaux d'Acheminement
            </h3>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
              <BellRing className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">Notifications Push Mobiles</h4>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  Envoyées via le Service Worker sur smartphones (Android & iOS) et ordinateurs de bureau.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-stone-900">Registre d'Audit Système</h4>
                <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
                  Chaque diffusion est horodatée et archivée dans le journal des alertes de l'entreprise.
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-700" />
                Transmission Locale & Indépendante
              </p>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed">
                Aucune dépendance externe requise (pas de clés d'API tierces ni de frais de messagerie).
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Message Form */}
        <div className="lg:col-span-2">
          <motion.div 
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl shadow-xs border border-stone-200 space-y-5"
          >
            {sendSuccess && (
              <div className="p-4 rounded-xl flex items-start gap-3 text-xs bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-bold">{sendSuccess}</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Le message a été distribué sur les terminaux ciblés.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSend} className="space-y-4">
              {/* Target & Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Destinataire(s)
                  </label>
                  <select
                    value={selectedTarget}
                    onChange={(e) => setSelectedTarget(e.target.value)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                  >
                    <option value="all">📢 Tous les collaborateurs (Diffusion générale)</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        👤 {emp.name} — {emp.roleType} ({emp.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                    Niveau d'Urgence
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                  >
                    <option value="normal">Standard (Information interne)</option>
                    <option value="urgent">🚨 Urgent (Avis immédiat)</option>
                    <option value="convocation">📋 Convocation Administrative / RH</option>
                  </select>
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Objet du Message
                </label>
                <input
                  type="text"
                  placeholder="Ex : Réunion d'équipe, Note de service, Ajustement d'horaires..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3.5 py-2.5 text-xs text-stone-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1.5">
                  Corps du Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Rédigez votre message à l'attention de l'équipe..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-800 focus:bg-white focus:border-emerald-500 focus:outline-hidden transition resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-stone-400">
                  {message.length} caractère(s)
                </span>

                <button
                  type="submit"
                  disabled={isSending || !message.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSending ? "Diffusion en cours..." : "Diffuser le Message"}</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
