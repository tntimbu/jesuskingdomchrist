import React, { useState, useEffect } from 'react';
import { Persembahan, Donasi, KasPengeluaran, User } from '../../types';
import { StorageManager } from '../../utils/storage';
import { exportToExcel, exportToPDF } from '../../utils/exportTools';
import { DollarSign, Plus, FileSpreadsheet, FileText, ArrowDownRight, ArrowUpRight, TrendingUp, X } from 'lucide-react';

interface KeuanganViewProps {
  currentUser: User;
}

export const KeuanganView: React.FC<KeuanganViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'PERSEMBAHAN' | 'DONASI' | 'KAS'>('PERSEMBAHAN');
  const [persembahanList, setPersembahanList] = useState<Persembahan[]>([]);
  const [donasiList, setDonasiList] = useState<Donasi[]>([]);
  const [kasList, setKasList] = useState<KasPengeluaran[]>([]);

  // Modals
  const [isPersembahanModal, setIsPersembahanModal] = useState(false);
  const [isKasModal, setIsKasModal] = useState(false);

  // Form states
  const [persembahanForm, setPersembahanForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    jenis: 'Persembahan Minggu',
    jumlah: 1500000,
    keterangan: 'Ibadah Raya 1 (Pagi)',
    metode_pembayaran: 'QRIS / Transfer Bank'
  });

  const [kasForm, setKasForm] = useState({
    tanggal: new Date().toISOString().slice(0, 10),
    kategori: 'Biaya Operasional & Listrik',
    jumlah: 750000,
    tipe: 'Pengeluaran' as 'Penerimaan' | 'Pengeluaran',
    keterangan: 'Pembayaran Rekening Listrik & AC Gedung Utama',
    pic: 'Bendahara Gereja'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPersembahanList(StorageManager.getPersembahan());
    setDonasiList(StorageManager.getDonasi());
    setKasList(StorageManager.getKasPengeluaran());
  };

  const totalPersembahan = persembahanList.reduce((acc, c) => acc + (c.jumlah || 0), 0);
  const totalPengeluaran = kasList.filter((k) => k.tipe === 'Pengeluaran').reduce((acc, c) => acc + (c.jumlah || 0), 0);
  const totalPenerimaan = kasList.filter((k) => k.tipe === 'Penerimaan').reduce((acc, c) => acc + (c.jumlah || 0), 0) + totalPersembahan;

  const handleSavePersembahan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!persembahanForm.jumlah) return;

    const newP: Persembahan = {
      persembahan_id: `PRS-2026-${(persembahanList.length + 1).toString().padStart(3, '0')}`,
      tanggal: persembahanForm.tanggal,
      jenis: persembahanForm.jenis,
      jumlah: Number(persembahanForm.jumlah),
      keterangan: persembahanForm.keterangan,
      metode_pembayaran: persembahanForm.metode_pembayaran
    };

    const updated = [newP, ...persembahanList];
    setPersembahanList(updated);
    StorageManager.savePersembahan(updated);
    StorageManager.logActivity(currentUser.username, `Input Persembahan Rp ${newP.jumlah.toLocaleString('id-ID')}`, 'Keuangan & Kas');
    setIsPersembahanModal(false);
  };

  const handleSaveKas = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kasForm.jumlah) return;

    const newK: KasPengeluaran = {
      kas_id: `KAS-2026-${(kasList.length + 1).toString().padStart(3, '0')}`,
      tanggal: kasForm.tanggal,
      kategori: kasForm.kategori,
      jumlah: Number(kasForm.jumlah),
      tipe: kasForm.tipe,
      keterangan: kasForm.keterangan,
      pic: kasForm.pic
    };

    const updated = [newK, ...kasList];
    setKasList(updated);
    StorageManager.saveKasPengeluaran(updated);
    StorageManager.logActivity(currentUser.username, `Input Kas/Pengeluaran Rp ${newK.jumlah.toLocaleString('id-ID')}`, 'Keuangan & Kas');
    setIsKasModal(false);
  };

  const handleExportExcel = () => {
    exportToExcel(persembahanList, 'Data_Persembahan_Keuangan');
  };

  const handleExportPDF = () => {
    const headers = ['ID', 'Tanggal', 'Jenis Persembahan', 'Metode', 'Keterangan', 'Jumlah (Rp)'];
    const rows = persembahanList.map((p) => [
      p.persembahan_id,
      p.tanggal,
      p.jenis,
      p.metode_pembayaran || 'Tunai',
      p.keterangan,
      `Rp ${p.jumlah.toLocaleString('id-ID')}`
    ]);
    exportToPDF('LAPORAN PERSEMBAHAN & KAS GEREJA', headers, rows, undefined, 'Laporan_Keuangan_Persembahan');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-emerald-400" />
            <span>Manajemen Keuangan, Persembahan & Kas</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pencatatan persembahan ibadah, donasi pembangunan, kas penerimaan & pengeluaran operasional.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Excel</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm text-white">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Penerimaan (Persembahan & Kas)</span>
          <h3 className="text-2xl font-bold tracking-tight text-emerald-400 mt-2">
            Rp {totalPenerimaan.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Akumulasi Seluruh Persembahan & Donasi</p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm text-white">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Pengeluaran Operasional</span>
          <h3 className="text-2xl font-bold tracking-tight text-rose-400 mt-2">
            Rp {totalPengeluaran.toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Biaya Listrik, Maintenance & Diakonia</p>
        </div>

        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-sm text-white">
          <span className="text-xs text-slate-400 uppercase font-semibold">Saldo Kas Bersih Realtime</span>
          <h3 className="text-2xl font-bold tracking-tight text-indigo-400 mt-2">
            Rp {(totalPenerimaan - totalPengeluaran).toLocaleString('id-ID')}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">Tersedia di Kas Bank / Tunai</p>
        </div>
      </div>

      {/* Subtab Selector */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('PERSEMBAHAN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PERSEMBAHAN' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Persembahan Ibadah ({persembahanList.length})
          </button>
          <button
            onClick={() => setActiveTab('KAS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'KAS' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Kas & Pengeluaran ({kasList.length})
          </button>
          <button
            onClick={() => setActiveTab('DONASI')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DONASI' ? 'bg-indigo-600 text-white shadow' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            Donasi Pembangunan ({donasiList.length})
          </button>
        </div>

        {activeTab === 'PERSEMBAHAN' && (
          <button
            onClick={() => setIsPersembahanModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Persembahan</span>
          </button>
        )}

        {activeTab === 'KAS' && (
          <button
            onClick={() => setIsKasModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Catat Transaksi Kas</span>
          </button>
        )}
      </div>

      {/* Tab 1: Persembahan */}
      {activeTab === 'PERSEMBAHAN' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">ID & Tanggal</th>
                  <th className="p-3.5">Jenis Persembahan</th>
                  <th className="p-3.5">Metode Pembayaran</th>
                  <th className="p-3.5">Keterangan</th>
                  <th className="p-3.5 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {persembahanList.map((p) => (
                  <tr key={p.persembahan_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5">
                      <div className="font-mono text-indigo-300 font-bold">{p.persembahan_id}</div>
                      <div className="text-[10px] text-slate-400">{p.tanggal}</div>
                    </td>
                    <td className="p-3.5 font-bold text-white">
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">
                        {p.jenis}
                      </span>
                    </td>
                    <td className="p-3.5">{p.metode_pembayaran || 'Tunai'}</td>
                    <td className="p-3.5 text-slate-300">{p.keterangan}</td>
                    <td className="p-3.5 text-right font-bold text-emerald-400 text-sm">
                      + Rp {p.jumlah.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Kas & Pengeluaran */}
      {activeTab === 'KAS' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs text-slate-300">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="p-3.5">ID & Tanggal</th>
                  <th className="p-3.5">Tipe & Kategori</th>
                  <th className="p-3.5">Keterangan Transaksi</th>
                  <th className="p-3.5">PIC / Penanggung Jawab</th>
                  <th className="p-3.5 text-right">Jumlah (Rp)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {kasList.map((k) => (
                  <tr key={k.kas_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5">
                      <div className="font-mono text-slate-300 font-bold">{k.kas_id}</div>
                      <div className="text-[10px] text-slate-400">{k.tanggal}</div>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${k.tipe === 'Penerimaan' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                        {k.tipe}: {k.kategori}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-300">{k.keterangan}</td>
                    <td className="p-3.5 text-slate-400">{k.pic || '-'}</td>
                    <td className={`p-3.5 text-right font-bold text-sm ${k.tipe === 'Penerimaan' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {k.tipe === 'Penerimaan' ? '+' : '-'} Rp {k.jumlah.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Persembahan */}
      {isPersembahanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Catat Persembahan Ibadah</h3>
              <button onClick={() => setIsPersembahanModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSavePersembahan} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tanggal *</label>
                <input
                  type="date"
                  required
                  value={persembahanForm.tanggal}
                  onChange={(e) => setPersembahanForm({ ...persembahanForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Jenis Persembahan</label>
                <select
                  value={persembahanForm.jenis}
                  onChange={(e) => setPersembahanForm({ ...persembahanForm, jenis: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="Persembahan Minggu">Persembahan Minggu</option>
                  <option value="Persembahan Perpuluhan">Persembahan Perpuluhan</option>
                  <option value="Persembahan Syukur">Persembahan Syukur</option>
                  <option value="Persembahan Kasih Diakonia">Diakonia / Pelayanan</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Jumlah Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  value={persembahanForm.jumlah}
                  onChange={(e) => setPersembahanForm({ ...persembahanForm, jumlah: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-sm text-emerald-400"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Keterangan / Ibadah</label>
                <input
                  type="text"
                  value={persembahanForm.keterangan}
                  onChange={(e) => setPersembahanForm({ ...persembahanForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPersembahanModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 rounded-xl font-bold">
                  Simpan Persembahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Kas */}
      {isKasModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Catat Transaksi Kas & Operasional</h3>
              <button onClick={() => setIsKasModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveKas} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Tipe Transaksi</label>
                <select
                  value={kasForm.tipe}
                  onChange={(e) => setKasForm({ ...kasForm, tipe: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="Pengeluaran">Pengeluaran (Kredit)</option>
                  <option value="Penerimaan">Penerimaan (Debit)</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Kategori Biaya</label>
                <input
                  type="text"
                  value={kasForm.kategori}
                  onChange={(e) => setKasForm({ ...kasForm, kategori: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nominal (Rp) *</label>
                <input
                  type="number"
                  required
                  value={kasForm.jumlah}
                  onChange={(e) => setKasForm({ ...kasForm, jumlah: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Keterangan Transaksi</label>
                <input
                  type="text"
                  value={kasForm.keterangan}
                  onChange={(e) => setKasForm({ ...kasForm, keterangan: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsKasModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
