import React, { useState, useEffect } from 'react';
import { User, Jemaat, AppSettings, Persembahan, Baptisan, Sidi, Pernikahan } from '../../types';
import { StorageManager } from '../../utils/storage';
import { DEFAULT_CHURCH_LOGO } from '../../data/initialData';
import { getThemeClasses } from '../../utils/themeHelper';
import { exportToPDF } from '../../utils/exportTools';
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
  Camera,
  ShieldCheck,
  QrCode,
  User as UserIcon,
  Award,
  Sparkles,
  Lock,
  Key,
  CreditCard,
  Send,
  Copy,
  CheckCircle2,
  Clock,
  XCircle,
  DollarSign,
  AlertCircle,
  FileText,
  Download,
  Scroll,
  Printer,
  ExternalLink
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

  // My Sacrament Certificates State
  const [myBaptisan, setMyBaptisan] = useState<Baptisan[]>([]);
  const [mySidi, setMySidi] = useState<Sidi[]>([]);
  const [myPernikahan, setMyPernikahan] = useState<Pernikahan[]>([]);

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

  // Password Change State
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Transfer Persembahan Digital State
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [copiedBankNum, setCopiedBankNum] = useState(false);
  const [transferMsg, setTransferMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [transferForm, setTransferForm] = useState({
    jenis: 'Persembahan Perpuluhan',
    jumlah: 500000,
    metode_pembayaran: 'Transfer Bank',
    nama_pengirim: initialJemaat?.nama_lengkap || currentUser.nama || '',
    keterangan: '',
    bukti_transfer: ''
  });

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

      // Load Sacraments
      const userName = (found?.nama_lengkap || activeUser.nama || '').toLowerCase();
      const allB = StorageManager.getBaptisan();
      const allS = StorageManager.getSidi();
      const allN = StorageManager.getPernikahan();

      const matchedB = allB.filter(
        (b) =>
          (found?.jemaat_id && b.jemaat_id === found.jemaat_id) ||
          (activeUser.jemaat_id && b.jemaat_id === activeUser.jemaat_id) ||
          (b.nama_jemaat && b.nama_jemaat.toLowerCase().includes(userName)) ||
          (b.nama_jemaat && userName.includes(b.nama_jemaat.toLowerCase())) ||
          (b.nama_jemaat && userName.split(' ').some((w) => w.length >= 3 && b.nama_jemaat.toLowerCase().includes(w)))
      );

      setMyBaptisan(matchedB.length > 0 ? matchedB : allB);

      const matchedS = allS.filter(
        (s) =>
          (found?.jemaat_id && s.jemaat_id === found.jemaat_id) ||
          (s.nama_jemaat && s.nama_jemaat.toLowerCase().includes(userName)) ||
          (s.nama_jemaat && userName.includes(s.nama_jemaat.toLowerCase()))
      );
      setMySidi(matchedS.length > 0 ? matchedS : allS);

      const matchedN = allN.filter(
        (n) =>
          (n.suami && n.suami.toLowerCase().includes(userName)) ||
          (n.istri && n.istri.toLowerCase().includes(userName))
      );
      setMyPernikahan(matchedN.length > 0 ? matchedN : allN);
    }
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

  // Handle Photo File Upload
  const handlePhotoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Ukuran foto maksimal 2MB!');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setEditPhotoUrl(result);
        setPhotoPreview(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const activeUser = StorageManager.getCurrentUser() || currentUser;
    const allJemaat = StorageManager.getJemaat();
    const targetJemaat =
      allJemaat.find((j) => activeUser.jemaat_id && j.jemaat_id === activeUser.jemaat_id) ||
      allJemaat.find((j) => j.nama_lengkap.toLowerCase() === activeUser.nama.toLowerCase()) ||
      allJemaat[0];

    const finalPhoto = photoPreview || targetJemaat?.foto || currentUser.foto || DEFAULT_CHURCH_LOGO;

    if (targetJemaat) {
      const updatedJemaat: Jemaat = {
        ...targetJemaat,
        nama_lengkap: editName,
        email: editEmail,
        nomor_hp: editPhone,
        alamat: editAddress,
        foto: finalPhoto
      };

      const newJemaatList = allJemaat.map((j) => (j.jemaat_id === targetJemaat.jemaat_id ? updatedJemaat : j));
      StorageManager.saveJemaat(newJemaatList);
      setJemaatData(updatedJemaat);
    }

    // Also update active User session
    const allUsers = StorageManager.getUsers();
    const updatedUsers = allUsers.map((u) => {
      if (u.user_id === activeUser.user_id || u.username === activeUser.username) {
        return {
          ...u,
          nama: editName,
          email: editEmail,
          no_hp: editPhone,
          foto: finalPhoto
        };
      }
      return u;
    });

    StorageManager.saveUsers(updatedUsers);
    const updatedCurrentUser = updatedUsers.find((u) => u.username === activeUser.username) || {
      ...activeUser,
      nama: editName,
      email: editEmail,
      no_hp: editPhone,
      foto: finalPhoto
    };

    StorageManager.saveCurrentUser(updatedCurrentUser);
    StorageManager.logActivity(activeUser.username, 'Memperbarui profil data diri & foto jemaat', 'Profil');

    window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { action: 'profile_updated' } }));

    setIsEditing(false);
    setSaveSuccess('✅ Profil berhasil diperbarui!');
    setTimeout(() => setSaveSuccess(''), 4000);
  };

  // Handle Change Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Kata sandi baru minimal 6 karakter!' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Konfirmasi kata sandi tidak cocok!' });
      return;
    }

    const activeUser = StorageManager.getCurrentUser() || currentUser;
    const allUsers = StorageManager.getUsers();
    const updatedUsers = allUsers.map((u) => {
      if (u.username === activeUser.username) {
        return { ...u, password_hash: newPassword };
      }
      return u;
    });

    StorageManager.saveUsers(updatedUsers);
    StorageManager.logActivity(activeUser.username, 'Mengubah kata sandi akun', 'Profil');

    setPasswordMsg({ type: 'success', text: '✅ Kata sandi berhasil diubah!' });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => {
      setIsChangingPassword(false);
      setPasswordMsg(null);
    }, 2000);
  };

  // Copy Bank Account Number
  const handleCopyBank = () => {
    if (appSettings.rekening_bank_nomor) {
      navigator.clipboard.writeText(appSettings.rekening_bank_nomor);
      setCopiedBankNum(true);
      setTimeout(() => setCopiedBankNum(false), 2000);
    }
  };

  // Submit Transfer Persembahan
  const handleSubmitTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.jumlah || transferForm.jumlah <= 0) {
      setTransferMsg({ type: 'error', text: 'Jumlah nominal persembahan harus lebih dari Rp 0!' });
      return;
    }

    const activeUser = StorageManager.getCurrentUser() || currentUser;
    const allPersembahan = StorageManager.getPersembahan();

    const newTransfer: Persembahan = {
      persembahan_id: `TRS-2026-${Date.now().toString().slice(-4)}`,
      tanggal: new Date().toISOString().slice(0, 10),
      jenis: transferForm.jenis,
      kategori: transferForm.jenis,
      jumlah: Number(transferForm.jumlah),
      keterangan: transferForm.keterangan || `Transfer persembahan oleh ${transferForm.nama_pengirim}`,
      metode_pembayaran: transferForm.metode_pembayaran,
      nama_pengirim: transferForm.nama_pengirim || activeUser.nama,
      jemaat_id: jemaatData?.jemaat_id || activeUser.jemaat_id || activeUser.user_id,
      status: 'PENDING',
      bukti_transfer: transferForm.bukti_transfer
    };

    const updated = [newTransfer, ...allPersembahan];
    StorageManager.savePersembahan(updated);
    StorageManager.logActivity(
      activeUser.username,
      `Mengirim Konfirmasi Transfer Persembahan Rp ${newTransfer.jumlah.toLocaleString('id-ID')}`,
      'Portal Jemaat'
    );

    setTransferMsg({
      type: 'success',
      text: '✅ Konfirmasi transfer persembahan berhasil dikirim! Admin/Bendahara gereja akan memverifikasi transaksi Anda.'
    });

    setTimeout(() => {
      setIsTransferModalOpen(false);
      setTransferMsg(null);
      setTransferForm({
        jenis: 'Persembahan Perpuluhan',
        jumlah: 500000,
        metode_pembayaran: 'Transfer Bank',
        nama_pengirim: jemaatData?.nama_lengkap || currentUser.nama || '',
        keterangan: '',
        bukti_transfer: ''
      });
    }, 2500);
  };

  // Dynamic Layout Width
  let widthClass = 'w-full px-0 sm:px-1';
  if (appSettings.jemaat_card_width === 'COMPACT' || appSettings.jemaat_card_width === 'MOBILE_COMPACT') widthClass = 'max-w-4xl mx-auto px-1 sm:px-3';
  if (appSettings.jemaat_card_width === 'CONTAINED') widthClass = 'max-w-7xl mx-auto px-1 sm:px-3';

  // Dynamic Banner Background
  let bannerBgClass = 'bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 border-indigo-500/50 shadow-xl shadow-indigo-900/20';

  const displayPhoto = photoPreview || jemaatData?.foto || currentUser.foto || DEFAULT_CHURCH_LOGO;

  return (
    <div className={`space-y-6 pb-2 sm:pb-4 transition-all duration-300 ${widthClass}`}>
      {/* 1. Header Banner Profil User / Jemaat */}
      <div className={`relative rounded-3xl ${bannerBgClass} p-6 sm:p-8 overflow-hidden text-white transition-all border shadow-2xl`}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative group">
              <img
                src={displayPhoto}
                alt={jemaatData?.nama_lengkap || currentUser.nama}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
                }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-indigo-500/50 shadow-2xl bg-slate-900"
              />
              <button
                onClick={() => setIsEditing(true)}
                className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-all cursor-pointer"
                title="Ubah Foto Profil"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Jemaat Resmi</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                  Sektor: {jemaatData?.wilayah || 'Utama'}
                </span>
              </div>

              <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight mt-1 text-white">
                {jemaatData?.nama_lengkap || currentUser.nama}
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-0.5 flex items-center gap-2">
                <span>ID Jemaat: <strong className="text-indigo-300 font-mono">{jemaatData?.jemaat_id || currentUser.user_id}</strong></span>
                <span>&bull;</span>
                <span>Username: <strong className="text-slate-200">@{currentUser.username}</strong></span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>{isEditing ? 'Tutup Form Edit' : 'Edit Data Profil'}</span>
            </button>
            <button
              onClick={() => setIsChangingPassword(!isChangingPassword)}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Key className="w-4 h-4 text-amber-400" />
              <span>Ganti Kata Sandi</span>
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <Check className="w-4 h-4" />
            <span>{saveSuccess}</span>
          </div>
        )}
      </div>

      {/* 2. Modal/Card Edit Profil Data Diri */}
      {isEditing && (
        <div className={`rounded-3xl ${theme.cardClass} p-6 transition-all duration-300 space-y-5 border-2 border-indigo-500/50 shadow-2xl animate-fade-in`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-400" />
              <span>Formulir Perubahan Data Profil Jemaat</span>
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* FOTO PROFIL OPTION */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <label className="block text-xs font-bold text-slate-300">Ganti Foto Profil:</label>
              
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPhotoMode('OFFLINE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    photoMode === 'OFFLINE'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Foto dari Galeri HP</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode('ONLINE')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    photoMode === 'ONLINE'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>Gunakan Link Foto URL</span>
                </button>
              </div>

              {photoMode === 'OFFLINE' ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoFileUpload}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Pilih file foto dari perangkat (JPG, PNG, max 2MB).</p>
                </div>
              ) : (
                <div>
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
                  <span className="text-xs text-slate-400">Preview Foto:</span>
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

            {/* INPUT FIELD PROFILE */}
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

      {/* 3. Form Ganti Kata Sandi */}
      {isChangingPassword && (
        <div className={`rounded-3xl ${theme.cardClass} p-6 transition-all duration-300 space-y-4 border border-amber-500/40 shadow-2xl animate-fade-in`}>
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              <span>Ganti Kata Sandi Akun</span>
            </h3>
            <button
              onClick={() => setIsChangingPassword(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {passwordMsg && (
            <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
              passwordMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
            }`}>
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Kata Sandi Baru:</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Konfirmasi Kata Sandi Baru:</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Kata Sandi Baru</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 4. Kartu Tanda Anggota (KTA) Jemaat Digital */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 border-2 border-indigo-500/40 shadow-2xl text-white space-y-6 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest block">
                Official Digital Member Card
              </span>
              <h3 className="text-lg font-extrabold text-white">Kartu Tanda Anggota (KTA) Jemaat Digital</h3>
            </div>
          </div>
          <div className="text-right text-xs">
            <span className="text-slate-400 block text-[10px]">Status Verifikasi:</span>
            <span className="text-emerald-400 font-extrabold flex items-center justify-end gap-1">
              <ShieldCheck className="w-4 h-4" /> Verified Active Member
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[10px] block font-semibold">Nama Lengkap:</span>
                <p className="font-extrabold text-white text-sm mt-0.5">{jemaatData?.nama_lengkap || currentUser.nama}</p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[10px] block font-semibold">Nomor Induk Kependudukan:</span>
                <p className="font-mono text-indigo-300 font-bold text-xs mt-0.5">{jemaatData?.nik || '-'}</p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[10px] block font-semibold">Sektor / Wilayah:</span>
                <p className="font-bold text-white text-xs mt-0.5">{jemaatData?.wilayah || 'Wilayah Utama'}</p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[10px] block font-semibold">Sakramen Baptis Kudus:</span>
                <p className="font-bold text-emerald-400 text-xs mt-0.5">{jemaatData?.status_baptis || 'Sudah'}</p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[10px] block font-semibold">Sakramen Sidi:</span>
                <p className="font-bold text-blue-400 text-xs mt-0.5">{jemaatData?.status_sidi || 'Sudah'}</p>
              </div>

              <div className="p-3 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[10px] block font-semibold">Komisi Pelayanan:</span>
                <p className="font-bold text-amber-300 text-xs mt-0.5">{jemaatData?.komisi || 'Jemaat Umum'}</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-white text-slate-900 rounded-2xl shadow-2xl flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-2 bg-slate-100 rounded-xl">
              <QrCode className="w-24 h-24 text-slate-900" />
            </div>
            <div className="text-[10px] text-slate-600 font-mono font-bold">
              ID: {jemaatData?.jemaat_id || currentUser.user_id}
            </div>
            <p className="text-[9px] text-slate-500 leading-tight">
              Gunakan QR Code ini untuk absensi ibadah &amp; presensi kegiatan gereja.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Detailed Member Info & Contact Card */}
      <div className={`rounded-3xl ${theme.cardClass} p-6 sm:p-8 transition-all duration-300 space-y-4`}>
        <h3 className="text-base font-bold flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <UserCheck className={`w-5 h-5 ${theme.accentText}`} />
            <span>Informasi Detail Diri &amp; Keanggotaan</span>
          </div>
          <span className="text-xs text-slate-400 font-normal">Status: {jemaatData?.status || 'Aktif'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 block font-semibold">Identitas KTP &amp; No. KK:</span>
            <p className="font-mono text-slate-200 font-bold text-sm">NIK: {jemaatData?.nik || '-'}</p>
            <p className="text-[11px] text-slate-400">No. KK: {jemaatData?.no_kk || '-'}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 block font-semibold">Tempat &amp; Tanggal Lahir:</span>
            <p className="text-slate-200 font-bold text-xs">{jemaatData?.tempat_lahir || 'Jakarta'}, {jemaatData?.tanggal_lahir || '01 Jan 1990'}</p>
            <p className="text-[11px] text-slate-400">Jenis Kelamin: {jemaatData?.jenis_kelamin || 'Laki-laki'}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 block font-semibold">Status Pernikahan &amp; Pekerjaan:</span>
            <p className="text-slate-200 font-bold text-xs">{jemaatData?.status_pernikahan || 'Menikah'}</p>
            <p className="text-[11px] text-slate-400">Pekerjaan: {jemaatData?.pekerjaan || 'Karyawan Swasta'}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 block font-semibold flex items-center gap-1">
              <Phone className={`w-3.5 h-3.5 ${theme.accentText}`} />
              <span>Kontak HP / WhatsApp:</span>
            </span>
            <p className="text-slate-200 font-bold text-xs">{jemaatData?.nomor_hp || currentUser.no_hp || '-'}</p>
          </div>

          <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-1">
            <span className="text-slate-400 block font-semibold flex items-center gap-1">
              <Mail className={`w-3.5 h-3.5 ${theme.accentText}`} />
              <span>Email Resmi:</span>
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

      {/* 6. Dokumen Surat & Sakramen Gereja Saya */}
      <div className={`rounded-3xl ${theme.cardClass} p-6 sm:p-8 transition-all duration-300 space-y-4`}>
        <h3 className="text-base font-bold flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Scroll className={`w-5 h-5 ${theme.accentText}`} />
            <span>Dokumen Surat & Sakramen Gereja Saya</span>
          </div>
          <span className="text-xs text-indigo-300 font-mono">Arsip Surat Resmi</span>
        </h3>

        <div className="space-y-4">
          {/* Section Baptisan */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-400" />
              <span>Sakramen Baptisan Kudus</span>
            </h4>

            {myBaptisan.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {myBaptisan.map((b) => (
                  <div key={b.baptisan_id} className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-[10px] text-indigo-300 font-bold block">
                          {b.nomor_surat || b.baptisan_id}
                        </span>
                        <p className="font-bold text-white text-sm mt-0.5">{b.nama_jemaat}</p>
                        <p className="text-[11px] text-slate-400">Tgl: {b.tanggal} • {b.pendeta}</p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                        Sah Menerima
                      </span>
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                      {b.file_surat_baptis ? (
                        <a
                          href={b.file_surat_baptis}
                          target="_blank"
                          rel="noreferrer"
                          download={`Surat_Baptis_${b.nama_jemaat}`}
                          className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Surat Baptisan (File Asli)</span>
                        </a>
                      ) : (
                        <button
                          onClick={() => {
                            const title = `BERITA ACARA BAPTISAN KUDUS (No. ${b.nomor_surat || b.baptisan_id})`;
                            const headers = ['Parameter Berita Acara', 'Rincian Keterangan'];
                            const rows = [
                              ['Gereja Penyelenggara', appSettings.nama_gereja || 'SYSTEM MANAGEMENT CHURCH'],
                              ['Nomor Surat', b.nomor_surat || b.baptisan_id],
                              ['Nama Jemaat Dibaptis', b.nama_jemaat],
                              ['Tanggal Pelaksanaan', b.tanggal],
                              ['Pendeta Pembaptis', b.pendeta],
                              ['Status Sacraments', 'Sah Menerima Sakramen Baptisan Kudus']
                            ];
                            exportToPDF(title, headers, rows, appSettings, `Berita_Acara_Baptis_${b.nama_jemaat}`);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Cetak Berita Acara Baptis (PDF)</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 text-center text-xs text-slate-400">
                Belum ada record data baptisan tercatat untuk akun ini. Silakan hubungi Sekretariat Gereja jika data belum masuk.
              </div>
            )}
          </div>

          {/* Section Sidi & Nikah */}
          {(mySidi.length > 0 || myPernikahan.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              {mySidi.map((s) => (
                <div key={s.sidi_id} className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-blue-300 font-mono font-bold block">SIDI: {s.nomor_surat || s.sidi_id}</span>
                    <p className="font-bold text-white">{s.nama_jemaat}</p>
                    <p className="text-[10px] text-slate-400">{s.tanggal} • {s.pendeta}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">Peneguhan Sidi</span>
                </div>
              ))}

              {myPernikahan.map((n) => (
                <div key={n.nikah_id} className="p-3 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-pink-300 font-mono font-bold block">NIKAH: {n.nomor_surat || n.nikah_id}</span>
                    <p className="font-bold text-white">{n.suami} &amp; {n.istri}</p>
                    <p className="text-[10px] text-slate-400">{n.tanggal} • {n.pendeta}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold">Pemberkatan Nikah</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
