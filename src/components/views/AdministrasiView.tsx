import React, { useState, useEffect } from 'react';
import { Baptisan, Sidi, Pernikahan, User, Jemaat } from '../../types';
import { StorageManager } from '../../utils/storage';
import { exportToPDF } from '../../utils/exportTools';
import { FileText, Plus, Award, Heart, Scroll, Printer, Download, X } from 'lucide-react';

interface AdministrasiViewProps {
  currentUser: User;
}

export const AdministrasiView: React.FC<AdministrasiViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'BAPTISAN' | 'SIDI' | 'PERNIKAHAN' | 'SURAT'>('BAPTISAN');
  const [baptisanList, setBaptisanList] = useState<Baptisan[]>([]);
  const [sidiList, setSidiList] = useState<Sidi[]>([]);
  const [pernikahanList, setPernikahanList] = useState<Pernikahan[]>([]);
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);

  // Modals
  const [isBaptisModal, setIsBaptisModal] = useState(false);
  const [isSidiModal, setIsSidiModal] = useState(false);
  const [isNikahModal, setIsNikahModal] = useState(false);

  // Form states
  const [baptisForm, setBaptisForm] = useState({
    nama_jemaat: '',
    tanggal: new Date().toISOString().slice(0, 10),
    pendeta: 'Pdt. Dr. Herman Setyawan, M.Th',
    lokasi: 'Sanctuary Main Hall GKFC Pro'
  });

  const [sidiForm, setSidiForm] = useState({
    nama_jemaat: '',
    tanggal: new Date().toISOString().slice(0, 10),
    pendeta: 'Pdt. Dr. Herman Setyawan, M.Th'
  });

  const [nikahForm, setNikahForm] = useState({
    suami: '',
    istri: '',
    tanggal: new Date().toISOString().slice(0, 10),
    pendeta: 'Pdt. Dr. Herman Setyawan, M.Th',
    lokasi: 'Gedung Utama GKFC Pro'
  });

  useEffect(() => {
    loadData();

    const handleSync = () => loadData();
    const unsubscribe = StorageManager.subscribe(handleSync);
    window.addEventListener('cms_data_changed', handleSync);
    window.addEventListener('storage', handleSync);
    window.addEventListener('focus', handleSync);

    const intervalId = setInterval(loadData, 500);

    return () => {
      unsubscribe();
      window.removeEventListener('cms_data_changed', handleSync);
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('focus', handleSync);
      clearInterval(intervalId);
    };
  }, []);

  const loadData = () => {
    setBaptisanList(StorageManager.getBaptisan());
    setSidiList(StorageManager.getSidi());
    setPernikahanList(StorageManager.getPernikahan());
    setJemaatList(StorageManager.getJemaat());
  };

  const handleSaveBaptis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baptisForm.nama_jemaat) return;
    const newB: Baptisan = {
      baptisan_id: `BAP-2026-${(baptisanList.length + 1).toString().padStart(3, '0')}`,
      jemaat_id: 'JMT-GEN',
      nama_jemaat: baptisForm.nama_jemaat,
      tanggal: baptisForm.tanggal,
      pendeta: baptisForm.pendeta,
      lokasi: baptisForm.lokasi,
      nomor_surat: `BAP/GKFC/2026/${baptisForm.tanggal.slice(5, 7)}/${(baptisanList.length + 1).toString().padStart(3, '0')}`
    };
    const updated = [newB, ...baptisanList];
    setBaptisanList(updated);
    StorageManager.saveBaptisan(updated);
    StorageManager.logActivity(currentUser.username, `Input Surat Baptisan: ${newB.nama_jemaat}`, 'Administrasi Sacraments');
    setIsBaptisModal(false);
  };

  const handleSaveSidi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidiForm.nama_jemaat) return;
    const newS: Sidi = {
      sidi_id: `SDI-2026-${(sidiList.length + 1).toString().padStart(3, '0')}`,
      jemaat_id: 'JMT-GEN',
      nama_jemaat: sidiForm.nama_jemaat,
      tanggal: sidiForm.tanggal,
      pendeta: sidiForm.pendeta,
      nomor_surat: `SDI/GKFC/2026/${sidiForm.tanggal.slice(5, 7)}/${(sidiList.length + 1).toString().padStart(3, '0')}`
    };
    const updated = [newS, ...sidiList];
    setSidiList(updated);
    StorageManager.saveSidi(updated);
    StorageManager.logActivity(currentUser.username, `Input Surat Peneguhan Sidi: ${newS.nama_jemaat}`, 'Administrasi Sacraments');
    setIsSidiModal(false);
  };

  const handleSaveNikah = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nikahForm.suami || !nikahForm.istri) return;
    const newN: Pernikahan = {
      nikah_id: `NKH-2026-${(pernikahanList.length + 1).toString().padStart(3, '0')}`,
      suami: nikahForm.suami,
      istri: nikahForm.istri,
      tanggal: nikahForm.tanggal,
      pendeta: nikahForm.pendeta,
      lokasi: nikahForm.lokasi,
      nomor_surat: `NKH/GKFC/2026/${nikahForm.tanggal.slice(5, 7)}/${(pernikahanList.length + 1).toString().padStart(3, '0')}`
    };
    const updated = [newN, ...pernikahanList];
    setPernikahanList(updated);
    StorageManager.savePernikahan(updated);
    StorageManager.logActivity(currentUser.username, `Input Surat Pemberkatan Nikah: ${newN.suami} & ${newN.istri}`, 'Administrasi Sacraments');
    setIsNikahModal(false);
  };

  const cetakSuratBaptisPDF = (b: Baptisan) => {
    const title = `SURAT BAPTISAN KUDUS (No. ${b.nomor_surat || b.baptisan_id})`;
    const headers = ['Parameter Surat', 'Keterangan'];
    const rows = [
      ['Nomor Registrasi', b.baptisan_id],
      ['Nomor Surat Resmi', b.nomor_surat || '-'],
      ['Nama Jemaat Dibaptis', b.nama_jemaat || '-'],
      ['Tanggal Pelaksanaan', b.tanggal],
      ['Pendeta Pembaptis', b.pendeta],
      ['Lokasi Sacraments', b.lokasi]
    ];
    exportToPDF(title, headers, rows, undefined, `Surat_Baptis_${b.nama_jemaat}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Scroll className="w-6 h-6 text-indigo-400" />
            <span>Administrasi Sakramen & Surat Gereja</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pencatatan Baptisan Kudus, Peneguhan Sidi, Pemberkatan Pernikahan Kudus, dan Generator Surat Resmi.
          </p>
        </div>

        {/* Subtab Navigation */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('BAPTISAN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'BAPTISAN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Baptisan ({baptisanList.length})
          </button>
          <button
            onClick={() => setActiveTab('SIDI')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'SIDI' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sidi ({sidiList.length})
          </button>
          <button
            onClick={() => setActiveTab('PERNIKAHAN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'PERNIKAHAN' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Pernikahan ({pernikahanList.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Baptisan */}
      {activeTab === 'BAPTISAN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Data Baptisan Kudus</h3>
            <button
              onClick={() => setIsBaptisModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Input Baptisan Baru</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">No. Surat & ID</th>
                    <th className="p-3.5">Nama Yang Dibaptis</th>
                    <th className="p-3.5">Tanggal Baptis</th>
                    <th className="p-3.5">Pendeta Pembaptis</th>
                    <th className="p-3.5">Lokasi</th>
                    <th className="p-3.5 text-center">Cetak Surat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {baptisanList.map((b) => (
                    <tr key={b.baptisan_id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-3.5 font-mono text-indigo-300">
                        {b.nomor_surat || b.baptisan_id}
                      </td>
                      <td className="p-3.5 font-bold text-white text-sm">{b.nama_jemaat || b.jemaat_id}</td>
                      <td className="p-3.5">{b.tanggal}</td>
                      <td className="p-3.5">{b.pendeta}</td>
                      <td className="p-3.5 text-slate-400">{b.lokasi}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => cetakSuratBaptisPDF(b)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/80 inline-flex items-center gap-1 text-[11px] font-semibold"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Sidi */}
      {activeTab === 'SIDI' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Data Peneguhan Sidi</h3>
            <button
              onClick={() => setIsSidiModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Input Peneguhan Sidi</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">No. Surat & ID</th>
                    <th className="p-3.5">Nama Peserta Sidi</th>
                    <th className="p-3.5">Tanggal Sidi</th>
                    <th className="p-3.5">Pendeta Melayani</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sidiList.map((s) => (
                    <tr key={s.sidi_id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-3.5 font-mono text-blue-300">{s.nomor_surat || s.sidi_id}</td>
                      <td className="p-3.5 font-bold text-white text-sm">{s.nama_jemaat || s.jemaat_id}</td>
                      <td className="p-3.5">{s.tanggal}</td>
                      <td className="p-3.5">{s.pendeta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Pernikahan */}
      {activeTab === 'PERNIKAHAN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Pemberkatan Pernikahan Kudus</h3>
            <button
              onClick={() => setIsNikahModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Input Pernikahan Baru</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">No. Surat Nikah</th>
                    <th className="p-3.5">Mempelai Pria (Suami)</th>
                    <th className="p-3.5">Mempelai Wanita (Istri)</th>
                    <th className="p-3.5">Tanggal Pemberkatan</th>
                    <th className="p-3.5">Pendeta Pemberkat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {pernikahanList.map((n) => (
                    <tr key={n.nikah_id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-3.5 font-mono text-emerald-300">{n.nomor_surat || n.nikah_id}</td>
                      <td className="p-3.5 font-bold text-white">{n.suami}</td>
                      <td className="p-3.5 font-bold text-white">{n.istri}</td>
                      <td className="p-3.5">{n.tanggal}</td>
                      <td className="p-3.5">{n.pendeta}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Input Baptis */}
      {isBaptisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Input Data Baptisan Kudus</h3>
              <button onClick={() => setIsBaptisModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBaptis} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Jemaat Dibaptis *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Jemaat"
                  value={baptisForm.nama_jemaat}
                  onChange={(e) => setBaptisForm({ ...baptisForm, nama_jemaat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  value={baptisForm.tanggal}
                  onChange={(e) => setBaptisForm({ ...baptisForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pendeta Pembaptis</label>
                <input
                  type="text"
                  value={baptisForm.pendeta}
                  onChange={(e) => setBaptisForm({ ...baptisForm, pendeta: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Lokasi Baptisan</label>
                <input
                  type="text"
                  value={baptisForm.lokasi}
                  onChange={(e) => setBaptisForm({ ...baptisForm, lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsBaptisModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan Baptisan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Sidi */}
      {isSidiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Input Data Peneguhan Sidi</h3>
              <button onClick={() => setIsSidiModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSidi} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Peserta Sidi *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Jemaat"
                  value={sidiForm.nama_jemaat}
                  onChange={(e) => setSidiForm({ ...sidiForm, nama_jemaat: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tanggal Sidi</label>
                <input
                  type="date"
                  value={sidiForm.tanggal}
                  onChange={(e) => setSidiForm({ ...sidiForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pendeta Melayani</label>
                <input
                  type="text"
                  value={sidiForm.pendeta}
                  onChange={(e) => setSidiForm({ ...sidiForm, pendeta: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsSidiModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan Sidi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Input Nikah */}
      {isNikahModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Input Pemberkatan Pernikahan</h3>
              <button onClick={() => setIsNikahModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveNikah} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Nama Mempelai Pria (Suami) *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Suami"
                  value={nikahForm.suami}
                  onChange={(e) => setNikahForm({ ...nikahForm, suami: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Nama Mempelai Wanita (Istri) *</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Istri"
                  value={nikahForm.istri}
                  onChange={(e) => setNikahForm({ ...nikahForm, istri: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Tanggal Pemberkatan</label>
                <input
                  type="date"
                  value={nikahForm.tanggal}
                  onChange={(e) => setNikahForm({ ...nikahForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Pendeta Pemberkat</label>
                <input
                  type="text"
                  value={nikahForm.pendeta}
                  onChange={(e) => setNikahForm({ ...nikahForm, pendeta: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsNikahModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan Pernikahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
