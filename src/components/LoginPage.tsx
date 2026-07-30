import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, AppSettings } from '../types';
import { StorageManager } from '../utils/storage';
import { DEFAULT_CHURCH_LOGO } from '../data/initialData';
import { ShieldCheck, UserCheck, Church, Lock, Mail, Eye, EyeOff, Sparkles, ArrowRight, RefreshCw, Smartphone } from 'lucide-react';

interface LoginPageProps {
  settings: AppSettings;
  onLoginSuccess: (user: User) => void;
  onInstallPWA?: () => void;
  canInstallPWA?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  settings,
  onLoginSuccess,
  onInstallPWA,
  canInstallPWA
}) => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Quick Account Switcher for Demo Ease
  const handleQuickRoleSelect = (roleName: string) => {
    setErrorMessage('');
    if (roleName === 'SUPER_ADMIN') {
      setUsername('superadmin');
      setPassword('admin123');
    } else if (roleName === 'ADMIN') {
      setUsername('adminsekretariat');
      setPassword('admin123');
    } else {
      setUsername('jemaat01');
      setPassword('jemaat123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const users = StorageManager.getUsers();
      const inputName = username.trim().toLowerCase();
      const inputPass = password.trim();

      const found = users.find((u) => {
        const matchesName =
          u.username.toLowerCase() === inputName ||
          u.email.toLowerCase() === inputName;
        const expectedPass = u.password_hash || (u.role === 'JEMAAT' ? 'jemaat123' : 'admin123');
        return matchesName && expectedPass === inputPass;
      });

      if (found) {
        if (found.status === 'Nonaktif') {
          setErrorMessage('Akun Anda dinonaktifkan oleh Administrator.');
          setIsLoading(false);
          return;
        }

        const historyId = StorageManager.recordLogin(found.username);
        StorageManager.logActivity(found.username, 'Login ke sistem CMS Pro', 'Auth');
        
        // Save logged in user state
        StorageManager.saveCurrentUser(found);
        (window as any).__cms_history_id = historyId;

        setIsLoading(false);
        onLoginSuccess(found);
      } else {
        setErrorMessage('Username/Email atau Password tidak cocok. Coba: superadmin / admin123, atau klik tombol Pulihkan Kredensial Default di bawah.');
        setIsLoading(false);
      }
    }, 700);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail) return;
    setResetSent(true);
    setTimeout(() => {
      setForgotModalOpen(false);
      setResetSent(false);
      setResetEmail('');
      alert(`Instruksi reset password telah dikirimkan ke email: ${resetEmail}`);
    }, 1200);
  };

  return (
    <div id="app-container" className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate-950 p-4 sm:p-6 lg:p-8 selection:bg-indigo-500 selection:text-white">
      {/* Background Animated Gradient Blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse pointer-events-none delay-1000" />
      <div className="absolute top-1/2 right-1/3 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl animate-pulse pointer-events-none delay-500" />

      {/* Decorative Grid Lines Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(#ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Side: Branding & Info (Visible on Mobile & Desktop) */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-6 text-white space-y-5 flex flex-col justify-center"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs font-medium text-indigo-300 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Enterprise Church Management System v2.5</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 overflow-hidden border border-white/20">
                <img
                  src={settings.logo || DEFAULT_CHURCH_LOGO}
                  alt="Logo Gereja"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_CHURCH_LOGO;
                  }}
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {settings.nama_gereja}
              </h1>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              Sistem informasi manajemen gereja terpadu, realtime, scalable, berbasis Google Sheets & Firebase Firestore dengan hak akses bertingkat dan dukungan PWA Native.
            </p>
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="pt-4 border-t border-slate-800/80 space-y-3">
            <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Demo Quick Account Login (Klik untuk Pilih Role):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickRoleSelect('SUPER_ADMIN')}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  username === 'superadmin'
                    ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-md shadow-indigo-950/50'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-1.5 text-indigo-400 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Super Admin</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate w-full">Akses Penuh System</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleSelect('ADMIN')}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  username === 'adminsekretariat'
                    ? 'bg-blue-950/80 border-blue-500 text-white shadow-md shadow-blue-950/50'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-1.5 text-blue-400 text-xs font-bold">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Admin</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate w-full">Manajemen Jemaat</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickRoleSelect('JEMAAT')}
                className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                  username === 'jemaat01'
                    ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md shadow-emerald-950/50'
                    : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                  <Church className="w-3.5 h-3.5" />
                  <span>Jemaat</span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 truncate w-full">Portal Anggota</span>
              </button>
            </div>
          </div>

          {canInstallPWA && (
            <div className="pt-2">
              <button
                onClick={onInstallPWA}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-xs font-semibold hover:from-indigo-600 hover:to-blue-700 shadow-md shadow-indigo-500/25 transition-all"
              >
                <Smartphone className="w-4 h-4" />
                <span>Install CMS Pro Aplikasi Android/PWA</span>
              </button>
            </div>
          )}
        </motion.div>

        {/* Right Side: Glassmorphism Login Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-6 w-full"
        >
          <div className="relative rounded-3xl bg-slate-900/70 backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-2xl shadow-black/80">
            {/* Top Glowing Header on Mobile */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10 sm:hidden">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
                  <Church className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white truncate max-w-[200px]">{settings.nama_gereja}</h2>
                  <p className="text-[11px] text-slate-400">Portal CMS Enterprise</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Selamat Datang</h2>
              <p className="text-slate-400 text-xs sm:text-sm mt-1">
                Silakan masukkan username dan password akun Anda.
              </p>
            </div>

            {errorMessage && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium space-y-2"
              >
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <div className="pt-1 border-t border-rose-500/20 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      StorageManager.resetAdminAccounts();
                      setUsername('superadmin');
                      setPassword('admin123');
                      setErrorMessage('Kredensial Admin dipulihkan: superadmin / admin123. Silakan klik Masuk ke Dashboard.');
                    }}
                    className="text-[11px] text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
                  >
                    ⚡ Reset Kredensial Super Admin Ke Default
                  </button>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Username / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Contoh: superadmin"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-indigo-500/40"
                  />
                  <span>Ingat login saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
                >
                  Lupa Password?
                </button>
              </div>

              {/* Mobile Role Quick Selector */}
              <div className="block sm:hidden pt-2">
                <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Quick Demo Role:</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSelect('SUPER_ADMIN')}
                    className="py-1.5 px-2 bg-indigo-900/60 text-indigo-200 rounded-lg text-[11px] font-semibold border border-indigo-700/50"
                  >
                    SuperAdmin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSelect('ADMIN')}
                    className="py-1.5 px-2 bg-blue-900/60 text-blue-200 rounded-lg text-[11px] font-semibold border border-blue-700/50"
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickRoleSelect('JEMAAT')}
                    className="py-1.5 px-2 bg-emerald-900/60 text-emerald-200 rounded-lg text-[11px] font-semibold border border-emerald-700/50"
                  >
                    Jemaat
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi Akses...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
              <p className="text-[11px] text-slate-500">
                Church Management System Pro Enterprise &copy; 2026. All rights reserved.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {forgotModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-white space-y-4"
            >
              <h3 className="text-lg font-bold">Lupa Password Akun</h3>
              <p className="text-xs text-slate-400">
                Masukkan email yang terdaftar pada sistem CMS Pro. Kami akan mengirimkan tautan untuk mengatur ulang password Anda.
              </p>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="email@gkfc-cms.org"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={resetSent}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all"
                  >
                    {resetSent ? 'Kirim Tautan...' : 'Kirim Instruksi Reset'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
