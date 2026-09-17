import React, { useState, useEffect, useRef } from 'react';
import { User, AppSettings, ChatMessage } from './types';
import { StorageManager } from './utils/storage';
import { LoginPage } from './components/LoginPage';
import { NavbarHeader } from './components/NavbarHeader';
import { Sidebar, NavTab } from './components/Sidebar';
import { CardMenuModal } from './components/CardMenuModal';
import { BottomNav } from './components/BottomNav';
import { APK_DOWNLOAD_URL } from './components/FloatingApkDownloadButton';
import { AlertTriangle, ArrowLeft, Grid, Home, MessageCircle, X } from 'lucide-react';
import { menuModules } from './data/navigationMenu';
import { playNotificationChime } from './utils/soundHelper';

import { getThemeClasses } from './utils/themeHelper';
import { registerMessagingServiceWorker, listenToForegroundMessages } from './utils/firebaseMessaging';
import { initOneSignalWebSDK } from './utils/pushNotificationService';

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
import { ChatView } from './components/views/ChatView';
import { PustakaRohaniView } from './components/views/PustakaRohaniView';
import { SystemSettingsView } from './components/views/SystemSettingsView';
import { LainnyaView } from './components/views/LainnyaView';
import { SplashScreen } from './components/SplashScreen';
import { SuperAdminSaaSPanel } from './components/SuperAdminSaaSPanel';
import { TenantLockedScreen } from './components/TenantLockedScreen';
import { NavbarCustomizerModal } from './components/NavbarCustomizerModal';
import { AndroidStudioConverterModal } from './components/AndroidStudioConverterModal';
import { FloatingNotificationBanner } from './components/FloatingNotificationBanner';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginPageOpen, setIsLoginPageOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(StorageManager.getSettings());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSaaSPanelOpen, setIsSaaSPanelOpen] = useState(false);
  const [isNavbarCustomizerOpen, setIsNavbarCustomizerOpen] = useState(false);
  const [isAndroidStudioModalOpen, setIsAndroidStudioModalOpen] = useState(false);
  const [tenantStatus, setTenantStatus] = useState(() => StorageManager.checkTenantStatus());

  // Default Guest user for public browsing when not logged in
  const GUEST_USER: User = {
    user_id: 'guest',
    username: 'pengunjung',
    nama: 'Jemaat / Pengunjung',
    role: 'JEMAAT',
    email: 'jemaat@gkfc-cms.org',
    status: 'Aktif'
  };

  const effectiveUser = currentUser || GUEST_USER;
  const isEffectiveAdmin = effectiveUser.role === 'ADMIN' || effectiveUser.role === 'SUPER_ADMIN';

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

    // Register Service Worker for PWA & Offline Support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          console.log('[PWA] Service Worker registered:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Service Worker registration note:', err);
        });

      // Also register Firebase Messaging SW if supported
      registerMessagingServiceWorker().catch(() => {});
    }

    const unsubscribeFCM = listenToForegroundMessages((payload) => {
      console.log('FCM Foreground message received:', payload);
    });

    return () => {
      unsubscribeFCM();
    };
  }, []);

  useEffect(() => {
    // Sync custom theme hex color to CSS variables globally
    if (settings && settings.warna_tema) {
      const customHex = settings.warna_tema.trim();
      if (/^#[0-9A-F]{6}$/i.test(customHex) || /^#[0-9A-F]{3}$/i.test(customHex)) {
        document.documentElement.style.setProperty('--theme-custom-primary', customHex);
      }
    }
  }, [settings?.warna_tema]);

  useEffect(() => {
    // Inisialisasi OneSignal Push Notification jika disetel & aktif
    if (settings && settings.onesignal_enabled !== false && settings.onesignal_app_id) {
      try {
        initOneSignalWebSDK(settings.onesignal_app_id);
      } catch (err) {
        console.warn('OneSignal init error:', err);
      }
    }
  }, [settings?.onesignal_app_id, settings?.onesignal_enabled]);

  useEffect(() => {
    // Listen for setting changes across components & tabs
    const handleSettingsSync = () => {
      setSettings(StorageManager.getSettings());
      setTenantStatus(StorageManager.checkTenantStatus());
      const savedUser = StorageManager.getCurrentUser();
      if (savedUser) {
        // SECURITY GUARD: Only refresh current user if it is the EXACT same username.
        // Never allow adding/syncing jemaat or storage events to switch the logged-in session to another user!
        setCurrentUser((prev) => {
          if (!prev) return savedUser;
          if (
            savedUser.username &&
            prev.username &&
            savedUser.username.toLowerCase() === prev.username.toLowerCase()
          ) {
            return savedUser;
          }
          return prev;
        });
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

  // Floating Live Chat Notification State (Ditampilkan saat pengguna sedang TIDAK di ruang chat)
  const [incomingChatNotif, setIncomingChatNotif] = useState<ChatMessage | null>(null);
  const [lastDismissedChatId, setLastDismissedChatId] = useState<string>(() => {
    try {
      return sessionStorage.getItem('cms_last_seen_chat_id') || '';
    } catch (e) {
      return '';
    }
  });
  const prevChatCountRef = useRef<number>(-1);

  // Jika pengguna sedang berada di ruang chat, sembunyikan notifikasi mengambang & tandai semua pesan saat ini sebagai sudah dibaca
  useEffect(() => {
    if (activeTab === 'chat') {
      const allMsgs = StorageManager.getChatMessages();
      if (allMsgs.length > 0) {
        const latest = allMsgs[allMsgs.length - 1];
        if (latest && latest.id) {
          try {
            sessionStorage.setItem('cms_last_seen_chat_id', latest.id);
          } catch (e) {
            // ignore
          }
          setLastDismissedChatId(latest.id);
        }
      }
      setIncomingChatNotif(null);
    }
  }, [activeTab]);

  // Pantau pesan chat masuk secara berkala dan realtime ketika pengguna TIDAK berada di ruang chat
  useEffect(() => {
    if (activeTab === 'chat') {
      setIncomingChatNotif(null);
      return;
    }

    const checkIncomingChat = () => {
      if (activeTab === 'chat') {
        setIncomingChatNotif(null);
        return;
      }

      const allMsgs = StorageManager.getChatMessages();
      if (allMsgs.length === 0) return;

      const latest = allMsgs[allMsgs.length - 1];
      if (!latest || !latest.id) return;

      const myName = (effectiveUser.nama || effectiveUser.username || '').toLowerCase().trim();
      const senderName = (latest.sender_name || '').toLowerCase().trim();
      const isFromMe =
        (effectiveUser.user_id && latest.sender_id === effectiveUser.user_id) ||
        (senderName && myName && senderName === myName);

      let seenId = '';
      try {
        seenId = sessionStorage.getItem('cms_last_seen_chat_id') || lastDismissedChatId;
      } catch (e) {
        seenId = lastDismissedChatId;
      }

      if (!isFromMe && latest.id !== seenId) {
        setIncomingChatNotif(latest);
        if (prevChatCountRef.current !== -1 && allMsgs.length > prevChatCountRef.current) {
          try {
            playNotificationChime();
          } catch (e) {
            // ignore
          }
        }
      }

      prevChatCountRef.current = allMsgs.length;
    };

    checkIncomingChat();

    window.addEventListener('cms_data_changed', checkIncomingChat);
    window.addEventListener('storage', checkIncomingChat);

    const interval = setInterval(checkIncomingChat, 2500);

    return () => {
      window.removeEventListener('cms_data_changed', checkIncomingChat);
      window.removeEventListener('storage', checkIncomingChat);
      clearInterval(interval);
    };
  }, [activeTab, effectiveUser, lastDismissedChatId]);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    try {
      sessionStorage.setItem('cms_active_tab', tab);
    } catch (e) {
      // ignore
    }
  };

  // Global listener for tab navigation events triggered by notifications or quick links
  useEffect(() => {
    const handleNavigateTab = (e: Event) => {
      const ce = e as CustomEvent<{ tab: NavTab }>;
      if (ce.detail && ce.detail.tab) {
        handleSelectTab(ce.detail.tab);
      }
    };
    const handleOpenAndroidStudio = () => {
      setIsAndroidStudioModalOpen(true);
    };

    window.addEventListener('navigate_to_tab', handleNavigateTab);
    window.addEventListener('open_android_studio_modal', handleOpenAndroidStudio);
    return () => {
      window.removeEventListener('navigate_to_tab', handleNavigateTab);
      window.removeEventListener('open_android_studio_modal', handleOpenAndroidStudio);
    };
  }, []);

  // Handle Android Back Button / Navigation when logged in
  useEffect(() => {
    if (!currentUser || isLoginPageOpen) return;

    const handlePopState = () => {
      setActiveTab((prev) => (prev !== 'dashboard' ? 'dashboard' : prev));
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [currentUser, isLoginPageOpen]);

  const handleDownloadAPK = () => {
    const raw = settings?.apk_download_url;
    const downloadUrl = (raw && raw !== 'https://drive.google.com/file/d/1TlnvPxgIPWQ13CE_EJnj4gUMAipCWy1s/view?usp=sharing') ? raw : APK_DOWNLOAD_URL;
    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
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

  const handleCloseLoginPage = () => {
    setIsLoginPageOpen(false);
    // Set active tab back to main church dashboard (Mode Publik)
    setActiveTab('dashboard');
    try {
      sessionStorage.setItem('cms_active_tab', 'dashboard');
    } catch (e) {}
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
    setActiveTab('dashboard');
    try {
      sessionStorage.setItem('cms_active_tab', 'dashboard');
    } catch (e) {}

    // Cleanly replace history state
    try {
      window.history.replaceState({ page: 'cms' }, '', window.location.href);
    } catch (e) {}

    setIsLoginPageOpen(false);
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
        onClose={handleCloseLoginPage}
        onInstallPWA={handleDownloadAPK}
        canInstallPWA={true}
      />
    );
  }

  // Check if tenant is locked (NONAKTIF / KADALUARSA / DIBLOKIR)
  // SuperAdmin always bypasses lock screen for full management access
  if (tenantStatus.isLocked && effectiveUser.role !== 'SUPER_ADMIN' && !isLoginPageOpen) {
    return (
      <TenantLockedScreen
        tenant={tenantStatus.tenant}
        reason={tenantStatus.reason}
        message={tenantStatus.message}
        onOpenLogin={() => setIsLoginPageOpen(true)}
      />
    );
  }

  const theme = getThemeClasses(settings);

  return (
    <div id="app-container" className={`min-h-screen ${theme.rootBg} ${theme.fontClass} flex flex-col selection:bg-indigo-500/30 selection:text-white relative transition-colors duration-300`}>
      {/* Main Top Header */}
      <NavbarHeader
        currentUser={effectiveUser}
        isGuest={!currentUser}
        onOpenLogin={() => setIsLoginPageOpen(true)}
        settings={settings}
        onLogout={requestLogout}
        onUpdateCurrentUser={(updatedUser) => setCurrentUser(updatedUser)}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        onInstallPWA={handleDownloadAPK}
        canInstallPWA={true}
        onOpenSuperAdminSaaSPanel={() => setIsSaaSPanelOpen(true)}
        activeTab={activeTab}
        onNavigateToDashboard={() => handleSelectTab('dashboard')}
        onUpdateSettings={handleUpdateSettings}
        onNavigateToSettings={() => handleSelectTab('settings')}
        onOpenNavbarCustomizer={isEffectiveAdmin ? () => setIsNavbarCustomizerOpen(true) : undefined}
        onOpenAndroidStudioModal={isEffectiveAdmin ? () => setIsAndroidStudioModalOpen(true) : undefined}
      />

      {/* Card Menu Overlay Modal (Replaces Left Sidebar for All Devices) */}
      <CardMenuModal
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={effectiveUser}
        settings={settings}
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSuperAdminSaaSPanel={() => setIsSaaSPanelOpen(true)}
        onOpenNavbarCustomizer={isEffectiveAdmin ? () => setIsNavbarCustomizerOpen(true) : undefined}
        onOpenAndroidStudioModal={isEffectiveAdmin ? () => setIsAndroidStudioModalOpen(true) : undefined}
      />

      {/* Content Layout - Full Width Without Left Sidebar */}
      <div className="flex flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4">
        {/* Main Content Area */}
        <main className="flex-1 w-full min-w-0 p-1 sm:p-3 lg:p-4 pb-20 lg:pb-8">
          {/* Top Breadcrumb & Quick Back Bar when in Sub-Modules */}
          {activeTab !== 'dashboard' && (
            <div className="mb-4 p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-3 shadow-2xl backdrop-blur-md animate-fade-in">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => handleSelectTab('dashboard')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black flex items-center gap-2 border border-indigo-400/30 shadow-lg transition-all cursor-pointer shrink-0 active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-white" />
                  <span>Kembali ke Dashboard Utama</span>
                </button>

                <span className="text-slate-600 font-bold hidden sm:inline">/</span>

                <div className="hidden sm:flex items-center gap-2 min-w-0">
                  <span className="text-xs font-extrabold text-amber-400 uppercase tracking-wider truncate">
                    Modul: {menuModules.find((m) => m.id === activeTab)?.title || activeTab}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="px-3.5 py-2 rounded-xl text-white text-xs font-extrabold flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer hover:scale-105 active:scale-95"
                style={{ backgroundColor: settings.warna_tema || '#CD5C5C' }}
              >
                <Grid className="w-4 h-4 text-white" />
                <span className="hidden xs:inline">Kartu Menu</span>
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              currentUser={effectiveUser}
              settings={settings}
              onNavigate={handleSelectTab}
              onUpdateSettings={handleUpdateSettings}
              onLogout={requestLogout}
              onOpenLogin={() => setIsLoginPageOpen(true)}
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

          {activeTab === 'chat' && <ChatView currentUser={effectiveUser} settings={settings} />}

          {activeTab === 'pustaka' && (
            <PustakaRohaniView
              currentUser={effectiveUser}
              settings={settings}
              onNavigateToChat={() => handleSelectTab('chat')}
            />
          )}

          {activeTab === 'settings' && (
            isEffectiveAdmin ? (
              <SystemSettingsView
                currentUser={effectiveUser}
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
              />
            ) : (
              <div className="p-8 text-center bg-slate-900/60 rounded-3xl border border-slate-800 text-slate-300">
                <p className="font-bold text-lg mb-2 text-rose-400">Akses Khusus Administrator</p>
                <p className="text-sm text-slate-400">Menu Pengaturan Sistem dan Kustomisasi Warna Tema Navbar hanya dapat diakses oleh Admin & SuperAdmin.</p>
              </div>
            )
          )}

          {activeTab === 'lainnya' && (
            <LainnyaView
              currentUser={effectiveUser}
              onNavigate={handleSelectTab}
              settings={settings}
            />
          )}
        </main>
      </div>

      {/* NOTIFIKASI KARTU KECIL MENGAMBANG LIVE CHAT - SELALU MUNCUL SAAT TIDAK BERADA DI RUANG CHAT */}
      {activeTab !== 'chat' && incomingChatNotif && (
        <div
          role="alert"
          className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9990] max-w-sm w-[calc(100vw-2rem)] sm:w-84 p-3.5 rounded-2xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl backdrop-blur-xl text-white transition-all ring-4 ring-indigo-500/20 animate-fade-in"
        >
          <div className="flex items-start gap-3">
            <div className="relative shrink-0 mt-0.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-400 shadow-inner">
                <MessageCircle className="w-5 h-5 text-indigo-300" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-ping" />
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-indigo-300 truncate">
                  {incomingChatNotif.sender_name}
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold shrink-0 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Chat Masuk
                </span>
              </div>

              <p className="text-xs text-slate-200 line-clamp-2 mt-1 font-normal leading-relaxed">
                {incomingChatNotif.message}
              </p>

              <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-slate-800/80">
                <button
                  type="button"
                  onClick={() => {
                    if (incomingChatNotif && incomingChatNotif.id) {
                      try {
                        sessionStorage.setItem('cms_last_seen_chat_id', incomingChatNotif.id);
                      } catch (e) {
                        // ignore
                      }
                      setLastDismissedChatId(incomingChatNotif.id);
                    }
                    setIncomingChatNotif(null);
                    handleSelectTab('chat');
                  }}
                  className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Buka Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (incomingChatNotif && incomingChatNotif.id) {
                      try {
                        sessionStorage.setItem('cms_last_seen_chat_id', incomingChatNotif.id);
                      } catch (e) {
                        // ignore
                      }
                      setLastDismissedChatId(incomingChatNotif.id);
                    }
                    setIncomingChatNotif(null);
                  }}
                  className="text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (incomingChatNotif && incomingChatNotif.id) {
                  try {
                    sessionStorage.setItem('cms_last_seen_chat_id', incomingChatNotif.id);
                  } catch (e) {
                    // ignore
                  }
                  setLastDismissedChatId(incomingChatNotif.id);
                }
                setIncomingChatNotif(null);
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all shrink-0 cursor-pointer"
              title="Tutup Notifikasi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Interactive Notification Banner for Content Updates & Announcements */}
      <FloatingNotificationBanner
        currentUser={effectiveUser}
        settings={settings}
        onNavigate={handleSelectTab}
      />

      {/* Mobile Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        currentUser={effectiveUser}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        settings={settings}
      />

      {/* SuperAdmin SaaS Multi-Church Master Control Panel */}
      <SuperAdminSaaSPanel
        isOpen={isSaaSPanelOpen}
        onClose={() => setIsSaaSPanelOpen(false)}
        onSelectTenant={(tenantId) => {
          setSettings(StorageManager.getSettings());
          setTenantStatus(StorageManager.checkTenantStatus());
        }}
      />

      {/* KARTU PERINGATAN KONFIRMASI KELUAR APLIKASI */}
      {isLogoutConfirmOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#090d16]/90 backdrop-blur-sm transition-opacity">
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

      {/* Modal Kustomisasi Warna & Tema Navbar Global (Hanya untuk Admin & SuperAdmin) */}
      {isEffectiveAdmin && (
        <NavbarCustomizerModal
          isOpen={isNavbarCustomizerOpen}
          onClose={() => setIsNavbarCustomizerOpen(false)}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onNavigateToSettings={() => handleSelectTab('settings')}
        />
      )}

      {/* Modal Generator Android Studio & Firebase (FCM) & Download google-services.json */}
      <AndroidStudioConverterModal
        isOpen={isAndroidStudioModalOpen}
        onClose={() => setIsAndroidStudioModalOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
}
