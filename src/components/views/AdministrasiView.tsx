import React, { useState, useEffect } from 'react';
import { Baptisan, Sidi, Pernikahan, User, Jemaat } from '../../types';
import { StorageManager } from '../../utils/storage';
import { exportToPDF } from '../../utils/exportTools';
import { FileText, Plus, Award, Heart, Scroll, Printer, Download, X, Trash2, Upload, CheckCircle, ExternalLink } from 'lucide-react';

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

  // Upload file state for specific Baptisan
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);
  const [uploadUrlInput, setUploadUrlInput] = useState<string>('');

  // Form states
  const [baptisForm, setBaptisForm] = useState({
    nama_jemaat: '',
    tanggal: new Date().toISOString().slice(0, 10),
    pendeta: 'Pdt. Dr. Herman Setyawan, M.Th',
    lokasi: 'Gedung Sanctuary Utama',
    file_surat_baptis: ''
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
    lokasi: 'Gedung Sanctuary Utama'
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
    const settings = StorageManager.getSettings();
    const allJ = StorageManager.getJemaat();
    const matchedJ = allJ.find(
      (j) =>
        j.nama_lengkap.toLowerCase().includes(baptisForm.nama_jemaat.toLowerCase()) ||
        baptisForm.nama_jemaat.toLowerCase().includes(j.nama_lengkap.toLowerCase())
    );

    const newB: Baptisan = {
      baptisan_id: `BAP-2026-${(baptisanList.length + 1).toString().padStart(3, '0')}`,
      jemaat_id: matchedJ ? matchedJ.jemaat_id : 'JMT-GEN',
      nama_jemaat: baptisForm.nama_jemaat,
      tanggal: baptisForm.tanggal,
      pendeta: baptisForm.pendeta,
      lokasi: baptisForm.lokasi,
      nomor_surat: `BAP/${settings.nama_gereja ? settings.nama_gereja.slice(0, 4).toUpperCase() : 'GKFC'}/2026/${baptisForm.tanggal.slice(5, 7)}/${(baptisanList.length + 1).toString().padStart(3, '0')}`,
      file_surat_baptis: baptisForm.file_surat_baptis
    };
    const updated = [newB, ...baptisanList];
    setBaptisanList(updated);
    StorageManager.saveBaptisan(updated);
    StorageManager.logActivity(currentUser.username, `Input Surat Baptisan: ${newB.nama_jemaat}`, 'Administrasi Sacraments');
    window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { action: 'baptisan_updated' } }));
    setIsBaptisModal(false);
    setBaptisForm({
      nama_jemaat: '',
      tanggal: new Date().toISOString().slice(0, 10),
      pendeta: 'Pdt. Dr. Herman Setyawan, M.Th',
      lokasi: 'Gedung Sanctuary Utama',
      file_surat_baptis: ''
    });
  };

  const handleUploadSuratFile = (baptisan_id: string, fileData: string) => {
    const updated = baptisanList.map((b) => {
      if (b.baptisan_id === baptisan_id) {
        return { ...b, file_surat_baptis: fileData };
      }
      return b;
    });
    setBaptisanList(updated);
    StorageManager.saveBaptisan(updated);
    StorageManager.logActivity(currentUser.username, `Upload Surat Baptisan ID: ${baptisan_id}`, 'Administrasi Sacraments');
    window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { action: 'baptisan_file_uploaded' } }));
    setUploadTargetId(null);
    setUploadUrlInput('');
  };

  const handleSaveSidi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidiForm.nama_jemaat) return;
    const settings = StorageManager.getSettings();
    const newS: Sidi = {
      sidi_id: `SDI-2026-${(sidiList.length + 1).toString().padStart(3, '0')}`,
      jemaat_id: 'JMT-GEN',
      nama_jemaat: sidiForm.nama_jemaat,
      tanggal: sidiForm.tanggal,
      pendeta: sidiForm.pendeta,
      nomor_surat: `SDI/${settings.nama_gereja ? settings.nama_gereja.slice(0, 4).toUpperCase() : 'GKFC'}/2026/${sidiForm.tanggal.slice(5, 7)}/${(sidiList.length + 1).toString().padStart(3, '0')}`
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
    const settings = StorageManager.getSettings();
    const newN: Pernikahan = {
      nikah_id: `NKH-2026-${(pernikahanList.length + 1).toString().padStart(3, '0')}`,
      suami: nikahForm.suami,
      istri: nikahForm.istri,
      tanggal: nikahForm.tanggal,
      pendeta: nikahForm.pendeta,
      lokasi: nikahForm.lokasi,
      nomor_surat: `NKH/${settings.nama_gereja ? settings.nama_gereja.slice(0, 4).toUpperCase() : 'GKFC'}/2026/${nikahForm.tanggal.slice(5, 7)}/${(pernikahanList.length + 1).toString().padStart(3, '0')}`
    };
    const updated = [newN, ...pernikahanList];
    setPernikahanList(updated);
    StorageManager.savePernikahan(updated);
    StorageManager.logActivity(currentUser.username, `Input Surat Pemberkatan Nikah: ${newN.suami} & ${newN.istri}`, 'Administrasi Sacraments');
    setIsNikahModal(false);
  };

  const handleDeleteBaptis = (id: string, nama: string) => {
    if (window.confirm(`Hapus record baptisan untuk ${nama}?`)) {
      const updated = baptisanList.filter((b) => b.baptisan_id !== id);
      setBaptisanList(updated);
      StorageManager.saveBaptisan(updated);
      StorageManager.logActivity(currentUser.username, `Menghapus record baptis: ${nama}`, 'Administrasi Sacraments');
    }
  };

  const handleDeleteSidi = (id: string, nama: string) => {
    if (window.confirm(`Hapus record sidi untuk ${nama}?`)) {
      const updated = sidiList.filter((s) => s.sidi_id !== id);
      setSidiList(updated);
      StorageManager.saveSidi(updated);
      StorageManager.logActivity(currentUser.username, `Menghapus record sidi: ${nama}`, 'Administrasi Sacraments');
    }
  };

  const handleDeleteNikah = (id: string, nama: string) => {
    if (window.confirm(`Hapus record pernikahan untuk ${nama}?`)) {
      const updated = pernikahanList.filter((n) => n.nikah_id !== id);
      setPernikahanList(updated);
      StorageManager.savePernikahan(updated);
      StorageManager.logActivity(currentUser.username, `Menghapus record pernikahan: ${nama}`, 'Administrasi Sacraments');
    }
  };

  // Cetak Berita Acara Baptisan Kudus (PDF)
  const cetakBeritaAcaraBaptisPDF = (b: Baptisan) => {
    const settings = StorageManager.getSettings();
    const churchName = (settings.nama_gereja || 'SYSTEM MANAGEMENT CHURCH').trim();
    const title = `BERITA ACARA BAPTISAN KUDUS (No. ${b.nomor_surat || b.baptisan_id})`;
    const headers = ['Parameter Berita Acara', 'Rincian & Keterangan Resmi'];
    const rows = [
      ['Gereja Penyelenggara', churchName],
      ['Nomor Berita Acara', b.nomor_surat || b.baptisan_id],
      ['Nama Jemaat Yang Dibaptis', b.nama_jemaat || '-'],
      ['Tanggal Pelaksanaan Baptis', b.tanggal],
      ['Pendeta Pembaptis', b.pendeta],
      ['Lokasi Sakramen', b.lokasi],
      ['Keterangan Status', 'Berita Acara Resmi Sakramen Baptisan Kudus Sah']
    ];
    exportToPDF(title, headers, rows, settings, `Berita_Acara_Baptis_${b.nama_jemaat || 'Jemaat'}`);
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
            Pencatatan Baptisan Kudus, Peneguhan Sidi, Pemberkatan Pernikahan Kudus, Upload Surat Baptisan, dan Berita Acara.
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
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Data Baptisan Kudus & Upload Surat</h3>
            <button
              onClick={() => setIsBaptisModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
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
                    <th className="p-3.5">Dokumen Surat Jadi</th>
                    <th className="p-3.5 text-center">Cetak Berita Acara</th>
                    <th className="p-3.5 text-center">Aksi</th>
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
                      <td className="p-3.5">
                        {b.file_surat_baptis ? (
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-emerald-400" />
                              <span>Surat Jadi Uploaded</span>
                            </span>
                            <a
                              href={b.file_surat_baptis}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 cursor-pointer"
                              title="Lihat / Download Surat Baptisan"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              onClick={() => setUploadTargetId(b.baptisan_id)}
                              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                            >
                              Ganti
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setUploadTargetId(b.baptisan_id)}
                            className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Upload className="w-3 h-3" />
                            <span>Upload Surat Jadi</span>
                          </button>
                        )}
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => cetakBeritaAcaraBaptisPDF(b)}
                          className="px-3 py-1.5 rounded-lg bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/80 inline-flex items-center gap-1 text-[11px] font-semibold cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>PDF Berita Acara</span>
                        </button>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteBaptis(b.baptisan_id, b.nama_jemaat || b.jemaat_id)}
                          className="p-1.5 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80 transition-all inline-flex items-center gap-1 text-[11px] cursor-pointer"
                          title="Hapus Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Upload Surat Baptisan Jadi */}
      {uploadTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold">Upload Surat Baptisan Resmi (PDF / Foto)</h3>
              </div>
              <button onClick={() => setUploadTargetId(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Unggah file Surat Baptisan yang telah selesai ditandatangani gereja agar jemaat dapat langsung mengunduhnya dari Portal Jemaat.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Pilih File Surat dari Komputer (Foto/PDF)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px]"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        if (evt.target?.result) {
                          handleUploadSuratFile(uploadTargetId, evt.target.result as string);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <div className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-wider">ATAU</div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Tautan / URL File Surat Online</label>
                <input
                  type="text"
                  placeholder="https://drive.google.com/file/... atau URL dokumen"
                  value={uploadUrlInput}
                  onChange={(e) => setUploadUrlInput(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setUploadTargetId(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (uploadUrlInput) {
                      handleUploadSuratFile(uploadTargetId, uploadUrlInput);
                    }
                  }}
                  disabled={!uploadUrlInput}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold cursor-pointer"
                >
                  Simpan File Surat
                </button>
              </div>
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
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
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
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {sidiList.map((s) => (
                    <tr key={s.sidi_id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-3.5 font-mono text-blue-300">{s.nomor_surat || s.sidi_id}</td>
                      <td className="p-3.5 font-bold text-white text-sm">{s.nama_jemaat || s.jemaat_id}</td>
                      <td className="p-3.5">{s.tanggal}</td>
                      <td className="p-3.5">{s.pendeta}</td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteSidi(s.sidi_id, s.nama_jemaat || s.jemaat_id)}
                          className="p-1.5 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80 transition-all inline-flex items-center gap-1 text-[11px] cursor-pointer"
                          title="Hapus Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Tab 3: Pernikahan */}
      {activeTab === 'PERNIKAHAN' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Record Pemberkatan Pernikahan Kudus</h3>
            <button
              onClick={() => setIsNikahModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer"
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
                    <th className="p-3.5 text-center">Aksi</th>
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
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleDeleteNikah(n.nikah_id, `${n.suami} & ${n.istri}`)}
                          className="p-1.5 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80 transition-all inline-flex items-center gap-1 text-[11px] cursor-pointer"
                          title="Hapus Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal Input Baptis */}
      {isBaptisModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold">Input Data Baptisan Kudus</h3>
              <button onClick={() => setIsBaptisModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveBaptis} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Jemaat Dibaptis *</label>
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
                <label className="block text-slate-400 mb-1 font-semibold">Tanggal Pelaksanaan</label>
                <input
                  type="date"
                  value={baptisForm.tanggal}
                  onChange={(e) => setBaptisForm({ ...baptisForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pendeta Pembaptis</label>
                <input
                  type="text"
                  value={baptisForm.pendeta}
                  onChange={(e) => setBaptisForm({ ...baptisForm, pendeta: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Lokasi Baptisan</label>
                <input
                  type="text"
                  value={baptisForm.lokasi}
                  onChange={(e) => setBaptisForm({ ...baptisForm, lokasi: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Upload File Surat Baptisan Jadi (Opsional)</label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-[11px]"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        if (evt.target?.result) {
                          setBaptisForm({ ...baptisForm, file_surat_baptis: evt.target.result as string });
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsBaptisModal(false)} className="px-4 py-2 text-slate-300 font-bold cursor-pointer">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold cursor-pointer">
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
              <button onClick={() => setIsSidiModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSidi} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Peserta Sidi *</label>
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
                <label className="block text-slate-400 mb-1 font-semibold">Tanggal Sidi</label>
                <input
                  type="date"
                  value={sidiForm.tanggal}
                  onChange={(e) => setSidiForm({ ...sidiForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pendeta Melayani</label>
                <input
                  type="text"
                  value={sidiForm.pendeta}
                  onChange={(e) => setSidiForm({ ...sidiForm, pendeta: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsSidiModal(false)} className="px-4 py-2 text-slate-300 font-bold cursor-pointer">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold cursor-pointer">
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
              <button onClick={() => setIsNikahModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveNikah} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama Mempelai Pria (Suami) *</label>
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
                <label className="block text-slate-400 mb-1 font-semibold">Nama Mempelai Wanita (Istri) *</label>
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
                <label className="block text-slate-400 mb-1 font-semibold">Tanggal Pemberkatan</label>
                <input
                  type="date"
                  value={nikahForm.tanggal}
                  onChange={(e) => setNikahForm({ ...nikahForm, tanggal: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Pendeta Pemberkat</label>
                <input
                  type="text"
                  value={nikahForm.pendeta}
                  onChange={(e) => setNikahForm({ ...nikahForm, pendeta: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsNikahModal(false)} className="px-4 py-2 text-slate-300 font-bold cursor-pointer">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold cursor-pointer">
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
