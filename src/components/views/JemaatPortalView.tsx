import React, { useState, useEffect } from 'react';
import { User, Jemaat, Persembahan, AppSettings, Renungan, EventSchedule, FeaturedVideo, GalleryItem, PrayerRequest } from '../../types';
import { StorageManager } from '../../utils/storage';
import { DEFAULT_CHURCH_LOGO } from '../../data/initialData';
import { getThemeClasses } from '../../utils/themeHelper';
import { parseSocialVideoUrl } from '../../utils/videoHelper';
import {
  UserCheck,
  Edit3,
  Upload,
  Link as LinkIcon,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Check,
  DollarSign,
  Camera,
  ShieldCheck,
  Bell,
  Tv,
  BookOpen,
  Calendar,
  Send,
  Sparkles,
  Heart
} from 'lucide-react';

interface JemaatPortalViewProps {
  currentUser: User;
  settings?: AppSettings;
}

export const JemaatPortalView: React.FC<JemaatPortalViewProps> = ({ currentUser, settings }) => {
  const initialJemaat = React.useMemo(() => {
    const activeUser = StorageManager.getCurrentUser() || currentUser;
    const allJemaat = StorageManager.getJemaat();
    return (
      allJemaat.find((j) => activeUser.jemaat_id && j.jemaat_id === activeUser.jemaat_id) ||
      allJemaat.find((j) => j.nama_lengkap.toLowerCase() === activeUser.nama.toLowerCase()) ||
      allJemaat[0] ||
      null
    );
  }, [currentUser]);

  const [appSettings, setAppSettings] = useState<AppSettings>(() => settings || StorageManager.getSettings());
  const [jemaatData, setJemaatData] = useState<Jemaat | null>(initialJemaat);
  const [personalOfferings, setPersonalOfferings] = useState<Persembahan[]>(() => StorageManager.getPersembahan());
  const [renunganList, setRenunganList] = useState<Renungan[]>(() => StorageManager.getRenungan());
  const [eventsList, setEventsList] = useState<EventSchedule[]>(() => StorageManager.getEvents());
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>(() => StorageManager.getFeaturedVideos());
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(() => StorageManager.getGallery());

  // Video State
  const [activeVideoUrl, setActiveVideoUrl] = useState<string>('');

  // Prayer Request Form State
  const [prayerTopic, setPrayerTopic] = useState('Kesehatan & Pemulihan');
  const [prayerContent, setPrayerContent] = useState('');
  const [prayerSuccess, setPrayerSuccess] = useState('');

  const theme = getThemeClasses(appSettings);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = React.useRef(isEditing);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  const [editName, setEditName] = useState(initialJemaat?.nama_lengkap ?? currentUser.nama ?? '');
  const [editEmail, setEditEmail] = useState(initialJemaat?.email ?? currentUser.email ?? '');
  const [editPhone, setEditPhone] = useState(initialJemaat?.nomor_hp ?? currentUser.no_hp ?? '');
  const [editAddress, setEditAddress] = useState(initialJemaat?.alamat ?? '');
  
  // Photo Edit Mode: 'OFFLINE' (file upload) | 'ONLINE' (url)
  const [photoMode, setPhotoMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [editPhotoUrl, setEditPhotoUrl] = useState(initialJemaat?.foto ?? currentUser.foto ?? '');
  const [photoPreview, setPhotoPreview] = useState(initialJemaat?.foto ?? currentUser.foto ?? '');
  const [saveSuccess, setSaveSuccess] = useState('');

  const loadData = React.useCallback(() => {
    const freshSettings = StorageManager.getSettings();
    setAppSettings((prev) => (JSON.stringify(prev) !== JSON.stringify(freshSettings) ? freshSettings : prev));

    const activeUser = StorageManager.getCurrentUser() || currentUser;
    const allJemaat = StorageManager.getJemaat();
    const found =
      allJemaat.find((j) => activeUser.jemaat_id && j.jemaat_id === activeUser.jemaat_id) ||
      allJemaat.find((j) => j.nama_lengkap.toLowerCase() === activeUser.nama.toLowerCase()) ||
      allJemaat[0];

    if (found) {
      setJemaatData((prev) => (JSON.stringify(prev) !== JSON.stringify(found) ? found : prev));
      if (!isEditingRef.current) {
        setEditName(found.nama_lengkap ?? activeUser.nama ?? '');
        setEditEmail(found.email ?? activeUser.email ?? '');
        setEditPhone(found.nomor_hp ?? activeUser.no_hp ?? '');
        setEditAddress(found.alamat ?? '');
        setEditPhotoUrl(found.foto ?? '');
        setPhotoPreview(found.foto ?? '');
      }
    }

    const allPersembahan = StorageManager.getPersembahan();
    setPersonalOfferings(allPersembahan.slice(0, 5));

    setRenunganList(StorageManager.getRenungan());
    setEventsList(StorageManager.getEvents());
    setFeaturedVideos(StorageManager.getFeaturedVideos());
    setGalleryList(StorageManager.getGallery());
  }, [currentUser]);

  useEffect(() => {
    if (settings) {
      setAppSettings(settings);
    }
  }, [settings]);

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    const unsubscribe = StorageManager.subscribe(handleSync);
    window.addEventListener('cms_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    const intervalId = setInterval(loadData, 1500);

    return () => {
      unsubscribe();
      window.removeEventListener('cms_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(intervalId);
    };
  }, [loadData]);

  // Combined Videos for Jemaat Feed
  const allJemaatVideos = React.useMemo(() => {
    const combined: { id: string; judul: string; video_url: string; kategori: string }[] = [];
    const addedUrls = new Set<string>();

    featuredVideos.forEach((v) => {
      const url = v.video_url ? v.video_url.trim() : '';
      if (url && parseSocialVideoUrl(url).isValid && !addedUrls.has(url)) {
        addedUrls.add(url);
        combined.push({ id: v.video_id, judul: v.judul, video_url: url, kategori: v.kategori || 'Video Utama' });
      }
    });

    galleryList.forEach((g) => {
      const url = (g.video_url || (g.tipe === 'Video' ? g.foto : '')).trim();
      if (url && parseSocialVideoUrl(url).isValid && !addedUrls.has(url)) {
        addedUrls.add(url);
        combined.push({ id: g.gallery_id, judul: g.judul, video_url: url, kategori: g.kategori || 'Galeri' });
      }
    });

    if (appSettings.video_url && parseSocialVideoUrl(appSettings.video_url).isValid) {
      const sUrl = appSettings.video_url.trim();
      if (!addedUrls.has(sUrl)) {
        addedUrls.add(sUrl);
        combined.unshift({
          id: 'SETTING-VID',
          judul: appSettings.video_title || 'Tayangan Ibadah Terbaru',
          video_url: sUrl,
          kategori: 'Ibadah Utama'
        });
      }
    }

    return combined;
  }, [featuredVideos, galleryList, appSettings.video_url, appSettings.video_title]);

  const activeVideoItem = allJemaatVideos.find((v) => v.video_url === activeVideoUrl) || allJemaatVideos[0];
  const currentVideoUrl = activeVideoUrl || activeVideoItem?.video_url || appSettings.video_url || '';
  const parsedVideo = parseSocialVideoUrl(currentVideoUrl);

  // Dynamic Layout Width
  let widthClass = 'max-w-5xl mx-auto px-2 sm:px-4';
  if (appSettings.jemaat_card_width === 'FULL') widthClass = 'w-full px-1 sm:px-4';
  if (appSettings.jemaat_card_width === 'COMPACT' || appSettings.jemaat_card_width === 'MOBILE_COMPACT') widthClass = 'max-w-3xl mx-auto px-1 sm:px-3';
  if (appSettings.jemaat_card_width === 'CONTAINED') widthClass = 'max-w-5xl mx-auto px-2 sm:px-4';

  // Dynamic Card Density
  let cardPaddingClass = 'p-5 sm:p-6';
  if (appSettings.card_size === 'COMPACT') cardPaddingClass = 'p-3.5 sm:p-4 text-xs';
  if (appSettings.card_size === 'SPACIOUS') cardPaddingClass = 'p-6 sm:p-8 text-sm';

  // Dynamic Banner Background
  let bannerBgClass = 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-900/20';
  switch (appSettings.jemaat_banner_bg) {
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

  const handleToggleEditing = (open?: boolean) => {
    const nextState = open !== undefined ? open : !isEditing;
    if (nextState) {
      const activeUser = StorageManager.getCurrentUser() || currentUser;
      setEditName(jemaatData?.nama_lengkap ?? activeUser.nama ?? '');
      setEditEmail(jemaatData?.email ?? activeUser.email ?? '');
      setEditPhone(jemaatData?.nomor_hp ?? activeUser.no_hp ?? '');
      setEditAddress(jemaatData?.alamat ?? '');
      setEditPhotoUrl(jemaatData?.foto ?? '');
      setPhotoPreview(jemaatData?.foto ?? '');
    }
    setIsEditing(nextState);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran foto terlalu besar. Maksimal 5 MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotoPreview(base64String);
        setEditPhotoUrl(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Nama tidak boleh kosong');
      return;
    }

    const activeUser = StorageManager.getCurrentUser() || currentUser;
    const allJemaat = StorageManager.getJemaat();
    const finalPhoto = editPhotoUrl.trim() || photoPreview || DEFAULT_CHURCH_LOGO;

    let updatedJemaatList = [...allJemaat];
    let targetIndex = updatedJemaatList.findIndex(
      (j) =>
        (jemaatData && j.jemaat_id === jemaatData.jemaat_id) ||
        (activeUser.jemaat_id && j.jemaat_id === activeUser.jemaat_id) ||
        j.nama_lengkap.toLowerCase() === activeUser.nama.toLowerCase()
    );

    const targetJemaatId =
      targetIndex >= 0
        ? updatedJemaatList[targetIndex].jemaat_id
        : activeUser.jemaat_id || `JMT-${Date.now().toString().slice(-4)}`;

    const updatedRecord: Jemaat = {
      jemaat_id: targetJemaatId,
      nik: targetIndex >= 0 ? updatedJemaatList[targetIndex].nik : '3171000000000000',
      no_kk: targetIndex >= 0 ? updatedJemaatList[targetIndex].no_kk : '3171000000000000',
      nama_lengkap: editName.trim(),
      jenis_kelamin: targetIndex >= 0 ? updatedJemaatList[targetIndex].jenis_kelamin : 'Laki-laki',
      tempat_lahir: targetIndex >= 0 ? updatedJemaatList[targetIndex].tempat_lahir : 'Jakarta',
      tanggal_lahir: targetIndex >= 0 ? updatedJemaatList[targetIndex].tanggal_lahir : '1995-01-01',
      alamat: editAddress.trim(),
      wilayah: targetIndex >= 0 ? updatedJemaatList[targetIndex].wilayah : 'Wilayah I - Sunter',
      komisi: targetIndex >= 0 ? updatedJemaatList[targetIndex].komisi : 'Komisi Pria (Bapa)',
      status_baptis: targetIndex >= 0 ? updatedJemaatList[targetIndex].status_baptis : 'Sudah',
      status_sidi: targetIndex >= 0 ? updatedJemaatList[targetIndex].status_sidi : 'Sudah',
      status_pernikahan: targetIndex >= 0 ? updatedJemaatList[targetIndex].status_pernikahan : 'Belum Menikah',
      pekerjaan: targetIndex >= 0 ? updatedJemaatList[targetIndex].pekerjaan : 'Swasta',
      nomor_hp: editPhone.trim(),
      email: editEmail.trim(),
      foto: finalPhoto,
      status: 'Aktif'
    };

    if (targetIndex >= 0) {
      updatedJemaatList[targetIndex] = updatedRecord;
    } else {
      updatedJemaatList.unshift(updatedRecord);
    }

    StorageManager.saveJemaat(updatedJemaatList);
    setJemaatData(updatedRecord);

    const updatedUser: User = {
      ...activeUser,
      nama: editName.trim(),
      email: editEmail.trim(),
      no_hp: editPhone.trim(),
      jemaat_id: targetJemaatId
    };
    StorageManager.saveCurrentUser(updatedUser);

    const allUsers = StorageManager.getUsers();
    const updatedUsers = allUsers.map((u) => (u.user_id === activeUser.user_id ? updatedUser : u));
    StorageManager.saveUsers(updatedUsers);

    window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { action: 'profile_updated' } }));

    StorageManager.logActivity(
      activeUser.username,
      `Mengubah profil & foto profil mandiri Jemaat (${activeUser.nama})`,
      'JemaatManagement'
    );

    setSaveSuccess('Profil & foto berhasil disimpan!');
    setTimeout(() => {
      setSaveSuccess('');
      setIsEditing(false);
    }, 1200);
  };

  const handleSendPrayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prayerContent.trim()) {
      alert('Isi permohonan doa wajib diisi.');
      return;
    }

    const currentPrayers = StorageManager.getPrayerRequests();
    const newReq: PrayerRequest = {
      prayer_id: `DOA-${Date.now().toString().slice(-4)}`,
      jemaat_name: jemaatData?.nama_lengkap || currentUser.nama || 'Jemaat FC',
      topik: prayerTopic,
      permohonan: prayerContent.trim(),
      tanggal: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'Diterima',
      is_private: true
    };

    StorageManager.savePrayerRequests([newReq, ...currentPrayers]);
    StorageManager.logActivity(currentUser.username, `Mengirimkan permohonan doa topic: ${prayerTopic}`, 'PrayerRequest');

    setPrayerContent('');
    setPrayerSuccess('Permohonan doa Anda telah terkirim ke Tim Doa Syafaat Gereja!');
    setTimeout(() => setPrayerSuccess(''), 4000);
  };

  const latestRenungan = renunganList.length > 0 ? renunganList[0] : null;

  return (
    <div className={`space-y-6 pb-12 animate-fade-in ${widthClass}`}>
      {/* 1. Ticker Running Pengumuman Banner */}
      {appSettings.show_jemaat_announcement_banner !== false && appSettings.jemaat_announcement_text && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-white flex items-center gap-3 shadow-lg overflow-hidden">
          <div className="px-3 py-1 rounded-xl bg-indigo-600 text-[10px] sm:text-xs font-extrabold uppercase tracking-wider shrink-0 flex items-center gap-1.5 shadow">
            <Bell className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
            <span>Pengumuman</span>
          </div>
          <div className="overflow-hidden flex-1 text-xs sm:text-sm font-semibold text-indigo-100">
            <p className="inline-block font-medium leading-relaxed">{appSettings.jemaat_announcement_text}</p>
          </div>
        </div>
      )}

      {/* 2. Welcome Banner */}
      <div className={`rounded-3xl ${bannerBgClass} border ${cardPaddingClass} text-white relative overflow-hidden transition-all duration-300`}>
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <img
                src={jemaatData?.foto || currentUser.foto || photoPreview || DEFAULT_CHURCH_LOGO}
                alt="Foto Profil"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-indigo-500 shadow-xl shadow-indigo-500/20"
              />
              <button
                onClick={() => handleToggleEditing(true)}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg border border-white/20 transition-all cursor-pointer"
                title="Ganti Foto Profil"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{appSettings.jemaat_banner_title || 'Shalom & Selamat Datang'}</span>
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                Shalom, {jemaatData?.nama_lengkap || currentUser.nama}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                {appSettings.jemaat_banner_subtitle || 'Portal Layanan Jemaat Resmi & Sistem Informasi Terpadu'} • ID:{' '}
                <strong className="text-indigo-300 font-mono">{jemaatData?.jemaat_id}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => handleToggleEditing()}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <Edit3 className="w-4 h-4" />
            <span>{isEditing ? 'Tutup Edit' : 'Edit Profil & Foto'}</span>
          </button>
        </div>
      </div>

      {/* 3. EDIT PROFILE FORM SECTION */}
      {isEditing && (
        <div className="rounded-3xl bg-slate-900/95 border-2 border-indigo-500/50 p-6 shadow-2xl text-white space-y-6 animate-slide-down">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-indigo-400" />
              <span>Edit Profil & Ganti Foto Profil</span>
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {saveSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{saveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* PHOTO EDIT SECTION */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
              <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider block">
                Opsi Ganti Foto Profil:
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoMode('OFFLINE')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    photoMode === 'OFFLINE'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Foto (Offline File)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPhotoMode('ONLINE')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    photoMode === 'ONLINE'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" />
                  <span>Link URL Gambar (Online)</span>
                </button>
              </div>

              {photoMode === 'OFFLINE' ? (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block">Pilih File Foto dari Perangkat / HP:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="w-full text-xs text-slate-300 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer bg-slate-900 p-2 rounded-xl border border-slate-700"
                  />
                  <p className="text-[10px] text-slate-500">Mendukung format JPG, PNG, WEBP (Otomatis tersimpan offline).</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs text-slate-400 block">Masukkan Link URL Gambar Online:</label>
                  <input
                    type="url"
                    value={editPhotoUrl}
                    onChange={(e) => {
                      setEditPhotoUrl(e.target.value);
                      setPhotoPreview(e.target.value);
                    }}
                    placeholder="https://example.com/foto.jpg"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              )}

              {photoPreview && (
                <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
                  <span className="text-xs text-slate-400">Preview Foto Baru:</span>
                  <img
                    src={photoPreview}
                    alt="Preview"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
                    }}
                    className="w-12 h-12 rounded-xl object-cover border border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* TEXT INPUTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Nama Lengkap Jemaat:</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">No. Handphone / WhatsApp:</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Alamat Email:</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-300">Alamat Tempat Tinggal:</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Perubahan Profil</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Feed Video Media Sosial (If Enabled by SuperAdmin) */}
      {appSettings.show_jemaat_social_video !== false && parsedVideo.isValid && (
        <div className={`rounded-3xl ${theme.cardClass} ${cardPaddingClass} transition-all duration-300 space-y-4`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Tv className="w-5 h-5 text-indigo-400" />
              <span>Tayangan Video Ibadah & Khotbah Terbaru</span>
            </h3>
            <span className="text-[11px] text-indigo-300 font-bold bg-indigo-500/20 px-2.5 py-1 rounded-full border border-indigo-500/30">
              {activeVideoItem?.judul || 'Streaming YouTube'}
            </span>
          </div>

          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl">
            <iframe
              src={parsedVideo.embedUrl}
              title={activeVideoItem?.judul || 'Video Stream'}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {allJemaatVideos.length > 1 && (
            <div className="pt-2 border-t border-white/10">
              <span className="text-xs font-bold text-slate-300 block mb-2">Daftar Video Lainnya:</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allJemaatVideos.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setActiveVideoUrl(v.video_url)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      currentVideoUrl === v.video_url
                        ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                        : 'bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xs truncate">{v.judul}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{v.kategori}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}      {/* 5. Member Profile Details & Status Sakramen Card */}
      {appSettings.show_jemaat_sacraments_card !== false && (
        <div className={`rounded-3xl ${theme.cardClass} ${cardPaddingClass} transition-all duration-300 space-y-4`}>

          <h3 className="text-base font-bold flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <UserCheck className={`w-5 h-5 ${theme.accentText}`} />
              <span>Informasi Keanggotaan & Status Sakramen</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">Sektor: {jemaatData?.wilayah || 'Utama'}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <span className="text-slate-400 block font-semibold">Identitas KTP / KK:</span>
              <p className="font-mono text-slate-200 font-bold text-sm">{jemaatData?.nik || '-'}</p>
              <p className="text-[11px] text-slate-400">No. KK: {jemaatData?.no_kk || '-'}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <span className="text-slate-400 block font-semibold">Status Sakramen Gereja:</span>
              <p className="text-emerald-400 font-bold">Baptis Kudus: {jemaatData?.status_baptis || 'Sudah'}</p>
              <p className="text-blue-400 font-bold">Sidi Gereja: {jemaatData?.status_sidi || 'Sudah'}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <span className="text-slate-400 block font-semibold">Komisi & Pelayanan:</span>
              <p className={`${theme.accentText} font-bold text-sm`}>{jemaatData?.komisi || 'Jemaat Umum'}</p>
              <p className="text-[11px] text-slate-400">Status Keanggotaan: {jemaatData?.status || 'Aktif'}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <span className="text-slate-400 block font-semibold flex items-center gap-1">
                <Phone className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>Kontak HP / WA:</span>
              </span>
              <p className="text-slate-200 font-bold text-xs">{jemaatData?.nomor_hp || currentUser.no_hp || '-'}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <span className="text-slate-400 block font-semibold flex items-center gap-1">
                <Mail className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>Email:</span>
              </span>
              <p className="text-slate-200 font-bold text-xs truncate">{jemaatData?.email || currentUser.email || '-'}</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
              <span className="text-slate-400 block font-semibold flex items-center gap-1">
                <MapPin className={`w-3.5 h-3.5 ${theme.accentText}`} />
                <span>Alamat Domisili:</span>
              </span>
              <p className="text-slate-200 font-bold text-xs">{jemaatData?.alamat || '-'}</p>
            </div>
          </div>
        </div>
      )}

      {/* 6. Renungan Harian Widget (If Enabled) */}
      {appSettings.show_jemaat_daily_renungan !== false && latestRenungan && (
        <div className={`rounded-3xl ${theme.cardClass} ${cardPaddingClass} transition-all duration-300 space-y-4`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-400" />
              <span>Renungan Harian Terbaru</span>
            </h3>
            <span className="text-xs text-amber-300 font-semibold">{latestRenungan.tanggal}</span>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-white space-y-3">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold inline-block border border-amber-500/30">
              📖 {latestRenungan.ayat || latestRenungan.ayat_alkitab || 'Ayat Alkitab Hari Ini'}
            </span>
            <h4 className="text-lg font-extrabold text-amber-200">{latestRenungan.judul}</h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line line-clamp-4">
              {latestRenungan.isi}
            </p>
            {latestRenungan.penulis && (
              <p className="text-[11px] text-amber-400 font-semibold pt-2 border-t border-amber-500/20">
                Oleh: {latestRenungan.penulis}
              </p>
            )}
          </div>
        </div>
      )}

      {/* 7. Event & Jadwal Ibadah Widget (If Enabled) */}
      {appSettings.show_jemaat_event_jadwal !== false && eventsList.length > 0 && (
        <div className={`rounded-3xl ${theme.cardClass} ${cardPaddingClass} transition-all duration-300 space-y-4`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              <span>Jadwal Ibadah & Agenda Gereja Mendatang</span>
            </h3>
            <span className="text-xs text-slate-400">{eventsList.length} Agenda</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {eventsList.slice(0, 4).map((evt) => (
              <div key={evt.event_id} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1.5 hover:border-indigo-500/50 transition-all">
                <div className="flex items-center justify-between text-indigo-300 font-bold">
                  <span>{evt.kategori || 'Ibadah Raya'}</span>
                  <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded-full border border-indigo-500/30">
                    {evt.jam} WIB
                  </span>
                </div>
                <h5 className="font-extrabold text-white text-sm">{evt.nama}</h5>
                <p className="text-slate-300 flex items-center gap-1 text-[11px]">
                  <Calendar className="w-3 h-3 text-emerald-400" />
                  <span>{evt.tanggal}</span>
                  {evt.lokasi && (
                    <>
                      • <MapPin className="w-3 h-3 text-rose-400" />
                      <span>{evt.lokasi}</span>
                    </>
                  )}
                </p>
                {evt.pembicara && (
                  <p className="text-slate-400 text-[10px] italic pt-1 border-t border-white/5">
                    Pembicara: {evt.pembicara}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 8. Form Kirim Permohonan Doa Jemaat (If Enabled) */}
      {appSettings.show_jemaat_quick_doa !== false && (
        <div className={`rounded-3xl ${theme.cardClass} ${cardPaddingClass} transition-all duration-300 space-y-4`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-rose-400" />
              <span>Kirim Permohonan Doa Syafaat Jemaat</span>
            </h3>
            <span className="text-xs text-slate-400">Kerahasiaan Terjamin</span>
          </div>

          {prayerSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>{prayerSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSendPrayer} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Kategori Doa:</label>
                <select
                  value={prayerTopic}
                  onChange={(e) => setPrayerTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white font-semibold focus:outline-none focus:border-indigo-500"
                >
                  <option value="Kesehatan & Pemulihan">Kesehatan & Pemulihan Sakit</option>
                  <option value="Keluarga & Pernikahan">Keharmonisan Keluarga & Rumah Tangga</option>
                  <option value="Pekerjaan & Usaha">Pekerjaan, Karir & Usaha Bisnis</option>
                  <option value="Masa Depan & Studi">Studi & Masa Depan Anak</option>
                  <option value="Kekuatan Iman & Ucapan Syukur">Kekuatan Kerohanian & Ucapan Syukur</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nama Pemohon (Otomatis):</label>
                <input
                  type="text"
                  readOnly
                  value={jemaatData?.nama_lengkap || currentUser.nama}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-400 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1 font-semibold">Isi Pokok Permohonan Doa:</label>
              <textarea
                rows={3}
                required
                value={prayerContent}
                onChange={(e) => setPrayerContent(e.target.value)}
                placeholder="Tuliskan isi pokok doa Anda secara khusus..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-white text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Kirimkan Pokok Doa ke Tim Doa Syafaat</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 9. Riwayat Catatan Persembahan Personal (If Enabled) */}
      {appSettings.show_jemaat_offering_history !== false && (
        <div className={`rounded-3xl ${theme.cardClass} ${cardPaddingClass} transition-all duration-300 space-y-4`}>
          <h3 className="text-base font-bold flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-400" />
              <span>Catatan Histori Persembahan Personal</span>
            </div>
            <span className="text-xs text-slate-400 font-normal">Tercatat: {personalOfferings.length} Data</span>
          </h3>

          {personalOfferings.length === 0 ? (
            <p className="text-xs text-slate-400 py-3">Belum ada data persembahan personal tercatat.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {personalOfferings.map((po) => (
                <div key={po.persembahan_id} className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs space-y-1">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {po.kategori || 'Gereja'}
                  </span>
                  <p className="font-extrabold text-white text-base mt-1">
                    Rp {po.jumlah.toLocaleString('id-ID')}
                  </p>
                  <p className="text-slate-400">{po.tanggal} • {po.metode_pembayaran || 'Tunai'}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
