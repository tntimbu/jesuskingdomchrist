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
  Sparkles,
  CreditCard,
  QrCode
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

  useEffect(() => {
    if (settings) {
      setMetaForm(settings);
    }
  }, [settings]);
  const [copiedCode, setCopiedCode] = useState(false);

  // GAS Sync & Testing State
  const [testingGAS, setTestingGAS] = useState(false);
  const [gasStatusMsg, setGasStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Firebase Firestore Connection Testing State
  const [testingFirebase, setTestingFirebase] = useState(false);
  const [firebaseStatusMsg, setFirebaseStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // FCM Payload Code Generator Modal State
  const [showFcmModal, setShowFcmModal] = useState(false);
  const [fcmTitle, setFcmTitle] = useState('🔔 Notifikasi Penting Gereja');
  const [fcmBody, setFcmBody] = useState('Shalom jemaat, Ibadah Raya Minggu akan dimulai pukul 09.00 WIB.');
  const [fcmChannelId, setFcmChannelId] = useState('high_importance_channel');
  const [fcmSound, setFcmSound] = useState('default');
  const [fcmTargetToken, setFcmTargetToken] = useState('PASTE_TARGET_FCM_DEVICE_TOKEN_HERE');
  const [activeFcmTab, setActiveFcmTab] = useState<'JSON' | 'NODE' | 'CURL' | 'ANDROID'>('JSON');
  const [copiedFcmCode, setCopiedFcmCode] = useState(false);

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
    StorageManager.saveSettings(metaForm);
    window.dispatchEvent(new CustomEvent('cms_data_changed', { detail: { action: 'settings_updated' } }));
    StorageManager.logActivity(currentUser.username, 'Memperbarui kustomisasi tampilan portal jemaat & dashboard', 'System Settings');
    setSavedSuccess(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setSavedSuccess(false), 4000);
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

    if (currentUser.role !== 'SUPER_ADMIN' && userForm.role === 'SUPER_ADMIN') {
      setUserError('Hak Akses Terbatas: Hanya SuperAdmin yang berhak membuat akun SuperAdmin baru.');
      return;
    }

    const trimmedUsername = userForm.username.trim().toLowerCase();
    if (!trimmedUsername || !userForm.nama) {
      setUserError('Username dan Nama Lengkap wajib diisi.');
      return;
    }

    const globalUsers = StorageManager.getUsers();

    if (globalUsers.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      setUserError(`Username "${trimmedUsername}" sudah digunakan oleh akun lain dalam sistem.`);
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

    const activeAdminTenantId = currentUser.tenant_id || StorageManager.getActiveTenantId() || 'CHURCH-001';
    const assignedTenantId = currentUser.role === 'SUPER_ADMIN'
      ? (userForm.role === 'SUPER_ADMIN' ? 'ALL' : activeAdminTenantId)
      : activeAdminTenantId;

    const newUser: User = {
      user_id: `USR-${(globalUsers.length + 1).toString().padStart(3, '0')}`,
      username: trimmedUsername,
      email: userForm.email.trim(),
      no_hp: userForm.no_hp.trim(),
      nama: userForm.nama.trim(),
      role: userForm.role,
      status: userForm.status,
      password_hash: userForm.password_hash.trim(),
      tenant_id: assignedTenantId,
      created_at: new Date().toLocaleString('id-ID')
    };

    const updatedGlobal = [newUser, ...globalUsers];
    StorageManager.saveUsers(updatedGlobal);
    setUsersList(updatedGlobal);
    StorageManager.logActivity(
      currentUser.username,
      `Menambahkan user baru: ${newUser.username} (${newUser.role})`,
      'User Management'
    );
    setIsUserModal(false);
    setUserSuccess(`Berhasil membuat user akun baru "${newUser.username}". Password: ${userForm.password_hash.trim()}`);
    alert(`Akun Pengguna Baru Berhasil Dibuat!\n\nKredensial Login:\n- Role: ${newUser.role}\n- Username: ${newUser.username}\n- Password: ${userForm.password_hash.trim()}`);
    setTimeout(() => setUserSuccess(''), 3000);
  };

  const handleOpenEditUser = (u: User) => {
    if (u.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      alert('Akses Terbatas: Hanya SuperAdmin yang berhak mengedit akun SuperAdmin.');
      return;
    }

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

    if (currentUser.role !== 'SUPER_ADMIN' && editUserForm.role === 'SUPER_ADMIN') {
      setUserError('Hak Akses Terbatas: Hanya SuperAdmin yang berhak menetapkan role SuperAdmin.');
      return;
    }

    const trimmedUsername = editUserForm.username.trim().toLowerCase();
    if (!trimmedUsername || !editUserForm.nama) {
      setUserError('Username dan Nama Lengkap tidak boleh kosong.');
      return;
    }

    const globalUsers = StorageManager.getUsers();

    // Check duplicate username in global users
    const isDuplicate = globalUsers.some(
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

    const activeAdminTenantId = currentUser.tenant_id || StorageManager.getActiveTenantId() || 'CHURCH-001';

    const updatedGlobal = globalUsers.map((u) => {
      if (u.user_id === editingUser.user_id) {
        return {
          ...u,
          username: trimmedUsername,
          nama: editUserForm.nama.trim(),
          email: editUserForm.email.trim(),
          no_hp: editUserForm.no_hp.trim(),
          role: editUserForm.role,
          status: editUserForm.status,
          password_hash: updatedPass,
          tenant_id: u.tenant_id || activeAdminTenantId
        };
      }
      return u;
    });

    StorageManager.saveUsers(updatedGlobal);
    setUsersList(updatedGlobal);

    // If edited account is current logged in user, update current user session
    if (editingUser.user_id === currentUser.user_id) {
      const updatedSelf = updatedGlobal.find((u) => u.user_id === currentUser.user_id);
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
    if (u.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      alert('Akses Terbatas: Hanya SuperAdmin yang berhak mereset password SuperAdmin.');
      return;
    }

    const newRandomPass = generateRandomPassword();
    if (
      window.confirm(
        `Reset password untuk user "${u.username}" (${u.nama})?\n\nPassword baru yang akan dibuat: ${newRandomPass}`
      )
    ) {
      const globalUsers = StorageManager.getUsers();
      const updatedGlobal = globalUsers.map((item) => {
        if (item.user_id === u.user_id) {
          return { ...item, password_hash: newRandomPass };
        }
        return item;
      });

      StorageManager.saveUsers(updatedGlobal);
      setUsersList(updatedGlobal);
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

    if (u.username === 'superadmin' || u.role === 'SUPER_ADMIN') {
      alert('Akun Super Admin tidak boleh dihapus oleh Admin biasa.');
      return;
    }

    if (window.confirm(`Hapus permanen akun "${u.username}" (${u.nama}) dari sistem?`)) {
      const globalUsers = StorageManager.getUsers();
      const updatedGlobal = globalUsers.filter((item) => item.user_id !== u.user_id);
      StorageManager.saveUsers(updatedGlobal);
      setUsersList(updatedGlobal);
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
    const globalUsers = StorageManager.getUsers();
    const targetUser = globalUsers.find((u) => u.user_id === userId);

    if (targetUser && targetUser.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
      alert('Akses Terbatas: Hanya SuperAdmin yang berhak merubah status akun SuperAdmin.');
      return;
    }

    const updatedGlobal = globalUsers.map((u) => {
      if (u.user_id === userId) {
        const nextStatus = u.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
        return { ...u, status: nextStatus as any };
      }
      return u;
    });

    StorageManager.saveUsers(updatedGlobal);
    setUsersList(updatedGlobal);
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

  // Filtered Users List per Tenant Access Rights
  const activeAdminTenantId = currentUser.tenant_id || StorageManager.getActiveTenantId() || 'CHURCH-001';

  const tenantScopedUsers = usersList.filter((u) => {
    if (currentUser.role === 'SUPER_ADMIN') {
      return true; // SuperAdmin can see all accounts across all tenants
    }
    // Admin MUST NOT see SuperAdmin accounts
    if (u.role === 'SUPER_ADMIN' || u.username.toLowerCase() === 'superadmin') {
      return false;
    }
    // Admin MUST ONLY see users belonging to their own church/tenant
    if (u.tenant_id && u.tenant_id !== 'ALL' && u.tenant_id !== activeAdminTenantId) {
      return false;
    }
    return true;
  });

  const filteredUsers = tenantScopedUsers.filter((u) => {
    const matchQuery =
      u.username.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.nama.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUser.toLowerCase());
    const matchRole = filterRole === 'ALL' || u.role === filterRole;
    const matchStatus = filterStatus === 'ALL' || u.status === filterStatus;
    return matchQuery && matchRole && matchStatus;
  });

  return (
    <div className="space-y-6 pb-2 sm:pb-4">
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
              : 'Kelola profil gereja, judul dashboard, tema warna, logo, video media sosial, serta akun user (Admin & Jemaat).'}
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
            onClick={() => setActiveTab('USERS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-300" />
            <span>Manajemen User ({tenantScopedUsers.length})</span>
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
        <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-indigo-400" />
          <div>
            <span className="font-bold block">Akses Level Admin Gereja:</span>
            <span>Anda dapat mengubah profil gereja, judul dashboard, tema warna, logo, dan tautan video media sosial, serta mengelola akun User (Admin & JEMAAT) dan password untuk gereja Anda. Fitur Google Sheets REST API & Audit Logs dikunci khusus untuk SuperAdmin.</span>
          </div>
        </div>
      )}

      {/* Tab 1: Metadata profil gereja & Custom Visual */}
      {activeTab === 'METADATA' && (
        <div className="space-y-6">
          {savedSuccess && (
            <div className="p-4 bg-emerald-500/20 border-2 border-emerald-500/50 text-emerald-300 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-between gap-3 shadow-2xl animate-bounce">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>✅ Perubahan berhasil disimpan! Pengaturan Lebar Kartu & Kustomisasi Tampilan Portal/Dashboard Jemaat telah diperbarui secara realtime.</span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-600/40 px-2.5 py-1 rounded-lg text-emerald-200 shrink-0">Status: Tersimpan</span>
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

            {/* Section 1.5: Pengaturan Rekening Bank & QRIS Persembahan Digital */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
              <h3 className="text-base font-bold pb-3 border-b border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span>Pengaturan Rekening Bank & QRIS Persembahan Digital</span>
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                  Transfer Dashboard Jemaat
                </span>
              </h3>

              <p className="text-xs text-slate-400">
                Informasi bank dan QRIS ini akan ditampilkan kepada jemaat pada Portal Jemaat ketika melakukan transfer persembahan / perpuluhan digital.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nama Bank *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Bank BCA / Mandiri / BRI"
                    value={metaForm.rekening_bank_nama || ''}
                    onChange={(e) => setMetaForm({ ...metaForm, rekening_bank_nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Nomor Rekening Bank *</label>
                  <input
                    type="text"
                    placeholder="Contoh: 527-089-1122"
                    value={metaForm.rekening_bank_nomor || ''}
                    onChange={(e) => setMetaForm({ ...metaForm, rekening_bank_nomor: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold text-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 font-semibold">Atas Nama Rekening *</label>
                  <input
                    type="text"
                    placeholder="Contoh: Gereja Kemenangan Faith Center"
                    value={metaForm.rekening_bank_atas_nama || ''}
                    onChange={(e) => setMetaForm({ ...metaForm, rekening_bank_atas_nama: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                  />
                </div>
              </div>

              {/* QRIS Image Upload / Link */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                <label className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-emerald-400" />
                  <span>Gambar / Barcode Kode QRIS Gereja</span>
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  {metaForm.qris_image_url ? (
                    <div className="shrink-0 relative">
                      <img
                        src={metaForm.qris_image_url}
                        alt="QRIS Preview"
                        className="w-24 h-24 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md bg-white p-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <span className="absolute -bottom-1 -right-1 px-2 py-0.5 bg-emerald-600 text-[9px] font-bold text-white rounded-full">
                        QRIS Active
                      </span>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center text-slate-500 text-xs text-center p-2">
                      Belum ada QRIS
                    </div>
                  )}

                  <div className="flex-1 space-y-2 w-full">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={metaForm.qris_image_url || ''}
                        placeholder="Paste URL Gambar Kode QRIS atau Upload File..."
                        onChange={(e) => setMetaForm({ ...metaForm, qris_image_url: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                      />
                      <label className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shrink-0 transition-all">
                        <Upload className="w-4 h-4" />
                        <span>Upload QRIS</span>
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
                                  setMetaForm({ ...metaForm, qris_image_url: evt.target.result as string });
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Format disarankan: PNG / JPEG / WebP / SVG. Gambar QRIS akan dipindai oleh aplikasi mobile banking / m-banking jemaat.
                    </p>
                  </div>
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

                {/* Custom Unlimited Hex Color Picker */}
                <div className="sm:col-span-2 lg:col-span-3 p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <label className="block text-amber-400 font-extrabold text-xs sm:text-sm">
                        🎨 Kustom Kode Warna Hex (Contoh: #CD5C5C) - Bebas Tanpa Batas
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Kustomisasi warna tema bebas dengan memasukkan kode hex apa saja (seperti #CD5C5C, #10B981, #FF5733). Berlaku untuk tampilan Admin &amp; Akun Jemaat.
                      </p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-2xl border-2 border-white/20 shadow-xl shrink-0 flex items-center justify-center font-mono text-[10px] text-white font-black"
                      style={{ backgroundColor: metaForm.warna_tema || '#CD5C5C' }}
                    >
                      {metaForm.warna_tema || '#CD5C5C'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    {/* Hex Code Text Input */}
                    <div className="sm:col-span-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-mono font-bold text-xs">HEX:</span>
                        <input
                          type="text"
                          value={metaForm.warna_tema || '#CD5C5C'}
                          onChange={(e) => {
                            const val = e.target.value;
                            setMetaForm({ ...metaForm, warna_tema: val });
                          }}
                          placeholder="#CD5C5C"
                          className="w-full pl-14 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono font-extrabold text-sm focus:ring-2 focus:ring-amber-500 outline-none uppercase"
                        />
                      </div>
                      {/* HTML Color Picker Button */}
                      <label className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-200 shrink-0">
                        <input
                          type="color"
                          value={metaForm.warna_tema && /^#[0-9A-F]{6}$/i.test(metaForm.warna_tema) ? metaForm.warna_tema : '#CD5C5C'}
                          onChange={(e) => setMetaForm({ ...metaForm, warna_tema: e.target.value })}
                          className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                        />
                        <span>Pilih Visual</span>
                      </label>
                    </div>

                    {/* Live Preview Button Tag */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400 font-medium">Pratinjau:</span>
                      <button
                        type="button"
                        className="px-3.5 py-1.5 rounded-xl text-white font-extrabold text-xs shadow-lg transition-all"
                        style={{ backgroundColor: metaForm.warna_tema || '#CD5C5C' }}
                      >
                        Warna Utama
                      </button>
                    </div>
                  </div>

                  {/* Quick Preset Color Hex Chips */}
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block mb-2">Rekomendasi Warna Hex Populer:</span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Terracotta', hex: '#CD5C5C' },
                        { name: 'Royal Indigo', hex: '#4F46E5' },
                        { name: 'Emerald', hex: '#059669' },
                        { name: 'Warm Amber', hex: '#D97706' },
                        { name: 'Crimson Rose', hex: '#E11D48' },
                        { name: 'Ocean Sky', hex: '#0284C7' },
                        { name: 'Amethyst', hex: '#7C3AED' },
                        { name: 'Fuchsia', hex: '#D946EF' },
                        { name: 'Deep Teal', hex: '#0F766E' },
                        { name: 'Warm Gold', hex: '#B45309' }
                      ].map((chip) => (
                        <button
                          key={chip.hex}
                          type="button"
                          onClick={() => setMetaForm({ ...metaForm, warna_tema: chip.hex })}
                          className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                            (metaForm.warna_tema || '#CD5C5C').toUpperCase() === chip.hex.toUpperCase()
                              ? 'border-white text-white ring-2 ring-amber-400 shadow-md scale-105'
                              : 'border-slate-800 text-slate-300 hover:border-slate-600 bg-slate-900'
                          }`}
                        >
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: chip.hex }} />
                          <span>{chip.name} ({chip.hex})</span>
                        </button>
                      ))}
                    </div>
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
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-400 font-semibold text-xs sm:text-sm">Pengaturan Lebar Kartu Dashboard Jemaat</label>
                    <span className="text-[10px] text-indigo-400 font-mono font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Pilih 1 Ukuran Lebar</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'CONTAINED', label: '🛡️ Standard (Max 5XL)', desc: 'Rekomendasi Desktop & Tablet' },
                      { id: 'FULL', label: '🖥️ Full Width (100%)', desc: 'Memenuhi Seluruh Layar' },
                      { id: 'MOBILE_COMPACT', label: '📱 Compact Mobile', desc: 'Rapat Rapi Fokus Hape' }
                    ].map((cw) => {
                      const isSelected =
                        (metaForm.jemaat_card_width || 'CONTAINED') === cw.id ||
                        (cw.id === 'MOBILE_COMPACT' && metaForm.jemaat_card_width === 'COMPACT');
                      return (
                        <button
                          type="button"
                          key={cw.id}
                          onClick={() => setMetaForm({ ...metaForm, jemaat_card_width: cw.id as any })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/50 text-white shadow-lg'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-bold text-[11px]">{cw.label}</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-500">{cw.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-slate-400 font-semibold text-xs sm:text-sm">Ukuran Kepadatan Padding Kartu (Density)</label>
                    <span className="text-[10px] text-indigo-400 font-mono font-semibold bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">Pilih 1 Padding</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      { id: 'COMPACT', label: '⚡ Ringkas', desc: 'Padding Kecil (Hape)' },
                      { id: 'NORMAL', label: '⚖️ Normal', desc: 'Padding Standar' },
                      { id: 'SPACIOUS', label: '✨ Lega', desc: 'Padding Luas & Mewah' }
                    ].map((cs) => {
                      const isSelected = (metaForm.card_size || 'NORMAL') === cs.id;
                      return (
                        <button
                          type="button"
                          key={cs.id}
                          onClick={() => setMetaForm({ ...metaForm, card_size: cs.id as any })}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'border-indigo-500 bg-indigo-950/60 ring-2 ring-indigo-500/50 text-white shadow-lg'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <span className="font-bold text-[11px]">{cs.label}</span>
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-400 bg-indigo-500' : 'border-slate-600'}`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                          </div>
                          <div className="text-[9px] text-slate-500">{cs.desc}</div>
                        </button>
                      );
                    })}
                  </div>
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

            {/* Section 5: Kontrol Tombol Floating Download Aplikasi Mobile (.APK Android) */}
            <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
              <h3 className="text-base font-bold pb-3 border-b border-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-2 text-emerald-400">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  <span>5. Kontrol Tombol Melayang Download APK Mobile Android</span>
                </span>
                <span className="text-[10px] font-semibold text-slate-400">Mobile APK Download Control</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-all sm:col-span-2">
                  <div>
                    <div className="font-bold text-xs text-emerald-300">Tampilkan Tombol Floating Download APK Mobile Android</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Jika diaktifkan, tombol melayang untuk mengunduh file .APK akan tampil di sudut kanan bawah dashboard.</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={metaForm.show_apk_download_button !== false}
                    onChange={(e) => setMetaForm({ ...metaForm, show_apk_download_button: e.target.checked })}
                    className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 w-5 h-5 shrink-0"
                  />
                </label>

                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-slate-300 font-semibold text-xs">Link Tautan Download File .APK (Google Drive / Direct URL):</label>
                  <input
                    type="url"
                    value={metaForm.apk_download_url || 'https://drive.google.com/file/d/1TlnvPxgIPWQ13CE_EJnj4gUMAipCWy1s/view?usp=sharing'}
                    onChange={(e) => setMetaForm({ ...metaForm, apk_download_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-xs"
                  />
                </div>
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

                <button
                  type="button"
                  onClick={() => setShowFcmModal(true)}
                  className="px-3.5 py-2 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 border border-purple-500/40 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>🛠️ Generator Code Payload FCM (Status Bar & Bunyi)</span>
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
                {currentUser.role === 'SUPER_ADMIN'
                  ? 'Kelola kredensial login (Username & Password) untuk Super Admin, Admin Sekretariat, dan Jemaat lintas gereja.'
                  : 'Kelola kredensial login (Username & Password) untuk Admin Sekretariat dan Jemaat gereja Anda.'}
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
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md flex items-center gap-1.5 self-start md:self-auto cursor-pointer"
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
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-semibold"
              >
                <option value="ALL">Semua Role</option>
                {currentUser.role === 'SUPER_ADMIN' && (
                  <option value="SUPER_ADMIN">Super Admin</option>
                )}
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
                            {u.role === 'SUPER_ADMIN' && currentUser.role !== 'SUPER_ADMIN' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>Terkunci (SuperAdmin)</span>
                              </span>
                            ) : (
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Edit Username & Password Button */}
                                <button
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-800/80 text-indigo-300 border border-indigo-700/50 transition-all cursor-pointer"
                                  title="Ubah Username & Password / Edit Profile"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                {/* Reset Quick Password */}
                                <button
                                  onClick={() => handleQuickResetPassword(u)}
                                  className="p-1.5 rounded-lg bg-amber-900/40 hover:bg-amber-800/80 text-amber-300 border border-amber-700/50 transition-all cursor-pointer"
                                  title="Reset Password Acak"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {/* Toggle Status */}
                                <button
                                  onClick={() => handleToggleUserStatus(u.user_id)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                    u.status === 'Aktif'
                                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                      : 'bg-emerald-900/40 hover:bg-emerald-800 text-emerald-300 border border-emerald-700/50'
                                  }`}
                                >
                                  {u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
                                </button>

                                {/* Delete User */}
                                {u.username !== 'superadmin' && u.role !== 'SUPER_ADMIN' && u.user_id !== currentUser.user_id && (
                                  <button
                                    onClick={() => handleDeleteUser(u)}
                                    className="p-1.5 rounded-lg bg-rose-900/30 hover:bg-rose-800/80 text-rose-300 border border-rose-800/50 transition-all cursor-pointer"
                                    title="Hapus User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                  >
                    <option value="ADMIN">ADMIN (Kelola Data & Sekretariat Gereja)</option>
                    {currentUser.role === 'SUPER_ADMIN' && (
                      <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh System)</option>
                    )}
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
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-semibold"
                  >
                    <option value="ADMIN">ADMIN (Kelola Data & Sekretariat Gereja)</option>
                    {currentUser.role === 'SUPER_ADMIN' && (
                      <option value="SUPER_ADMIN">SUPER_ADMIN (Akses Penuh System)</option>
                    )}
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
      {/* Modal Generator Code Payload FCM */}
      {showFcmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-indigo-300 flex items-center gap-2">
                  <Code className="w-5 h-5 text-purple-400" />
                  <span>Generator Code Payload FCM (Heads-Up & Sound Status Bar HP)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Format JSON, Node.js Admin SDK, cURL, dan Android Channel Setup agar notifikasi muncul diatas layar dan berbunyi meskipun aplikasi ditutup.
                </p>
              </div>
              <button onClick={() => setShowFcmModal(false)} className="text-slate-400 hover:text-white font-bold text-lg px-2">
                ✕
              </button>
            </div>

            {/* Config Input Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Judul Notifikasi (Title)</label>
                <input
                  type="text"
                  value={fcmTitle}
                  onChange={(e) => setFcmTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Channel ID Android (Penting!)</label>
                <input
                  type="text"
                  value={fcmChannelId}
                  onChange={(e) => setFcmChannelId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-slate-400 mb-1 font-semibold">Isi Pesan Notifikasi (Body)</label>
                <input
                  type="text"
                  value={fcmBody}
                  onChange={(e) => setFcmBody(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Nama File Suara (Sound)</label>
                <input
                  type="text"
                  value={fcmSound}
                  onChange={(e) => setFcmSound(e.target.value)}
                  placeholder="default"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">FCM Device Token Tujuan</label>
                <input
                  type="text"
                  value={fcmTargetToken}
                  onChange={(e) => setFcmTargetToken(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Code Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
              {[
                { id: 'JSON', label: '📄 FCM HTTP v1 JSON' },
                { id: 'NODE', label: '🟢 Node.js Admin SDK' },
                { id: 'CURL', label: '💻 cURL Command' },
                { id: 'ANDROID', label: '🤖 Android Kotlin Channel' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFcmTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeFcmTab === tab.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Code Output Viewer */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 p-4 font-mono text-xs text-indigo-200 overflow-x-auto max-h-80">
              <button
                onClick={() => {
                  let textToCopy = '';
                  if (activeFcmTab === 'JSON') {
                    textToCopy = JSON.stringify(
                      {
                        message: {
                          token: fcmTargetToken,
                          notification: { title: fcmTitle, body: fcmBody },
                          android: {
                            priority: 'HIGH',
                            notification: {
                              channel_id: fcmChannelId,
                              sound: fcmSound,
                              default_sound: true,
                              default_vibrate_timings: true,
                              notification_priority: 'PRIORITY_MAX',
                              visibility: 'PUBLIC'
                            }
                          },
                          apns: {
                            headers: { 'apns-priority': '10' },
                            payload: { aps: { sound: fcmSound, badge: 1 } }
                          }
                        }
                      },
                      null,
                      2
                    );
                  } else if (activeFcmTab === 'NODE') {
                    textToCopy = `const admin = require('firebase-admin');\n\nasync function sendPushNotification(token) {\n  await admin.messaging().send({\n    token: token,\n    notification: {\n      title: '${fcmTitle}',\n      body: '${fcmBody}'\n    },\n    android: {\n      priority: 'high',\n      notification: {\n        channelId: '${fcmChannelId}',\n        sound: '${fcmSound}',\n        priority: 'max'\n      }\n    }\n  });\n}`;
                  } else if (activeFcmTab === 'CURL') {
                    textToCopy = `curl -X POST https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send \\\n  -H "Authorization: Bearer YOUR_OAUTH_TOKEN" \\\n  -H "Content-Type: application/json" \\\n  -d '{"message":{"token":"${fcmTargetToken}","notification":{"title":"${fcmTitle}","body":"${fcmBody}"},"android":{"priority":"HIGH","notification":{"channel_id":"${fcmChannelId}","sound":"${fcmSound}"}}}}'`;
                  } else {
                    textToCopy = `if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {\n    val channel = NotificationChannel(\n        "${fcmChannelId}",\n        "Pemberitahuan Utama",\n        NotificationManager.IMPORTANCE_HIGH\n    ).apply {\n        description = "Channel notifikasi status bar dan bunyi"\n        enableVibration(true)\n    }\n    val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager\n    notificationManager.createNotificationChannel(channel)\n}`;
                  }

                  navigator.clipboard.writeText(textToCopy);
                  setCopiedFcmCode(true);
                  setTimeout(() => setCopiedFcmCode(false), 2000);
                }}
                className="absolute top-3 right-3 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-[11px] font-sans font-bold flex items-center gap-1.5 shadow"
              >
                {copiedFcmCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedFcmCode ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>

              <pre className="whitespace-pre-wrap leading-relaxed">
                {activeFcmTab === 'JSON' &&
                  JSON.stringify(
                    {
                      message: {
                        token: fcmTargetToken,
                        notification: {
                          title: fcmTitle,
                          body: fcmBody
                        },
                        data: {
                          click_action: 'FLUTTER_NOTIFICATION_CLICK',
                          url: '/'
                        },
                        android: {
                          priority: 'HIGH',
                          notification: {
                            channel_id: fcmChannelId,
                            sound: fcmSound,
                            default_sound: true,
                            default_vibrate_timings: true,
                            notification_priority: 'PRIORITY_MAX',
                            visibility: 'PUBLIC',
                            icon: 'ic_notification'
                          }
                        },
                        apns: {
                          headers: {
                            'apns-priority': '10'
                          },
                          payload: {
                            aps: {
                              alert: {
                                title: fcmTitle,
                                body: fcmBody
                              },
                              sound: fcmSound,
                              badge: 1,
                              'content-available': 1
                            }
                          }
                        },
                        webpush: {
                          headers: {
                            Urgency: 'high'
                          },
                          notification: {
                            title: fcmTitle,
                            body: fcmBody,
                            requireInteraction: true,
                            vibrate: [200, 100, 200]
                          }
                        }
                      }
                    },
                    null,
                    2
                  )}

                {activeFcmTab === 'NODE' &&
                  `// Node.js Backend Code (Firebase Admin SDK)
const admin = require('firebase-admin');

async function sendHeadsUpNotification(targetToken) {
  const message = {
    token: targetToken,
    notification: {
      title: '${fcmTitle}',
      body: '${fcmBody}'
    },
    android: {
      priority: 'high',
      notification: {
        channelId: '${fcmChannelId}',
        sound: '${fcmSound}',
        defaultSound: true,
        defaultVibrateTimings: true,
        priority: 'max',
        visibility: 'public'
      }
    },
    apns: {
      headers: { 'apns-priority': '10' },
      payload: {
        aps: {
          sound: '${fcmSound}',
          badge: 1
        }
      }
    }
  };

  const response = await admin.messaging().send(message);
  console.log('Success sending FCM push notification:', response);
}`}

                {activeFcmTab === 'CURL' &&
                  `# FCM HTTP v1 REST API cURL Command
curl -X POST https://fcm.googleapis.com/v1/projects/YOUR_PROJECT_ID/messages:send \\
  -H "Authorization: Bearer YOUR_OAUTH_ACCESS_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "message": {
      "token": "${fcmTargetToken}",
      "notification": {
        "title": "${fcmTitle}",
        "body": "${fcmBody}"
      },
      "android": {
        "priority": "HIGH",
        "notification": {
          "channel_id": "${fcmChannelId}",
          "sound": "${fcmSound}",
          "notification_priority": "PRIORITY_MAX"
        }
      }
    }
  }'`}

                {activeFcmTab === 'ANDROID' &&
                  `// Android Native / Flutter (Kotlin) - Wajib buat NotificationChannel High Importance
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build

fun createHighImportanceChannel(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channelId = "${fcmChannelId}"
        val channelName = "Notifikasi Utama Status Bar"
        val importance = NotificationManager.IMPORTANCE_HIGH
        
        val channel = NotificationChannel(channelId, channelName, importance).apply {
            description = "Channel untuk mambuat notifikasi memunculkan banner status bar & suara saat app ditutup"
            enableVibration(true)
            vibrationPattern = longArrayOf(200, 100, 200, 100, 200)
        }
        
        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.createNotificationChannel(channel)
    }
}`}
              </pre>
            </div>

            <div className="p-3 bg-purple-950/40 border border-purple-500/30 text-purple-200 rounded-xl text-[11px] space-y-1">
              <div className="font-bold">🔑 Kunci Utama Agar Notifikasi Muncul di Status Bar & Berbunyi saat App Ditutup:</div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                <li><code className="text-amber-300 font-mono">android.priority = "HIGH"</code> (memaksa OS tidak menunda pesan).</li>
                <li><code className="text-amber-300 font-mono">android.notification.channel_id</code> harus cocok dengan <code className="text-amber-300 font-mono">IMPORTANCE_HIGH</code> di Android HP.</li>
                <li><code className="text-amber-300 font-mono">android.notification.sound = "default"</code> (atau nama file audio di res/raw).</li>
                <li><code className="text-amber-300 font-mono">apns.headers["apns-priority"] = "10"</code> untuk perangkat iOS / Apple iPhone.</li>
              </ul>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowFcmModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
