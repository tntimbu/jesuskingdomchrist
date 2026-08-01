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
import { RenunganFullscreenModal } from './RenunganFullscreenModal';
import { FloatingApkDownloadButton } from './FloatingApkDownloadButton';
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
  ChevronDown,
  ChevronUp,
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
  Volume2,
  Maximize2,
  CreditCard,
  Copy,
  CheckCircle2,
  XCircle,
  Ticket,
  Grid,
  FileText,
  BarChart3,
  UserCheck,
  Settings
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

  // Data state initialized lazily for instant flicker-free rendering
  const [jemaatList, setJemaatList] = useState<Jemaat[]>(() => StorageManager.getJemaat());
  const [persembahanList, setPersembahanList] = useState<Persembahan[]>(() => StorageManager.getPersembahan());
  const [eventsList, setEventsList] = useState<EventSchedule[]>(() => StorageManager.getEvents());
  const [renunganList, setRenunganList] = useState<Renungan[]>(() => StorageManager.getRenungan());
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>(() => StorageManager.getPengumuman());
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>(() => StorageManager.getPrayerRequests());
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => StorageManager.getActivityLogs());
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>(() => StorageManager.getFeaturedVideos());
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(() => StorageManager.getGallery());
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('');

  // Prayer Request Form State
  const [prayerText, setPrayerText] = useState('');
  const [prayerTopic, setPrayerTopic] = useState('Kesehatan');
  const [prayerSubmitted, setPrayerSubmitted] = useState(false);

  // Transfer Persembahan Digital State & Handlers
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [copiedBankNum, setCopiedBankNum] = useState(false);
  const [transferForm, setTransferForm] = useState({
    jenis: 'Persembahan Perpuluhan',
    jumlah: 500000,
    metode_pembayaran: 'Transfer Bank',
    nama_pengirim: currentUser.nama || '',
    keterangan: '',
    bukti_transfer: ''
  });
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleCopyBank = () => {
    const num = settings.rekening_bank_nomor || '527-089-1122';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(num);
      setCopiedBankNum(true);
      setTimeout(() => setCopiedBankNum(false), 2000);
    }
  };

  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.jumlah || transferForm.jumlah <= 0) {
      setTransferMsg({ type: 'error', text: 'Jumlah nominal persembahan harus lebih dari Rp 0!' });
      return;
    }

    const allPersembahan = StorageManager.getPersembahan();
    const newTransfer: Persembahan = {
      persembahan_id: `TRS-2026-${Date.now().toString().slice(-4)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      jenis: transferForm.jenis,
      kategori: transferForm.jenis,
      jumlah: Number(transferForm.jumlah),
      keterangan: transferForm.keterangan || `Transfer persembahan oleh ${transferForm.nama_pengirim}`,
      metode_pembayaran: transferForm.metode_pembayaran,
      nama_pengirim: transferForm.nama_pengirim || currentUser.nama,
      jemaat_id: currentUser.jemaat_id || currentUser.user_id,
      status: 'PENDING',
      bukti_transfer: transferForm.bukti_transfer
    };

    const updated = [newTransfer, ...allPersembahan];
    StorageManager.savePersembahan(updated);
    setPersembahanList(updated);
    StorageManager.logActivity(
      currentUser.username,
      `Mengirim Konfirmasi Transfer Persembahan Rp ${newTransfer.jumlah.toLocaleString('id-ID')}`,
      'Dashboard Home'
    );

    setTransferMsg({
      type: 'success',
      text: '✅ Konfirmasi transfer persembahan berhasil dikirim! Admin/Bendahara gereja akan memverifikasi transaksi Anda.'
    });

    setTimeout(() => {
      setIsTransferModalOpen(false);
      setTransferMsg(null);
      setTransferForm({
        jenis: 'Persembahan Perpuluhan',
        jumlah: 500000,
        metode_pembayaran: 'Transfer Bank',
        nama_pengirim: currentUser.nama || '',
        keterangan: '',
        bukti_transfer: ''
      });
    }, 2500);
  };

  // Event Reservation State & Handler
  const [isEventResModalOpen, setIsEventResModalOpen] = useState(false);
  const [selectedEventForRes, setSelectedEventForRes] = useState<EventSchedule | null>(null);
  const [eventResForm, setEventResForm] = useState({
    nama_jemaat: currentUser.nama || '',
    nomor_wa: currentUser.no_hp || '0812-3456-7890',
    jumlah_kursi: 1,
    catatan: ''
  });
  const [eventResMsg, setEventResMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleOpenReservationModal = (evt: EventSchedule) => {
    setSelectedEventForRes(evt);
    setEventResForm({
      nama_jemaat: currentUser.nama || '',
      nomor_wa: currentUser.no_hp || '0812-3456-7890',
      jumlah_kursi: 1,
      catatan: ''
    });
    setEventResMsg(null);
    setIsEventResModalOpen(true);
  };

  const handleSaveEventReservation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForRes || !eventResForm.nama_jemaat || !eventResForm.nomor_wa) {
      setEventResMsg({ type: 'error', text: 'Lengkapi nama dan nomor WhatsApp Anda!' });
      return;
    }

    const existingRes = StorageManager.getEventReservations();
    const newRes = {
      reservation_id: `RES-2026-${Date.now().toString().slice(-4)}`,
      event_id: selectedEventForRes.event_id,
      nama_jemaat: eventResForm.nama_jemaat,
      nomor_wa: eventResForm.nomor_wa,
      jumlah_kursi: Number(eventResForm.jumlah_kursi) || 1,
      catatan: eventResForm.catatan,
      tanggal_reservasi: new Date().toLocaleString('id-ID'),
      status: 'TERKONFIRMASI' as const
    };

    const updated = [newRes, ...existingRes];
    StorageManager.saveEventReservations(updated);
    StorageManager.logActivity(
      currentUser.username,
      `Melakukan reservasi event "${selectedEventForRes.nama}" sebanyak ${eventResForm.jumlah_kursi} kursi`,
      'Events'
    );

    // Broadcast update event to all views & admin
    window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { action: 'reservation_updated' } }));

    setEventResMsg({
      type: 'success',
      text: `✅ Reservasi berhasil! ${eventResForm.jumlah_kursi} kursi terkonfirmasi dan telah terdaftar di Panel Admin.`
    });

    setTimeout(() => {
      setIsEventResModalOpen(false);
      setEventResMsg(null);
    }, 2000);
  };

  // Quick Customizer Modal State
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [customForm, setCustomForm] = useState<AppSettings>(settings);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Fullscreen Renungan Modal State
  const [selectedRenunganForModal, setSelectedRenunganForModal] = useState<Renungan | null>(null);

  // Toggle limit display for Riwayat Transfer Persembahan Saya
  const [showAllMyTransfers, setShowAllMyTransfers] = useState(false);

  // Notifications State
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>(() => StorageManager.getNotifications());
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

  // Combined list of all available videos from Featured Videos, Galeri Videos, and Settings
  const allDashboardVideos = React.useMemo(() => {
    const combined: {
      id: string;
      judul: string;
      video_url: string;
      kategori: string;
      platform: string;
      is_active?: boolean;
    }[] = [];

    const addedUrls = new Set<string>();

    // 1. Featured Social Videos (Managed in Galeri -> Video Media Sosial / Stream)
    featuredVideos.forEach((v) => {
      const url = v.video_url ? v.video_url.trim() : '';
      if (url && parseSocialVideoUrl(url).isValid && !addedUrls.has(url)) {
        addedUrls.add(url);
        combined.push({
          id: v.video_id,
          judul: v.judul,
          video_url: url,
          kategori: v.kategori || 'Video Utama',
          platform: v.platform || 'YouTube',
          is_active: v.is_active
        });
      }
    });

    // 2. Videos uploaded in Galeri (where tipe === 'Video' or video_url exists)
    galleryList.forEach((g) => {
      const url = (g.video_url || (g.tipe === 'Video' ? g.foto : '')).trim();
      if (url && parseSocialVideoUrl(url).isValid && !addedUrls.has(url)) {
        addedUrls.add(url);
        combined.push({
          id: g.gallery_id,
          judul: g.judul,
          video_url: url,
          kategori: g.kategori || 'Galeri Video',
          platform: 'YouTube'
        });
      }
    });

    // 3. Fallback Settings Video URL
    if (settings.video_url && parseSocialVideoUrl(settings.video_url).isValid) {
      const sUrl = settings.video_url.trim();
      if (!addedUrls.has(sUrl)) {
        addedUrls.add(sUrl);
        combined.unshift({
          id: 'SETTING-VID',
          judul: settings.video_title || 'Tayangan Video Terbaru',
          video_url: sUrl,
          kategori: 'Ibadah Utama',
          platform: 'YouTube',
          is_active: true
        });
      }
    }

    return combined;
  }, [featuredVideos, galleryList, settings.video_url, settings.video_title]);

  // Determine current active video item & video title
  const activeSelectedVideo = allDashboardVideos.find((v) => v.video_url === activeVideoUrl);
  const activeFeatured = allDashboardVideos.find((v) => v.is_active) || allDashboardVideos[0];
  const currentVideoItem = activeSelectedVideo || activeFeatured;

  const rawVideoUrl = activeVideoUrl || currentVideoItem?.video_url || settings.video_url || '';
  const currentVideoUrl = rawVideoUrl && rawVideoUrl.includes('5qap5aO4i9A')
    ? 'https://www.youtube.com/watch?v=wX2S6AebnI8'
    : rawVideoUrl;
  const parsedVideo = parseSocialVideoUrl(currentVideoUrl);
  const currentVideoDisplayTitle = currentVideoItem?.judul || settings.video_title || 'Tayangan Ibadah Raya & Khotbah Terbaru';

  // Stable User Avatar Source to prevent flashing/kedipan
  const userAvatarSrc = React.useMemo(() => {
    if (currentUser.foto) return currentUser.foto;
    const jId = currentUser.jemaat_id;
    const jName = currentUser.nama?.toLowerCase();

    const foundInState = jemaatList.find(
      (j) => (jId && j.jemaat_id === jId) || (jName && j.nama_lengkap.toLowerCase() === jName)
    );
    if (foundInState?.foto) return foundInState.foto;

    const storedJemaat = StorageManager.getJemaat();
    const foundInStorage = storedJemaat.find(
      (j) => (jId && j.jemaat_id === jId) || (jName && j.nama_lengkap.toLowerCase() === jName)
    );
    if (foundInStorage?.foto) return foundInStorage.foto;

    return settings.logo || DEFAULT_CHURCH_LOGO;
  }, [currentUser.foto, currentUser.jemaat_id, currentUser.nama, jemaatList, settings.logo]);

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
    window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { action: 'settings_updated' } }));
    StorageManager.logActivity(currentUser.username, 'Mengubah kustomisasi portal & dashboard jemaat', 'System Settings');
    setSaveSuccessMsg(true);
    setRefreshToast('✅ Perubahan Kustomisasi Dashboard & Portal Jemaat Berhasil Disimpan!');
    setTimeout(() => {
      setSaveSuccessMsg(false);
      setIsCustomizerOpen(false);
      setTimeout(() => setRefreshToast(''), 3500);
    }, 1200);
  };

  // Dynamic Theme Preset Style Classes & Density
  const getCardStyleClass = () => {
    const cardStyle = settings.card_style || 'GLASS';
    let base = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';
    switch (cardStyle) {
      case 'SOLID':
        base = 'bg-slate-900 border border-slate-800 shadow-xl';
        break;
      case 'NEON':
        base = 'bg-slate-900/90 border border-indigo-500/40 shadow-lg shadow-indigo-500/10 backdrop-blur-xl';
        break;
      case 'FLAT':
        base = 'bg-slate-900/60 border border-slate-700/60 shadow-none';
        break;
      case 'GLASS':
      default:
        base = 'bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl';
        break;
    }

    const density = settings.card_size || 'NORMAL';
    let padding = 'p-5 sm:p-6';
    if (density === 'COMPACT') padding = 'p-3.5 sm:p-4';
    if (density === 'SPACIOUS') padding = 'p-6 sm:p-8';

    return `${base} ${padding}`;
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

  let widthClass = 'w-full px-0 sm:px-1';
  if (settings.jemaat_card_width === 'FULL') widthClass = 'w-full px-0 sm:px-1';
  if (settings.jemaat_card_width === 'COMPACT' || settings.jemaat_card_width === 'MOBILE_COMPACT') widthClass = 'max-w-4xl mx-auto px-1 sm:px-3';
  if (settings.jemaat_card_width === 'CONTAINED') widthClass = 'max-w-7xl mx-auto px-1 sm:px-3';

  let bannerBgClass = 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-900/20';
  switch (settings.jemaat_banner_bg) {
    case 'GRADIENT_GOLD':
      bannerBgClass = 'bg-gradient-to-r from-amber-950 via-yellow-900 to-amber-950 border-amber-500/50 shadow-xl shadow-amber-900/20';
      break;
    case 'GRADIENT_EMERALD':
      bannerBgClass = 'bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 border-emerald-500/50 shadow-xl shadow-emerald-900/20';
      break;
    case 'GRADIENT_PURPLE':
      bannerBgClass = 'bg-gradient-to-r from-purple-950 via-fuchsia-900 to-purple-950 border-purple-500/50 shadow-xl shadow-purple-900/20';
      break;
    case 'OBSIDIAN_NIGHT':
      bannerBgClass = 'bg-gradient-to-r from-slate-950 via-neutral-900 to-slate-950 border-slate-700 shadow-xl shadow-black/40';
      break;
    case 'OCEAN_BLUE':
      bannerBgClass = 'bg-gradient-to-r from-slate-950 via-blue-900 to-cyan-950 border-cyan-500/50 shadow-xl shadow-cyan-900/20';
      break;
    case 'GRADIENT_INDIGO':
    default:
      bannerBgClass = 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-900/20';
      break;
  }

  return (
    <div className={`space-y-6 pb-2 sm:pb-4 transition-all duration-300 ${widthClass}`}>
      {/* Welcome Card Banner with Dynamic Custom Header */}
      <div className={`relative rounded-3xl ${bannerBgClass} ${cardStyleClass} overflow-hidden text-white transition-all duration-300`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={userAvatarSrc}
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
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Tombol Refresh Data untuk Semua User */}
            <button
              onClick={handleRefreshData}
              disabled={isRefreshing}
              className="px-3 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-xs font-semibold border border-indigo-500/40 flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm cursor-pointer w-full sm:w-auto"
              title="Refresh Data Dashboard"
            >
              <RotateCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="truncate">{isRefreshing ? 'Memuat...' : 'Refresh Data'}</span>
            </button>

            {isAdmin && (
              <>
                <button
                  onClick={() => setIsCreateNotifModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto"
                  title="Buat Notifikasi atau Peringatan Resmi untuk Jemaat"
                >
                  <BellRing className="w-3.5 h-3.5 text-amber-200 shrink-0" />
                  <span className="truncate">Buat Notifikasi</span>
                </button>

                <button
                  onClick={() => setIsCustomizerOpen(true)}
                  className="px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto"
                >
                  <Palette className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Custom Tampilan</span>
                </button>
              </>
            )}

            {settings.show_quick_actions !== false && !isJemaat && (
              <>
                <button
                  onClick={() => onNavigate('jemaat')}
                  className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto"
                >
                  <PlusCircle className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Tambah Jemaat</span>
                </button>
                <button
                  onClick={() => onNavigate('keuangan')}
                  className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto"
                >
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">Persembahan</span>
                </button>
              </>
            )}

            <button
              onClick={() => onNavigate('laporan')}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 text-xs font-semibold border border-white/10 flex items-center justify-center gap-1.5 transition-all cursor-pointer w-full sm:w-auto"
            >
              <Download className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">Cetak Laporan</span>
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

      {/* MENU UTAMA & MODUL PELAYANAN (HANYA DITAMPILKAN UNTUK ADMIN DI DASHBOARD HOME, UNTUK JEMAAT DIALIKAN KE MENU LAINNYA) */}
      {isAdmin && (
        <div className={`p-5 sm:p-6 rounded-3xl ${cardStyleClass} text-white space-y-4`}>
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-600 to-pink-600 text-white shadow-lg shadow-indigo-500/20">
                <Grid className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white tracking-wide">
                  Panel Quick Access Admin
                </h3>
                <p className="text-[11px] text-slate-400">Akses cepat manajemen sistem &amp; modul pelayanan</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-extrabold border border-indigo-500/30 uppercase tracking-wider">
              Admin Shortcuts
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {/* 1. Jemaat & KK */}
            <button
              onClick={() => onNavigate('jemaat')}
              className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/90 via-slate-900 to-slate-950 hover:from-indigo-900/90 hover:to-indigo-950 border border-indigo-500/30 hover:border-indigo-400 text-left transition-all duration-200 group cursor-pointer shadow-xl flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {jemaatList.length} Jiwa
                </span>
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-blue-300 transition-colors block">
                  Data Jemaat &amp; KK
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Database, KK &amp; KTA</span>
              </div>
            </button>

            {/* 2. Keuangan & Kas */}
            <button
              onClick={() => onNavigate('keuangan')}
              className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 hover:from-emerald-900/90 hover:to-emerald-950 border border-emerald-500/30 hover:border-emerald-400 text-left transition-all duration-200 group cursor-pointer shadow-xl flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Kas &amp; Transfer
                </span>
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition-colors block">
                  Keuangan &amp; Kas
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Kas, Persembahan &amp; Bank</span>
              </div>
            </button>

            {/* 3. Administrasi & Sakramen */}
            <button
              onClick={() => onNavigate('administrasi')}
              className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/90 via-slate-900 to-slate-950 hover:from-purple-900/90 hover:to-purple-950 border border-purple-500/30 hover:border-purple-400 text-left transition-all duration-200 group cursor-pointer shadow-xl flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-purple-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Surat Sakramen
                </span>
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-purple-300 transition-colors block">
                  Administrasi Surat
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Baptis, Sidi &amp; Pernikahan</span>
              </div>
            </button>

            {/* 4. Agenda & Reservasi */}
            <button
              onClick={() => onNavigate('agenda')}
              className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/90 via-slate-900 to-slate-950 hover:from-amber-900/90 hover:to-amber-950 border border-amber-500/30 hover:border-amber-400 text-left transition-all duration-200 group cursor-pointer shadow-xl flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-amber-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Calendar className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {eventsList.length} Event
                </span>
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors block">
                  Agenda &amp; Event
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Jadwal &amp; Reservasi Kursi</span>
              </div>
            </button>

            {/* 5. Menu Lainnya */}
            <button
              onClick={() => onNavigate('lainnya')}
              className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/90 via-slate-900 to-slate-950 hover:from-cyan-900/90 hover:to-cyan-950 border border-cyan-500/30 hover:border-cyan-400 text-left transition-all duration-200 group cursor-pointer shadow-xl flex flex-col justify-between space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl bg-cyan-600 text-white shadow-lg group-hover:scale-110 transition-transform">
                  <Grid className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  All Modul
                </span>
              </div>
              <div>
                <span className="font-extrabold text-xs sm:text-sm text-white group-hover:text-cyan-300 transition-colors block">
                  Menu Lainnya
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Semua Modul &amp; Fitur</span>
              </div>
            </button>
          </div>
        </div>
      )}

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
              <div
                className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-emerald-500/30 flex flex-col justify-between space-y-2`}
              >
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
                  <span>Tercatat di Kas Gereja</span>
                </div>
              </div>

              {/* Kartu 4: Jadwal & Event */}
              <div
                className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-amber-500/30 flex flex-col justify-between space-y-2`}
              >
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
                  <span>Agenda Ibadah & Event</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900/80 backdrop-blur-xl border border-indigo-500/30 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                  Portal Informasi Terfokus Jemaat
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Akses cepat renungan harian, pengumuman resmi &amp; tayangan ibadah gereja
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full md:w-auto shrink-0">
              <button
                onClick={() => onNavigate('renungan')}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-bold text-[10px] sm:text-xs border border-indigo-400/30 shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center"
              >
                <BookOpen className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                <span>Renungan</span>
              </button>
              <button
                onClick={() => onNavigate('pengumuman')}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white font-bold text-[10px] sm:text-xs border border-emerald-400/30 shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center"
              >
                <Megaphone className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                <span>Pengumuman</span>
              </button>
              <button
                onClick={() => onNavigate('media')}
                className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white font-bold text-[10px] sm:text-xs border border-red-400/30 shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 whitespace-nowrap text-center"
              >
                <Tv className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
                <span>Streaming</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Latest Renungan Utama */}
            {settings.show_renungan_widget !== false && (
              <div className={`rounded-3xl ${cardStyleClass} text-white space-y-3 flex flex-col justify-between transition-all duration-300 border border-indigo-500/30`}>
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span className="px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-bold text-[10px] border border-indigo-500/30 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Renungan Utama Hari Ini</span>
                    </span>
                    {latestRenungan && (
                      <button
                        onClick={() => setSelectedRenunganForModal(latestRenungan)}
                        className="px-2 py-1 rounded-lg bg-indigo-600/80 hover:bg-indigo-500 text-white text-[10px] font-extrabold flex items-center gap-1 border border-indigo-400/30 shadow transition-all cursor-pointer"
                        title="Baca Layar Penuh"
                      >
                        <Maximize2 className="w-3 h-3 text-amber-300" />
                        <span>Layar Penuh</span>
                      </button>
                    )}
                  </div>

                  {latestRenungan ? (
                    <div className="mt-3 space-y-2">
                      <h3
                        onClick={() => setSelectedRenunganForModal(latestRenungan)}
                        className="font-extrabold text-base text-white hover:text-indigo-300 transition-colors cursor-pointer"
                      >
                        {latestRenungan.judul}
                      </h3>
                      {(latestRenungan.ayat || latestRenungan.ayat_alkitab) && (
                        <p className="text-xs text-amber-400 font-semibold italic bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                          &ldquo;{latestRenungan.ayat || latestRenungan.ayat_alkitab}&rdquo;
                        </p>
                      )}
                      <p
                        lang="id"
                        onClick={() => setSelectedRenunganForModal(latestRenungan)}
                        className="text-xs text-slate-300 line-clamp-3 leading-relaxed cursor-pointer hover:text-slate-100 text-justify break-words"
                      >
                        {latestRenungan.isi.length > 180 ? `${latestRenungan.isi.slice(0, 180)}...` : latestRenungan.isi}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 py-6 text-center">Belum ada data renungan terbaru.</p>
                  )}
                </div>

                <div className="pt-3 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Oleh: <strong className="text-slate-200 font-semibold">{latestRenungan?.penulis || 'Gembala Sidang'}</strong></span>
                    <span className="text-[10px] text-slate-400">{latestRenungan?.tanggal || 'Hari Ini'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    {latestRenungan ? (
                      <button
                        onClick={() => setSelectedRenunganForModal(latestRenungan)}
                        className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold flex items-center gap-1.5 cursor-pointer text-xs border border-indigo-400/30 transition-all shadow-md active:scale-95"
                        title="Baca Selengkapnya"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-amber-300" />
                        <span>Baca Selengkapnya</span>
                      </button>
                    ) : <div />}

                    <button
                      onClick={() => onNavigate('renungan')}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600/90 hover:bg-indigo-600 text-white font-extrabold flex items-center gap-1.5 cursor-pointer text-xs border border-indigo-400/30 transition-all shadow-md shadow-indigo-600/20"
                    >
                      <span>Kumpulan Renungan &rarr;</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Latest Pengumuman */}
            {settings.show_pengumuman_widget !== false && (
              <div className={`rounded-3xl ${cardStyleClass} text-white space-y-3 flex flex-col justify-between transition-all duration-300`}>
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
                      <h3 className="font-extrabold text-base text-white text-left tracking-tight">{latestPengumuman.judul}</h3>
                      <p
                        lang="id"
                        className="text-xs text-slate-300 line-clamp-4 leading-relaxed text-justify hyphens-auto [text-align-last:left] [text-justify:inter-word] break-words whitespace-pre-line"
                        style={{
                          textAlign: 'justify',
                          textJustify: 'inter-word',
                          hyphens: 'auto',
                          WebkitHyphens: 'auto',
                          textAlignLast: 'left',
                          wordBreak: 'break-word',
                          overflowWrap: 'break-word',
                        }}
                      >
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
                    onClick={() => onNavigate('pengumuman')}
                    className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Kumpulan Pengumuman &rarr;</span>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Latest Upcoming Event */}
            {settings.show_event_widget !== false && (
              <div className={`rounded-3xl ${cardStyleClass} text-white space-y-3 flex flex-col justify-between transition-all duration-300`}>
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

                      <button
                        onClick={() => handleOpenReservationModal(latestEvent)}
                        className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Ticket className="w-4 h-4" />
                        <span>Reservasi Kursi / Kehadiran</span>
                      </button>
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
            <div className={`rounded-3xl ${cardStyleClass} text-white space-y-4 transition-all duration-300`}>
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

          {/* Transfer Persembahan & Perpuluhan Digital Card for Jemaat & All Users */}
          <div className={`rounded-3xl ${cardStyleClass} p-5 sm:p-6 border border-emerald-500/30 shadow-2xl text-white space-y-6 relative overflow-hidden transition-all duration-300`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/30">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
                    Transfer Digital & QRIS Gereja
                  </span>
                  <h3 className="text-base sm:text-lg font-extrabold text-white">Transfer Persembahan & Perpuluhan</h3>
                </div>
              </div>

              <button
                onClick={() => setIsTransferModalOpen(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
                <span>Kirim / Konfirmasi Transfer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
              {/* Bank Account Info Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Rekening Resmi Gereja</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {settings.rekening_bank_nama || 'Bank BCA'}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Nomor Rekening:</span>
                  <div className="flex items-center justify-between mt-1 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                    <span className="font-mono text-base sm:text-lg font-black text-white tracking-wider">
                      {settings.rekening_bank_nomor || '527-089-1122'}
                    </span>
                    <button
                      onClick={handleCopyBank}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/60 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                    >
                      {copiedBankNum ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedBankNum ? 'Tersalin!' : 'Salin'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Atas Nama Rekening:</span>
                  <p className="font-bold text-slate-200 text-xs sm:text-sm">{settings.rekening_bank_atas_nama || 'Gereja Kemenangan Faith Center'}</p>
                </div>
              </div>

              {/* QRIS Code Preview Card */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-4">
                {settings.qris_image_url ? (
                  <img
                    src={settings.qris_image_url}
                    alt="Barcode QRIS Gereja"
                    className="w-28 h-28 object-contain rounded-xl border-2 border-emerald-500/40 bg-white p-1 shrink-0 shadow-md"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-center p-2 text-slate-500 text-[10px]">
                    QRIS Digital
                  </div>
                )}
                <div className="space-y-1.5 text-xs text-center sm:text-left">
                  <span className="font-extrabold text-white block">QRIS Persembahan Digital</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Pindai QRIS di atas menggunakan GoPay, OVO, Dana, ShopeePay, LinkAja, BCA Mobile, atau aplikasi M-Banking Anda.
                  </p>
                </div>
              </div>
            </div>

            {/* Riwayat Transfer Persembahan Saya */}
            <div className="space-y-3 pt-1">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Riwayat Persembahan Transfer Saya</span>
              </h4>

              {(() => {
                const myTransfers = persembahanList.filter(
                  (p) =>
                    (p.jemaat_id && (p.jemaat_id === currentUser.jemaat_id || p.jemaat_id === currentUser.user_id)) ||
                    (p.nama_pengirim && p.nama_pengirim.toLowerCase() === currentUser.nama.toLowerCase())
                );

                if (myTransfers.length === 0) {
                  return (
                    <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-center text-xs text-slate-400">
                      Belum ada riwayat persembahan transfer. Klik "Kirim / Konfirmasi Transfer" di atas untuk mengirim persembahan.
                    </div>
                  );
                }

                const displayedTransfers = showAllMyTransfers ? myTransfers : myTransfers.slice(0, 1);

                return (
                  <div className="space-y-2">
                    {displayedTransfers.map((p) => {
                      const isPending = p.status === 'PENDING';
                      const isVerified = p.status === 'TERVERIFIKASI' || !p.status;
                      const isRejected = p.status === 'DITOLAK';

                      return (
                        <div
                          key={p.persembahan_id}
                          className="p-3.5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{p.jenis || 'Persembahan'}</span>
                              <span className="text-[10px] text-slate-400 font-mono">({p.tanggal})</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{p.keterangan || '-'}</p>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                            <span className="font-bold text-sm text-emerald-400">
                              Rp {p.jumlah.toLocaleString('id-ID')}
                            </span>

                            {isPending && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-bold">
                                <Clock className="w-3 h-3 text-amber-400" />
                                <span>Menunggu Verifikasi</span>
                              </span>
                            )}
                            {isVerified && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                                <span>Terverifikasi / Diterima</span>
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                                <XCircle className="w-3 h-3 text-rose-400" />
                                <span>Ditolak</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {myTransfers.length > 1 && (
                      <button
                        onClick={() => setShowAllMyTransfers(!showAllMyTransfers)}
                        className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-indigo-300 hover:text-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm mt-1"
                      >
                        {showAllMyTransfers ? (
                          <>
                            <ChevronUp className="w-4 h-4 text-indigo-400" />
                            <span>Sembunyikan (Tampilkan 1 Terbaru Saja)</span>
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 text-indigo-400" />
                            <span>Lihat Selengkapnya ({myTransfers.length - 1} riwayat lagi)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Modal Submit Konfirmasi Transfer */}
          {isTransferModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
              <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-base font-bold">Konfirmasi Transfer Persembahan</h3>
                  </div>
                  <button
                    onClick={() => {
                      setIsTransferModalOpen(false);
                      setTransferMsg(null);
                    }}
                    className="text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {transferMsg && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-bold border ${
                      transferMsg.type === 'success'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {transferMsg.text}
                  </div>
                )}

                <form onSubmit={handleSubmitTransfer} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Jenis / Kategori Persembahan *</label>
                    <select
                      value={transferForm.jenis}
                      onChange={(e) => setTransferForm({ ...transferForm, jenis: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                    >
                      <option value="Persembahan Perpuluhan">Persembahan Perpuluhan (10%)</option>
                      <option value="Persembahan Minggu">Persembahan Minggu</option>
                      <option value="Persembahan Syukur">Persembahan Syukur</option>
                      <option value="Persembahan Kasih Diakonia">Diakonia / Pelayanan</option>
                      <option value="Persembahan Pembangunan">Donasi Pembangunan Gedung</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Nama Pengirim / Atas Nama Rekening *</label>
                    <input
                      type="text"
                      required
                      value={transferForm.nama_pengirim}
                      onChange={(e) => setTransferForm({ ...transferForm, nama_pengirim: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Nominal Persembahan (Rp) *</label>
                    <input
                      type="number"
                      required
                      min={1000}
                      value={transferForm.jumlah}
                      onChange={(e) => setTransferForm({ ...transferForm, jumlah: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-extrabold text-sm text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Metode Pembayaran</label>
                    <select
                      value={transferForm.metode_pembayaran}
                      onChange={(e) => setTransferForm({ ...transferForm, metode_pembayaran: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    >
                      <option value="Transfer Bank">Transfer Bank ({settings.rekening_bank_nama || 'BCA'})</option>
                      <option value="QRIS Digital">QRIS Digital Scan</option>
                    </select>
                  </div>

                  {/* Upload Bukti Transfer */}
                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Unggah / Upload Foto Bukti Transfer</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="URL bukti transfer atau upload file..."
                        value={transferForm.bukti_transfer}
                        onChange={(e) => setTransferForm({ ...transferForm, bukti_transfer: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px] font-mono"
                      />
                      <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Foto</span>
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
                                  setTransferForm({ ...transferForm, bukti_transfer: evt.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1 font-semibold">Catatan / Pokok Doa (Opsional)</label>
                    <input
                      type="text"
                      placeholder="Contoh: Ucapan syukur ulang tahun / perpuluhan bulan Juli"
                      value={transferForm.keterangan}
                      onChange={(e) => setTransferForm({ ...transferForm, keterangan: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={() => setIsTransferModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Kirim Konfirmasi Transfer</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {settings.show_video_widget !== false && settings.video_enabled !== false && (
            <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-4 sm:p-5 overflow-hidden text-white space-y-3 transition-all duration-300 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 animate-pulse shrink-0">
                    <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold text-[10px] uppercase tracking-wider border border-red-500/30">
                        🔴 Live Media Stream
                      </span>
                      <span className="text-[11px] text-slate-400 capitalize">Media: {parsedVideo.type}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                      {currentVideoDisplayTitle}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate('galeri')}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                >
                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Galeri Video &amp; Foto</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {settings.video_description && (
                <p className="text-xs text-slate-300 italic bg-white/5 py-1.5 px-3 rounded-xl border border-white/5">
                  "{settings.video_description}"
                </p>
              )}

              {/* Embedded Video Display */}
              <div className="relative w-full max-w-5xl mx-auto rounded-2xl overflow-hidden bg-black/90 border border-white/10 aspect-video max-h-[380px] sm:max-h-[460px] shadow-2xl">
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
                  <div className="w-full h-full min-h-[160px] flex flex-col items-center justify-center p-4 text-center text-slate-400">
                    <ShieldAlert className="w-10 h-10 text-amber-400 mb-1.5" />
                    <p className="text-xs font-bold text-slate-200">Video Belum Diatur atau Tautan Tidak Sesuai</p>
                    <p className="text-[11px] mt-0.5 max-w-md text-slate-400">
                      Video tayangan ibadah/khotbah belum dikonfigurasi oleh pengurus gereja.
                    </p>
                  </div>
                )}
              </div>

              {/* Gallery Video & Photo Stream Playlist Selector */}
              {allDashboardVideos.length > 0 && (
                <div className="pt-2.5 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-300 flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      Pilih Tayangan Video &amp; Media Terkait:
                    </span>
                    <button
                      onClick={() => onNavigate('galeri')}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold text-[11px] cursor-pointer"
                    >
                      Buka Galeri Media &rarr;
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allDashboardVideos.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setActiveVideoUrl(v.video_url)}
                        className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                          currentVideoUrl === v.video_url
                            ? 'bg-indigo-950/90 border-indigo-500 text-white shadow-lg ring-1 ring-indigo-500/30'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400">
                          <Play className="w-3 h-3 fill-current" />
                          <span>{v.platform || 'Video'} &bull; {v.kategori || 'Ibadah'}</span>
                        </div>
                        <p className="text-[11px] font-semibold mt-0.5 truncate">{v.judul}</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {/* Total Jemaat Card */}
              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-indigo-500/30 flex flex-col justify-between space-y-2 text-white`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider truncate">Total Jemaat</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-md shrink-0">
                    <Users className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-xl sm:text-3xl font-black text-white">{totalJemaat}</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 font-medium">Jiwa</span>
                </div>
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[9px] sm:text-[11px] text-slate-300 gap-1">
                  <span>L: <strong className="text-indigo-300 font-bold">{totalLaki}</strong></span>
                  <span>P: <strong className="text-pink-300 font-bold">{totalPerempuan}</strong></span>
                </div>
              </div>

              {/* Total Keluarga Card */}
              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-purple-500/30 flex flex-col justify-between space-y-2 text-white`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider truncate">Total KK</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-md shrink-0">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
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

              {/* Total Persembahan Card */}
              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-emerald-500/30 flex flex-col justify-between space-y-2 text-white`}>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] sm:text-xs text-slate-300 font-bold uppercase tracking-wider truncate">Kas Persembahan</span>
                  <div className="p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-md shrink-0">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1 flex-wrap">
                  <span className="text-base sm:text-2xl font-black text-emerald-400 leading-tight">
                    Rp {totalPersembahan.toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/10 text-[9px] sm:text-[11px] text-slate-300 truncate">
                  <span>Tersimpan di Kas</span>
                </div>
              </div>

              {/* Event Mendatang Card */}
              <div className={`p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl ${cardStyleClass} border border-amber-500/30 flex flex-col justify-between space-y-2 text-white`}>
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
                  <span>Ibadah & Agenda</span>
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

              {/* Section 4: Pengaturan Lebar Kartu & Layout Dashboard Jemaat */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-indigo-300 block text-xs sm:text-sm">Pengaturan Lebar Kartu Dashboard Jemaat & Mobile View</label>
                  <span className="text-[10px] text-indigo-400 font-mono font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Pilih 1 Opsional</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: 'CONTAINED', label: '🛡️ Standard (Max 5XL)', desc: 'Rekomendasi Desktop' },
                    { id: 'FULL', label: '🖥️ Full Width (100%)', desc: 'Layar Penuh' },
                    { id: 'MOBILE_COMPACT', label: '📱 Compact Mobile', desc: 'Fokus Hape' }
                  ].map((cw) => {
                    const isSelected =
                      (customForm.jemaat_card_width || 'CONTAINED') === cw.id ||
                      (cw.id === 'MOBILE_COMPACT' && customForm.jemaat_card_width === 'COMPACT');
                    return (
                      <button
                        type="button"
                        key={cw.id}
                        onClick={() => setCustomForm({ ...customForm, jemaat_card_width: cw.id as any })}
                        className={`p-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold ring-1 ring-indigo-500/50'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full mb-1">
                          <span className="font-bold text-[11px]">{cw.label}</span>
                          <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                            {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                          </div>
                        </div>
                        <div className="text-[9px] text-slate-500">{cw.desc}</div>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="font-bold text-indigo-300 block text-xs sm:text-sm">Ukuran Density / Padding Kartu</label>
                  <span className="text-[10px] text-indigo-400 font-mono font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Pilih 1 Padding</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'COMPACT', label: '⚡ Ringkas (Hape)' },
                    { id: 'NORMAL', label: '⚖️ Normal Standar' },
                    { id: 'SPACIOUS', label: '✨ Lega & Mewah' }
                  ].map((cs) => {
                    const isSelected = (customForm.card_size || 'NORMAL') === cs.id;
                    return (
                      <button
                        type="button"
                        key={cs.id}
                        onClick={() => setCustomForm({ ...customForm, card_size: cs.id as any })}
                        className={`p-2 rounded-xl text-center border text-xs transition-all cursor-pointer flex items-center justify-between px-2.5 ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-600/20 text-white font-bold ring-1 ring-indigo-500/50'
                            : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span className="truncate">{cs.label}</span>
                        <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ml-1 ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                          {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 space-y-1.5">
                  <label className="block text-indigo-300 font-bold text-xs sm:text-sm">Style Background Banner Jemaat</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {[
                      { id: 'GRADIENT_INDIGO', label: '🌌 Royal Twilight' },
                      { id: 'GRADIENT_GOLD', label: '👑 Golden Grace' },
                      { id: 'GRADIENT_EMERALD', label: '🌿 Emerald Divine' },
                      { id: 'GRADIENT_PURPLE', label: '🔮 Amethyst Majesty' },
                      { id: 'OBSIDIAN_NIGHT', label: '🖤 Obsidian Night' },
                      { id: 'OCEAN_BLUE', label: '🌊 Ocean Waves' }
                    ].map((gb) => {
                      const isSelected = (customForm.jemaat_banner_bg || 'GRADIENT_INDIGO') === gb.id;
                      return (
                        <button
                          type="button"
                          key={gb.id}
                          onClick={() => setCustomForm({ ...customForm, jemaat_banner_bg: gb.id as any })}
                          className={`p-2 rounded-xl border text-left text-[11px] font-bold transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/80 ring-1 ring-indigo-500/50 text-white'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <span className="truncate">{gb.label}</span>
                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center shrink-0 ml-1 ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                            {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <label className="block text-slate-400 font-semibold">Teks Ticker Pengumuman Jemaat</label>
                  <input
                    type="text"
                    value={customForm.jemaat_announcement_text || ''}
                    onChange={(e) => setCustomForm({ ...customForm, jemaat_announcement_text: e.target.value })}
                    placeholder="Contoh: Ibadah Raya Minggu ini pukul 09:00 WIB..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              {/* Section 5: Sakelar Widget Dashboard */}
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

      {/* MODAL RESERVASI KURSI / EVENT UNTUK JEMAAT */}
      {isEventResModalOpen && selectedEventForRes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <Ticket className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">Formulir Reservasi Kursi</h3>
                  <p className="text-[10px] text-amber-300 font-bold truncate max-w-[200px] sm:max-w-[280px]">
                    Event: {selectedEventForRes.nama}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEventResModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {eventResMsg && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold border ${
                  eventResMsg.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}
              >
                {eventResMsg.text}
              </div>
            )}

            <form onSubmit={handleSaveEventReservation} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Lengkap Jemaat *</label>
                <input
                  type="text"
                  required
                  value={eventResForm.nama_jemaat}
                  onChange={(e) => setEventResForm({ ...eventResForm, nama_jemaat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                  placeholder="Nama pemesan kursi..."
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nomor WhatsApp *</label>
                <input
                  type="text"
                  required
                  value={eventResForm.nomor_wa}
                  onChange={(e) => setEventResForm({ ...eventResForm, nomor_wa: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-semibold"
                  placeholder="0812xxxxxxx"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Jumlah Kursi Dipesan *</label>
                <input
                  type="number"
                  required
                  min={1}
                  max={20}
                  value={eventResForm.jumlah_kursi}
                  onChange={(e) => setEventResForm({ ...eventResForm, jumlah_kursi: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-amber-400 font-mono font-extrabold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Catatan Khusus (Opsional)</label>
                <input
                  type="text"
                  placeholder="Contoh: Butuh kursi lansia / dengan anak-anak"
                  value={eventResForm.catatan}
                  onChange={(e) => setEventResForm({ ...eventResForm, catatan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventResModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-400 hover:to-emerald-500 text-white font-extrabold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Kirim Reservasi Ke Admin</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating APK Download Button for Android */}
      <FloatingApkDownloadButton />

      {/* Fullscreen Renungan Modal */}
      <RenunganFullscreenModal
        renungan={selectedRenunganForModal}
        onClose={() => setSelectedRenunganForModal(null)}
      />
    </div>
  );
};
