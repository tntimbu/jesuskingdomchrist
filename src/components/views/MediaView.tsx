import React, { useState, useEffect } from 'react';
import { Pengumuman, Renungan, User } from '../../types';
import { StorageManager } from '../../utils/storage';
import { Megaphone, BookOpen, Plus, Heart, Share2, Sparkles, X } from 'lucide-react';

interface MediaViewProps {
  currentUser: User;
}

export const MediaView: React.FC<MediaViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'PENGUMUMAN' | 'RENUNGAN'>('PENGUMUMAN');
  const [pengumumanList, setPengumumanList] = useState<Pengumuman[]>([]);
  const [renunganList, setRenunganList] = useState<Renungan[]>([]);

  // Modals
  const [isPengumumanModal, setIsPengumumanModal] = useState(false);
  const [isRenunganModal, setIsRenunganModal] = useState(false);

  // Forms
  const [pengumumanForm, setPengumumanForm] = useState({
    judul: '',
    isi: '',
    tanggal: new Date().toISOString().slice(0, 10),
    kategori: 'Pengumuman Penting',
    penulis: currentUser.nama || 'Sekretariat'
  });

  const [renunganForm, setRenunganForm] = useState({
    judul: '',
    ayat_alkitab: 'Filipi 4:13',
    isi: '',
    tanggal: new Date().toISOString().slice(0, 10),
    penulis: 'Pdt. Dr. Herman Setyawan'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPengumumanList(StorageManager.getPengumuman());
    setRenunganList(StorageManager.getRenungan());
  };

  const handleSavePengumuman = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pengumumanForm.judul || !pengumumanForm.isi) return;

    const newP: Pengumuman = {
      pengumuman_id: `PGM-2026-${(pengumumanList.length + 1).toString().padStart(3, '0')}`,
      judul: pengumumanForm.judul,
      isi: pengumumanForm.isi,
      tanggal: pengumumanForm.tanggal,
      kategori: pengumumanForm.kategori,
      penulis: pengumumanForm.penulis
    };

    const updated = [newP, ...pengumumanList];
    setPengumumanList(updated);
    StorageManager.savePengumuman(updated);
    StorageManager.logActivity(currentUser.username, `Menerbitkan pengumuman: ${newP.judul}`, 'Media & Renungan');
    setIsPengumumanModal(false);
  };

  const handleSaveRenungan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!renunganForm.judul || !renunganForm.isi) return;

    const newR: Renungan = {
      renungan_id: `RNG-2026-${(renunganList.length + 1).toString().padStart(3, '0')}`,
      judul: renunganForm.judul,
      ayat_alkitab: renunganForm.ayat_alkitab,
      isi: renunganForm.isi,
      tanggal: renunganForm.tanggal,
      penulis: renunganForm.penulis
    };

    const updated = [newR, ...renunganList];
    setRenunganList(updated);
    StorageManager.saveRenungan(updated);
    StorageManager.logActivity(currentUser.username, `Menerbitkan renungan: ${newR.judul}`, 'Media & Renungan');
    setIsRenunganModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-indigo-400" />
            <span>Pengumuman Jemaat & Renungan Harian</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Warta jemaat mingguan, buletin gereja, dan santapan rohani harian bagi jemaat.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('PENGUMUMAN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'PENGUMUMAN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Warta / Pengumuman ({pengumumanList.length})
          </button>
          <button
            onClick={() => setActiveTab('RENUNGAN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'RENUNGAN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Renungan Harian ({renunganList.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Pengumuman */}
      {activeTab === 'PENGUMUMAN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Warta Jemaat & Informasi Gereja</h3>
            {currentUser.role !== 'JEMAAT' && (
              <button
                onClick={() => setIsPengumumanModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Pengumuman Baru</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pengumumanList.map((p) => (
              <div
                key={p.pengumuman_id}
                className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm text-white space-y-3 hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                    {p.kategori}
                  </span>
                  <span className="text-xs text-slate-400">{p.tanggal}</span>
                </div>

                <h4 className="text-lg font-bold text-white leading-snug">{p.judul}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{p.isi}</p>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Diterbitkan oleh: {p.penulis}</span>
                  <button className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Bagikan</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Renungan Harian */}
      {activeTab === 'RENUNGAN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Santapan Rohani & Renungan Harian</h3>
            {currentUser.role !== 'JEMAAT' && (
              <button
                onClick={() => setIsRenunganModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tulis Renungan Baru</span>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {renunganList.map((r) => (
              <div
                key={r.renungan_id}
                className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-xl text-white space-y-4 hover:border-indigo-500/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                      Renungan Tanggal: {r.tanggal}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Penulis: {r.penulis}</span>
                </div>

                <div>
                  <h4 className="text-xl font-extrabold text-white tracking-tight">{r.judul}</h4>
                  <div className="mt-2 inline-block px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-semibold text-xs">
                    Bacaan Alkitab: {r.ayat_alkitab}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                  "{r.isi}"
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Pengumuman */}
      {isPengumumanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Terbitkan Pengumuman Baru</h3>
              <button onClick={() => setIsPengumumanModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePengumuman} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Judul Pengumuman *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jadwal Gotong Royong Persiapan Paskah"
                  value={pengumumanForm.judul}
                  onChange={(e) => setPengumumanForm({ ...pengumumanForm, judul: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kategori</label>
                <input
                  type="text"
                  value={pengumumanForm.kategori}
                  onChange={(e) => setPengumumanForm({ ...pengumumanForm, kategori: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Isi Pengumuman *</label>
                <textarea
                  required
                  rows={4}
                  value={pengumumanForm.isi}
                  onChange={(e) => setPengumumanForm({ ...pengumumanForm, isi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPengumumanModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Terbitkan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Renungan */}
      {isRenunganModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Tulis Renungan Harian</h3>
              <button onClick={() => setIsRenunganModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveRenungan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Judul Renungan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Pengharapan Yang Teguh"
                  value={renunganForm.judul}
                  onChange={(e) => setRenunganForm({ ...renunganForm, judul: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Ayat Alkitab Kunci</label>
                <input
                  type="text"
                  value={renunganForm.ayat_alkitab}
                  onChange={(e) => setRenunganForm({ ...renunganForm, ayat_alkitab: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Isi Pesan Renungan *</label>
                <textarea
                  required
                  rows={4}
                  value={renunganForm.isi}
                  onChange={(e) => setRenunganForm({ ...renunganForm, isi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsRenunganModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan Renungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
