import React, { useState, useEffect } from 'react';
import { Wilayah, Pelayanan, User } from '../../types';
import { StorageManager } from '../../utils/storage';
import { MapPin, Users, Plus, Edit, Trash2, X, Shield, Calendar } from 'lucide-react';

interface WilayahViewProps {
  currentUser: User;
}

export const WilayahView: React.FC<WilayahViewProps> = ({ currentUser }) => {
  const [wilayahList, setWilayahList] = useState<Wilayah[]>([]);
  const [pelayananList, setPelayananList] = useState<Pelayanan[]>([]);

  // Modal States
  const [isWilayahModal, setIsWilayahModal] = useState(false);
  const [isPelayananModal, setIsPelayananModal] = useState(false);
  
  const [wilayahForm, setWilayahForm] = useState<Partial<Wilayah>>({ nama_wilayah: '', ketua: '', jumlah_jemaat: 50 });
  const [pelayananForm, setPelayananForm] = useState<Partial<Pelayanan>>({ nama: '', kategori: 'Musik & Ibadah', penanggung_jawab: '', jadwal: 'Minggu' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setWilayahList(StorageManager.getWilayah());
    setPelayananList(StorageManager.getPelayanan());
  };

  const handleSaveWilayah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wilayahForm.nama_wilayah) return;
    const newW: Wilayah = {
      wilayah_id: `WIL-${(wilayahList.length + 1).toString().padStart(3, '0')}`,
      nama_wilayah: wilayahForm.nama_wilayah,
      ketua: wilayahForm.ketua || 'Belum Ditentukan',
      jumlah_jemaat: Number(wilayahForm.jumlah_jemaat) || 0
    };
    const updated = [newW, ...wilayahList];
    setWilayahList(updated);
    StorageManager.saveWilayah(updated);
    StorageManager.logActivity(currentUser.username, `Menambahkan wilayah baru: ${newW.nama_wilayah}`, 'Wilayah & Pelayanan');
    setIsWilayahModal(false);
  };

  const handleSavePelayanan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelayananForm.nama) return;
    const newP: Pelayanan = {
      pelayanan_id: `PLY-${(pelayananList.length + 1).toString().padStart(3, '0')}`,
      nama: pelayananForm.nama,
      kategori: pelayananForm.kategori || 'Umum',
      penanggung_jawab: pelayananForm.penanggung_jawab || 'Sekretariat',
      jadwal: pelayananForm.jadwal || 'Minggu'
    };
    const updated = [newP, ...pelayananList];
    setPelayananList(updated);
    StorageManager.savePelayanan(updated);
    StorageManager.logActivity(currentUser.username, `Menambahkan komisi/pelayanan baru: ${newP.nama}`, 'Wilayah & Pelayanan');
    setIsPelayananModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <MapPin className="w-6 h-6 text-indigo-400" />
            <span>Manajemen Wilayah & Komisi Pelayanan</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pengorganisasian wilayah rayon jemaat, ketua wilayah, komisi gereja, dan tim pelayanan ibadah.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setWilayahForm({ nama_wilayah: '', ketua: 'Pnt. Baru', jumlah_jemaat: 40 });
              setIsWilayahModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Tambah Wilayah</span>
          </button>

          <button
            onClick={() => {
              setPelayananForm({ nama: '', kategori: 'Musik & Ibadah', penanggung_jawab: '', jadwal: 'Sabtu / Minggu' });
              setIsPelayananModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Tim Pelayanan</span>
          </button>
        </div>
      </div>

      {/* Wilayah Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Daftar Wilayah Rayon Jemaat</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 text-xs">
            {wilayahList.length} Wilayah
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {wilayahList.map((w) => (
            <div
              key={w.wilayah_id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm text-white hover:border-indigo-500/40 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                  {w.wilayah_id}
                </span>
                <span className="text-xs text-slate-400">{w.jumlah_jemaat} Jiwa</span>
              </div>

              <div>
                <h4 className="font-bold text-base text-white">{w.nama_wilayah}</h4>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ketua: {w.ketua}</span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                <span>Terhubung ke 18 Sheets</span>
                <span className="text-emerald-400 font-semibold">Aktif</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pelayanan Table */}
      <div className="space-y-3 pt-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>Daftar Komisi & Tim Pelayanan Ibadah</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-indigo-400 text-xs">
            {pelayananList.length} Tim
          </span>
        </h3>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">Nama Pelayanan / Tim</th>
                  <th className="p-3.5">Kategori</th>
                  <th className="p-3.5">Penanggung Jawab</th>
                  <th className="p-3.5">Jadwal Latihan / Tugas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pelayananList.map((p) => (
                  <tr key={p.pelayanan_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5 font-bold text-white text-sm">{p.nama}</td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                        {p.kategori}
                      </span>
                    </td>
                    <td className="p-3.5">{p.penanggung_jawab}</td>
                    <td className="p-3.5 text-slate-400">{p.jadwal || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Wilayah Modal */}
      {isWilayahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Tambah Wilayah Rayon Baru</h3>
              <button onClick={() => setIsWilayahModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveWilayah} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Wilayah *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Wilayah V - Jakarta Selatan"
                  value={wilayahForm.nama_wilayah}
                  onChange={(e) => setWilayahForm({ ...wilayahForm, nama_wilayah: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Ketua Wilayah / Penatua</label>
                <input
                  type="text"
                  value={wilayahForm.ketua}
                  onChange={(e) => setWilayahForm({ ...wilayahForm, ketua: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Jumlah Jemaat Estimasi</label>
                <input
                  type="number"
                  value={wilayahForm.jumlah_jemaat}
                  onChange={(e) => setWilayahForm({ ...wilayahForm, jumlah_jemaat: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsWilayahModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan Wilayah
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Pelayanan Modal */}
      {isPelayananModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Tambah Tim Pelayanan / Komisi</h3>
              <button onClick={() => setIsPelayananModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePelayanan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Tim / Pelayanan *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Tim Sound Engine & Audio"
                  value={pelayananForm.nama}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, nama: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kategori</label>
                <input
                  type="text"
                  placeholder="Musik & Ibadah / Media / Diakonia"
                  value={pelayananForm.kategori}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, kategori: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Penanggung Jawab / Koordinator</label>
                <input
                  type="text"
                  value={pelayananForm.penanggung_jawab}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, penanggung_jawab: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Jadwal Latihan / Tugas</label>
                <input
                  type="text"
                  value={pelayananForm.jadwal}
                  onChange={(e) => setPelayananForm({ ...pelayananForm, jadwal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPelayananModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan Pelayanan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
