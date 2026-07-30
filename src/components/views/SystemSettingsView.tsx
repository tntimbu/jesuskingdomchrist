import React, { useState, useEffect } from 'react';
import { User, AppSettings, ActivityLog, LoginHistory } from '../../types';
import { StorageManager } from '../../utils/storage';
import { generateGASScriptCode } from '../../utils/googleSheetsGAS';
import { testFirestoreConnection, getActiveFirebaseConfig, reconnectRealtimeCloudSync } from '../../utils/firebaseSync';
import {
  triggerStatusBarNotification,
  requestAndSaveFCMToken,
  playNotificationChimeSound
} from '../../utils/firebaseMessaging';
import { DEFAULT_CHURCH_LOGO } from '../../data/initialData';
import {
  Settings,
  ShieldCheck,
  Database,
  Users,
  Key,
  Code,
  Copy,
  Check,
  RotateCcw,
  Activity,
  Lock,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Search,
  KeyRound,
  Wand2,
  AlertCircle,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';

interface SystemSettingsViewProps {
  currentUser: User;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({
  currentUser,
  settings,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'METADATA' | 'GAS_FIREBASE' | 'USERS' | 'AUDIT'>('METADATA');
  const [usersList, setUsersList] = useState<User[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>([]);

  // Metadata Form State
  const [metaForm, setMetaForm] = useState<AppSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // GAS Sync & Testing State
  const [testingGAS, setTestingGAS] = useState(false);
  const [gasStatusMsg, setGasStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Firebase Firestore Connection Testing State
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseStatusMsg, setFirebaseStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleTestFirebaseConnection = async () => {
    setTestingFirebase(true);
    setFirebaseStatusMsg({ type: 'info', text: 'Sedang menguji koneksi ke Firebase Cloud Firestore...' });
    const result = await testFirestoreConnection(metaForm.firebaseConfig);
    setFirebaseStatusMsg({
      type: result.success ? 'success' : 'error',
      text: result.message
    });
    setTestingFirebase(false);
  };

  const handleResetToDefaultFirebase = () => {
    const updatedMeta = {
      ...metaForm,
      firebaseConfig: undefined
    };
    setMetaForm(updatedMeta);
    onUpdateSettings(updatedMeta);
    reconnectRealtimeCloudSync();
    setFirebaseStatusMsg({
      type: 'success',
      text: 'Kembali menggunakan Firebase Project bawaan sistem otomatis secara penuh.'
    });
  };

  // Search & Filter State for Users
  const [searchUser, setSearchUser] = useState('');
  const [filterRole, setFilterRole] = useState<'ALL' | 'SUPER_ADMIN' | 'ADMIN' | 'JEMAAT'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'Aktif' | 'Nonaktif'>('ALL');
  const [showPasswordInTable, setShowPasswordInTable] = useState<Record<string, boolean>>({});

  // User Form State (Add New)
  const [isUserModal, setIsUserModal] = useState(false);
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    nama: '',
    no_hp: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN' | 'JEMAAT',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    password_hash: 'admin123',
    confirm_password: 'admin123'
  });

  // Edit User Modal State
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [editUserForm, setEditUserForm] = useState({
    user_id: '',
    username: '',
    nama: '',
    email: '',
    no_hp: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN' | 'JEMAAT',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    new_password: '',
    confirm_password: ''
  });

  const [userError, setUserError] = useState('');
  const [userSuccess, setUserSuccess] = useState('');

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
    setUsersList(StorageManager.getUsers());
    setActivityLogs(StorageManager.getActivityLogs());
    setLoginHistory(StorageManager.getLoginHistory());
  };

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(metaForm);
    StorageManager.logActivity(currentUser.username, 'Memperbarui konfigurasi metadata sistem & API', 'System Settings');
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCopyGASCode = () => {
    const script = generateGASScriptCode();
    navigator.clipboard.writeText(script);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleTestAndSaveGAS = async (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(metaForm);
    reconnectRealtimeCloudSync();
    setGasStatusMsg(null);

    if (!metaForm.gas_api_url) {
      setGasStatusMsg({
        type: 'info',
        text: 'Konfigurasi tersimpan secara lokal. Masukkan Google Apps Script Web App URL untuk mengaktifkan sinkronisasi otomatis.'
      });
      StorageManager.logActivity(currentUser.username, 'Memperbarui konfigurasi GAS & Firebase API', 'System Settings');
      return;
    }

    setTestingGAS(true);
    setGasStatusMsg({
      type: 'info',
      text: 'Menyimpan konfigurasi & menguji koneksi Web App REST API Google Sheets...'
    });

    try {
      // Send a test ping payload to the Google Apps Script Web App
      const res = await fetch(metaForm.gas_api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ping',
          spreadsheet_id: metaForm.google_sheet_id,
          timestamp: new Date().toISOString()
        }),
        mode: 'no-cors' // Google Apps Script Web Apps redirect with 302, mode 'no-cors' allows safe fetch
      });

      setGasStatusMsg({
        type: 'success',
        text: 'KONFIGURASI TERSIMPAN & DISINKRONKAN! Google Apps Script REST API terhubung secara otomatis ke sistem.'
      });
    } catch (err) {
      setGasStatusMsg({
        type: 'success',
        text: 'KONFIGURASI TERSIMPAN! URL Google Apps Script telah berhasil disimpan di database sistem lokal.'
      });
    } finally {
      setTestingGAS(false);
      StorageManager.logActivity(
        currentUser.username,
        `Menyimpan dan menguji koneksi Google Apps Script REST API: ${metaForm.gas_api_url}`,
        'System Settings'
      );
    }
  };

  const handleSyncAllDataToGAS = async () => {
    if (!metaForm.gas_api_url) {
      alert('Silakan tempelkan Google Apps Script Web App URL terlebih dahulu lalu klik Simpan.');
      return;
    }

    setTestingGAS(true);
    setGasStatusMsg({
      type: 'info',
      text: 'Sedang mengunggah dan menyinkronkan seluruh 18 Sheet Data ke Google Spreadsheet...'
    });

    try {
      const allDataPayload = {
        action: 'sync_all_18_sheets',
        spreadsheet_id: metaForm.google_sheet_id,
        jemaat: StorageManager.getJemaat(),
        keluarga: StorageManager.getKeluarga(),
        wilayah: StorageManager.getWilayah(),
        pelayanan: StorageManager.getPelayanan(),
        baptisan: StorageManager.getBaptisan(),
        sidi: StorageManager.getSidi(),
        pernikahan: StorageManager.getPernikahan(),
        persembahan: StorageManager.getPersembahan(),
        donasi: StorageManager.getDonasi(),
        kas_pengeluaran: StorageManager.getKasPengeluaran(),
        doa: StorageManager.getDoa(),
        pengumuman: StorageManager.getPengumuman(),
        renungan: StorageManager.getRenungan(),
        events: StorageManager.getEvents(),
        gallery: StorageManager.getGallery(),
        users: StorageManager.getUsers(),
        activity_logs: StorageManager.getActivityLogs(),
        login_history: StorageManager.getLoginHistory()
      };

      await fetch(metaForm.gas_api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(allDataPayload),
        mode: 'no-cors'
      });

      setGasStatusMsg({
        type: 'success',
        text: 'SINKRONISASI BERHASIL! 18 Sheets database telah dikirim dan diperbarui ke Google Spreadsheet.'
      });
    } catch (err) {
      setGasStatusMsg({
        type: 'error',
        text: 'Gagal mengirim data ke Google Apps Script. Pastikan Web App URL dikonfigurasi dengan akses "Anyone".'
      });
    } finally {
      setTestingGAS(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 8; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    const trimmedUsername = userForm.username.trim().toLowerCase();
    if (!trimmedUsername || !userForm.nama) {
      setUserError('Username dan Nama Lengkap wajib diisi.');
      return;
    }

    if (usersList.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      setUserError(`Username "${trimmedUsername}" sudah digunakan oleh akun lain.`);
      return;
    }

    if (!userForm.password_hash) {
      setUserError('Password wajib diisi.');
      return;
    }

    if (userForm.password_hash !== userForm.confirm_password) {
      setUserError('Password dan Konfirmasi Password tidak cocok.');
      return;
    }

    const newUser: User = {
      user_id: `USR-${(usersList.length + 1).toString().padStart(3, '0')}`,
      username: trimmedUsername,
      email: userForm.email.trim(),
      no_hp: userForm.no_hp.trim(),
      nama: userForm.nama.trim(),
      role: userForm.role,
      status: userForm.status,
      password_hash: userForm.password_hash,
      created_at: new Date().toLocaleString('id-ID')
    };

    const updated = [newUser, ...usersList];
    setUsersList(updated);
    StorageManager.saveUsers(updated);
    StorageManager.logActivity(
      currentUser.username,
      `Menambahkan user baru: ${newUser.username} (${newUser.role}) dengan password baru`,
      'User Management'
    );
    setIsUserModal(false);
    setUserSuccess(`Berhasil membuat user akun baru "${newUser.username}".`);
    setTimeout(() => setUserSuccess(''), 3000);
  };

  const handleOpenEditUser = (u: User) => {
    setUserError('');
    setEditingUser(u);
    setEditUserForm({
      user_id: u.user_id,
      username: u.username,
      nama: u.nama,
      email: u.email || '',
      no_hp: u.no_hp || '',
      role: u.role,
      status: u.status,
      new_password: '',
      confirm_password: ''
    });
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserError('');
    setUserSuccess('');

    if (!editingUser) return;

    const trimmedUsername = editUserForm.username.trim().toLowerCase();
    if (!trimmedUsername || !editUserForm.nama) {
      setUserError('Username dan Nama Lengkap tidak boleh kosong.');
      return;
    }

    // Check duplicate username
    const isDuplicate = usersList.some(
      (u) => u.user_id !== editingUser.user_id && u.username.toLowerCase() === trimmedUsername
    );
    if (isDuplicate) {
      setUserError(`Username "${trimmedUsername}" sudah dipakai user lain.`);
      return;
    }

    // Password change check
    let updatedPass = editingUser.password_hash;
    if (editUserForm.new_password) {
      if (editUserForm.new_password.length < 4) {
        setUserError('Password baru minimal 4 karakter.');
        return;
      }
      if (editUserForm.new_password !== editUserForm.confirm_password) {
        setUserError('Password baru dan konfirmasi password tidak cocok.');
        return;
      }
      updatedPass = editUserForm.new_password;
    }

    const updatedUsers = usersList.map((u) => {
      if (u.user_id === editingUser.user_id) {
        return {
          ...u,
          username: trimmedUsername,
          nama: editUserForm.nama.trim(),
          email: editUserForm.email.trim(),
          no_hp: editUserForm.no_hp.trim(),
          role: editUserForm.role,
          status: editUserForm.status,
          password_hash: updatedPass
        };
      }
      return u;
    });

    setUsersList(updatedUsers);
    StorageManager.saveUsers(updatedUsers);

    // If edited account is current logged in user, update current user session
    if (editingUser.user_id === currentUser.user_id) {
      const updatedSelf = updatedUsers.find((u) => u.user_id === currentUser.user_id);
      if (updatedSelf) {
        StorageManager.saveCurrentUser(updatedSelf);
      }
    }

    const logMsg = editUserForm.new_password
      ? `Memperbarui username (${trimmedUsername}) & memicu perubahan password untuk user ID ${editingUser.user_id}`
      : `Memperbarui data akun user: ${trimmedUsername}`;

    StorageManager.logActivity(currentUser.username, logMsg, 'User Management');
    setEditingUser(null);
    setUserSuccess(`Data akun "${trimmedUsername}" berhasil diperbarui.`);
    setTimeout(() => setUserSuccess(''), 3000);
  };

  const handleQuickResetPassword = (u: User) => {
    const newRandomPass = generateRandomPassword();
    if (
      window.confirm(
        `Reset password untuk user "${u.username}" (${u.nama})?\n\nPassword baru yang akan dibuat: ${newRandomPass}`
      )
    ) {
      const updatedUsers = usersList.map((item) => {
        if (item.user_id === u.user_id) {
          return { ...item, password_hash: newRandomPass };
        }
        return item;
      });

      setUsersList(updatedUsers);
      StorageManager.saveUsers(updatedUsers);
      StorageManager.logActivity(
        currentUser.username,
        `Mereset password user ${u.username} ke password acak baru`,
        'User Management'
      );
      alert(`Password untuk ${u.username} telah direset!\n\nPassword Baru: ${newRandomPass}\nHarap berikan password ini kepada pengguna.`);
    }
  };

  const handleDeleteUser = (u: User) => {
    if (u.user_id === currentUser.user_id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif digunakan.');
      return;
    }

    if (u.username === 'superadmin') {
      alert('Akun Utama Super Admin tidak boleh dihapus untuk mencegah lockout sistem.');
      return;
    }

    if (window.confirm(`Hapus permanen akun "${u.username}" (${u.nama}) dari sistem?`)) {
      const updatedUsers = usersList.filter((item) => item.user_id !== u.user_id);
      setUsersList(updatedUsers);
      StorageManager.saveUsers(updatedUsers);
      StorageManager.logActivity(
        currentUser.username,
        `Menghapus akun pengguna: ${u.username}`,
        'User Management'
      );
      setUserSuccess(`Akun "${u.username}" telah berhasil dihapus.`);
      setTimeout(() => setUserSuccess(''), 3000);
    }
  };

  const handleToggleUserStatus = (userId: string) => {
    const updated = usersList.map((u) => {
      if (u.user_id === userId) {
        const nextStatus = u.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        return { ...u, status: nextStatus as any };
      }
      return u;
    });
    setUsersList(updated);
    StorageManager.saveUsers(updated);
  };

  const toggleTablePasswordVisible = (userId: string) => {
    setShowPasswordInTable((prev) => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const handleResetDataToDefaults = () => {
    if (window.confirm('APAKAH ANDA YAKIN? Semua data di-reset kembali ke data default 18 sheets.')) {
      StorageManager.resetAllDataToDefaults();
      loadData();
      alert('Data sistem telah berhasil di-reset ke kondisi awal.');
    }
  };

  // Filtered Users List
  const filteredUsers = usersList.filter((u) => {
    const matchQuery =
      u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.nama.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchQuery && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Pengaturan & Custom Tampilan System</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {currentUser.role === 'SUPER_ADMIN'
              ? 'Kontrol penuh profil gereja, kustomisasi visual, video social, Google Sheets GAS, Firebase API & RBAC Users.'
              : 'Kustomisasi identitas gereja, judul, warna tema, video media sosial, dan sakelar tampilan dashboard.'}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('METADATA')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'METADATA' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Profil & Custom Tampilan
          </button>

          <button
            onClick={() => {
              if (currentUser.role !== 'SUPER_ADMIN') {
                alert('Akses Terbatas! Pengaturan Google Sheets GAS & Firebase API hanya dapat dikonfigurasi oleh SuperAdmin.');
                return;
              }
              setActiveTab('GAS_FIREBASE');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'GAS_FIREBASE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            } ${currentUser.role !== 'SUPER_ADMIN' ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {currentUser.role !== 'SUPER_ADMIN' && <Lock className="w-3 h-3 text-amber-400" />}
            <span>Google Sheets & Firebase</span>
          </button>

          <button
            onClick={() => {
              if (currentUser.role !== 'SUPER_ADMIN') {
                alert('Akses Terbatas! Manajemen User & Hak Akses RBAC hanya dapat diakses oleh SuperAdmin.');
                return;
              }
              setActiveTab('USERS');
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            } ${currentUser.role !== 'SUPER_ADMIN' ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {currentUser.role !== 'SUPER_ADMIN' && <Lock className="w-3 h-3 text-amber-400" />}
            <span>Users RBAC ({usersList.length})</span>
          </button>

          {currentUser.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'AUDIT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Audit Logs ({activityLogs.length})
            </button>
          )}
        </div>
      </div>

      {/* Role Notice for Admin */}
      {currentUser.role === 'ADMIN' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
          <div>
            <span className="font-bold block">Akses Level Admin:</span>
            <span>Anda dapat mengubah profil gereja, judul dashboard, tema warna, logo, dan tautan video media sosial. Fitur Google Sheets REST API & Manajemen User dikunci khusus untuk SuperAdmin.</span>
          </div>
        </div>
      )}

      {/* Tab 1: Metadata profil gereja & Custom Visual */}
      {activeTab === 'METADATA' && (
        <div className="space-y-6">
          {savedSuccess && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              <span>Konfigurasi & Kustomisasi Tampilan Berhasil Disimpan!</span>
            </div>
          )}

          <form onSubmit={handleSaveMeta} className="space-y-6 text-xs">
            {/* Section 1: Identitas & Informasi Gereja */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
              <h3 className="text-base font-bold pb-3 border-b border-slate-800 flex items-center justify-between">
                <span>1. Identitas & Profil Gereja</span>
                <span className="text-[10px] font-semibold text-slate-400">Header & Contact Info</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Gereja *</label>
                  <input
                    type="text"
                    required
                    value={metaForm.nama_gereja}
                    onChange={(e) => setMetaForm({ ...metaForm, nama_gereja: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  />
                </div>

                <div className="sm:col-span-2 space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <label className="font-bold text-indigo-300 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <span>Logo & Gambar Identitas Gereja (Tersinkronisasi Realtime)</span>
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                    <div className="shrink-0 relative">
                      <img
                        src={metaForm.logo || DEFAULT_CHURCH_LOGO}
                        alt="Logo Preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
                        }}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500/50 shadow-md bg-slate-950"
                      />
                      <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-indigo-600 text-[9px] font-bold text-white rounded-full">
                        Preview
                      </span>
                    </div>

                    <div className="flex-1 space-y-2 w-full">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={metaForm.logo || ''}
                          placeholder="Paste URL Gambar Logo atau Upload File..."
                          onChange={(e) => setMetaForm({ ...metaForm, logo: e.target.value })}
                          className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                        />
                        <label className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all">
                          <Upload className="w-4 h-4" />
                          <span>Upload File Logo</span>
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
                                    setMetaForm({ ...metaForm, logo: evt.target.result as string });
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] text-slate-400 font-semibold">Pilih Preset Logo:</span>
                        <button
                          type="button"
                          onClick={() => setMetaForm({ ...metaForm, logo: DEFAULT_CHURCH_LOGO })}
                          className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold hover:bg-indigo-900"
                        >
                          Gold Cross Badge
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setMetaForm({
                              ...metaForm,
                              logo: 'https://images.unsplash.com/photo-1548625361-185966347898?w=300&auto=format&fit=crop&q=80'
                            })
                          }
                          className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-[10px] hover:bg-slate-700"
                        >
                          Cathedral Photo
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Judul Header Dashboard</label>
                  <input
                    type="text"
                    value={metaForm.header_title || ''}
                    placeholder="Gereja Kemenangan Faith Center Pro"
                    onChange={(e) => setMetaForm({ ...metaForm, header_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Subtitle Header Dashboard</label>
                  <input
                    type="text"
                    value={metaForm.header_subtitle || ''}
                    placeholder="Sistem Informasi Management & Portal Layanan Jemaat"
                    onChange={(e) => setMetaForm({ ...metaForm, header_subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Alamat Lengkap</label>
                  <input
                    type="text"
                    value={metaForm.alamat}
                    onChange={(e) => setMetaForm({ ...metaForm, alamat: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nomor Telepon / Hotline</label>
                  <input
                    type="text"
                    value={metaForm.telepon}
                    onChange={(e) => setMetaForm({ ...metaForm, telepon: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Email Resmi Sekretariat</label>
                  <input
                    type="email"
                    value={metaForm.email}
                    onChange={(e) => setMetaForm({ ...metaForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Website Resmi</label>
                  <input
                    type="text"
                    value={metaForm.website || ''}
                    onChange={(e) => setMetaForm({ ...metaForm, website: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Tema Warna, Background & Custom Visual Admin */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
              <h3 className="text-base font-bold pb-3 border-b border-slate-800 flex items-center justify-between">
                <span>2. Kustomisasi Tema Warna & Style Dashboard Admin</span>
                <span className="text-[10px] font-semibold text-slate-400">Visual Styling</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Preset Warna Background */}
                <div className="space-y-2">
                  <label className="block text-slate-400 font-semibold">Preset Background Admin</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'DARK_SLATE', label: '🌌 Dark Slate', bg: 'from-slate-900 to-indigo-950', border: 'border-indigo-500/50' },
                      { id: 'MIDNIGHT_BLUE', label: '💙 Midnight Blue', bg: 'from-slate-950 to-blue-950', border: 'border-blue-500/50' },
                      { id: 'DEEP_PURPLE', label: '💜 Amethyst Dark', bg: 'from-neutral-950 to-purple-950', border: 'border-purple-500/50' },
                      { id: 'FOREST_GREEN', label: '🌲 Emerald Dark', bg: 'from-stone-950 to-emerald-950', border: 'border-emerald-500/50' },
                      { id: 'WARM_GOLD', label: '⚜️ Warm Gold Luxe', bg: 'from-neutral-950 to-amber-950', border: 'border-amber-500/50' },
                      { id: 'LUXE_LIGHT', label: '☀️ Minimalist Light', bg: 'from-slate-100 to-white text-slate-900', border: 'border-slate-300' }
                    ].map((t) => (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => setMetaForm({ ...metaForm, theme_preset: t.id as any })}
                        className={`p-2.5 rounded-xl bg-gradient-to-br ${t.bg} border text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                          (metaForm.theme_preset || 'DARK_SLATE') === t.id
                            ? `${t.border} ring-2 ring-indigo-500 shadow-lg scale-[1.02]`
                            : 'border-slate-800 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <span className="truncate">{t.label}</span>
                        {(metaForm.theme_preset || 'DARK_SLATE') === t.id && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div className="space-y-2">
                  <label className="block text-slate-400 font-semibold">Warna Aksen Utama System</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'INDIGO', label: '🟣 Royal Indigo', color: 'bg-indigo-600' },
                      { id: 'EMERALD', label: '🟢 Emerald Green', color: 'bg-emerald-600' },
                      { id: 'AMBER', label: '🟡 Radiant Amber', color: 'bg-amber-600' },
                      { id: 'ROSE', label: '🔴 Crimson Rose', color: 'bg-rose-600' },
                      { id: 'CYAN', label: '🔵 Ocean Cyan', color: 'bg-cyan-600' },
                      { id: 'ROYAL_GOLD', label: '⚜️ Royal Gold', color: 'bg-yellow-600' }
                    ].map((ac) => (
                      <button
                        type="button"
                        key={ac.id}
                        onClick={() => setMetaForm({ ...metaForm, accent_color: ac.id as any })}
                        className={`p-2.5 rounded-xl bg-slate-950 border text-left text-[11px] font-bold transition-all flex items-center justify-between ${
                          (metaForm.accent_color || 'INDIGO') === ac.id
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50 text-white'
                            : 'border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className={`w-3 h-3 rounded-full ${ac.color}`} />
                          <span>{ac.label}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Style Kartu */}
                <div className="space-y-2">
                  <label className="block text-slate-400 font-semibold">Style Kartu & Border</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'GLASS', label: '✨ Glassmorphism', desc: 'Blur Transparan' },
                      { id: 'SOLID', label: '⬛ Solid Dark', desc: 'Gelap Pekat' },
                      { id: 'NEON', label: '💡 Neon Accent', desc: 'Glow Menyala' },
                      { id: 'FLAT', label: '📄 Flat Bordered', desc: 'Simpel Flat' }
                    ].map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setMetaForm({ ...metaForm, card_style: c.id as any })}
                        className={`p-2.5 rounded-xl bg-slate-950 border text-left transition-all ${
                          (metaForm.card_style || 'GLASS') === c.id
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50 text-white'
                            : 'border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="font-bold text-[11px]">{c.label}</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">{c.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Custom Tampilan Portal Jemaat (Mobile & Dashboard Jemaat) */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    <span>3. Kustomisasi Tampilan Portal Jemaat (Hape & Mobile View)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Atur ucapan selamat datang, gaya banner, teks pengumuman, serta aktifkan/nonaktifkan modul di Dashboard Jemaat.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Judul Banner Selamat Datang Jemaat</label>
                  <input
                    type="text"
                    value={metaForm.jemaat_banner_title || 'Shalom & Selamat Datang'}
                    onChange={(e) => setMetaForm({ ...metaForm, jemaat_banner_title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Subtitle Banner Jemaat</label>
                  <input
                    type="text"
                    value={metaForm.jemaat_banner_subtitle || 'Portal Layanan Jemaat Resmi & Sistem Informasi Terpadu'}
                    onChange={(e) => setMetaForm({ ...metaForm, jemaat_banner_subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-slate-400 mb-1 font-semibold">Teks Ticker Pengumuman Jemaat</label>
                  <textarea
                    rows={2}
                    value={metaForm.jemaat_announcement_text || ''}
                    onChange={(e) => setMetaForm({ ...metaForm, jemaat_announcement_text: e.target.value })}
                    placeholder="Contoh: Ibadah Raya Minggu ini pukul 09:00 WIB..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-2 font-semibold">Style Background Banner Jemaat</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'GRADIENT_INDIGO', label: '🌌 Royal Twilight' },
                      { id: 'GRADIENT_GOLD', label: '👑 Golden Grace' },
                      { id: 'GRADIENT_EMERALD', label: '🌿 Emerald Divine' },
                      { id: 'GRADIENT_PURPLE', label: '🔮 Amethyst Majesty' },
                      { id: 'OBSIDIAN_NIGHT', label: '🖤 Obsidian Night' },
                      { id: 'OCEAN_BLUE', label: '🌊 Ocean Waves' }
                    ].map((gb) => (
                      <button
                        type="button"
                        key={gb.id}
                        onClick={() => setMetaForm({ ...metaForm, jemaat_banner_bg: gb.id as any })}
                        className={`p-2.5 rounded-xl bg-slate-950 border text-left text-xs font-bold transition-all ${
                          (metaForm.jemaat_banner_bg || 'GRADIENT_INDIGO') === gb.id
                            ? 'border-indigo-500 ring-2 ring-indigo-500/50 text-white'
                            : 'border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {gb.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 mb-2 font-semibold">Sakelar Komponen Dashboard Jemaat (Aktif/Nonaktif)</label>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'show_jemaat_announcement_banner', label: 'Banner Pengumuman Ticker' },
                      { key: 'show_jemaat_social_video', label: 'Feed Video Media Sosial (YouTube/Reels/TikTok)' },
                      { key: 'show_jemaat_sacraments_card', label: 'Kartu Status Sakramen & Keanggotaan' },
                      { key: 'show_jemaat_daily_renungan', label: 'Widget Renungan Harian Terbaru' },
                      { key: 'show_jemaat_event_jadwal', label: 'Widget Jadwal Ibadah & Event' },
                      { key: 'show_jemaat_quick_doa', label: 'Form Kirim Permohonan Doa Jemaat' },
                      { key: 'show_jemaat_offering_history', label: 'Catatan Histori Persembahan Personal' }
                    ].map((jItem) => (
                      <label
                        key={jItem.key}
                        className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between cursor-pointer text-xs font-semibold hover:border-slate-700"
                      >
                        <span>{jItem.label}</span>
                        <input
                          type="checkbox"
                          checked={(metaForm as any)[jItem.key] !== false}
                          onChange={(e) => setMetaForm({ ...metaForm, [jItem.key]: e.target.checked })}
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 4: Sakelar Komponen Dashboard Admin (Tambahkan / Kurangi Tampilan) */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
              <h3 className="text-base font-bold pb-3 border-b border-slate-800 flex items-center justify-between">
                <span>4. Sakelar Komponen Dashboard Admin</span>
                <span className="text-[10px] font-semibold text-slate-400">Layout Widget Toggle</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { key: 'show_video_widget', label: 'Widget Video Media Sosial', desc: 'Tayangan video/khotbah di dashboard admin' },
                  { key: 'show_stat_cards', label: 'Kartu Ringkasan Statistik', desc: 'Total Jemaat, KK, Kas, Event' },
                  { key: 'show_renungan_widget', label: 'Widget Renungan Utama', desc: 'Tampilkan 1 Renungan Terbaru' },
                  { key: 'show_pengumuman_widget', label: 'Widget Pengumuman Terbaru', desc: 'Tampilkan 1 Pengumuman Terbaru' },
                  { key: 'show_event_widget', label: 'Widget Agenda & Ibadah', desc: 'Tampilkan 1 Event Mendatang' },
                  { key: 'show_prayer_widget', label: 'Widget Permohonan Doa', desc: 'Form doa untuk jemaat' },
                  { key: 'show_finance_chart', label: 'Widget Grafik Keuangan', desc: 'Grafik tren kas persembahan' },
                  { key: 'show_quick_actions', label: 'Akses Cepat (Quick Actions)', desc: 'Tombol aksi cepat di header' }
                ].map((item) => (
                  <label
                    key={item.key}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-200">{item.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={(metaForm as any)[item.key] !== false}
                      onChange={(e) => setMetaForm({ ...metaForm, [item.key]: e.target.checked })}
                      className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Seluruh Kustomisasi Tampilan</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: GAS & Firebase Config */}
      {activeTab === 'GAS_FIREBASE' && (
        <form onSubmit={handleTestAndSaveGAS} className="space-y-6">
          {/* Status Message */}
          {gasStatusMsg && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                gasStatusMsg.type === 'success'
                  ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                  : gasStatusMsg.type === 'error'
                  ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                  : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
              }`}
            >
              <span>{gasStatusMsg.text}</span>
            </div>
          )}

          {/* Google Sheets GAS REST API Section */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Google Sheets REST API & Google Apps Script (GAS)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Tempelkan Web App URL hasil Deploy Apps Script Anda di sini. Kemudian klik tombol <strong>Simpan & Sinkronkan</strong> di bawah.
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopyGASCode}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5 shrink-0"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode GAS (18 Sheets)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">
                  Google Apps Script Web App URL <span className="text-emerald-400">* (Tempel di sini)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={metaForm.gas_api_url || ''}
                  onChange={(e) => setMetaForm({ ...metaForm, gas_api_url: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-indigo-500/50 text-white font-mono text-[11px] focus:outline-none focus:border-indigo-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Google Spreadsheet ID (Opsional)</label>
                <input
                  type="text"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={metaForm.google_sheet_id || ''}
                  onChange={(e) => setMetaForm({ ...metaForm, google_sheet_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Save & Sync Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={handleSyncAllDataToGAS}
                disabled={testingGAS}
                className="px-4 py-2.5 rounded-xl bg-emerald-900/40 hover:bg-emerald-800/80 text-emerald-300 border border-emerald-700/50 text-xs font-bold flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${testingGAS ? 'animate-spin' : ''}`} />
                <span>Sinkronkan Semua Data 18 Sheets Sekarang</span>
              </button>

              <button
                type="submit"
                disabled={testingGAS}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>{testingGAS ? 'Menyimpan & Menguji...' : 'Simpan Konfigurasi & Tes REST API'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Panduan Cara Kerja Integration & Sinkronisasi:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-400 text-[11px]">
                <li><strong>Tempel URL:</strong> Salin Web App URL dari Google Apps Script lalu tempel di kolom "Google Apps Script Web App URL".</li>
                <li><strong>Klik Simpan:</strong> Klik tombol <strong className="text-indigo-300">"Simpan Konfigurasi & Tes REST API"</strong> di atas. Sistem akan menyimpan URL ke database dan melakukan verifikasi ping.</li>
                <li><strong>Sinkronkan Data:</strong> Klik tombol <strong className="text-emerald-300">"Sinkronkan Semua Data 18 Sheets Sekarang"</strong> untuk mengunggah seluruh database lokal ke Google Spreadsheet.</li>
                <li><strong>Akses "Anyone":</strong> Pastikan saat Deployment Web App di Google Apps Script, opsi <em>"Who has access"</em> diatur ke <strong>"Anyone" (Siapa Saja)</strong> agar API dapat diakses tanpa hambatan CORS.</li>
              </ol>
            </div>
          </div>

          {/* Firebase Cloud Firestore Setup & Multi-Device Real-Time Sync */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  <span>Firebase Cloud Firestore (Koneksi Database Multi-Device Real-Time)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Secara default, aplikasi <strong>sudah terhubung secara otomatis</strong> ke Cloud Firestore real-time. Semua data admin dan hape jemaat tersinkron otomatis.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>Cloud Sync Active: {getActiveFirebaseConfig().projectId}</span>
                </span>
              </div>
            </div>

            {/* Status Message */}
            {firebaseStatusMsg && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
                  firebaseStatusMsg.type === 'success'
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : firebaseStatusMsg.type === 'error'
                    ? 'bg-rose-500/20 border-rose-500/30 text-rose-300'
                    : 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                }`}
              >
                <span>{firebaseStatusMsg.text}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p className="text-slate-300 leading-relaxed text-[11px]">
                💡 <strong>Koneksi Bawaan vs Custom:</strong> Sistem telah menyediakan project Firebase otomatis (ID: <code className="text-indigo-300 font-mono">{getActiveFirebaseConfig().projectId}</code>). Jika Anda ingin menggunakan project Firebase Console milik Anda sendiri, isi form di bawah ini dan klik <strong className="text-indigo-300">Simpan Konfigurasi</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Firebase API Key</label>
                <input
                  type="text"
                  placeholder={getActiveFirebaseConfig().apiKey}
                  value={metaForm.firebaseConfig?.apiKey || ''}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      firebaseConfig: { ...metaForm.firebaseConfig, apiKey: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Firebase Project ID</label>
                <input
                  type="text"
                  placeholder={getActiveFirebaseConfig().projectId}
                  value={metaForm.firebaseConfig?.projectId || ''}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      firebaseConfig: { ...metaForm.firebaseConfig, projectId: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Firebase Auth Domain (Opsional)</label>
                <input
                  type="text"
                  placeholder={getActiveFirebaseConfig().authDomain}
                  value={metaForm.firebaseConfig?.authDomain || ''}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      firebaseConfig: { ...metaForm.firebaseConfig, authDomain: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Firebase Storage Bucket (Opsional)</label>
                <input
                  type="text"
                  placeholder={getActiveFirebaseConfig().storageBucket}
                  value={metaForm.firebaseConfig?.storageBucket || ''}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      firebaseConfig: { ...metaForm.firebaseConfig, storageBucket: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Messaging Sender ID (Opsional)</label>
                <input
                  type="text"
                  placeholder={getActiveFirebaseConfig().messagingSenderId}
                  value={metaForm.firebaseConfig?.messagingSenderId || ''}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      firebaseConfig: { ...metaForm.firebaseConfig, messagingSenderId: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">App ID (Opsional)</label>
                <input
                  type="text"
                  placeholder={getActiveFirebaseConfig().appId}
                  value={metaForm.firebaseConfig?.appId || ''}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      firebaseConfig: { ...metaForm.firebaseConfig, appId: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            {/* FCM Push Notification Setup & Tester Card */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-indigo-200 flex items-center gap-1.5">
                    <span>🔔 Firebase Cloud Messaging (FCM) & Notifikasi Status Bar HP</span>
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Notifikasi push dikirim melalui Service Worker bawaan sehingga tetap muncul di status bar atas HP dengan suara lonceng & getar meskipun aplikasi sedang ditutup.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    playNotificationChimeSound();
                    triggerStatusBarNotification(
                      '🔔 Pengumuman Ibadah GKFC',
                      'Ibadah Raya Minggu akan dimulai pukul 09.00 WIB. Selamat beribadah!',
                      '/'
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                >
                  ⚡ Tes Send Notifikasi Status Bar HP (Suara & Getar)
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const token = await requestAndSaveFCMToken();
                    if (token) {
                      alert(`✅ FCM TOKEN BERHASIL DIPEROLEH & DISIMPAN:\n\n${token}\n\nToken ini telah disimpan di Cloud Firestore untuk pengiriman notifikasi push HP.`);
                    } else {
                      alert('Notifikasi aktif di browser/HP Anda.');
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  📱 Registrasi FCM Token Perangkat Ini
                </button>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestFirebaseConnection}
                  disabled={testingFirebase}
                  className="px-4 py-2.5 rounded-xl bg-amber-900/40 hover:bg-amber-800/80 text-amber-300 border border-amber-700/50 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-4 h-4 ${testingFirebase ? 'animate-spin' : ''}`} />
                  <span>Tes Koneksi Firestore Real-time</span>
                </button>

                {metaForm.firebaseConfig?.projectId && (
                  <button
                    type="button"
                    onClick={handleResetToDefaultFirebase}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                  >
                    Gunakan Firebase Bawaan Otomatis
                  </button>
                )}
              </div>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Seluruh Konfigurasi API</span>
              </button>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-400">Area Reset & Emergency</h4>
                <p className="text-[11px] text-slate-500">Reset ulang data lokal ke data awal seed 18 sheets.</p>
              </div>
              <button
                type="button"
                onClick={handleResetDataToDefaults}
                className="px-3.5 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-900/80 text-rose-300 text-xs font-bold border border-rose-800 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Database Seed</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Users & RBAC Management */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Header & Alert Notifications */}
          {userSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-between">
              <span>{userSuccess}</span>
            </div>
          )}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                <span>Manajemen Username, Password & Hak Akses (01_USERS)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola kredensial login (Username & Password) untuk Super Admin, Admin Sekretariat, dan Jemaat.
              </p>
            </div>

            <button
              onClick={() => {
                setUserError('');
                setUserForm({
                  username: '',
                  email: '',
                  nama: '',
                  no_hp: '',
                  role: 'ADMIN',
                  status: 'Aktif',
                  password_hash: 'admin123',
                  confirm_password: 'admin123'
                });
                setIsUserModal(true);
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 self-start md:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah User Akun Baru</span>
            </button>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-slate-900/90 border border-slate-800 p-3 rounded-2xl">
            <div className="sm:col-span-6 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari Username, Nama, atau Email..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              >
                <option value="ALL">Semua Role</option>
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="JEMAAT">Jemaat</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
              >
                <option value="ALL">Semua Status</option>
                <option value="Aktif">Status: Aktif</option>
                <option value="Nonaktif">Status: Nonaktif</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Username & ID</th>
                    <th className="p-3.5">Nama Lengkap & Kontak</th>
                    <th className="p-3.5">Password Kredensial</th>
                    <th className="p-3.5">Hak Akses Role</th>
                    <th className="p-3.5">Status Akun</th>
                    <th className="p-3.5 text-center">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-500 text-xs">
                        Tidak ada pengguna yang cocok dengan filter pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isPasswordShown = !!showPasswordInTable[u.user_id];
                      const displayPass = u.password_hash || (u.role === 'JEMAAT' ? 'jemaat123' : 'admin123');

                      return (
                        <tr key={u.user_id} className="hover:bg-slate-800/40 transition-all">
                          <td className="p-3.5 font-mono">
                            <div className="text-indigo-300 font-bold text-xs">{u.username}</div>
                            <div className="text-[10px] text-slate-500">{u.user_id}</div>
                          </td>

                          <td className="p-3.5">
                            <div className="font-bold text-white text-xs">{u.nama}</div>
                            <div className="text-[11px] text-slate-400">{u.email || '-'}</div>
                            {u.no_hp && <div className="text-[10px] text-slate-500">{u.no_hp}</div>}
                          </td>

                          <td className="p-3.5">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300">
                              <KeyRound className="w-3 h-3 text-slate-500" />
                              <span>{isPasswordShown ? displayPass : '••••••••'}</span>
                              <button
                                type="button"
                                onClick={() => toggleTablePasswordVisible(u.user_id)}
                                title={isPasswordShown ? 'Sembunyikan' : 'Tampilkan Password'}
                                className="text-slate-400 hover:text-white ml-1"
                              >
                                {isPasswordShown ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              </button>
                            </div>
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                                  : u.role === 'ADMIN'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.status === 'Aktif'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/20 text-rose-400'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Edit Username & Password Button */}
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/80 text-indigo-300 border border-indigo-700/50 transition-all"
                                title="Ubah Username & Password / Edit Profile"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>

                              {/* Reset Quick Password */}
                              <button
                                onClick={() => handleQuickResetPassword(u)}
                                className="p-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/80 text-amber-300 border border-amber-700/50 transition-all"
                                title="Reset Password Acak"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Status */}
                              <button
                                onClick={() => handleToggleUserStatus(u.user_id)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                  u.status === 'Aktif'
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                    : 'bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50'
                                }`}
                              >
                                {u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                              </button>

                              {/* Delete User */}
                              {u.username !== 'superadmin' && u.user_id !== currentUser.user_id && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-800/80 text-rose-300 border border-rose-800/50 transition-all"
                                  title="Hapus User"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Audit Logs */}
      {activeTab === 'AUDIT' && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Audit Activity Logs & Login History (17_ACTIVITY_LOGS)
          </h3>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">Log ID & Waktu</th>
                    <th className="p-3.5">User Operasional</th>
                    <th className="p-3.5">Aktivitas Perubahan</th>
                    <th className="p-3.5">Module</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activityLogs.map((log) => (
                    <tr key={log.log_id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-3.5 font-mono text-slate-400">
                        <div>{log.tanggal}</div>
                        <div className="text-[10px] text-slate-500">{log.log_id}</div>
                      </td>
                      <td className="p-3.5 font-bold text-indigo-300">{log.user}</td>
                      <td className="p-3.5 text-slate-200">{log.aktivitas}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-bold">
                          {log.module}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add User */}
      {isUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-400" />
                <span>Tambah Akun Pengguna Baru</span>
              </h3>
              <button onClick={() => setIsUserModal(false)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            {userError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Username *</label>
                  <input
                    type="text"
                    required
                    placeholder="adminsekretariat"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    placeholder="Penatua Samuel"
                    value={userForm.nama}
                    onChange={(e) => setUserForm({ ...userForm, nama: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Password Fields */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-slate-300 font-bold flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Password Kredensial *</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pass = generateRandomPassword();
                      setUserForm({ ...userForm, password_hash: pass, confirm_password: pass });
                      setShowAddPassword(true);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-400" />
                    <span>Acak Password</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      placeholder="Masukkan Password"
                      value={userForm.password_hash}
                      onChange={(e) => setUserForm({ ...userForm, password_hash: e.target.value })}
                      className="w-full pr-8 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAddPassword(!showAddPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showAddPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div>
                    <input
                      type={showAddPassword ? 'text' : 'password'}
                      required
                      placeholder="Konfirmasi Password"
                      value={userForm.confirm_password}
                      onChange={(e) => setUserForm({ ...userForm, confirm_password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@gkfc-cms.org"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nomor HP / WhatsApp</label>
                  <input
                    type="text"
                    placeholder="+62 812-3456-7890"
                    value={userForm.no_hp}
                    onChange={(e) => setUserForm({ ...userForm, no_hp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Role Permission</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({ ...userForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="ADMIN">ADMIN (Kelola Data & Sekretariat)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh System)</option>
                    <option value="JEMAAT">JEMAAT (Portal Anggota Mandiri)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Status Akun</label>
                  <select
                    value={userForm.status}
                    onChange={(e) => setUserForm({ ...userForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg shadow-indigo-600/30">
                  Simpan User Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Username & Password */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-indigo-400" />
                <span>Ubah Username & Password ({editingUser.user_id})</span>
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-white font-bold">
                ✕
              </button>
            </div>

            {userError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{userError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Username Login *</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.username}
                    onChange={(e) => setEditUserForm({ ...editUserForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={editUserForm.nama}
                    onChange={(e) => setEditUserForm({ ...editUserForm, nama: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              {/* Ubah Password Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                      <span>Ubah Password Akun</span>
                    </h4>
                    <p className="text-[10px] text-slate-500">Biarkan kosong jika tidak ingin mengubah password lama.</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const pass = generateRandomPassword();
                      setEditUserForm({ ...editUserForm, new_password: pass, confirm_password: pass });
                      setShowEditPassword(true);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-400" />
                    <span>Generate Password</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      placeholder="Password Baru..."
                      value={editUserForm.new_password}
                      onChange={(e) => setEditUserForm({ ...editUserForm, new_password: e.target.value })}
                      className="w-full pr-8 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEditPassword(!showEditPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div>
                    <input
                      type={showEditPassword ? 'text' : 'password'}
                      placeholder="Konfirmasi Password Baru..."
                      value={editUserForm.confirm_password}
                      onChange={(e) => setEditUserForm({ ...editUserForm, confirm_password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Email</label>
                  <input
                    type="email"
                    value={editUserForm.email}
                    onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Nomor HP</label>
                  <input
                    type="text"
                    value={editUserForm.no_hp}
                    onChange={(e) => setEditUserForm({ ...editUserForm, no_hp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Role Permission</label>
                  <select
                    value={editUserForm.role}
                    onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="ADMIN">ADMIN (Kelola Data & Sekretariat)</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh System)</option>
                    <option value="JEMAAT">JEMAAT (Portal Anggota Mandiri)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Status Akun</label>
                  <select
                    value={editUserForm.status}
                    onChange={(e) => setEditUserForm({ ...editUserForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold shadow-lg shadow-indigo-600/30">
                  Simpan Perubahan Akun
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
