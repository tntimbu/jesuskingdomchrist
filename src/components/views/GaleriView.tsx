import React, { useState, useEffect } from 'react';
import { GalleryItem, User } from '../../types';
import { StorageManager } from '../../utils/storage';
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
  Tag
} from 'lucide-react';

interface GaleriViewProps {
  currentUser: User;
}

export const GaleriView: React.FC<GaleriViewProps> = ({ currentUser }) => {
  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';
  const [galleryList, setGalleryList] = useState<GalleryItem[]>([]);
  const [activeType, setActiveType] = useState<'ALL' | 'Foto' | 'Video'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('SEMUA');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<GalleryItem | null>(null);

  // Add Form
  const [mediaForm, setMediaForm] = useState({
    judul: '',
    tipe: 'Foto' as 'Foto' | 'Video',
    foto: '',
    video_url: '',
    kategori: 'Ibadah',
    tanggal: new Date().toISOString().slice(0, 10),
    keterangan: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const list = StorageManager.getGallery();
    setGalleryList(list);
  };

  const handleSaveMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaForm.judul) return;

    const newItem: GalleryItem = {
      gallery_id: `GAL-2026-${(galleryList.length + 1).toString().padStart(3, '0')}`,
      judul: mediaForm.judul,
      tipe: mediaForm.tipe,
      foto: mediaForm.foto || (mediaForm.tipe === 'Foto' ? 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800&auto=format&fit=crop&q=80' : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80'),
      video_url: mediaForm.video_url,
      kategori: mediaForm.kategori,
      tanggal: mediaForm.tanggal,
      keterangan: mediaForm.keterangan,
      penulis: currentUser.nama || 'Sekretariat'
    };

    const updated = [newItem, ...galleryList];
    setGalleryList(updated);
    StorageManager.saveGallery(updated);
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

  const handleDeleteMedia = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Apakah Anda yakin ingin menghapus media ini dari galeri?')) return;

    const updated = galleryList.filter((g) => g.gallery_id !== id);
    setGalleryList(updated);
    StorageManager.saveGallery(updated);
    StorageManager.logActivity(currentUser.username, `Menghapus media galeri ID ${id}`, 'Galeri');
  };

  // Helper to format embedded video URL
  const getEmbedVideoUrl = (url?: string) => {
    if (!url) return '';
    if (url.includes('youtube.com/watch?v=')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
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
            <span>Galeri Foto & Video Gereja</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Dokumentasi peribadatan, perayaan, momen diakonia, dan video liputan kegiatan jemaat.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Upload Foto / Video Baru</span>
          </button>
        )}
      </div>

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

                  {/* Top Badge: Type & Category */}
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

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{item.tanggal}</span>
                    </span>
                    <span className="text-indigo-400 font-semibold group-hover:underline flex items-center gap-0.5">
                      <span>{isVideo ? 'Putar Video' : 'Lihat Foto'}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL LIGHTBOX FOTO */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="relative aspect-video w-full bg-black flex items-center justify-center">
              <img
                src={selectedPhoto.foto}
                alt={selectedPhoto.judul}
                className="max-h-[75vh] w-auto object-contain mx-auto"
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-2">
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-bold">
                <Tag className="w-3.5 h-3.5" />
                <span>{selectedPhoto.kategori || 'Galeri Foto'}</span>
                <span>•</span>
                <span>{selectedPhoto.tanggal}</span>
              </div>
              <h3 className="text-xl font-black text-white">{selectedPhoto.judul}</h3>
              {selectedPhoto.keterangan && (
                <p className="text-sm text-slate-300 leading-relaxed">{selectedPhoto.keterangan}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL PLAYER VIDEO */}
      {selectedVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Video className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-bold text-white truncate max-w-md">{selectedVideo.judul}</h3>
              </div>
              <button
                onClick={() => setSelectedVideo(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-xl">
                {selectedVideo.video_url?.includes('embed') || selectedVideo.video_url?.includes('youtube') || selectedVideo.video_url?.includes('youtu.be') ? (
                  <iframe
                    src={getEmbedVideoUrl(selectedVideo.video_url)}
                    title={selectedVideo.judul}
                    className="w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video
                    src={selectedVideo.video_url || selectedVideo.foto}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Kategori: <strong className="text-indigo-400">{selectedVideo.kategori || 'Video'}</strong></span>
                  <span>Tanggal: {selectedVideo.tanggal}</span>
                </div>
                {selectedVideo.keterangan && (
                  <p className="text-sm text-slate-300 pt-1">{selectedVideo.keterangan}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL UPLOAD MEDIA (ADMIN ONLY) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Upload Media Galeri Baru</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMedia} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Judul / Caption Media</label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Dokumentasi Ibadah Paskah 2026"
                  value={mediaForm.judul}
                  onChange={(e) => setMediaForm({ ...mediaForm, judul: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Tipe Media</label>
                  <select
                    value={mediaForm.tipe}
                    onChange={(e) => setMediaForm({ ...mediaForm, tipe: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Foto">Foto Dokumentasi</option>
                    <option value="Video">Video Liputan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kategori</label>
                  <select
                    value={mediaForm.kategori}
                    onChange={(e) => setMediaForm({ ...mediaForm, kategori: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Ibadah">Ibadah</option>
                    <option value="Youth & Pemuda">Youth & Pemuda</option>
                    <option value="Event & Paskah">Event & Paskah</option>
                    <option value="Diakonia">Diakonia</option>
                    <option value="Konser Musik">Konser Musik</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              {mediaForm.tipe === 'Foto' ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">File Foto / URL Gambar</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Paste URL Gambar atau Upload File..."
                      value={mediaForm.foto}
                      onChange={(e) => setMediaForm({ ...mediaForm, foto: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-mono"
                    />
                    <label className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
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
                                setMediaForm({ ...mediaForm, foto: evt.target.result as string });
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-300">URL Video (YouTube / MP4 / Social)</label>
                  <input
                    type="text"
                    required
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
    </div>
  );
};
