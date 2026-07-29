import React, { useState, useEffect } from 'react';
import { User, AppSettings, NotificationItem } from '../types';
import { StorageManager } from '../utils/storage';
import { Bell, Clock, Calendar, Smartphone, LogOut, ChevronDown, CheckCheck, Menu } from 'lucide-react';

interface NavbarHeaderProps {
  currentUser: User;
  settings: AppSettings;
  onLogout: () => void;
  onOpenMobileMenu?: () => void;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

export const NavbarHeader: React.FC<NavbarHeaderProps> = ({
  currentUser,
  settings,
  onLogout,
  onOpenMobileMenu,
  onInstallPWA,
  canInstallPWA
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dateStr, setDateStr] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

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
    setNotifications(StorageManager.getNotifications());
  }, []);

  const unreadCount = notifications.filter((n) => n.status_baca === 'Belum').length;

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
              src={settings.logo || 'https://images.unsplash.com/photo-1548625361-185966347898?w=100&auto=format&fit=crop&q=80'}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-cover border border-white/20 shadow-lg shadow-indigo-500/10"
            />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-base font-bold leading-none text-white tracking-tight">{settings.nama_gereja}</h1>
            <p className="text-[10px] uppercase tracking-widest text-indigo-400 font-semibold mt-1">Enterprise CMS Pro</p>
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
            className="relative p-2.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0f172a]" />
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-4 z-50 text-white space-y-3">
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
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Tandai Semua</span>
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada notifikasi.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.notif_id}
                      className={`p-3 rounded-xl border text-xs space-y-1 transition-all ${
                        n.status_baca === 'Belum'
                          ? 'bg-indigo-600/10 border-indigo-500/30 text-white'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-semibold text-slate-200">
                        <span>{n.judul}</span>
                        <span className="text-[10px] text-slate-500">{n.tanggal}</span>
                      </div>
                      <p className="text-slate-300 leading-normal">{n.pesan}</p>
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
    </header>
  );
};
