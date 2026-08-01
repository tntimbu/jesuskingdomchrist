import React, { useState, useEffect } from 'react';
import { Jemaat, Keluarga, User } from '../../types';
import { StorageManager } from '../../utils/storage';
import { exportToExcel, exportToPDF } from '../../utils/exportTools';
import {
  Users,
  Search,
  Plus,
  FileSpreadsheet,
  FileText,
  Edit,
  Trash2,
  Eye,
  X,
  UserCheck,
  Building,
  Upload,
  Phone,
  Mail,
  MapPin,
  Calendar
} from 'lucide-react';

interface JemaatViewProps {
  currentUser: User;
}

export const JemaatView: React.FC<JemaatViewProps> = ({ currentUser }) => {
  const [jemaatList, setJemaatList] = useState<Jemaat[]>([]);
  const [keluargaList, setKeluargaList] = useState<Keluarga[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWilayah, setFilterWilayah] = useState('ALL');
  const [filterKomisi, setFilterKomisi] = useState('ALL');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJemaat, setEditingJemaat] = useState<Jemaat | null>(null);
  const [viewingJemaat, setViewingJemaat] = useState<Jemaat | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Jemaat>>({
    nik: '',
    no_kk: '',
    nama_lengkap: '',
    jenis_kelamin: 'Laki-laki',
    tempat_lahir: 'Jakarta',
    tanggal_lahir: '1995-01-01',
    alamat: '',
    wilayah: 'Wilayah I - Sunter',
    komisi: 'Komisi Pemuda (Youth)',
    status_baptis: 'Sudah',
    status_sidi: 'Sudah',
    status_pernikahan: 'Belum Menikah',
    pekerjaan: 'Wiraswasta',
    nomor_hp: '',
    email: '',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
    status: 'Aktif'
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
    setJemaatList(StorageManager.getJemaat());
    setKeluargaList(StorageManager.getKeluarga());
  };

  const filteredJemaat = jemaatList.filter((j) => {
    const matchesQuery =
      j.nama_lengkap.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.nik.includes(searchQuery) ||
      j.no_kk.includes(searchQuery) ||
      j.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWilayah = filterWilayah === 'ALL' || j.wilayah === filterWilayah;
    const matchesKomisi = filterKomisi === 'ALL' || j.komisi === filterKomisi;
    return matchesQuery && matchesWilayah && matchesKomisi;
  });

  const handleOpenAdd = () => {
    setEditingJemaat(null);
    setFormData({
      nik: `3171${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      no_kk: `3171${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      nama_lengkap: '',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: '1995-05-15',
      alamat: 'Jl. Pemuda No. 10',
      wilayah: 'Wilayah I - Sunter',
      komisi: 'Komisi Pria (Bapa)',
      status_baptis: 'Sudah',
      status_sidi: 'Sudah',
      status_pernikahan: 'Menikah',
      pekerjaan: 'Karyawan Swasta',
      nomor_hp: '+62 812-3456-7890',
      email: 'jemaat.baru@gmail.com',
      foto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (j: Jemaat) => {
    setEditingJemaat(j);
    setFormData(j);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string, nama: string) => {
    if (window.confirm(`Hapus data jemaat ${nama}?`)) {
      const updated = jemaatList.filter((j) => j.jemaat_id !== id);
      setJemaatList(updated);
      StorageManager.saveJemaat(updated);
      StorageManager.logActivity(currentUser.username, `Menghapus data jemaat: ${nama}`, 'Master Jemaat');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama_lengkap) return;

    const activeTenantId = currentUser.tenant_id || StorageManager.getActiveTenantId() || 'CHURCH-001';

    if (editingJemaat) {
      const updated = jemaatList.map((j) =>
        j.jemaat_id === editingJemaat.jemaat_id ? ({ ...j, ...formData } as Jemaat) : j
      );
      setJemaatList(updated);
      StorageManager.saveJemaat(updated);
      StorageManager.logActivity(currentUser.username, `Mengubah data jemaat: ${formData.nama_lengkap}`, 'Master Jemaat');
    } else {
      const newJemaat: Jemaat = {
        jemaat_id: `JMT-${(jemaatList.length + 1).toString().padStart(3, '0')}`,
        ...(formData as Jemaat)
      };
      const updated = [newJemaat, ...jemaatList];
      setJemaatList(updated);
      StorageManager.saveJemaat(updated);

      // Auto create user login account for this Jemaat so they can immediately log in
      const allUsers = StorageManager.getUsers();
      let derivedUsername = '';
      if (formData.email && formData.email.includes('@')) {
        derivedUsername = formData.email.split('@')[0].toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      }
      if (!derivedUsername || derivedUsername.length < 3) {
        derivedUsername = formData.nama_lengkap.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      }
      if (!derivedUsername || derivedUsername.length < 3) {
        derivedUsername = `jemaat_${newJemaat.jemaat_id.toLowerCase().replace('-', '')}`;
      }

      let finalUsername = derivedUsername;
      let counter = 1;
      while (allUsers.some((u) => u.username.toLowerCase() === finalUsername)) {
        finalUsername = `${derivedUsername}${counter}`;
        counter++;
      }

      const newJemaatUser: User = {
        user_id: `USR-${(allUsers.length + 1).toString().padStart(3, '0')}`,
        username: finalUsername,
        nama: newJemaat.nama_lengkap,
        email: newJemaat.email || '',
        no_hp: newJemaat.nomor_hp || '',
        role: 'JEMAAT',
        status: 'Aktif',
        password_hash: 'jemaat123',
        tenant_id: activeTenantId,
        created_at: new Date().toLocaleString('id-ID')
      };

      StorageManager.saveUsers([newJemaatUser, ...allUsers]);
      StorageManager.logActivity(currentUser.username, `Menambahkan jemaat baru: ${newJemaat.nama_lengkap} & akun login: ${finalUsername}`, 'Master Jemaat');

      alert(`Data Jemaat "${newJemaat.nama_lengkap}" berhasil ditambahkan!\n\nAkun Login Portal Jemaat telah dibuat secara otomatis:\n- Username: ${finalUsername}\n- Password: jemaat123`);
    }

    setIsModalOpen(false);
  };

  const handleExportExcel = () => {
    exportToExcel(filteredJemaat, 'Data_Jemaat_Gereja');
  };

  const handleExportPDF = () => {
    const headers = ['ID', 'NIK', 'Nama Lengkap', 'JK', 'Wilayah', 'Komisi', 'No. HP', 'Status'];
    const rows = filteredJemaat.map((j) => [
      j.jemaat_id,
      j.nik,
      j.nama_lengkap,
      j.jenis_kelamin,
      j.wilayah,
      j.komisi,
      j.nomor_hp,
      j.status
    ]);
    exportToPDF('LAPORAN MASTER DATA JEMAAT GEREJA', headers, rows, undefined, 'Data_Jemaat');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-400" />
            <span>Master Data Jemaat & Kartu Keluarga</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola data jemaat, wilayah, komisi, status baptis/sidi, dan kartu keluarga secara rinci.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>Export PDF</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Jemaat</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan NIK, No KK, Nama, Email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterWilayah}
            onChange={(e) => setFilterWilayah(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Wilayah</option>
            <option value="Wilayah I - Sunter">Wilayah I - Sunter</option>
            <option value="Wilayah II - Kelapa Gading">Wilayah II - Kelapa Gading</option>
            <option value="Wilayah III - Cempaka Putih">Wilayah III - Cempaka Putih</option>
            <option value="Wilayah IV - Kemayoran & Menteng">Wilayah IV - Kemayoran</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={filterKomisi}
            onChange={(e) => setFilterKomisi(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">Semua Komisi</option>
            <option value="Komisi Pria (Bapa)">Komisi Pria (Bapa)</option>
            <option value="Komisi Wanita (WBI)">Komisi Wanita (WBI)</option>
            <option value="Komisi Pemuda (Youth)">Komisi Pemuda (Youth)</option>
            <option value="Komisi Remaja">Komisi Remaja</option>
            <option value="Komisi Anak (Sekolah Minggu)">Sekolah Minggu</option>
          </select>
        </div>
      </div>

      {/* Jemaat Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="p-3.5">Foto & Nama</th>
                <th className="p-3.5">NIK & No KK</th>
                <th className="p-3.5">Wilayah</th>
                <th className="p-3.5">Komisi</th>
                <th className="p-3.5">Baptis / Sidi</th>
                <th className="p-3.5">Kontak</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredJemaat.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    Tidak ada data jemaat yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredJemaat.map((j) => (
                  <tr key={j.jemaat_id} className="hover:bg-slate-800/40 transition-all">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <img
                          src={j.foto}
                          alt={j.nama_lengkap}
                          className="w-9 h-9 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <p className="font-bold text-white text-sm">{j.nama_lengkap}</p>
                          <p className="text-[10px] text-slate-400">{j.jemaat_id} • {j.jenis_kelamin}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-slate-300">
                      <div>NIK: {j.nik}</div>
                      <div className="text-[10px] text-slate-500">KK: {j.no_kk}</div>
                    </td>

                    <td className="p-3.5">{j.wilayah}</td>

                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold">
                        {j.komisi}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <div className="space-y-0.5 text-[11px]">
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] ${j.status_baptis === 'Sudah' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                          Baptis: {j.status_baptis}
                        </span>
                        <br />
                        <span className={`inline-block px-1.5 py-0.2 rounded text-[10px] ${j.status_sidi === 'Sudah' ? 'bg-blue-500/20 text-blue-300' : 'bg-amber-500/20 text-amber-300'}`}>
                          Sidi: {j.status_sidi}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <div>{j.nomor_hp}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">{j.email}</div>
                    </td>

                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setViewingJemaat(j)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700"
                          title="Detail"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(j)}
                          className="p-1.5 rounded-lg bg-indigo-900/40 text-indigo-300 hover:bg-indigo-900/80"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(j.jemaat_id, j.nama_lengkap)}
                          className="p-1.5 rounded-lg bg-rose-900/40 text-rose-300 hover:bg-rose-900/80"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Detail Modal */}
      {viewingJemaat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                <span>Kartu Detail Jemaat</span>
              </h3>
              <button onClick={() => setViewingJemaat(null)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
              <img
                src={viewingJemaat.foto}
                alt={viewingJemaat.nama_lengkap}
                className="w-24 h-24 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-md"
              />
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="text-xl font-bold">{viewingJemaat.nama_lengkap}</h4>
                <p className="text-xs text-indigo-400 font-semibold">{viewingJemaat.jemaat_id} • Status: {viewingJemaat.status}</p>
                <p className="text-xs text-slate-300">{viewingJemaat.komisi} • {viewingJemaat.wilayah}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-slate-500 block">NIK:</span>
                <span className="font-mono text-slate-200">{viewingJemaat.nik}</span>
              </div>
              <div>
                <span className="text-slate-500 block">No. KK:</span>
                <span className="font-mono text-slate-200">{viewingJemaat.no_kk}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Jenis Kelamin:</span>
                <span>{viewingJemaat.jenis_kelamin}</span>
              </div>
              <div>
                <span className="text-slate-500 block">TTL:</span>
                <span>{viewingJemaat.tempat_lahir}, {viewingJemaat.tanggal_lahir}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Baptis:</span>
                <span className="text-emerald-400 font-bold">{viewingJemaat.status_baptis}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Status Sidi:</span>
                <span className="text-blue-400 font-bold">{viewingJemaat.status_sidi}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Pekerjaan:</span>
                <span>{viewingJemaat.pekerjaan}</span>
              </div>
              <div>
                <span className="text-slate-500 block">No. HP:</span>
                <span>{viewingJemaat.nomor_hp}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 block">Alamat Domisili:</span>
                <span className="text-slate-200">{viewingJemaat.alamat}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingJemaat(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold">
                {editingJemaat ? 'Edit Data Jemaat' : 'Tambah Jemaat Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={formData.nama_lengkap || ''}
                    onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">NIK (KTP) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nik || ''}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">No. KK *</label>
                  <input
                    type="text"
                    required
                    value={formData.no_kk || ''}
                    onChange={(e) => setFormData({ ...formData, no_kk: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.jenis_kelamin || 'Laki-laki'}
                    onChange={(e) => setFormData({ ...formData, jenis_kelamin: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Wilayah</label>
                  <select
                    value={formData.wilayah || 'Wilayah I - Sunter'}
                    onChange={(e) => setFormData({ ...formData, wilayah: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Wilayah I - Sunter">Wilayah I - Sunter</option>
                    <option value="Wilayah II - Kelapa Gading">Wilayah II - Kelapa Gading</option>
                    <option value="Wilayah III - Cempaka Putih">Wilayah III - Cempaka Putih</option>
                    <option value="Wilayah IV - Kemayoran & Menteng">Wilayah IV - Kemayoran</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Komisi</label>
                  <select
                    value={formData.komisi || 'Komisi Pria (Bapa)'}
                    onChange={(e) => setFormData({ ...formData, komisi: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Komisi Pria (Bapa)">Komisi Pria (Bapa)</option>
                    <option value="Komisi Wanita (WBI)">Komisi Wanita (WBI)</option>
                    <option value="Komisi Pemuda (Youth)">Komisi Pemuda (Youth)</option>
                    <option value="Komisi Remaja">Komisi Remaja</option>
                    <option value="Komisi Anak (Sekolah Minggu)">Sekolah Minggu</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Status Baptis</label>
                  <select
                    value={formData.status_baptis || 'Sudah'}
                    onChange={(e) => setFormData({ ...formData, status_baptis: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Sudah">Sudah Baptis</option>
                    <option value="Belum">Belum Baptis</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Status Sidi</label>
                  <select
                    value={formData.status_sidi || 'Sudah'}
                    onChange={(e) => setFormData({ ...formData, status_sidi: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Sudah">Sudah Sidi</option>
                    <option value="Belum">Belum Sidi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nomor HP / Whatsapp</label>
                  <input
                    type="text"
                    value={formData.nomor_hp || ''}
                    onChange={(e) => setFormData({ ...formData, nomor_hp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1">Alamat Domisili Lengkap</label>
                  <input
                    type="text"
                    value={formData.alamat || ''}
                    onChange={(e) => setFormData({ ...formData, alamat: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-md shadow-indigo-600/30"
                >
                  Simpan Data
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
