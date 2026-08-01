import React, { useState } from 'react';
import { MessageCircle, Mail, PhoneCall, X, Send, Sparkles, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';
import { SuperAdminContact } from '../types';
import { StorageManager } from '../utils/storage';

interface SuperAdminChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  churchName?: string;
}

export const SuperAdminChatModal: React.FC<SuperAdminChatModalProps> = ({
  isOpen,
  onClose,
  churchName
}) => {
  const contact: SuperAdminContact = StorageManager.getSuperAdminContact();
  const currentChurch = churchName || StorageManager.getSettings().nama_gereja || 'Gereja Pembeli';

  const [messageInput, setMessageInput] = useState('');
  const [isSent, setIsSent] = useState(false);

  if (!isOpen) return null;

  const handleSendDirectMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim()) return;

    // Log activity / prayer request as support ticket
    const currentUser = StorageManager.getCurrentUser();
    StorageManager.logActivity(
      currentUser ? currentUser.username : 'User',
      `Pesan Support SuperAdmin: "${messageInput.substring(0, 50)}..."`,
      'Support'
    );

    setIsSent(true);
    setTimeout(() => {
      setIsSent(false);
      setMessageInput('');
      onClose();
    }, 2000);
  };

  const getWaUrl = () => {
    const waNum = contact.wa ? contact.wa.replace(/\D/g, '') : '6281234567890';
    const text = encodeURIComponent(`Halo SuperAdmin, saya dari ${currentChurch}.\n\nPesan/Bantuan: ${messageInput || 'Mohon bantuan mengenai aplikasi / lisensi gereja kami.'}`);
    return `https://wa.me/${waNum}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in text-white">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageCircle className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-1.5">
                <span>Hubungi SuperAdmin &amp; Support</span>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </h3>
              <p className="text-[11px] text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-400" />
                <span>{currentChurch}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Alert */}
        {isSent && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Pesan Anda berhasil dikirim langsung ke SuperAdmin! Tim support akan merespon segera.</span>
          </div>
        )}

        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={getWaUrl()}
            target="_blank"
            rel="noreferrer"
            className="p-3.5 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 flex items-center gap-2.5 transition-all cursor-pointer group active:scale-95"
          >
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <MessageCircle className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-white">WhatsApp Direct</div>
              <div className="text-[10px] text-emerald-400 font-mono">+{contact.wa || '6281234567890'}</div>
            </div>
          </a>

          <a
            href={`mailto:${contact.email || 'superadmin@gkfc-cms.org'}?subject=Dukungan%20Aplikasi%20Gereja%20${encodeURIComponent(currentChurch)}`}
            className="p-3.5 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 flex items-center gap-2.5 transition-all cursor-pointer group active:scale-95"
          >
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-xs font-black text-white">Email SuperAdmin</div>
              <div className="text-[10px] text-indigo-300 font-mono truncate max-w-[120px]">{contact.email}</div>
            </div>
          </a>
        </div>

        {/* Direct Text Form */}
        <form onSubmit={handleSendDirectMessage} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Tulis Pesan / Pertanyaan / Tagihan Lisensi:
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Respon Cepat 24/7</span>
            </label>
            <textarea
              rows={3}
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Contoh: Halo SuperAdmin, mohon konfirmasi perpanjangan masa berlaku lisensi aplikasi gereja kami..."
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              required
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-400">
              Penanggung Jawab: <span className="font-bold text-slate-200">{contact.nama}</span>
            </div>

            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-white font-extrabold text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Kirim Pesan Direct</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
