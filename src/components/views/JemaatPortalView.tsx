import React, { useState, useEffect } from 'react';
import { User, Jemaat, Persembahan } from '../../types';
import { StorageManager } from '../../utils/storage';
import { DEFAULT_CHURCH_LOGO } from '../../data/initialData';
import {
  UserCheck,
  Edit3,
  Upload,
  Link,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Check,
  DollarSign,
  Camera,
  ShieldCheck
} from 'lucide-react';

interface JemaatPortalViewProps {
  currentUser: User;
}

export const JemaatPortalView: React.FC<JemaatPortalViewProps> = ({ currentUser }) => {
  const [jemaatData, setJemaatData] = useState<Jemaat | null>(null);
  const [personalOfferings, setPersonalOfferings] = useState<Persembahan[]>([]);

  // Edit Profile State
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = React.useRef(isEditing);
  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  
  // Photo Edit Mode: 'OFFLINE' (file upload) | 'ONLINE' (url)
  const [photoMode, setPhotoMode] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  const loadData = React.useCallback(() => {
    const activeUser = StorageManager.getCurrentUser() || currentUser;
    const allJemaat = StorageManager.getJemaat();
    const found =
      allJemaat.find((j) => activeUser.jemaat_id && j.jemaat_id === activeUser.jemaat_id) ||
      allJemaat.find((j) => j.nama_lengkap.toLowerCase() === activeUser.nama.toLowerCase()) ||
      allJemaat[0];

    if (found) {
      setJemaatData(found);
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
    setPersonalOfferings(allPersembahan.slice(0, 3));
  }, [currentUser]);

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

  // Handle Offline Image Upload via FileReader Base64
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

  // Save Profile Changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      alert('Nama tidak boleh kosong');
      return;
    }

    const activeUser = StorageManager.getCurrentUser() || currentUser;
    const allJemaat = StorageManager.getJemaat();
    const finalPhoto = editPhotoUrl.trim() || photoPreview || DEFAULT_CHURCH_LOGO;

    // Find target jemaat record to update
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

    // Update currentUser and allUsers in StorageManager
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

    // Notify application system of updates
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

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Profile Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 sm:p-8 shadow-xl text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
            <div className="relative group">
              <img
                src={jemaatData?.foto || photoPreview || DEFAULT_CHURCH_LOGO}
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
                <span>Portal Anggota Jemaat Terverifikasi</span>
              </span>
              <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                Shalom, {jemaatData?.nama_lengkap || currentUser.nama}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300">
                ID Jemaat: <strong className="text-indigo-300 font-mono">{jemaatData?.jemaat_id}</strong> • Wilayah:{' '}
                <span className="text-indigo-300 font-semibold">{jemaatData?.wilayah || 'Sektor Utama'}</span>
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

      {/* EDIT PROFILE FORM SECTION */}
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
            {/* PHOTO EDIT SECTION (OFFLINE vs ONLINE) */}
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
                  <Link className="w-4 h-4" />
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

              {/* Live Preview */}
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

      {/* Member Profile Details Card */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm text-white space-y-4">
        <h3 className="text-base font-bold flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-400" />
            <span>Informasi Keanggotaan & Data Jemaat</span>
          </div>
          <span className="text-xs text-slate-400 font-normal">Sektor: {jemaatData?.wilayah || 'Utama'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">Identitas KTP / KK:</span>
            <p className="font-mono text-slate-200 font-bold text-sm">{jemaatData?.nik || '-'}</p>
            <p className="text-[11px] text-slate-400">No. KK: {jemaatData?.no_kk || '-'}</p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">Status Sacraments:</span>
            <p className="text-emerald-400 font-bold">Baptis: {jemaatData?.status_baptis || 'Sudah'}</p>
            <p className="text-blue-400 font-bold">Sidi: {jemaatData?.status_sidi || 'Sudah'}</p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold">Komisi & Pelayanan:</span>
            <p className="text-indigo-300 font-bold text-sm">{jemaatData?.komisi || 'Jemaat Umum'}</p>
            <p className="text-[11px] text-slate-400">Status Keanggotaan: {jemaatData?.status || 'Aktif'}</p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Kontak HP / WA:</span>
            </span>
            <p className="text-slate-200 font-bold text-xs">{jemaatData?.nomor_hp || currentUser.no_hp || '-'}</p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-indigo-400" />
              <span>Email:</span>
            </span>
            <p className="text-slate-200 font-bold text-xs truncate">{jemaatData?.email || currentUser.email || '-'}</p>
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800 space-y-1">
            <span className="text-slate-400 block font-semibold flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-indigo-400" />
              <span>Alamat Domisili:</span>
            </span>
            <p className="text-slate-200 font-bold text-xs">{jemaatData?.alamat || '-'}</p>
          </div>
        </div>
      </div>

      {/* Riwayat Catatan Persembahan Personal */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-sm text-white space-y-4">
        <h3 className="text-base font-bold flex items-center gap-2 border-b border-slate-800 pb-3">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <span>Catatan Histori Persembahan Personal</span>
        </h3>

        {personalOfferings.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">Belum ada data persembahan tercatat.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {personalOfferings.map((po) => (
              <div key={po.persembahan_id} className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
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
    </div>
  );
};
