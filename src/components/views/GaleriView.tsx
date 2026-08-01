import React, { useState, useEffect, useRef } from 'react';
import { GalleryItem, User, FeaturedVideo } from '../../types';
import { StorageManager } from '../../utils/storage';
import { parseSocialVideoUrl } from '../../utils/videoHelper';
import {
  Image as ImageIcon,
  Video,
  Plus,
  Trash2,
  Filter,
  Play,
  Upload,
  X,
  ExternalLink,
  Sparkles,
  Calendar,
  Tag,
  CheckCircle2,
  Tv,
  HardDrive,
  FolderPlus,
  FileImage,
  UploadCloud
} from 'lucide-react';

interface GaleriViewProps {
  currentUser: User;
  initialTab?: 'GALLERY' | 'SOCIAL_VIDEOS';
}

export const GaleriView: React.FC<GaleriViewProps> = ({ currentUser, initialTab = 'GALLERY' }) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const [activeTab, setActiveTab] = useState<'GALLERY' | 'SOCIAL_VIDEOS'>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [galleryList, setGalleryList] = useState<GalleryItem[]>(() => StorageManager.getGallery());
  const [featuredVideos, setFeaturedVideos] = useState<FeaturedVideo[]>(() => StorageManager.getFeaturedVideos());
  const [activeType, setActiveType] = useState<'ALL' | 'Foto' | 'Video'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<GalleryItem | null>(null);

  // File input ref for local/offline image uploading
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [offlineFileName, setOfflineFileName] = useState<string>('');

  const handleOfflineFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Mohon pilih file gambar yang valid (JPG, PNG, WEBP, GIF)!');
      return;
    }

    setOfflineFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setMediaForm((prev) => ({
          ...prev,
          foto: result,
          judul: prev.judul || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        }));
      }
    };
    reader.readAsDataURL(file);
  };
  const [mediaForm, setMediaForm] = useState({
    judul: '',
    tipe: 'Foto' as 'Foto' | 'Video',
    foto: '',
    video_url: '',
    kategori: 'Ibadah',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: ''
  });

  // Add Featured Social Video Form
  const [videoForm, setVideoForm] = useState({
    judul: '',
    video_url: '',
    keterangan: '',
    platform: 'YouTube' as 'YouTube' | 'TikTok' | 'Instagram' | 'Direct',
    kategori: 'Ibadah Raya',
    is_active: true
  });

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    window.addEventListener('cms_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    const intervalId = setInterval(loadData, 1000);

    return () => {
      window.removeEventListener('cms_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(intervalId);
    };
  }, []);

  const loadData = () => {
    const g = StorageManager.getGallery();
    setGalleryList((prev) => (JSON.stringify(prev) !== JSON.stringify(g) ? g : prev));
    const f = StorageManager.getFeaturedVideos();
    setFeaturedVideos((prev) => (JSON.stringify(prev) !== JSON.stringify(f) ? f : prev));
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.judul) return;

    const vUrl = mediaForm.video_url || (mediaForm.tipe === 'Video' ? mediaForm.foto : '');

    const newItem: GalleryItem = {
      gallery_id: `GAL-2026-${(galleryList.length + 1).toString().padStart(3, '0')}`,
      judul: mediaForm.judul,
      tipe: mediaForm.tipe,
      foto: mediaForm.foto || (mediaForm.tipe === 'Foto' ? 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'),
      video_url: vUrl,
      kategori: mediaForm.kategori,
      tanggal: mediaForm.tanggal,
      keterangan: mediaForm.keterangan,
      penulis: currentUser.nama || 'Sekretariat'
    };

    const updated = [newItem, ...galleryList];
    setGalleryList(updated);
    StorageManager.saveGallery(updated);

    // Auto sync video items to Featured Videos for live stream stream display
    if (mediaForm.tipe === 'Video' && vUrl) {
      const parsed = parseSocialVideoUrl(vUrl);
      const newFeat: FeaturedVideo = {
        video_id: `VID-${Date.now().toString().slice(-4)}`,
        judul: mediaForm.judul,
        video_url: vUrl,
        keterangan: mediaForm.keterangan,
        is_active: true,
        tanggal: mediaForm.tanggal,
        platform: parsed.type === 'youtube' ? 'YouTube' : parsed.type === 'tiktok' ? 'TikTok' : parsed.type === 'instagram' ? 'Instagram' : 'Direct',
        kategori: mediaForm.kategori
      };
      const existing = StorageManager.getFeaturedVideos().map((v) => ({ ...v, is_active: false }));
      const updatedFeats = [newFeat, ...existing];
      StorageManager.saveFeaturedVideos(updatedFeats);
      setFeaturedVideos(updatedFeats);
    }

    StorageManager.logActivity(currentUser.username, `Mengunggah media galeri: ${newItem.judul}`, 'Galeri');

    setIsAddModalOpen(false);
    setMediaForm({
      judul: '',
      tipe: 'Foto',
      foto: '',
      video_url: '',
      kategori: 'Ibadah',
      tanggal: new Date().toISOString().slice(0, 10),
      keterangan: ''
    });
  };

  const handleSaveSocialVideo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoForm.judul || !videoForm.video_url) return;

    const parsed = parseSocialVideoUrl(videoForm.video_url);

    const newVideo: FeaturedVideo = {
      video_id: `VID-${Date.now().toString().slice(-4)}`,
      judul: videoForm.judul,
      video_url: videoForm.video_url,
      keterangan: videoForm.keterangan,
      is_active: videoForm.is_active,
      tanggal: new Date().toISOString().slice(0, 10),
      platform: parsed.type === 'youtube' ? 'YouTube' : parsed.type === 'tiktok' ? 'TikTok' : parsed.type === 'instagram' ? 'Instagram' : 'Direct',
      kategori: videoForm.kategori
    };

    let updatedList = [...featuredVideos];
    if (videoForm.is_active) {
      updatedList = updatedList.map((v) => ({ ...v, is_active: false }));
    }
    updatedList = [newVideo, ...updatedList];

    setFeaturedVideos(updatedList);
    StorageManager.saveFeaturedVideos(updatedList);
    StorageManager.logActivity(currentUser.username, `Menambahkan video media sosial: ${newVideo.judul}`, 'Galeri');

    setIsVideoModalOpen(false);
    setVideoForm({
      judul: '',
      video_url: '',
      keterangan: '',
      platform: 'YouTube',
      kategori: 'Ibadah Raya',
      is_active: true
    });
  };

  const handleActivateSocialVideo = (id: string) => {
    const updated = featuredVideos.map((v) => ({
      ...v,
      is_active: v.video_id === id
    }));
    setFeaturedVideos(updated);
    StorageManager.saveFeaturedVideos(updated);
    StorageManager.logActivity(currentUser.username, `Mengaktifkan tayangan video utama ID ${id}`, 'Galeri');
  };

  const handleDeleteSocialVideo = (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus video media sosial ini?')) return;
    const updated = featuredVideos.filter((v) => v.video_id !== id);
    if (updated.length > 0 && !updated.some((v) => v.is_active)) {
      updated[0].is_active = true;
    }
    setFeaturedVideos(updated);
    StorageManager.saveFeaturedVideos(updated);
    StorageManager.logActivity(currentUser.username, `Menghapus video media sosial ID ${id}`, 'Galeri');
  };

  const handleDeleteMedia = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus media ini dari galeri?')) return;

    const updated = galleryList.filter((g) => g.gallery_id !== id);
    setGalleryList(updated);
    StorageManager.saveGallery(updated);
    StorageManager.logActivity(currentUser.username, `Menghapus media galeri ID ${id}`, 'Galeri');
  };

  const categories = ['SEMUA', 'Ibadah', 'Youth & Pemuda', 'Event & Paskah', 'Diakonia', 'Konser Musik', 'Lainnya'];

  const filteredItems = galleryList.filter((item) => {
    const itemType = item.tipe || (item.video_url ? 'Video' : 'Foto');
    const matchesType = activeType === 'ALL' || itemType === activeType;
    const matchesCat = selectedCategory === 'SEMUA' || item.kategori === selectedCategory;
    return matchesType && matchesCat;
  });

  return (
    <div className="space-y-6">
      {/* Header Galeri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-400" />
            <span>Galeri & Video Media Sosial</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola foto dokumentasi peribadatan dan tautan video media sosial (YouTube / Reels / TikTok) untuk tayangan Dashboard Jemaat & Admin.
          </p>
        </div>

        {/* Tab Selector & Add Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="p-1 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setActiveTab('GALLERY')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'GALLERY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              <span>Galeri Foto</span>
            </button>
            <button
              onClick={() => setActiveTab('SOCIAL_VIDEOS')}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'SOCIAL_VIDEOS' ? 'bg-rose-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video Media Sosial ({featuredVideos.length})</span>
            </button>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2">
              {activeTab === 'GALLERY' && (
                <button
                  onClick={() => {
                    setOfflineFileName('');
                    setIsAddModalOpen(true);
                    setTimeout(() => {
                      fileInputRef.current?.click();
                    }, 200);
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all active:scale-95 border border-emerald-400/30 cursor-pointer"
                  title="Pilih dan upload file gambar dari galeri HP atau disk komputer lokal"
                >
                  <HardDrive className="w-4 h-4 text-emerald-200" />
                  <span>Unggah File Offline (Lokal)</span>
                </button>
              )}

              <button
                onClick={() => (activeTab === 'GALLERY' ? setIsAddModalOpen(true) : setIsVideoModalOpen(true))}
                className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{activeTab === 'GALLERY' ? 'Tambah Form Media' : 'Tambah Video Media Sosial'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* TAB 1: GALERI FOTO & DOKUMENTASI */}
      {activeTab === 'GALLERY' && (
        <>
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
            {/* Tipe Filter: Semua / Foto / Video */}
            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveType('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeType === 'ALL' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                Semua Media ({galleryList.length})
              </button>
              <button
                onClick={() => setActiveType('Foto')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeType === 'Foto' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Foto</span>
              </button>
              <button
                onClick={() => setActiveType('Video')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  activeType === 'Video' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Video className="w-3.5 h-3.5 text-rose-400" />
                <span>Video Liputan</span>
              </button>
            </div>

            {/* Kategori Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              <Filter className="w-4 h-4 text-slate-500 shrink-0 hidden sm:block" />
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-800 text-indigo-300 border border-indigo-500/40'
                      : 'text-slate-400 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Grid Galeri Items */}
          {filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <ImageIcon className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-semibold">Belum ada foto atau video dalam kategori ini.</p>
              {isAdmin && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Unggah Sekarang</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredItems.map((item) => {
                const isVideo = item.tipe === 'Video' || !!item.video_url;

                return (
                  <div
                    key={item.gallery_id}
                    onClick={() => {
                      if (isVideo) setSelectedVideo(item);
                      else setSelectedPhoto(item);
                    }}
                    className="group relative rounded-3xl bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 overflow-hidden shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col"
                  >
                    {/* Media Image / Thumbnail Container */}
                    <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
                      <img
                        src={item.foto || 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80'}
                        alt={item.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80';
                        }}
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                      {/* Top Badge */}
                      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 z-10">
                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider text-white shadow-md backdrop-blur-md flex items-center gap-1 ${
                          isVideo ? 'bg-rose-600/80 border border-rose-500/50' : 'bg-indigo-600/80 border border-indigo-500/50'
                        }`}>
                          {isVideo ? <Video className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                          <span>{isVideo ? 'VIDEO' : 'FOTO'}</span>
                        </span>

                        {item.kategori && (
                          <span className="px-2.5 py-1 rounded-xl bg-slate-900/80 text-slate-300 border border-slate-700/60 text-[10px] font-bold backdrop-blur-md truncate max-w-[120px]">
                            {item.kategori}
                          </span>
                        )}
                      </div>

                      {/* Center Play Button for Videos */}
                      {isVideo && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                          <div className="p-3.5 rounded-full bg-rose-600/90 text-white shadow-2xl group-hover:scale-110 transition-transform border border-white/20">
                            <Play className="w-6 h-6 fill-current ml-0.5" />
                          </div>
                        </div>
                      )}

                      {/* Delete Button for Admin */}
                      {isAdmin && (
                        <button
                          onClick={(e) => handleDeleteMedia(item.gallery_id, e)}
                          className="absolute bottom-3 right-3 p-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white shadow-lg z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Hapus Media"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                      <h3 className="font-bold text-white text-sm line-clamp-2 leading-snug group-hover:text-indigo-300 transition-colors">
                        {item.judul}
                      </h3>

                      {item.keterangan && (
                        <p className="text-xs text-slate-400 line-clamp-2 font-normal">
                          {item.keterangan}
                        </p>
                      )}

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-indigo-400" />
                          {item.tanggal}
                        </span>
                        <span>Oleh: {item.penulis || 'Admin'}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* TAB 2: VIDEO MEDIA SOSIAL DASHBOARD (YouTube / Reels / TikTok) */}
      {activeTab === 'SOCIAL_VIDEOS' && (
        <div className="space-y-6">
          <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 text-slate-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Tv className="w-4 h-4 text-rose-400" />
                <span>Pengaturan Tayangan Video Media Sosial Dashboard</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih video media sosial mana yang ditampilkan secara otomatis di Dashboard Utama Admin & Portal Jemaat.
              </p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Link Video Baru</span>
              </button>
            )}
          </div>

          {featuredVideos.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/50 border border-slate-800 space-y-3">
              <Video className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-slate-400 text-sm font-semibold">Belum ada tautan video media sosial yang terdaftar.</p>
              {isAdmin && (
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Link Pertama</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {featuredVideos.map((video) => {
                const parsed = parseSocialVideoUrl(video.video_url);

                return (
                  <div
                    key={video.video_id}
                    className={`p-5 rounded-3xl bg-slate-900/90 border transition-all ${
                      video.is_active
                        ? 'border-emerald-500/70 ring-1 ring-emerald-500/30 shadow-xl'
                        : 'border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black text-white ${
                            video.platform === 'TikTok'
                              ? 'bg-black border border-slate-700'
                              : video.platform === 'Instagram'
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600'
                              : 'bg-rose-600'
                          }`}>
                            {video.platform || 'YouTube'}
                          </span>
                          <span className="text-xs font-bold text-indigo-300">{video.kategori || 'Ibadah'}</span>
                          <span className="text-[10px] text-slate-500">• {video.tanggal}</span>
                        </div>
                        <h4 className="font-extrabold text-white text-base mt-1">{video.judul}</h4>
                      </div>

                      {video.is_active ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[11px] font-extrabold flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>TAYANG AKTIF</span>
                        </span>
                      ) : (
                        isAdmin && (
                          <button
                            onClick={() => handleActivateSocialVideo(video.video_id)}
                            className="px-3 py-1 rounded-full bg-slate-800 hover:bg-indigo-600 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-bold transition-all shrink-0"
                          >
                            Set Tayang Utama
                          </button>
                        )
                      )}
                    </div>

                    {/* Embedded Video Player Preview */}
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-inner my-3">
                      {parsed.isValid ? (
                        parsed.type === 'mp4' ? (
                          <video src={parsed.embedUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <iframe
                            src={parsed.embedUrl}
                            title={video.judul}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        )
                      ) : (
                        <div className="w-full h-full flex items-center justify-center p-4 text-center text-slate-500 text-xs">
                          Preview tidak tersedia untuk link ini.
                        </div>
                      )}
                    </div>

                    {video.keterangan && (
                      <p className="text-xs text-slate-400 mt-2 font-normal line-clamp-2">
                        {video.keterangan}
                      </p>
                    )}

                    <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <a
                        href={video.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 text-[11px]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Link Asli Video</span>
                      </a>

                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteSocialVideo(video.video_id)}
                          className="text-rose-400 hover:text-rose-300 font-semibold inline-flex items-center gap-1 text-[11px]"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MODAL VIEW PHOTO DETAIL */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-4xl w-full rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              <img src={selectedPhoto.foto} alt={selectedPhoto.judul} className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{selectedPhoto.judul}</h3>
              <p className="text-xs text-slate-400 mt-1">{selectedPhoto.keterangan}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIEW VIDEO DETAIL */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-4xl w-full rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl space-y-4 p-6">
            <button
              onClick={() => setSelectedVideo(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-all z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
              {parseSocialVideoUrl(selectedVideo.video_url).isValid ? (
                <iframe
                  src={parseSocialVideoUrl(selectedVideo.video_url).embedUrl}
                  title={selectedVideo.judul}
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <video src={selectedVideo.video_url} controls className="w-full h-full object-contain" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{selectedVideo.judul}</h3>
              <p className="text-xs text-slate-400 mt-1">{selectedVideo.keterangan}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD GALERI ITEM */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-lg w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-400" />
                <span>Unggah Media Galeri Baru</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Judul Dokumentasi</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Ibadah Paskah Raya 2026"
                  value={mediaForm.judul}
                  onChange={(e) => setMediaForm({ ...mediaForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tipe Media</label>
                  <select
                    value={mediaForm.tipe}
                    onChange={(e) => setMediaForm({ ...mediaForm, tipe: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="Foto">Foto</option>
                    <option value="Video">Video Liputan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori Event</label>
                  <select
                    value={mediaForm.kategori}
                    onChange={(e) => setMediaForm({ ...mediaForm, kategori: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    {categories.filter((c) => c !== 'SEMUA').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Offline File Upload Method / Local Storage */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-emerald-400" />
                    <span>Upload dari Penyimpanan Lokal / Disk Offline</span>
                  </label>
                  <span className="text-[10px] text-slate-400">Offline & Direct File</span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleOfflineFileUpload}
                  className="hidden"
                />

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow cursor-pointer transition-all active:scale-95"
                  >
                    <FolderPlus className="w-4 h-4 text-emerald-200" />
                    <span>Pilih Foto Lokal Disk / HP...</span>
                  </button>

                  {offlineFileName && (
                    <span className="text-[11px] text-emerald-300 truncate font-mono">
                      {offlineFileName}
                    </span>
                  )}
                </div>

                {/* Preview Thumbnail if local image loaded */}
                {mediaForm.foto && mediaForm.foto.startsWith('data:image/') && (
                  <div className="relative rounded-xl overflow-hidden border border-emerald-500/40 max-h-32 bg-black flex items-center justify-center">
                    <img src={mediaForm.foto} alt="Preview Offline" className="h-28 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setMediaForm((prev) => ({ ...prev, foto: '' }));
                        setOfflineFileName('');
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-rose-600 text-white hover:bg-rose-500 shadow cursor-pointer"
                      title="Hapus foto ini"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800/80">
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Atau Masukkan URL Gambar Web / Unsplash (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={mediaForm.foto}
                    onChange={(e) => {
                      setMediaForm({ ...mediaForm, foto: e.target.value });
                      if (!e.target.value.startsWith('data:image/')) {
                        setOfflineFileName('');
                      }
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-mono"
                  />
                </div>
              </div>

              {mediaForm.tipe === 'Video' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">URL Video Stream</label>
                  <input
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={mediaForm.video_url}
                    onChange={(e) => setMediaForm({ ...mediaForm, video_url: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                  />
                  <p className="text-[10px] text-slate-400">Mendukung link YouTube, Facebook, TikTok, Instagram, atau direct MP4 video.</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tanggal Kegiatan</label>
                  <input
                    type="date"
                    value={mediaForm.tanggal}
                    onChange={(e) => setMediaForm({ ...mediaForm, tanggal: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Keterangan / Detail Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Keterangan singkat momen peribadatan..."
                  value={mediaForm.keterangan}
                  onChange={(e) => setMediaForm({ ...mediaForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
                >
                  Simpan Media
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL ADD SOCIAL MEDIA VIDEO */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative max-w-lg w-full rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Tv className="w-5 h-5 text-rose-400" />
                <span>Tambah Video Media Sosial (Dashboard & Portal)</span>
              </h3>
              <button onClick={() => setIsVideoModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSocialVideo} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Judul Video / Khotbah</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tayangan Khotbah Minggu & Puji-pujian"
                  value={videoForm.judul}
                  onChange={(e) => setVideoForm({ ...videoForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Link URL Video <span className="text-indigo-400">(YouTube / Shorts / Instagram Reels / TikTok / MP4)</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://www.youtube.com/watch?v=5qap5aO4i9A atau https://youtube.com/shorts/..."
                  value={videoForm.video_url}
                  onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori / Segmen</label>
                  <select
                    value={videoForm.kategori}
                    onChange={(e) => setVideoForm({ ...videoForm, kategori: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="Ibadah Raya">Ibadah Raya</option>
                    <option value="Youth & Pemuda">Youth & Pemuda</option>
                    <option value="Renungan Harian">Renungan Harian</option>
                    <option value="Diakonia & Misi">Diakonia & Misi</option>
                    <option value="Lagu Pujian">Lagu Pujian</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Set Utama</label>
                  <label className="flex items-center gap-2 h-[38px] px-3 bg-slate-950 border border-slate-700 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={videoForm.is_active}
                      onChange={(e) => setVideoForm({ ...videoForm, is_active: e.target.checked })}
                      className="rounded border-slate-700 text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span className="text-xs font-bold text-emerald-400">Tayang Aktif</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Keterangan / Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Deskripsi singkat khotbah atau rekaman video..."
                  value={videoForm.keterangan}
                  onChange={(e) => setVideoForm({ ...videoForm, keterangan: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
                >
                  Simpan Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
