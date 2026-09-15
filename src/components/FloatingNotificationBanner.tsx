import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  BellRing,
  Volume2,
  X,
  ExternalLink,
  Eye,
  CheckCheck,
  Calendar,
  BookOpen,
  Megaphone,
  Video,
  FileText
} from 'lucide-react';
import { NotificationItem, User, AppSettings, NavTab } from '../types';
import { StorageManager } from '../utils/storage';
import { playNotificationChime, playWarningChime } from '../utils/soundHelper';

interface FloatingNotificationBannerProps {
  currentUser: User | null;
  settings: AppSettings;
  onNavigate: (tab: NavTab) => void;
}

export const FloatingNotificationBanner: React.FC<FloatingNotificationBannerProps> = ({
  currentUser,
  settings,
  onNavigate
}) => {
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(() =>
    StorageManager.getNotifications()
  );
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [selectedNotifForDetail, setSelectedNotifForDetail] = useState<NotificationItem | null>(null);

  const prevKeysRef = useRef<string>('');
  const isAdmin = currentUser && currentUser.role !== 'JEMAAT';

  // Load and subscribe to notification updates
  const loadNotifications = React.useCallback(() => {
    const list = StorageManager.getNotifications();
    setNotificationsList((prev) =>
      prev.length !== list.length || JSON.stringify(prev) !== JSON.stringify(list) ? list : prev
    );
  }, []);

  useEffect(() => {
    loadNotifications();

    const handleSync = () => {
      loadNotifications();
    };

    const unsubscribe = StorageManager.subscribe(handleSync);
    window.addEventListener('cms_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    const pollInterval = setInterval(loadNotifications, 2000);

    return () => {
      unsubscribe();
      window.removeEventListener('cms_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(pollInterval);
    };
  }, [loadNotifications]);

  // Listen to open detail modal from anywhere (e.g. NavbarHeader)
  useEffect(() => {
    const handleOpenDetail = (e: Event) => {
      const customEvent = e as CustomEvent<NotificationItem>;
      if (customEvent.detail) {
        setSelectedNotifForDetail(customEvent.detail);
      }
    };
    window.addEventListener('open_notification_detail', handleOpenDetail);
    return () => window.removeEventListener('open_notification_detail', handleOpenDetail);
  }, []);

  // Keyboard shortcut Esc to close detail modal
  useEffect(() => {
    if (!selectedNotifForDetail) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNotifForDetail(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNotifForDetail]);

  // Compute active notifications
  const activeNotifs = notificationsList.filter((n) => {
    if (dismissedIds.includes(n.notif_id)) return false;
    if (n.status_baca === 'Sudah') return false;

    // Filter by audience
    if (!currentUser) {
      return n.user_id === 'ALL' || n.tujuan_role === 'ALL' || n.user_id === 'JEMAAT';
    }

    if (n.user_id === 'ALL' || n.tujuan_role === 'ALL') return true;
    if (currentUser.role === 'JEMAAT' && (n.user_id === 'JEMAAT' || n.tujuan_role === 'JEMAAT')) return true;
    if (n.user_id === currentUser.username || n.user_id === currentUser.jemaat_id) return true;
    if (n.user_id && currentUser.nama && n.user_id.toLowerCase().trim() === currentUser.nama.toLowerCase().trim()) return true;
    if (isAdmin) return true;

    return false;
  });

  // Sound chime when new unread notifications arrive
  useEffect(() => {
    const currentKeys = activeNotifs.map((n) => n.notif_id).join(',');
    if (currentKeys && currentKeys !== prevKeysRef.current) {
      const hasWarning = activeNotifs.some((n) => n.tipe === 'Peringatan' || n.tipe === 'Penting');
      try {
        if (hasWarning) {
          playWarningChime();
        } else {
          playNotificationChime();
        }
      } catch (e) {
        // audio might wait for first interaction
      }
      prevKeysRef.current = currentKeys;
    }
  }, [activeNotifs]);

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => [...prev, id]);
    const updated = notificationsList.map((n) =>
      n.notif_id === id ? { ...n, status_baca: 'Sudah' as const } : n
    );
    setNotificationsList(updated);
    StorageManager.saveNotifications(updated);
  };

  const handleDismissAll = (ids: string[]) => {
    setDismissedIds((prev) => [...prev, ...ids]);
    const updated = notificationsList.map((n) =>
      ids.includes(n.notif_id) ? { ...n, status_baca: 'Sudah' as const } : n
    );
    setNotificationsList(updated);
    StorageManager.saveNotifications(updated);
  };

  const handleNavigateToSource = (notif: NotificationItem) => {
    // Mark as read and dismiss from floating view
    handleDismiss(notif.notif_id);
    setSelectedNotifForDetail(null);

    // Determine target tab
    let targetTab: NavTab | null = null;
    if (notif.target_view) {
      targetTab = notif.target_view as NavTab;
    } else if (notif.kategori_sumber) {
      const kat = notif.kategori_sumber.toLowerCase();
      if (kat === 'jadwal') targetTab = 'jadwal';
      else if (kat === 'renungan') targetTab = 'renungan';
      else if (kat === 'pengumuman') targetTab = 'pengumuman';
      else if (kat === 'video') targetTab = 'galeri';
    } else {
      // Fallback check from title
      const lowerJudul = notif.judul.toLowerCase();
      if (lowerJudul.includes('jadwal') || lowerJudul.includes('ibadah') || lowerJudul.includes('event')) {
        targetTab = 'jadwal';
      } else if (lowerJudul.includes('renungan')) {
        targetTab = 'renungan';
      } else if (lowerJudul.includes('pengumuman') || lowerJudul.includes('warta')) {
        targetTab = 'pengumuman';
      } else if (lowerJudul.includes('video') || lowerJudul.includes('tayangan')) {
        targetTab = 'galeri';
      }
    }

    if (targetTab) {
      onNavigate(targetTab);
      // Dispatch event with target id in case target view wants to scroll or highlight
      if (notif.target_id) {
        window.dispatchEvent(
          new CustomEvent('cms_target_item_selected', {
            detail: { tab: targetTab, targetId: notif.target_id }
          })
        );
      }
    }
  };

  // Helper for source category label & icon
  const getSourceMeta = (notif: NotificationItem) => {
    const isWarning = notif.tipe === 'Peringatan';
    const isImportant = notif.tipe === 'Penting';

    let catLabel = 'Pengumuman Gereja';
    let icon = <Megaphone className="w-4 h-4" />;
    let buttonLabel = 'Buka Pengumuman ↗';

    const lowerJudul = (notif.judul || '').toLowerCase();
    const lowerKat = (notif.kategori_sumber || '').toLowerCase();
    const target = (notif.target_view || '').toString().toLowerCase();

    if (lowerKat === 'jadwal' || target === 'jadwal' || target === 'agenda' || lowerJudul.includes('jadwal')) {
      catLabel = 'Jadwal Ibadah';
      icon = <Calendar className="w-4 h-4" />;
      buttonLabel = 'Lihat Jadwal Ibadah ↗';
    } else if (lowerKat === 'renungan' || target === 'renungan' || lowerJudul.includes('renungan')) {
      catLabel = 'Renungan Harian';
      icon = <BookOpen className="w-4 h-4" />;
      buttonLabel = 'Baca Renungan ↗';
    } else if (lowerKat === 'video' || target === 'galeri' || target === 'media' || lowerJudul.includes('video')) {
      catLabel = 'Video Terbaru';
      icon = <Video className="w-4 h-4" />;
      buttonLabel = 'Tonton Video ↗';
    } else if (isWarning) {
      catLabel = 'Peringatan Resmi';
      icon = <AlertTriangle className="w-4 h-4" />;
      buttonLabel = 'Buka Warta ↗';
    } else if (isImportant) {
      catLabel = 'Informasi Penting';
      icon = <ShieldAlert className="w-4 h-4" />;
      buttonLabel = 'Buka Pengumuman ↗';
    }

    return { catLabel, icon, buttonLabel };
  };

  if (settings.show_floating_notifications === false) {
    return null;
  }

  if (activeNotifs.length === 0 && !selectedNotifForDetail) {
    return null;
  }

  const visibleNotifs = activeNotifs.slice(0, 2);

  return (
    <>
      {/* FLOATING NOTIFICATION CARDS AT TOP */}
      {visibleNotifs.length > 0 && (
        <div
          id="floating-notification-container"
          className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 sm:left-auto sm:right-4 sm:translate-x-0 z-[9990] w-[calc(100vw-1.5rem)] sm:w-[410px] max-w-md pointer-events-auto space-y-2.5 animate-slide-down"
        >
          {/* Multi-notification Header Bar */}
          {activeNotifs.length > 1 && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/95 border border-slate-700/80 backdrop-blur-xl text-[11px] shadow-xl text-white">
              <span className="text-slate-300 font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                <span>
                  <strong>{activeNotifs.length}</strong> Notifikasi &amp; Pembaruan Baru
                </span>
              </span>
              <button
                type="button"
                onClick={() => handleDismissAll(activeNotifs.map((n) => n.notif_id))}
                className="text-xs text-indigo-400 hover:text-white font-bold hover:underline cursor-pointer flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tutup Semua ({activeNotifs.length})</span>
              </button>
            </div>
          )}

          {visibleNotifs.map((notif) => {
            const isWarning = notif.tipe === 'Peringatan';
            const isImportant = notif.tipe === 'Penting';
            const { catLabel, icon, buttonLabel } = getSourceMeta(notif);

            return (
              <div
                key={notif.notif_id}
                onClick={() => handleNavigateToSource(notif)}
                className={`group relative overflow-hidden p-3.5 rounded-2xl border-2 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl transition-all cursor-pointer hover:shadow-indigo-500/25 active:scale-[0.99] ${
                  isWarning
                    ? 'bg-slate-950/95 border-rose-500/80 text-rose-100 ring-2 ring-rose-500/20 hover:border-rose-400'
                    : isImportant
                    ? 'bg-slate-950/95 border-purple-500/80 text-purple-100 ring-2 ring-purple-500/20 hover:border-purple-400'
                    : 'bg-slate-950/95 border-indigo-500/80 text-indigo-100 ring-2 ring-indigo-500/20 hover:border-indigo-400'
                }`}
                title="Klik untuk langsung membuka sumber informasi"
              >
                {/* Top Glowing Gradient Accent */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isWarning
                      ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600'
                      : isImportant
                      ? 'bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-600'
                      : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600'
                  }`}
                />

                {/* Header Row */}
                <div className="flex items-start justify-between gap-2.5 relative z-10 pt-1">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
                        isWarning
                          ? 'bg-rose-600 text-white ring-2 ring-rose-400/40'
                          : isImportant
                          ? 'bg-purple-600 text-white ring-2 ring-purple-400/40'
                          : 'bg-indigo-600 text-white ring-2 ring-indigo-400/40'
                      }`}
                    >
                      {icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            isWarning
                              ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                              : isImportant
                              ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                              : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                          }`}
                        >
                          {catLabel}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate">
                          {notif.tanggal}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-extrabold text-white leading-snug line-clamp-1 mt-0.5 group-hover:text-indigo-200 transition-colors">
                        {notif.judul}
                      </h4>
                    </div>
                  </div>

                  {/* Actions Header (Audio Chime + Dismiss X) */}
                  <div className="flex items-center gap-1 shrink-0 relative z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isWarning) playWarningChime();
                        else playNotificationChime();
                      }}
                      className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 transition-all cursor-pointer"
                      title="Bunyikan Suara"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDismiss(notif.notif_id);
                      }}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white transition-all cursor-pointer"
                      title="Tutup Notifikasi"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Body Message Snippet */}
                <div className="mt-2 text-[11px] sm:text-xs text-slate-200 leading-snug bg-black/45 px-3 py-2 rounded-xl border border-white/10 relative z-10 group-hover:bg-black/60 transition-colors">
                  <p className="line-clamp-2">{notif.pesan}</p>

                  {/* Click to Source Action Button */}
                  <div className="mt-2 pt-1.5 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
                    <span className="text-indigo-300 group-hover:text-indigo-200 flex items-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{buttonLabel}</span>
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNotifForDetail(notif);
                      }}
                      className="px-2 py-0.5 rounded-md bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white text-[10px] font-medium transition-colors cursor-pointer flex items-center gap-1"
                      title="Buka teks lengkap"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Rincian</span>
                    </button>
                  </div>
                </div>

                {/* Footer Tag */}
                <div className="mt-1.5 flex items-center justify-between text-[10px] text-slate-400 relative z-10 px-1">
                  <span className="truncate">
                    Oleh: <strong className="text-slate-200">{notif.pengirim || 'Admin Gereja'}</strong>
                  </span>
                  <span className="text-indigo-400 font-semibold group-hover:underline">
                    Klik untuk membuka &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DETAIL NOTIFIKASI PENUH DENGAN TOMBOL NAVIGASI KE SUMBER */}
      {selectedNotifForDetail && (() => {
        const { catLabel, icon, buttonLabel } = getSourceMeta(selectedNotifForDetail);
        const isWarning = selectedNotifForDetail.tipe === 'Peringatan';
        const isImportant = selectedNotifForDetail.tipe === 'Penting';

        return (
          <div
            className="fixed inset-0 z-[100000] flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in"
            onClick={() => setSelectedNotifForDetail(null)}
          >
            <div
              className={`relative w-full max-w-lg sm:max-w-xl rounded-3xl bg-slate-900 border-2 shadow-[0_25px_70px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col max-h-[90vh] text-white ${
                isWarning
                  ? 'border-rose-500/80 shadow-rose-950/50'
                  : isImportant
                  ? 'border-purple-500/80 shadow-purple-950/50'
                  : 'border-indigo-500/80 shadow-indigo-950/50'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Top Accent Line */}
              <div
                className={`h-2 w-full shrink-0 ${
                  isWarning
                    ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600'
                    : isImportant
                    ? 'bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-600'
                    : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600'
                }`}
              />

              {/* Header */}
              <div className="p-5 sm:p-6 pb-4 border-b border-white/10 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                  <div
                    className={`p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
                      isWarning
                        ? 'bg-rose-600 text-white ring-4 ring-rose-500/20'
                        : isImportant
                        ? 'bg-purple-600 text-white ring-4 ring-purple-500/20'
                        : 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                    }`}
                  >
                    {icon}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isWarning
                            ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                            : isImportant
                            ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                            : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/40'
                        }`}
                      >
                        {catLabel}
                      </span>
                      <span className="text-xs text-slate-400">
                        {selectedNotifForDetail.tanggal}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white leading-snug">
                      {selectedNotifForDetail.judul}
                    </h3>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                      <span>
                        Pengirim: <strong className="text-slate-200">{selectedNotifForDetail.pengirim || 'Admin Gereja'}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedNotifForDetail(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-slate-300 hover:text-white transition-all cursor-pointer shrink-0"
                  title="Tutup (Esc)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Message Content */}
              <div className="p-5 sm:p-6 overflow-y-auto max-h-[50vh] space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Isi Notifikasi:</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    (Dapat digulir ke bawah)
                  </span>
                </div>
                <div className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-white/10 text-slate-100 text-sm sm:text-base leading-relaxed whitespace-pre-line select-text font-normal shadow-inner">
                  {selectedNotifForDetail.pesan}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (isWarning) playWarningChime();
                      else playNotificationChime();
                    }}
                    className="px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto"
                    title="Bunyikan Suara"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Bunyikan Suara</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedNotifForDetail(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 font-semibold text-xs sm:text-sm cursor-pointer transition-all flex-1 sm:flex-none text-center"
                  >
                    Tutup
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigateToSource(selectedNotifForDetail)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/40 cursor-pointer transition-all active:scale-95 flex-1 sm:flex-none text-center ring-2 ring-indigo-400/50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>{buttonLabel}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};
