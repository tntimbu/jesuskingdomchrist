import React, { useState, useEffect } from 'react';
import { User, AppSettings, NotificationItem } from '../types';
import { StorageManager } from '../utils/storage';
import { DEFAULT_CHURCH_LOGO } from '../data/initialData';
import {
  triggerStatusBarNotification,
  requestAndSaveFCMToken,
  playNotificationChimeSound
} from '../utils/firebaseMessaging';
import {
  Bell,
  Clock,
  Calendar,
  Smartphone,
  LogOut,
  ChevronDown,
  CheckCheck,
  Menu,
  KeyRound,
  UserCheck,
  Eye,
  EyeOff,
  Wand2,
  AlertCircle,
  Check,
  Volume2
} from 'lucide-react';

interface NavbarHeaderProps {
  currentUser: User;
  settings: AppSettings;
  onLogout: () => void;
  onUpdateCurrentUser?: (updatedUser: User) => void;
  onOpenMobileMenu?: () => void;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({
  currentUser,
  settings,
  onLogout,
  onUpdateCurrentUser,
  onOpenMobileMenu,
  onInstallPWA,
  canInstallPWA
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Self Profile Modal State
  const [isSelfModalOpen, setIsSelfModalOpen] = useState(false);
  const [showSelfPass, setShowSelfPass] = useState(false);
  const [selfForm, setSelfForm] = useState({
    username: currentUser.username,
    nama: currentUser.nama,
    email: currentUser.email || '',
    no_hp: currentUser.no_hp || '',
    old_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [selfError, setSelfError] = useState('');
  const [selfSuccess, setSelfSuccess] = useState('');

  useEffect(() => {
    setSelfForm({
      username: currentUser.username,
      nama: currentUser.nama,
      email: currentUser.email || '',
      no_hp: currentUser.no_hp || '',
      old_password: '',
      new_password: '',
      confirm_password: ''
    });
  }, [currentUser]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' WIB'
      );
      setDateStr(
        now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncNotifs = () => {
      setNotifications(StorageManager.getNotifications());
    };
    syncNotifs();

    const unsubscribe = StorageManager.subscribe(syncNotifs);
    window.addEventListener('cms_data_changed', syncNotifs);
    window.addEventListener('storage', syncNotifs);
    window.addEventListener('focus', syncNotifs);

    const intervalId = setInterval(syncNotifs, 500);

    return () => {
      unsubscribe();
      window.removeEventListener('cms_data_changed', syncNotifs);
      window.removeEventListener('storage', syncNotifs);
      window.removeEventListener('focus', syncNotifs);
      clearInterval(intervalId);
    };
  }, []);

  const relevantNotifications = notifications.filter((n) => {
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') return true;
    return (
      n.user_id === 'ALL' ||
      n.user_id === 'JEMAAT' ||
      n.user_id === currentUser.username ||
      n.user_id === currentUser.jemaat_id ||
      n.tujuan_role === 'ALL' ||
      n.tujuan_role === 'JEMAAT'
    );
  });

  const unreadCount = relevantNotifications.filter((n) => n.status_baca === 'Belum').length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, status_baca: 'Sudah' as const }));
    setNotifications(updated);
    StorageManager.saveNotifications(updated);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'ADMIN':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  const handleSaveSelfProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSelfError('');
    setSelfSuccess('');

    const trimmedUsername = selfForm.username.trim().toLowerCase();
    if (!trimmedUsername) {
      setSelfError('Username tidak boleh kosong');
      return;
    }

    const allUsers = StorageManager.getUsers();
    // Check if new username is already taken by another user
    const existing = allUsers.find(
      (u) => u.username.toLowerCase() === trimmedUsername && u.user_id !== currentUser.user_id
    );
    if (existing) {
      setSelfError(`Username "${trimmedUsername}" sudah digunakan oleh pengguna lain.`);
      return;
    }

    let finalPasswordHash = currentUser.password_hash || (currentUser.role === 'JEMAAT' ? 'jemaat123' : 'admin123');

    // If changing password
    if (selfForm.new_password) {
      if (selfForm.new_password.length < 4) {
        setSelfError('Password baru minimal 4 karakter');
        return;
      }
      if (selfForm.new_password !== selfForm.confirm_password) {
        setSelfError('Konfirmasi password baru tidak cocok');
        return;
      }
      finalPasswordHash = selfForm.new_password;
    }

    const updatedUser: User = {
      ...currentUser,
      username: trimmedUsername,
      nama: selfForm.nama.trim(),
      email: selfForm.email.trim(),
      no_hp: selfForm.no_hp.trim(),
      password_hash: finalPasswordHash
    };

    // Save to allUsers array in localStorage
    const updatedUserList = allUsers.map((u) => (u.user_id === currentUser.user_id ? updatedUser : u));
    StorageManager.saveUsers(updatedUserList);
    StorageManager.saveCurrentUser(updatedUser);

    if (onUpdateCurrentUser) {
      onUpdateCurrentUser(updatedUser);
    }

    StorageManager.logActivity(
      updatedUser.username,
      `Mengubah kredensial profil & password mandiri (${updatedUser.user_id})`,
      'SystemSettings'
    );

    setSelfSuccess('Profil & Kredensial Login berhasil diperbarui!');
    setTimeout(() => {
      setIsSelfModalOpen(false);
      setSelfSuccess('');
    }, 1200);
  };

  return (
    <header className="sticky top-0 z-30 h-20 w-full bg-white/5 backdrop-blur-xl border-b border-white/10 px-4 sm:px-8 flex items-center justify-between text-white">
      {/* Left section: Mobile menu toggle & Church Branding */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/10 lg:hidden transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <img
              src={settings.logo || DEFAULT_CHURCH_LOGO}
              alt="Logo"
              onError={(e) => {
                (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
              }}
              className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-lg shadow-indigo-500/10"
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-xs sm:text-base font-extrabold leading-tight text-white tracking-tight max-w-[160px] sm:max-w-none truncate">
              {settings.nama_gereja || 'Gereja'}
            </h1>
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-indigo-400 font-bold leading-none mt-0.5">
              Enterprise CMS Pro
            </p>
          </div>
        </div>
      </div>

      {/* Middle section: Digital Clock & Date */}
      <div className="hidden md:flex items-center gap-4 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs">
        <div className="flex items-center gap-2 text-indigo-300 font-mono font-medium">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>{timeStr}</span>
        </div>
        <div className="h-3 w-[1px] bg-white/10" />
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] text-emerald-300 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Real-Time Cloud</span>
        </div>
        <div className="h-3 w-[1px] bg-white/10" />
        <div className="flex items-center gap-2 text-slate-400 text-[11px] font-medium uppercase tracking-wider">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Right section: Install PWA, Notifications, Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {canInstallPWA && (
          <button
            onClick={onInstallPWA}
            className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 text-xs font-semibold shadow-sm transition-all border border-indigo-500/30"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install App</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifDropdown(!showNotifDropdown);
              setShowUserDropdown(false);
            }}
            className="relative p-2.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0f172a] animate-pulse" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="fixed top-16 right-3 sm:top-auto sm:right-0 sm:absolute mt-3 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm rounded-2xl bg-slate-900/98 backdrop-blur-2xl border border-white/20 shadow-2xl p-4 z-50 text-white space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold">Pemberitahuan System</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                      {unreadCount} Baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tandai Semua</span>
                  </button>
                )}
              </div>

              {/* Push Notification HP Controls */}
              <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 space-y-2 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-200 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                    Notifikasi Status Bar HP & Suara
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      playNotificationChimeSound();
                      triggerStatusBarNotification(
                        '🔔 Notifikasi GKFC CMS Pro',
                        'Suara lonceng & notifikasi di status bar HP aktif! Notifikasi tetap muncul saat aplikasi ditutup.'
                      );
                    }}
                    className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Volume2 className="w-3 h-3" />
                    Tes Suara
                  </button>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    const token = await requestAndSaveFCMToken();
                    if (token) {
                      alert('✅ Notifikasi Push HP (FCM) BERHASIL DIAKTIFKAN!\nToken Perangkat HP Anda telah terdaftar. Notifikasi akan muncul di atas bar HP dengan suara lonceng & getar.');
                    } else {
                      triggerStatusBarNotification('GKFC Church Notification', 'Izin Notifikasi HP Aktif! Suara lonceng dan getar siap digunakan.');
                    }
                  }}
                  className="w-full py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 font-bold text-[10px] text-center transition-all cursor-pointer"
                >
                  ⚡ Aktifkan / Izinkan Notifikasi Bar HP (FCM)
                </button>
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                {relevantNotifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada notifikasi.</p>
                ) : (
                  relevantNotifications.map((n) => (
                    <div
                      key={n.notif_id}
                      className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                        n.status_baca === 'Belum'
                          ? 'bg-indigo-600/15 border-indigo-500/40 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-200">
                        <span className="truncate max-w-[200px]">{n.judul}</span>
                        <span className="text-[10px] text-slate-500 shrink-0">{n.tanggal}</span>
                      </div>
                      <p className="text-slate-300 leading-normal text-[11px]">{n.pesan}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifDropdown(false);
            }}
            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-indigo-500/20">
              {currentUser.nama.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold leading-tight text-white truncate max-w-[120px]">
                {currentUser.nama}
              </p>
              <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold mt-0.5 ${getRoleBadge(currentUser.role)}`}>
                {currentUser.role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block" />
          </button>

          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-60 rounded-2xl bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 z-50 text-white space-y-1">
              <div className="p-3 bg-white/5 rounded-xl mb-1 border border-white/10">
                <p className="text-xs font-bold text-white truncate">{currentUser.nama}</p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser.email}</p>
                <span className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold mt-1.5 ${getRoleBadge(currentUser.role)}`}>
                  Role: {currentUser.role}
                </span>
              </div>

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  setSelfError('');
                  setSelfSuccess('');
                  setSelfForm({
                    username: currentUser.username,
                    nama: currentUser.nama,
                    email: currentUser.email || '',
                    no_hp: currentUser.no_hp || '',
                    old_password: '',
                    new_password: '',
                    confirm_password: ''
                  });
                  setIsSelfModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-indigo-300 hover:bg-indigo-500/10 text-xs font-semibold transition-all text-left"
              >
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Ubah Username & Password</span>
              </button>

              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Keluar (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Self Profile & Password Update */}
      {isSelfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 text-white space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <span>Pengaturan Kredensial Saya</span>
              </h3>
              <button
                onClick={() => setIsSelfModalOpen(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            {selfError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{selfError}</span>
              </div>
            )}

            {selfSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                <span>{selfSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveSelfProfile} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Username Login *</label>
                <input
                  type="text"
                  required
                  value={selfForm.username}
                  onChange={(e) => setSelfForm({ ...selfForm, username: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={selfForm.nama}
                  onChange={(e) => setSelfForm({ ...selfForm, nama: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              {/* Password change box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ubah Password</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$';
                      let pass = '';
                      for (let i = 0; i < 10; i++) {
                        pass += chars.charAt(Math.floor(Math.random() * chars.length));
                      }
                      setSelfForm({ ...selfForm, new_password: pass, confirm_password: pass });
                      setShowSelfPass(true);
                    }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Wand2 className="w-3 h-3 text-indigo-400" />
                    <span>Acak Password</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showSelfPass ? 'text' : 'password'}
                      placeholder="Password Baru (Kosongkan jika tidak diubah)"
                      value={selfForm.new_password}
                      onChange={(e) => setSelfForm({ ...selfForm, new_password: e.target.value })}
                      className="w-full pr-8 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSelfPass(!showSelfPass)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      {showSelfPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <div>
                    <input
                      type={showSelfPass ? 'text' : 'password'}
                      placeholder="Konfirmasi Password Baru"
                      value={selfForm.confirm_password}
                      onChange={(e) => setSelfForm({ ...selfForm, confirm_password: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={selfForm.email}
                  onChange={(e) => setSelfForm({ ...selfForm, email: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Nomor Handphone</label>
                <input
                  type="text"
                  value={selfForm.no_hp}
                  onChange={(e) => setSelfForm({ ...selfForm, no_hp: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSelfModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-white shadow-lg shadow-indigo-600/30"
                >
                  Simpan Kredensial
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
