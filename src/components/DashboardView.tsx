import React, { useEffect, useState } from 'react';
import {
  User,
  AppSettings,
  Jemaat,
  Persembahan,
  EventSchedule,
  ActivityLog,
  Renungan,
  Pengumuman,
  PrayerRequest,
  NotificationItem,
  FeaturedVideo,
  GalleryItem,
  Doa
} from '../types';
import { StorageManager } from '../utils/storage';
import { parseSocialVideoUrl } from '../utils/videoHelper';
import { DEFAULT_CHURCH_LOGO } from '../data/initialData';
import { playNotificationChime, playWarningChime } from '../utils/soundHelper';
import {
  Users,
  DollarSign,
  Calendar,
  Activity,
  PlusCircle,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  Megaphone,
  Download,
  Building2,
  HeartHandshake,
  Tv,
  Palette,
  Settings2,
  X,
  Check,
  ExternalLink,
  Sparkles,
  BookOpen,
  Heart,
  Send,
  Video,
  Play,
  ShieldAlert,
  ChevronRight,
  RotateCw,
  LogOut,
  AlertTriangle,
  Home,
  Wallet,
  Upload,
  Image as ImageIcon,
  BellRing,
  CheckCheck,
  Bell,
  Trash2,
  Volume2
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardViewProps {
  currentUser: User;
  settings: AppSettings;
  onNavigate: (tab: any) => void;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onLogout?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  settings,
  onNavigate,
  onUpdateSettings,
  onLogout
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN' || isSuperAdmin;
  const isJemaat = currentUser.role === 'JEMAAT';

  // Refresh & Toast State
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshToast, setRefreshToast] = useState('');

  // Data state
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [persembahanList, setPersembahanList] = useState<Persembahan[]>([]);
  const [eventsList, setEventsList] = useState<EventSchedule[]>([]);
  const [renunganList, setRenunganList] = useState<Renungan[]>([]);
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>([]);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('');

  // Prayer Request Form State
  const [prayerText, setPrayerText] = useState('');
  const [prayerTopic, setPrayerTopic] = useState('Kesehatan');
  const [prayerSubmitted, setPrayerSubmitted] = useState(false);

  // Quick Customizer Modal State
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customForm, setCustomForm] = useState<AppSettings>(settings);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Notifications State
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const [isCreateNotifModalOpen, setIsCreateNotifModalOpen] = useState(false);
  const [newNotifForm, setNewNotifForm] = useState({
    judul: '',
    pesan: '',
    tipe: 'Peringatan' as 'Peringatan' | 'Informasi' | 'Penting',
    tujuan_role: 'ALL'
  });

  const prevNotifKeysRef = React.useRef<string>('');

  useEffect(() => {
    loadDashboardData();

    const handleSync = () => {
      loadDashboardData();
    };

    const unsubscribe = StorageManager.subscribe(handleSync);
    window.addEventListener('cms_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    // Fast polling interval for zero-delay realtime UI synchronization across tabs
    const intervalId = setInterval(() => {
      loadDashboardData();
    }, 500);

    return () => {
      unsubscribe();
      window.removeEventListener('cms_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(intervalId);
    };
  }, []);

  // Automatic Audio Chime trigger when new notifications or warning alerts arrive
  useEffect(() => {
    const activeNotifs = notificationsList.filter(
      (n) =>
        !dismissedNotifIds.includes(n.notif_id) &&
        (n.user_id === 'ALL' ||
          n.user_id === 'JEMAAT' ||
          n.user_id === currentUser.username ||
          n.user_id === currentUser.jemaat_id ||
          n.tujuan_role === 'ALL' ||
          n.tujuan_role === 'JEMAAT' ||
          isAdmin)
    );

    const currentKeys = activeNotifs.map((n) => n.notif_id).join(',');
    if (currentKeys && currentKeys !== prevNotifKeysRef.current) {
      const hasWarning = activeNotifs.some((n) => n.tipe === 'Peringatan' || n.tipe === 'Penting');
      if (hasWarning) {
        playWarningChime();
      } else {
        playNotificationChime();
      }
      prevNotifKeysRef.current = currentKeys;
    }
  }, [notificationsList, dismissedNotifIds, currentUser, isAdmin]);

  useEffect(() => {
    setCustomForm(settings);
  }, [settings]);

  const loadDashboardData = React.useCallback(() => {
    const j = StorageManager.getJemaat();
    setJemaatList((prev) => (prev.length !== j.length || JSON.stringify(prev) !== JSON.stringify(j) ? j : prev));
    const p = StorageManager.getPersembahan();
    setPersembahanList((prev) => (prev.length !== p.length || JSON.stringify(prev) !== JSON.stringify(p) ? p : prev));
    const e = StorageManager.getEvents();
    setEventsList((prev) => (prev.length !== e.length || JSON.stringify(prev) !== JSON.stringify(e) ? e : prev));
    const r = StorageManager.getRenungan();
    setRenunganList((prev) => (prev.length !== r.length || JSON.stringify(prev) !== JSON.stringify(r) ? r : prev));
    const pg = StorageManager.getPengumuman();
    setPengumumanList((prev) => (prev.length !== pg.length || JSON.stringify(prev) !== JSON.stringify(pg) ? pg : prev));
    const pr = StorageManager.getPrayerRequests();
    setPrayerRequests((prev) => (prev.length !== pr.length || JSON.stringify(prev) !== JSON.stringify(pr) ? pr : prev));
    const al = StorageManager.getActivityLogs();
    setActivityLogs((prev) => (prev.length !== al.length || JSON.stringify(prev) !== JSON.stringify(al) ? al : prev));
    const n = StorageManager.getNotifications();
    setNotificationsList((prev) => (prev.length !== n.length || JSON.stringify(prev) !== JSON.stringify(n) ? n : prev));
    const fv = StorageManager.getFeaturedVideos();
    setFeaturedVideos((prev) => (prev.length !== fv.length || JSON.stringify(prev) !== JSON.stringify(fv) ? fv : prev));
    const g = StorageManager.getGallery();
    setGalleryList((prev) => (prev.length !== g.length || JSON.stringify(prev) !== JSON.stringify(g) ? g : prev));
  }, []);

  const handleSaveNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNotifForm.judul.trim() || !newNotifForm.pesan.trim()) return;

    const newNotif: NotificationItem = {
      notif_id: `NTF-${Date.now().toString().slice(-4)}`,
      user_id: newNotifForm.tujuan_role === 'ALL' ? 'ALL' : newNotifForm.tujuan_role,
      judul: newNotifForm.judul,
      pesan: newNotifForm.pesan,
      status_baca: 'Belum',
      tanggal: new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }),
      tipe: newNotifForm.tipe,
      pengirim: currentUser.nama || (isSuperAdmin ? 'Super Admin' : 'Admin Sekretariat'),
      is_pinned: true,
      tujuan_role: newNotifForm.tujuan_role
    };

    const updated = [newNotif, ...notificationsList];
    setNotificationsList(updated);
    StorageManager.saveNotifications(updated);
    StorageManager.logActivity(
      currentUser.username,
      `Membuat notifikasi / peringatan: "${newNotif.judul}"`,
      'Notifikasi'
    );

    window.dispatchEvent(new Event('cms_data_changed'));

    setIsCreateNotifModalOpen(false);
    setNewNotifForm({
      judul: '',
      pesan: '',
      tipe: 'Peringatan',
      tujuan_role: 'ALL'
    });
    setRefreshToast('Notifikasi / Peringatan berhasil dibuat dan dikirim ke Dashboard Jemaat!');
    setTimeout(() => setRefreshToast(''), 4000);
  };

  const handleDismissNotification = (id: string) => {
    setDismissedNotifIds((prev) => [...prev, id]);
    const updated = notificationsList.map((n) => (n.notif_id === id ? { ...n, status_baca: 'Sudah' as const } : n));
    setNotificationsList(updated);
    StorageManager.saveNotifications(updated);
    window.dispatchEvent(new Event('cms_data_changed'));
  };

  const handleDeleteNotification = (id: string) => {
    if (!window.confirm('Hapus notifikasi ini dari sistem?')) return;
    const updated = notificationsList.filter((n) => n.notif_id !== id);
    setNotificationsList(updated);
    StorageManager.saveNotifications(updated);
    StorageManager.logActivity(currentUser.username, `Menghapus notifikasi ID ${id}`, 'Notifikasi');
    window.dispatchEvent(new Event('cms_data_changed'));
  };

  const handleRefreshData = () => {
    setIsRefreshing(true);
    setRefreshToast('Memuat ulang seluruh data sistem & dashboard...');
    loadDashboardData();
    setTimeout(() => {
      window.location.reload();
    }, 250);
  };

  const totalJemaat = jemaatList.length;
  const totalLaki = jemaatList.filter((j) => j.jenis_kelamin === 'Laki-laki').length;
  const totalPerempuan = jemaatList.filter((j) => j.jenis_kelamin === 'Perempuan').length;
  const totalPersembahan = persembahanList.reduce((acc, curr) => acc + (curr.jumlah || 0), 0);
  const totalKeluarga = StorageManager.getKeluarga().length;

  // Single Latest Updates for Jemaat Focus Mode
  const latestRenungan = renunganList.length > 0 ? renunganList[0] : null;
  const latestPengumuman = pengumumanList.length > 0 ? pengumumanList[0] : null;
  const latestEvent = eventsList.length > 0 ? eventsList[0] : null;

  // Parsed Video Social Link (Priority: active selected video > featured video galeri > settings URL)
  const activeFeaturedVideo = featuredVideos.find((v) => v.is_active) || featuredVideos[0];
  const currentVideoUrl = activeVideoUrl || activeFeaturedVideo?.video_url || settings.video_url || '';
  const parsedVideo = parseSocialVideoUrl(currentVideoUrl);

  // Submit Jemaat Prayer Request
  const handleSubmitPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerText.trim()) return;

    const newPrayer: PrayerRequest = {
      prayer_id: `DOA-${Date.now()}`,
      jemaat_name: currentUser.nama,
      topik: prayerTopic,
      permohonan: prayerText,
      tanggal: new Date().toISOString().split('T')[0],
      status: 'Diterima',
      is_private: true
    };

    const updated = [newPrayer, ...prayerRequests];
    StorageManager.savePrayerRequests(updated);
    setPrayerRequests(updated);

    // Sync to Doa array so it appears in the Agenda / Permohonan Doa menu tab!
    const newDoa: Doa = {
      doa_id: `DOA-2026-${Date.now().toString().slice(-4)}`,
      nama_pemohon: currentUser.nama || 'Jemaat Mandiri',
      kategori: prayerTopic,
      isi_permohonan: prayerText,
      tanggal: new Date().toISOString().slice(0, 10),
      status: 'Proses Doa'
    };
    const currentDoaList = StorageManager.getDoa();
    StorageManager.saveDoa([newDoa, ...currentDoaList]);

    // Add activity log
    StorageManager.logActivity(
      currentUser.nama,
      `Mengirim permohonan doa (${prayerTopic})`,
      'Permohonan Doa'
    );

    window.dispatchEvent(new Event('cms_data_changed'));

    setPrayerText('');
    setPrayerSubmitted(true);
    setTimeout(() => setPrayerSubmitted(false), 4000);
  };

  // Quick Save Customizer Settings
  const handleSaveCustomizer = (e: React.FormEvent) => {
    e.preventDefault();
    StorageManager.saveSettings(customForm);
    if (onUpdateSettings) {
      onUpdateSettings(customForm);
    }
    setSaveSuccessMsg(true);
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setIsCustomizerOpen(false);
    }, 1200);
  };

  // Dynamic Theme Preset Style Classes
  const getCardStyleClass = () => {
    const cardStyle = settings.card_style || 'GLASS';
    switch (cardStyle) {
      case 'SOLID':
        return 'bg-slate-900 border border-slate-800 shadow-xl';
      case 'NEON':
        return 'bg-slate-900/90 border border-indigo-500/40 shadow-lg shadow-indigo-500/10 backdrop-blur-xl';
      case 'FLAT':
        return 'bg-slate-900/60 border border-slate-700/60 shadow-none';
      case 'GLASS':
      default:
        return 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';
    }
  };

  const cardStyleClass = getCardStyleClass();

  // Chart Data: Financial trend
  const financialChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Juli'],
    datasets: [
      {
        fill: true,
        label: 'Persembahan Minggu & Perpuluhan (Rp)',
        data: [42000000, 48500000, 51000000, 62000000, 58000000, 71000000, totalPersembahan],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        tension: 0.4
      }
    ]
  };

  const financialChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `Rp ${context.raw.toLocaleString('id-ID')}`
        }
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: 'rgba(148, 163, 184, 0.1)' }, ticks: { color: '#94a3b8' } }
    }
  };

  // Doughnut Chart Data: Wilayah Distribution
  const wilayahCount: { [key: string]: number } = {};
  jemaatList.forEach((j) => {
    const w = j.wilayah || 'Lainnya';
    wilayahCount[w] = (wilayahCount[w] || 0) + 1;
  });

  const wilayahChartData = {
    labels: Object.keys(wilayahCount),
    datasets: [
      {
        data: Object.values(wilayahCount),
        backgroundColor: ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Card Banner with Dynamic Custom Header */}
      <div className={`relative rounded-3xl ${cardStyleClass} p-6 sm:p-8 overflow-hidden text-white`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  currentUser.jemaat_id
                    ? jemaatList.find((j) => j.jemaat_id === currentUser.jemaat_id)?.foto ||
                      settings.logo || DEFAULT_CHURCH_LOGO
                    : settings.logo || DEFAULT_CHURCH_LOGO
                }
                alt="Logo/Avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
                }}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-lg shadow-indigo-500/20 bg-slate-900"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-[#0f172a]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Role: {currentUser.role}
                </span>
                <span className="text-xs text-slate-400">Live Portal</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight mt-1 text-white">
                Shalom, {currentUser.nama}!
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5">
                {settings.header_title || settings.nama_gereja} &bull;{' '}
                <span className="text-slate-400">{settings.header_subtitle || 'Portal Informasi Utama'}</span>
              </p>
            </div>
          </div>

          {/* Action & Customizer Buttons Header */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Refresh Data untuk Semua User */}
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/40 flex items-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer"
              title="Refresh Data Dashboard"
            >
              <RotateCw className={`w-4 h-4 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Memuat...' : 'Refresh Data'}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setIsCreateNotifModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center gap-2 transition-all cursor-pointer"
                  title="Buat Notifikasi atau Peringatan Resmi untuk Jemaat"
                >
                  <BellRing className="w-4 h-4 text-amber-200" />
                  <span>Buat Notifikasi / Peringatan</span>
                </button>

                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Palette className="w-4 h-4" />
                  <span>Custom Tampilan & Video</span>
                </button>
              </>
            )}

            {settings.show_quick_actions !== false && !isJemaat && (
              <>
                <button
                  onClick={() => onNavigate('jemaat')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Tambah Jemaat</span>
                </button>
                <button
                  onClick={() => onNavigate('keuangan')}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Persembahan</span>
                </button>
              </>
            )}

            <button
              onClick={() => onNavigate('laporan')}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Cetak Laporan</span>
            </button>

          </div>
        </div>

        {/* Refresh Notification Toast Banner */}
        {refreshToast && (
          <div className="mt-4 p-3 bg-indigo-500/20 border border-indigo-500/40 text-indigo-200 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 animate-fade-in shadow-lg">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{refreshToast}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Live Sync Done</span>
          </div>
        )}
      </div>

      {/* KARTU NOTIFIKASI MENGAMBANG DI ATAS LAYAR (FLOATING OVERLAY TOP NOTIFICATION) DENGAN BUNYI SUARA */}
      {(() => {
        const activeNotifs = notificationsList.filter(
          (n) =>
            !dismissedNotifIds.includes(n.notif_id) &&
            (n.user_id === 'ALL' ||
              n.user_id === 'JEMAAT' ||
              n.user_id === currentUser.username ||
              n.user_id === currentUser.jemaat_id ||
              n.tujuan_role === 'ALL' ||
              n.tujuan_role === 'JEMAAT' ||
              isAdmin)
        );

        if (activeNotifs.length === 0) return null;

        return (
          <div className="fixed top-4 sm:top-6 left-1/2 -translate-x-1/2 z-[999] w-[94vw] max-w-2xl pointer-events-auto space-y-3 animate-slide-down">
            {activeNotifs.map((notif) => {
              const isWarning = notif.tipe === 'Peringatan';
              const isImportant = notif.tipe === 'Penting';

              return (
                <div
                  key={notif.notif_id}
                  className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)] backdrop-blur-2xl transition-all ${
                    isWarning
                      ? 'bg-slate-950/95 border-rose-500/90 text-rose-100 ring-4 ring-rose-500/30'
                      : isImportant
                      ? 'bg-slate-950/95 border-purple-500/90 text-purple-100 ring-4 ring-purple-500/30'
                      : 'bg-slate-950/95 border-indigo-500/90 text-indigo-100 ring-4 ring-indigo-500/30'
                  }`}
                >
                  {/* Top Glowing Indicator Bar */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 ${
                      isWarning
                        ? 'bg-gradient-to-r from-rose-500 via-amber-400 to-rose-600 animate-pulse'
                        : isImportant
                        ? 'bg-gradient-to-r from-purple-500 via-indigo-400 to-purple-600 animate-pulse'
                        : 'bg-gradient-to-r from-indigo-500 via-sky-400 to-indigo-600 animate-pulse'
                    }`}
                  />

                  {/* Top Row Header */}
                  <div className="flex items-start justify-between gap-3 relative z-10 pt-1">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2.5 sm:p-3 rounded-2xl flex items-center justify-center shrink-0 shadow-xl ${
                          isWarning
                            ? 'bg-rose-600 text-white animate-bounce'
                            : isImportant
                            ? 'bg-purple-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {isWarning ? (
                          <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : isImportant ? (
                          <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6" />
                        ) : (
                          <BellRing className="w-5 h-5 sm:w-6 sm:h-6" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider ${
                              isWarning
                                ? 'bg-rose-500/30 text-rose-200 border border-rose-400/50'
                                : isImportant
                                ? 'bg-purple-500/30 text-purple-200 border border-purple-400/50'
                                : 'bg-indigo-500/30 text-indigo-200 border border-indigo-400/50'
                            }`}
                          >
                            {isWarning ? '⚠️ PERINGATAN RESMI' : isImportant ? '🚨 INFORMASI PENTING' : '📢 NOTIFIKASI MAJELIS'}
                          </span>
                          <span className="text-[11px] text-slate-300 font-semibold">
                            Pengirim: <strong className="text-white">{notif.pengirim || 'Admin Gereja'}</strong>
                          </span>
                          <span className="text-[11px] text-slate-400">&bull; {notif.tanggal}</span>
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-white mt-1 leading-snug tracking-tight">
                          {notif.judul}
                        </h3>
                      </div>
                    </div>

                    {/* Action controls: Play sound & Close */}
                    <div className="flex items-center gap-1.5 shrink-0 relative z-10">
                      <button
                        onClick={() => (isWarning ? playWarningChime() : playNotificationChime())}
                        className="p-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/30 transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Bunyikan Suara Notifikasi"
                      >
                        <Volume2 className="w-4 h-4 animate-pulse text-amber-300" />
                        <span className="hidden sm:inline text-[11px]">Suara</span>
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteNotification(notif.notif_id)}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition-all cursor-pointer"
                          title="Hapus Notifikasi Ini (Admin)"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => handleDismissNotification(notif.notif_id)}
                        className="p-2 rounded-xl bg-white/10 hover:bg-rose-600 text-slate-200 hover:text-white transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                        title="Tutup Floating Notifikasi"
                      >
                        <X className="w-4 h-4" />
                        <span className="hidden sm:inline">Tutup</span>
                      </button>
                    </div>
                  </div>

                  {/* Body Message */}
                  <div className="mt-3 text-xs sm:text-sm text-slate-100 leading-relaxed font-normal bg-black/60 p-3.5 rounded-2xl border border-white/10 relative z-10">
                    {notif.pesan}
                  </div>

                  {/* Footer Row */}
                  <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-300 pt-2 border-t border-white/10 relative z-10">
                    <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCheck className="w-4 h-4" />
                      <span>Notifikasi Mengambang Realtime (Disertai Bunyi Suara)</span>
                    </span>
                    <button
                      onClick={() => handleDismissNotification(notif.notif_id)}
                      className="text-xs text-indigo-300 hover:text-white font-bold underline cursor-pointer"
                    >
                      Tandai Sudah Dibaca
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* JEMAAT FOCUS MODE: Single Latest Update Panel & Statistics Cards */}
      {isJemaat && (
        <div className="space-y-6">
          {/* STATISTIK INFORMASI JEMAAT (STRICTLY 2 BARIS x 2 KARTU KOTAK) */}
          <div className="space-y-3 sm:space-y-4">
            {/* Baris Pertama: Total Jemaat (Kotak 1) & Total KK (Kotak 2) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              {/* Kartu 1: Total Jemaat */}
              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-indigo-500/30 flex flex-col justify-between space-y-2`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider truncate">Total Jemaat</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-md shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl sm:text-3xl font-black text-white">{totalJemaat}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Jiwa</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[11px] text-slate-300 gap-1">
                  <span>L: <strong className="text-indigo-300 font-bold">{totalLaki}</strong></span>
                  <span>P: <strong className="text-pink-300 font-bold">{totalPerempuan}</strong></span>
                </div>
              </div>

              {/* Kartu 2: Total Kepala Keluarga (KK) */}
              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-purple-500/30 flex flex-col justify-between space-y-2`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider truncate">Total KK</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-md shrink-0">
                    <Home className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl sm:text-3xl font-black text-white">{totalKeluarga}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Keluarga</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-[9px] sm:text-[11px] text-slate-300 truncate">
                  <span>Kepala Keluarga</span>
                </div>
              </div>
            </div>

            {/* Baris Kedua: Kas Persembahan (Kotak 3) & Jadwal & Event (Kotak 4) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              {/* Kartu 3: Kas Persembahan */}
              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-emerald-500/30 flex flex-col justify-between space-y-2`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider truncate">Kas Persembahan</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shrink-0">
                    <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-base sm:text-2xl font-black text-emerald-400 leading-tight">
                    Rp {totalPersembahan.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 text-[9px] sm:text-[11px] text-slate-300 truncate">
                  <span>Kas & Donasi</span>
                </div>
              </div>

              {/* Kartu 4: Jadwal & Event */}
              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-amber-500/30 flex flex-col justify-between space-y-2`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider truncate">Jadwal & Event</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-md shrink-0">
                    <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-xl sm:text-3xl font-black text-white">{eventsList.length}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Agenda</span>
                </div>
                <div className="pt-2 border-t border-white/10 text-[9px] sm:text-[11px] text-slate-300 truncate">
                  <span>Ibadah & Event</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
              <span>
                <strong>Portal Informasi Terfokus Jemaat:</strong> Menampilkan 1 update informasi terbaru dari SuperAdmin/Admin untuk menjaga tampilan tetap bersih.
              </span>
            </div>
            <button
              onClick={() => onNavigate('media')}
              className="text-xs font-bold text-indigo-400 hover:underline shrink-0"
            >
              Arsip Lengkap &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Latest Renungan Utama */}
            {settings.show_renungan_widget !== false && (
              <div className={`rounded-3xl ${cardStyleClass} p-6 text-white space-y-3 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Renungan Utama Hari Ini
                    </span>
                    <span className="text-[10px] text-slate-400">{latestRenungan?.tanggal || 'Terbaru'}</span>
                  </div>

                  {latestRenungan ? (
                    <div className="mt-3 space-y-2">
                      <h3 className="font-extrabold text-base text-white">{latestRenungan.judul}</h3>
                      {latestRenungan.ayat && (
                        <p className="text-xs text-amber-400 font-semibold italic bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                          &ldquo;{latestRenungan.ayat}&rdquo;
                        </p>
                      )}
                      <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed">
                        {latestRenungan.isi}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">Belum ada data renungan terbaru.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Oleh: {latestRenungan?.penulis || 'Gembala Sidang'}</span>
                  <button
                    onClick={() => onNavigate('media')}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <span>Baca Semua</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 2. Latest Pengumuman */}
            {settings.show_pengumuman_widget !== false && (
              <div className={`rounded-3xl ${cardStyleClass} p-6 text-white space-y-3 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-[10px] border border-emerald-500/30 flex items-center gap-1">
                      <Megaphone className="w-3 h-3" />
                      Pengumuman Resmi Terbaru
                    </span>
                    <span className="text-[10px] text-slate-400">{latestPengumuman?.tanggal || 'Terbaru'}</span>
                  </div>

                  {latestPengumuman ? (
                    <div className="mt-3 space-y-2">
                      <h3 className="font-extrabold text-base text-white">{latestPengumuman.judul}</h3>
                      <p className="text-xs text-slate-300 line-clamp-4 leading-relaxed">
                        {latestPengumuman.isi}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">Belum ada pengumuman terbaru.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Sekretariat Gereja</span>
                  <button
                    onClick={() => onNavigate('media')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                  >
                    <span>Pengumuman Lain</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* 3. Latest Upcoming Event */}
            {settings.show_event_widget !== false && (
              <div className={`rounded-3xl ${cardStyleClass} p-6 text-white space-y-3 flex flex-col justify-between`}>
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-bold text-[10px] border border-amber-500/30 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Agenda / Event Terdekat
                    </span>
                    <span className="text-[10px] text-slate-400">{latestEvent?.tanggal || 'Mendatang'}</span>
                  </div>

                  {latestEvent ? (
                    <div className="mt-3 space-y-2">
                      <h3 className="font-extrabold text-base text-white">{latestEvent.nama}</h3>
                      <div className="space-y-1 text-xs text-slate-300 bg-white/5 p-3 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-amber-400" />
                          <span>Pukul {latestEvent.jam} WIB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{latestEvent.lokasi}</span>
                        </div>
                        {latestEvent.pembicara && (
                          <div className="flex items-center gap-2 text-slate-400">
                            <span>Pembicara: {latestEvent.pembicara}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">Belum ada agenda mendatang.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Jadwal Minggu Ini</span>
                  <button
                    onClick={() => onNavigate('agenda')}
                    className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                  >
                    <span>Lihat Kalender</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Prayer Request Form for Jemaat */}
          {settings.show_prayer_widget !== false && (
            <div className={`rounded-3xl ${cardStyleClass} p-6 text-white space-y-4`}>
              <div className="flex items-center gap-2 pb-3 border-b border-white/10">
                <HeartHandshake className="w-5 h-5 text-pink-400" />
                <div>
                  <h3 className="font-bold text-base">Kirim Permohonan Doa Mandiri</h3>
                  <p className="text-xs text-slate-400">Tim pendoa dan hamba Tuhan akan mendoakan beban permohonan Anda.</p>
                </div>
              </div>

              {prayerSubmitted && (
                <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>Permohonan doa Anda telah berhasil dikirimkan ke Tim Pendoa Gereja!</span>
                </div>
              )}

              <form onSubmit={handleSubmitPrayer} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 text-xs mb-1 font-semibold">Kategori Doa</label>
                    <select
                      value={prayerTopic}
                      onChange={(e) => setPrayerTopic(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    >
                      <option value="Kesehatan">Kesehatan & Pemulihan</option>
                      <option value="Pekerjaan">Pekerjaan & Karir</option>
                      <option value="Keluarga">Keluarga & Rumah Tangga</option>
                      <option value="Keuangan">Keuangan & Usaha</option>
                      <option value="Pendidikan">Pendidikan & Sekolah</option>
                      <option value="Kerohanian">Pertumbuhan Kerohanian</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-400 text-xs mb-1 font-semibold">Isi Permohonan Doa</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        placeholder="Tuliskan pokok permohonan doa Anda..."
                        value={prayerText}
                        onChange={(e) => setPrayerText(e.target.value)}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim</span>
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Featured Social Media Video Player Widget for Jemaat (At the Very Bottom) */}
          {settings.show_video_widget !== false && settings.video_enabled !== false && (
            <div className={`rounded-3xl ${cardStyleClass} p-6 overflow-hidden text-white space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-400 animate-pulse">
                    <Tv className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold text-[10px] uppercase tracking-wider border border-red-500/30">
                        🔴 Live Media Stream
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">Media: {parsedVideo.type}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">
                      {settings.video_title || 'Tayangan Ibadah Raya & Khotbah Terbaru'}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('galeri')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Video className="w-4 h-4 text-indigo-400" />
                  <span>Lihat Galeri Foto & Video Lengkap</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {settings.video_description && (
                <p className="text-xs text-slate-300 italic bg-white/5 p-3 rounded-2xl border border-white/5">
                  "{settings.video_description}"
                </p>
              )}

              {/* Embedded Video Display */}
              <div className="relative w-full rounded-2xl overflow-hidden bg-black/80 border border-white/10 aspect-video shadow-2xl">
                {parsedVideo.isValid ? (
                  parsedVideo.type === 'mp4' ? (
                    <video
                      controls
                      className="w-full h-full object-contain"
                      src={parsedVideo.embedUrl}
                    />
                  ) : (
                    <iframe
                      src={parsedVideo.embedUrl}
                      title="Tayangan Media Sosial Gereja"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  )
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                    <ShieldAlert className="w-12 h-12 text-amber-400 mb-2" />
                    <p className="text-sm font-bold text-slate-200">Video Belum Diatur atau Tautan Tidak Sesuai</p>
                    <p className="text-xs mt-1 max-w-md">
                      Video tayangan ibadah/khotbah belum dikonfigurasi oleh pengurus gereja.
                    </p>
                  </div>
                )}
              </div>

              {/* Gallery Video & Photo Stream Playlist Selector */}
              {featuredVideos.length > 0 && (
                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      Pilih Tayangan Video & Media Terkait:
                    </span>
                    <button
                      onClick={() => onNavigate('galeri')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold text-[11px]"
                    >
                      Buka Galeri Media &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {featuredVideos.map((v) => (
                      <button
                        key={v.video_id}
                        type="button"
                        onClick={() => setActiveVideoUrl(v.video_url)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          currentVideoUrl === v.video_url
                            ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-lg ring-2 ring-indigo-500/30'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400">
                          <Play className="w-3 h-3 fill-current" />
                          <span>{v.platform || 'Video'} &bull; {v.kategori || 'Ibadah'}</span>
                        </div>
                        <p className="text-xs font-semibold mt-1 truncate">{v.judul}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* SUPERADMIN & ADMIN OPERATIONAL DASHBOARD */}
      {!isJemaat && (
        <div className="space-y-6">
          {/* Quick Statistics Cards */}
          {settings.show_stat_cards !== false && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Jemaat Card */}
              <div className={`rounded-2xl ${cardStyleClass} p-5 hover:border-white/20 transition-all text-white`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Jemaat</span>
                  <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <h3 className="text-2xl font-bold tracking-tight">
                    {totalJemaat} <span className="text-xs text-slate-400 font-normal">Jiwa</span>
                  </h3>
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-0.5">
                    <TrendingUp className="w-3.5 h-3.5" /> +4.2%
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-3 border-t border-white/10 pt-2">
                  <span>L: {totalLaki} Jiwa</span>
                  <span>&bull;</span>
                  <span>P: {totalPerempuan} Jiwa</span>
                </div>
              </div>

              {/* Total Keluarga Card */}
              <div className={`rounded-2xl ${cardStyleClass} p-5 hover:border-white/20 transition-all text-white`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kepala Keluarga</span>
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 flex items-center justify-center">
                    <Building2 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <h3 className="text-2xl font-bold tracking-tight">
                    {totalKeluarga} <span className="text-xs text-slate-400 font-normal">KK</span>
                  </h3>
                  <span className="text-xs font-medium text-slate-400">4 Wilayah</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 border-t border-white/10 pt-2">
                  Terdaftar di Database Gereja
                </div>
              </div>

              {/* Total Persembahan Card */}
              <div className={`rounded-2xl ${cardStyleClass} p-5 hover:border-white/20 transition-all text-white`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kas Persembahan</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <h3 className="text-xl font-bold tracking-tight text-emerald-400">
                    Rp {totalPersembahan.toLocaleString('id-ID')}
                  </h3>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 border-t border-white/10 pt-2 flex items-center justify-between">
                  <span>Tersimpan di Kas</span>
                  <span className="text-emerald-400 font-semibold">Tercatat</span>
                </div>
              </div>

              {/* Event Mendatang Card */}
              <div className={`rounded-2xl ${cardStyleClass} p-5 hover:border-white/20 transition-all text-white`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jadwal & Event</span>
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline justify-between">
                  <h3 className="text-2xl font-bold tracking-tight">
                    {eventsList.length} <span className="text-xs text-slate-400 font-normal">Agenda</span>
                  </h3>
                  <span className="text-xs font-medium text-amber-400">Minggu Ini</span>
                </div>
                <div className="mt-2 text-[11px] text-slate-400 border-t border-white/10 pt-2 truncate">
                  {eventsList[0]?.nama || 'Ibadah Raya Minggu'}
                </div>
              </div>
            </div>
          )}

          {/* Charts Section: Line & Doughnut Charts */}
          {settings.show_finance_chart !== false && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Financial Growth Chart */}
              <div className={`lg:col-span-8 rounded-3xl ${cardStyleClass} p-6 text-white`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Grafik Tren Persembahan & Kas</h3>
                    <p className="text-xs text-slate-400">Statistik akumulasi penerimaan per bulan tahun 2026</p>
                  </div>
                  <button
                    onClick={() => onNavigate('keuangan')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <span>Lihat Detail Kas</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="h-64 w-full">
                  <Line data={financialChartData} options={financialChartOptions} />
                </div>
              </div>

              {/* Wilayah Distribution Chart */}
              <div className={`lg:col-span-4 rounded-3xl ${cardStyleClass} p-6 text-white flex flex-col justify-between`}>
                <div>
                  <h3 className="text-base font-bold text-white">Demografi Per Wilayah</h3>
                  <p className="text-xs text-slate-400 mb-4">Sebaran lokasi tempat tinggal jemaat</p>
                  <div className="h-48 w-full flex items-center justify-center">
                    <Doughnut
                      data={wilayahChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { position: 'bottom', labels: { color: '#94a3b8', boxWidth: 12, font: { size: 10 } } } }
                      }}
                    />
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10 text-center">
                  <button
                    onClick={() => onNavigate('wilayah')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Kelola Data Wilayah</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Section: Today's Schedule & System Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Today's Schedule */}
            <div className={`lg:col-span-6 rounded-3xl ${cardStyleClass} p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                    <Clock className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold">Jadwal Ibadah & Agenda Terbaru</h3>
                </div>
                <button
                  onClick={() => onNavigate('agenda')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  Semua Agenda
                </button>
              </div>

              <div className="space-y-3">
                {eventsList.slice(0, 3).map((evt) => (
                  <div
                    key={evt.event_id}
                    className="p-3.5 rounded-2xl bg-white/5 border border-white/10 flex items-start justify-between gap-3 text-xs hover:border-indigo-500/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30">
                          {evt.kategori || 'Ibadah'}
                        </span>
                        <span className="text-slate-400 text-[11px]">{evt.jam}</span>
                      </div>
                      <h4 className="font-bold text-slate-100 text-sm mt-1">{evt.nama}</h4>
                      <p className="text-slate-400 mt-0.5">{evt.lokasi} &bull; Pembicara: {evt.pembicara || '-'}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg shrink-0">
                      {evt.tanggal}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity Logs & Audit Feed */}
            <div className={`lg:col-span-6 rounded-3xl ${cardStyleClass} p-6 text-white`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                    <Activity className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold">Aktivitas System Terbaru</h3>
                </div>
                {isSuperAdmin && (
                  <button
                    onClick={() => onNavigate('settings')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                  >
                    Audit Log
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {activityLogs.slice(0, 4).map((log) => (
                  <div
                    key={log.log_id}
                    className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between text-xs hover:border-white/20 transition-all"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-indigo-300">{log.user}</span>
                        <span className="text-[10px] text-slate-500">&bull; {log.module || 'System'}</span>
                      </div>
                      <p className="text-slate-300 line-clamp-1">{log.aktivitas}</p>
                    </div>
                    <span className="text-[10px] text-slate-500 shrink-0">{log.tanggal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUICK CUSTOMIZER MODAL FOR SUPERADMIN & ADMIN */}
      {isCustomizerOpen && isAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-bold text-base text-white">Custom Tampilan & Video Social Media</h3>
                  <p className="text-xs text-slate-400">Atur link video, header, warna theme, dan komponen dashboard.</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomizerOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Kustomisasi tampilan berhasil disimpan!</span>
              </div>
            )}

            <form onSubmit={handleSaveCustomizer} className="space-y-5 text-xs">
              {/* Section 1: Video Media Sosial Link */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-indigo-400" />
                    <span>Link Video Media Sosial (YouTube / Shorts / Reels / TikTok)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                    <input
                      type="checkbox"
                      checked={customForm.video_enabled !== false}
                      onChange={(e) => setCustomForm({ ...customForm, video_enabled: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                    <span className="text-emerald-400 font-semibold">Aktifkan Video</span>
                  </label>
                </div>

                <p className="text-[11px] text-indigo-300/90 bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
                  💡 <strong>Info:</strong> Tampilan video stream ini tidak dimuat di dashboard Admin/SuperAdmin. Video akan tampil secara otomatis di <strong>dashboard Jemaat pada bagian paling bawah</strong>.
                </p>

                <input
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=5qap5aO4i9A atau Shorts / Reels"
                  value={customForm.video_url || ''}
                  onChange={(e) => setCustomForm({ ...customForm, video_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-indigo-500/40 text-white font-mono text-[11px]"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Judul Video</label>
                    <input
                      type="text"
                      placeholder="Tayangan Ibadah Raya Minggu Ini"
                      value={customForm.video_title || ''}
                      onChange={(e) => setCustomForm({ ...customForm, video_title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Deskripsi Video</label>
                    <input
                      type="text"
                      placeholder="Saksikan firman Tuhan dan puji-pujian..."
                      value={customForm.video_description || ''}
                      onChange={(e) => setCustomForm({ ...customForm, video_description: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Custom Header Title & Logo Input */}
              <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <label className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>Logo & Identitas Gereja (Tampil di Semua User & Device)</span>
                  </label>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <div className="shrink-0 relative group">
                    <img
                      src={customForm.logo || DEFAULT_CHURCH_LOGO}
                      alt="Logo Preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
                      }}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-md bg-slate-950"
                    />
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-indigo-600 text-[9px] font-bold text-white rounded-full">
                      Preview
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={customForm.logo || ''}
                        placeholder="Paste URL Gambar Logo atau Upload File..."
                        onChange={(e) => setCustomForm({ ...customForm, logo: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                      />
                      <label className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (evt) => {
                                if (evt.target?.result) {
                                  setCustomForm({ ...customForm, logo: evt.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-semibold">Preset Logo Quick Pick:</span>
                      <button
                        type="button"
                        onClick={() => setCustomForm({ ...customForm, logo: DEFAULT_CHURCH_LOGO })}
                        className="px-2 py-1 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold hover:bg-indigo-900"
                      >
                        Default Gold Cross Emblem
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCustomForm({
                            ...customForm,
                            logo: 'https://images.unsplash.com/photo-1548625361-185966347898?w=300&auto=format&fit=crop&q=80'
                          })
                        }
                        className="px-2 py-1 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[10px] hover:bg-slate-700"
                      >
                        Cathedral Photo
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Judul Header Dashboard</label>
                    <input
                      type="text"
                      value={customForm.header_title || ''}
                      placeholder="Gereja Kemenangan Faith Center Pro"
                      onChange={(e) => setCustomForm({ ...customForm, header_title: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Subtitle Header</label>
                    <input
                      type="text"
                      value={customForm.header_subtitle || ''}
                      placeholder="Sistem Informasi & Portal Layanan Jemaat"
                      onChange={(e) => setCustomForm({ ...customForm, header_subtitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Preset Background & Card Style */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="font-bold text-slate-300 block">Preset Warna Tema Background</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'DARK_SLATE', label: '🌌 Dark Slate' },
                    { id: 'MIDNIGHT_BLUE', label: '💙 Sapphire Blue' },
                    { id: 'DEEP_PURPLE', label: '💜 Amethyst' },
                    { id: 'FOREST_GREEN', label: '🌲 Emerald Green' },
                    { id: 'WARM_GOLD', label: '⚜️ Warm Gold' },
                    { id: 'LUXE_LIGHT', label: '☀️ Soft Light' }
                  ].map((t) => (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setCustomForm({ ...customForm, theme_preset: t.id as any })}
                      className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                        (customForm.theme_preset || 'DARK_SLATE') === t.id
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <label className="font-bold text-slate-300 block pt-2">Style Kartu & Border</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'GLASS', label: '✨ Glassmorphism (Blur Transparan)' },
                    { id: 'SOLID', label: '⬛ Solid Dark Glass' },
                    { id: 'NEON', label: '💡 Neon Glow Accent' },
                    { id: 'FLAT', label: '📄 Flat Border Minimal' }
                  ].map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setCustomForm({ ...customForm, card_style: c.id as any })}
                      className={`p-2 rounded-xl text-xs font-semibold border text-left transition-all ${
                        (customForm.card_style || 'GLASS') === c.id
                          ? 'border-indigo-500 bg-indigo-600/20 text-indigo-300 font-bold'
                          : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 4: Sakelar Widget Dashboard */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="font-bold text-slate-300 block">Tampilkan / Sembunyikan Widget Dashboard</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: 'show_video_widget', label: 'Widget Video Stream' },
                    { key: 'show_stat_cards', label: 'Kartu Statistik Total' },
                    { key: 'show_renungan_widget', label: 'Widget Renungan Utama' },
                    { key: 'show_pengumuman_widget', label: 'Widget Pengumuman' },
                    { key: 'show_event_widget', label: 'Widget Agenda & Event' },
                    { key: 'show_prayer_widget', label: 'Widget Permohonan Doa' },
                    { key: 'show_finance_chart', label: 'Grafik Keuangan' }
                  ].map((w) => (
                    <label
                      key={w.key}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-slate-300">{w.label}</span>
                      <input
                        type="checkbox"
                        checked={(customForm as any)[w.key] !== false}
                        onChange={(e) => setCustomForm({ ...customForm, [w.key]: e.target.checked })}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCustomizerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL BUAT NOTIFIKASI / PERINGATAN (ADMIN & SUPERADMIN) */}
      {isCreateNotifModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4 shadow-2xl relative overflow-hidden text-white">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">
                    Buat Notifikasi & Peringatan Jemaat
                  </h3>
                  <p className="text-xs text-slate-400">
                    Pesan akan langsung tampil sebagai kartu utama di Dashboard Jemaat.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateNotifModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNotification} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Judul Informasi / Peringatan
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: ⚠️ Peringatan Perubahan Jadwal Ibadah Minggu"
                  value={newNotifForm.judul}
                  onChange={(e) => setNewNotifForm({ ...newNotifForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Kategori / Tipe Pesan
                  </label>
                  <select
                    value={newNotifForm.tipe}
                    onChange={(e) => setNewNotifForm({ ...newNotifForm, tipe: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="Peringatan">⚠️ Peringatan (Warning)</option>
                    <option value="Penting">🚨 Informasi Penting (Urgent)</option>
                    <option value="Informasi">📢 Pengumuman Biasa (Info)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Target Penerima
                  </label>
                  <select
                    value={newNotifForm.tujuan_role}
                    onChange={(e) => setNewNotifForm({ ...newNotifForm, tujuan_role: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="ALL">Semua Pengguna (Jemaat & Admin)</option>
                    <option value="JEMAAT">Khusus Jemaat</option>
                    <option value="ADMIN">Khusus Pengurus / Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Isi Pesan Notifikasi / Peringatan Detail
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Tuliskan isi detail pengumuman atau instruksi peringatan untuk jemaat gereja..."
                  value={newNotifForm.pesan}
                  onChange={(e) => setNewNotifForm({ ...newNotifForm, pesan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  Notifikasi akan langsung disinkronkan secara realtime ke seluruh browser jemaat.
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateNotifModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-extrabold shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Notifikasi Sekarang</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
