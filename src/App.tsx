import React, { useState, useEffect } from 'react';
import { User, AppSettings } from './types';
import { StorageManager } from './utils/storage';
import { LoginPage } from './components/LoginPage';
import { NavbarHeader } from './components/NavbarHeader';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { PWABanner } from './components/PWABanner';
import { AlertTriangle } from 'lucide-react';

import { getThemeClasses } from './utils/themeHelper';

import { DashboardView } from './components/DashboardView';
import { JemaatView } from './components/views/JemaatView';
import { WilayahView } from './components/views/WilayahView';
import { AdministrasiView } from './components/views/AdministrasiView';
import { KeuanganView } from './components/views/KeuanganView';
import { AgendaView } from './components/views/AgendaView';
import { MediaView } from './components/views/MediaView';
import { GaleriView } from './components/views/GaleriView';
import { LaporanView } from './components/views/LaporanView';
import { JemaatPortalView } from './components/views/JemaatPortalView';
import { SystemSettingsView } from './components/views/SystemSettingsView';
import { SplashScreen } from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginPageOpen, setIsLoginPageOpen] = useState(!StorageManager.getCurrentUser());
  const [settings, setSettings] = useState<AppSettings>(StorageManager.getSettings());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Default Guest user for public browsing when not logged in
  const GUEST_USER: User = {
    user_id: 'guest',
    username: 'tamu_jemaat',
    nama: 'Tamu Jemaat (Publik)',
    role: 'JEMAAT',
    email: 'jemaat@gkfc-cms.org',
    status: 'Aktif'
  };

  const effectiveUser = currentUser || GUEST_USER;

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPWABanner, setShowPWABanner] = useState(false);

  useEffect(() => {
    // Check local storage logged-in user session
    const savedUser = StorageManager.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      setIsLoginPageOpen(false);
      // Restore tab from sessionStorage or default to 'dashboard'
      const savedTab = (sessionStorage.getItem('cms_active_tab') as NavTab) || 'dashboard';
      setActiveTab(savedTab);
    }

    // PWA BeforeInstallPrompt Event Listener
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPWABanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      const base = import.meta.env.BASE_URL || './';
      const swUrl = `${base.endsWith('/') ? base : base + '/'}sw.js`;
      navigator.serviceWorker
        .register(swUrl)
        .then((reg) => {
          console.log('CMS Pro PWA Service Worker Registered:', reg.scope);
          reg.update();
        })
        .catch((err) => console.log('Service Worker registration failed:', err));
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  useEffect(() => {
    // Listen for setting changes across components & tabs
    const handleSettingsSync = () => {
      setSettings(StorageManager.getSettings());
      const savedUser = StorageManager.getCurrentUser();
      if (savedUser) {
        setCurrentUser(savedUser);
      }
    };

    const unsubscribe = StorageManager.subscribe(handleSettingsSync);
    window.addEventListener('cms_data_changed', handleSettingsSync);
    window.addEventListener('storage', handleSettingsSync);

    return () => {
      unsubscribe();
      window.removeEventListener('cms_data_changed', handleSettingsSync);
      window.removeEventListener('storage', handleSettingsSync);
    };
  }, []);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    try {
      sessionStorage.setItem('cms_active_tab', tab);
    } catch (e) {
      // ignore
    }
  };

  // Intercept Android Back Button / Browser Navigation to show Exit Confirmation Modal when logged in
  useEffect(() => {
    if (!currentUser || isLoginPageOpen) return;

    // Push history state to enable popstate interception for back button
    window.history.pushState({ page: 'cms' }, '', window.location.href);

    const handlePopState = () => {
      // Re-push history state to prevent unexpected navigation
      window.history.pushState({ page: 'cms' }, '', window.location.href);
      setIsLogoutConfirmOpen(true);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentUser, isLoginPageOpen]);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        console.log('User accepted PWA installation');
      }
      setDeferredPrompt(null);
      setShowPWABanner(false);
    } else {
      alert(
        'Untuk menginstal CMS Pro sebagai aplikasi Android/iOS:\n1. Di Chrome: Tekan Titik Tiga (⋮) -> Tambahkan ke Layar Utama / Install App.\n2. Di Safari iOS: Tekan tombol Share -> Add to Home Screen.'
      );
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setIsLoginPageOpen(false);
    if (user.role === 'JEMAAT') {
      setActiveTab('jemaat_portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  // Logout confirmation modal state
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  const requestLogout = () => {
    setIsLogoutConfirmOpen(true);
  };

  const confirmLogout = () => {
    if (currentUser) {
      const historyId = (window as any).__cms_history_id;
      if (historyId) {
        StorageManager.recordLogout(historyId);
      }
      StorageManager.logActivity(currentUser.username, 'Logout dari sistem CMS Pro', 'Auth');
    }
    StorageManager.clearCurrentUser();
    setCurrentUser(null);
    setIsLogoutConfirmOpen(false);

    // Cleanly replace history state so logout stays on login page
    try {
      window.history.replaceState({ page: 'login' }, '', window.location.href);
    } catch (e) {}

    setIsLoginPageOpen(true);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageManager.saveSettings(newSettings);
  };

  // Show initial splash screen with loading animation
  if (showSplash) {
    return <SplashScreen settings={settings} onFinish={() => setShowSplash(false)} />;
  }

  // If login view is explicitly open
  if (isLoginPageOpen) {
    return (
      <LoginPage
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
        onClose={() => setIsLoginPageOpen(false)}
        onInstallPWA={handleInstallPWA}
        canInstallPWA={!!deferredPrompt || true}
      />
    );
  }

  const theme = getThemeClasses(settings);

  return (
    <div id="app-container" className={`min-h-screen ${theme.rootBg} ${theme.fontClass} flex flex-col selection:bg-indigo-500/30 selection:text-white relative transition-colors duration-300`}>
      {/* PWA Install Notification Banner */}
      {showPWABanner && (
        <PWABanner
          onInstall={handleInstallPWA}
          onDismiss={() => setShowPWABanner(false)}
        />
      )}

      {/* Main Top Header */}
      <NavbarHeader
        currentUser={effectiveUser}
        isGuest={!currentUser}
        onOpenLogin={() => setIsLoginPageOpen(true)}
        settings={settings}
        onLogout={requestLogout}
        onUpdateCurrentUser={(updatedUser) => setCurrentUser(updatedUser)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onInstallPWA={handleInstallPWA}
        canInstallPWA={!!deferredPrompt}
      />

      {/* Content Layout */}
      <div className="flex flex-1 w-full mx-auto px-1 sm:px-3">
        {/* Sidebar */}
        <Sidebar
          currentUser={effectiveUser}
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-2 sm:p-4 lg:p-5 min-w-0 pb-16 lg:pb-6">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={effectiveUser}
              settings={settings}
              onNavigate={handleSelectTab}
              onUpdateSettings={handleUpdateSettings}
              onLogout={requestLogout}
            />
          )}

          {activeTab === 'jemaat' && <JemaatView currentUser={effectiveUser} />}

          {activeTab === 'wilayah' && <WilayahView currentUser={effectiveUser} />}

          {activeTab === 'administrasi' && <AdministrasiView currentUser={effectiveUser} />}

          {activeTab === 'keuangan' && <KeuanganView currentUser={effectiveUser} />}

          {activeTab === 'jadwal' && (
            <AgendaView currentUser={effectiveUser} mode="JADWAL" />
          )}

          {activeTab === 'agenda' && (
            <AgendaView currentUser={effectiveUser} mode="AGENDA" />
          )}

          {activeTab === 'doa' && (
            <AgendaView currentUser={effectiveUser} mode="DOA" />
          )}

          {activeTab === 'pengumuman' && (
            <MediaView currentUser={effectiveUser} mode="PENGUMUMAN" />
          )}

          {activeTab === 'renungan' && (
            <MediaView currentUser={effectiveUser} mode="RENUNGAN" />
          )}

          {activeTab === 'galeri' && (
            <GaleriView currentUser={effectiveUser} initialTab="GALLERY" />
          )}

          {activeTab === 'media' && (
            <GaleriView currentUser={effectiveUser} initialTab="SOCIAL_VIDEOS" />
          )}

          {activeTab === 'laporan' && <LaporanView currentUser={effectiveUser} />}

          {activeTab === 'jemaat_portal' && <JemaatPortalView currentUser={effectiveUser} settings={settings} />}

          {activeTab === 'settings' && (
            <SystemSettingsView
              currentUser={effectiveUser}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentUser={effectiveUser}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />

      {/* KARTU PERINGATAN KONFIRMASI KELUAR APLIKASI */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-6 text-white space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-white">Konfirmasi Keluar Aplikasi</h3>
              <p className="text-sm text-slate-300 leading-relaxed font-medium">
                Apakah Anda yakin ingin keluar dari aplikasi? Anda akan keluar dari sesi ini.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setIsLogoutConfirmOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all border border-slate-700 cursor-pointer"
              >
                Tidak
              </button>
              <button
                onClick={confirmLogout}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
              >
                Ya
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
