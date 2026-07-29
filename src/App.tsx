import React, { useState, useEffect } from 'react';
import { User, AppSettings } from './types';
import { StorageManager } from './utils/storage';
import { LoginPage } from './components/LoginPage';
import { NavbarHeader } from './components/NavbarHeader';
import { Sidebar, NavTab } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';
import { PWABanner } from './components/PWABanner';

import { DashboardView } from './components/DashboardView';
import { JemaatView } from './components/views/JemaatView';
import { WilayahView } from './components/views/WilayahView';
import { AdministrasiView } from './components/views/AdministrasiView';
import { KeuanganView } from './components/views/KeuanganView';
import { AgendaView } from './components/views/AgendaView';
import { MediaView } from './components/views/MediaView';
import { LaporanView } from './components/views/LaporanView';
import { JemaatPortalView } from './components/views/JemaatPortalView';
import { SystemSettingsView } from './components/views/SystemSettingsView';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(StorageManager.getSettings());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPWABanner, setShowPWABanner] = useState(false);

  useEffect(() => {
    // Check local storage logged-in user session
    const savedUser = StorageManager.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      if (savedUser.role === 'JEMAAT') {
        setActiveTab('jemaat_portal');
      }
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
    if (user.role === 'JEMAAT') {
      setActiveTab('jemaat_portal');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    if (currentUser) {
      const historyId = (window as any).__cms_history_id;
      if (historyId) {
        StorageManager.recordLogout(historyId);
      }
      StorageManager.logActivity(currentUser.username, 'Logout dari sistem CMS Pro', 'Auth');
    }
    StorageManager.clearCurrentUser();
    setCurrentUser(null);
  };

  const handleUpdateSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageManager.saveSettings(newSettings);
  };

  // If not logged in, show Glassmorphism Login Page
  if (!currentUser) {
    return (
      <LoginPage
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
        onInstallPWA={handleInstallPWA}
        canInstallPWA={!!deferredPrompt || true}
      />
    );
  }

  return (
    <div id="app-container" className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white relative" style={{ backgroundImage: 'radial-gradient(circle at 0% 0%, #1e293b 0%, #0f172a 100%)' }}>
      {/* PWA Install Notification Banner */}
      {showPWABanner && (
        <PWABanner
          onInstall={handleInstallPWA}
          onDismiss={() => setShowPWABanner(false)}
        />
      )}

      {/* Main Top Header */}
      <NavbarHeader
        currentUser={currentUser}
        settings={settings}
        onLogout={handleLogout}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onInstallPWA={handleInstallPWA}
        canInstallPWA={!!deferredPrompt}
      />

      {/* Content Layout */}
      <div className="flex flex-1 w-full max-w-7xl mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentUser={currentUser}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 pb-20 lg:pb-8">
          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={currentUser}
              settings={settings}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === 'jemaat' && <JemaatView currentUser={currentUser} />}

          {activeTab === 'wilayah' && <WilayahView currentUser={currentUser} />}

          {activeTab === 'administrasi' && <AdministrasiView currentUser={currentUser} />}

          {activeTab === 'keuangan' && <KeuanganView currentUser={currentUser} />}

          {activeTab === 'agenda' && <AgendaView currentUser={currentUser} />}

          {activeTab === 'media' && <MediaView currentUser={currentUser} />}

          {activeTab === 'laporan' && <LaporanView currentUser={currentUser} />}

          {activeTab === 'jemaat_portal' && <JemaatPortalView currentUser={currentUser} />}

          {activeTab === 'settings' && (
            <SystemSettingsView
              currentUser={currentUser}
              settings={settings}
              onUpdateSettings={handleUpdateSettings}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentUser={currentUser}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
}
