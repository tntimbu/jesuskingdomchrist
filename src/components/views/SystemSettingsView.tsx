import React, { useState, useEffect } from 'react';
import { User, AppSettings, ActivityLog, LoginHistory } from '../../types';
import { StorageManager } from '../../utils/storage';
import { generateGASScriptCode } from '../../utils/googleSheetsGAS';
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
  Plus
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

  // User Form State
  const [isUserModal, setIsUserModal] = useState(false);
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    nama: '',
    role: 'ADMIN' as 'SUPER_ADMIN' | 'ADMIN' | 'JEMAAT',
    status: 'Aktif' as 'Aktif' | 'Nonaktif',
    password_hash: 'admin123'
  });

  useEffect(() => {
    loadData();
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

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.username || !userForm.nama) return;

    const newUser: User = {
      user_id: `USR-${(usersList.length + 1).toString().padStart(3, '0')}`,
      username: userForm.username.trim(),
      email: userForm.email.trim(),
      nama: userForm.nama.trim(),
      role: userForm.role,
      status: userForm.status,
      password_hash: userForm.password_hash
    };

    const updated = [newUser, ...usersList];
    setUsersList(updated);
    StorageManager.saveUsers(updated);
    StorageManager.logActivity(currentUser.username, `Menambahkan user akun baru: ${newUser.username} (${newUser.role})`, 'User Management');
    setIsUserModal(false);
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

  const handleResetDataToDefaults = () => {
    if (window.confirm('APAKAH ANDA YAKIN? Semua data di-reset kembali ke data default 18 sheets.')) {
      StorageManager.resetAllDataToDefaults();
      loadData();
      alert('Data sistem telah berhasil di-reset ke kondisi awal.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <span>Pengaturan System & Control Panel (SuperAdmin)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Konfigurasi Google Sheets REST API, Firebase Auth, Hak Akses RBAC, & Audit Activity Log.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
          <button
            onClick={() => setActiveTab('METADATA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'METADATA' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Profil Gereja
          </button>
          <button
            onClick={() => setActiveTab('GAS_FIREBASE')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'GAS_FIREBASE' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Google Sheets & Firebase
          </button>
          <button
            onClick={() => setActiveTab('USERS')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'USERS' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Users RBAC ({usersList.length})
          </button>
          <button
            onClick={() => setActiveTab('AUDIT')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'AUDIT' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Audit Logs ({activityLogs.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Metadata profil gereja */}
      {activeTab === 'METADATA' && (
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-6 shadow-xl">
          <h3 className="text-base font-bold pb-3 border-b border-slate-800">Identitas & Informasi Gereja</h3>

          {savedSuccess && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold">
              Konfigurasi gereja berhasil diperbarui!
            </div>
          )}

          <form onSubmit={handleSaveMeta} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-400 mb-1">Nama Gereja *</label>
                <input
                  type="text"
                  required
                  value={metaForm.nama_gereja}
                  onChange={(e) => setMetaForm({ ...metaForm, nama_gereja: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">URL Logo Gereja</label>
                <input
                  type="text"
                  value={metaForm.logo}
                  onChange={(e) => setMetaForm({ ...metaForm, logo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Alamat Lengkap</label>
                <input
                  type="text"
                  value={metaForm.alamat}
                  onChange={(e) => setMetaForm({ ...metaForm, alamat: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nomor Telepon / Hotline</label>
                <input
                  type="text"
                  value={metaForm.telepon}
                  onChange={(e) => setMetaForm({ ...metaForm, telepon: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email Resmi Sekretariat</label>
                <input
                  type="email"
                  value={metaForm.email}
                  onChange={(e) => setMetaForm({ ...metaForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Website Resmi</label>
                <input
                  type="text"
                  value={metaForm.website}
                  onChange={(e) => setMetaForm({ ...metaForm, website: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
              >
                Simpan Profil Gereja
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: GAS & Firebase Config */}
      {activeTab === 'GAS_FIREBASE' && (
        <div className="space-y-6">
          {/* Google Sheets GAS REST API Section */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  <span>Google Sheets REST API & Google Apps Script (GAS)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Gunakan Google Apps Script untuk menjadikan Google Sheets sebagai database REST API backend.
                </p>
              </div>

              <button
                onClick={handleCopyGASCode}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow flex items-center gap-1.5"
              >
                {copiedCode ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                <span>{copiedCode ? 'Tersalin ke Clipboard!' : 'Salin Kode GAS (18 Sheets)'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Google Apps Script Web App URL</label>
                <input
                  type="text"
                  placeholder="https://script.google.com/macros/s/.../exec"
                  value={metaForm.gas_api_url || ''}
                  onChange={(e) => setMetaForm({ ...metaForm, gas_api_url: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Google Spreadsheet ID</label>
                <input
                  type="text"
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={metaForm.google_sheet_id || ''}
                  onChange={(e) => setMetaForm({ ...metaForm, google_sheet_id: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-[11px]"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span>Panduan Setup Google Apps Script (GAS) 18 Sheets Auto-Setup:</span>
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-slate-400 text-[11px]">
                <li>Buka Google Sheets baru di Google Drive Anda.</li>
                <li>Klik menu <strong>Ekstensi &gt; Apps Script</strong>.</li>
                <li>Hapus seluruh isi script lama, lalu tempelkan kode yang disalin di atas.</li>
                <li>Jalankan fungsi <code className="text-emerald-400 font-bold">setupAll18Sheets()</code> sekali untuk auto-generate 18 sheet beserta header barisnya.</li>
                <li>Klik tombol <strong>Terapkan &gt; Deploy sebagai Web App</strong> (Akses: Siapa Saja / Anyone).</li>
                <li>Salin Web App URL ke dalam form di atas.</li>
              </ol>
            </div>
          </div>

          {/* Firebase Setup */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-xl">
            <h3 className="text-base font-bold flex items-center gap-2 pb-3 border-b border-slate-800">
              <Key className="w-5 h-5 text-amber-400" />
              <span>Firebase Cloud Firestore & Authentication Credentials</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Firebase API Key</label>
                <input
                  type="text"
                  placeholder="AIzaSyA..."
                  value={metaForm.firebaseConfig?.apiKey || ''}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      firebaseConfig: { ...metaForm.firebaseConfig, apiKey: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-semibold">Firebase Project ID</label>
                <input
                  type="text"
                  placeholder="gkfc-cms-pro"
                  value={metaForm.firebaseConfig?.projectId || ''}
                  onChange={(e) =>
                    setMetaForm({
                      ...metaForm,
                      firebaseConfig: { ...metaForm.firebaseConfig, projectId: e.target.value }
                    })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-rose-400">Area Reset & Emergency</h4>
                <p className="text-[11px] text-slate-500">Reset ulang data lokal ke data awal seed 18 sheets.</p>
              </div>
              <button
                onClick={handleResetDataToDefaults}
                className="px-3.5 py-2 rounded-xl bg-rose-900/40 hover:bg-rose-900/80 text-rose-300 text-xs font-bold border border-rose-800 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Database Seed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Users & RBAC Management */}
      {activeTab === 'USERS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Manajemen Pengguna & Role Access (01_USERS)
            </h3>
            <button
              onClick={() => setIsUserModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah User Akun</span>
            </button>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs text-slate-300">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="p-3.5">User ID & Username</th>
                    <th className="p-3.5">Nama Lengkap</th>
                    <th className="p-3.5">Email</th>
                    <th className="p-3.5">Hak Akses Role</th>
                    <th className="p-3.5">Status Akun</th>
                    <th className="p-3.5 text-center">Aksi Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {usersList.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-800/40 transition-all">
                      <td className="p-3.5 font-mono text-indigo-300 font-bold">
                        <div>{u.username}</div>
                        <div className="text-[10px] text-slate-500">{u.user_id}</div>
                      </td>
                      <td className="p-3.5 font-bold text-white">{u.nama}</td>
                      <td className="p-3.5">{u.email}</td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                            : u.role === 'ADMIN'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'Aktif' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleUserStatus(u.user_id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold"
                        >
                          {u.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
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
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <h3 className="text-base font-bold pb-2 border-b border-slate-800">Tambah Akun Pengguna Baru</h3>
            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="adminsekretariat"
                  value={userForm.username}
                  onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
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
              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>
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
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsUserModal(false)} className="px-4 py-2 text-slate-300">
                  Batal
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 rounded-xl font-bold">
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
