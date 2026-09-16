import React, { useState, useEffect } from 'react';
import {
  X,
  Smartphone,
  CheckCircle,
  Copy,
  ExternalLink,
  Download,
  FileCode,
  Bell,
  Palette,
  Layers,
  BookOpen,
  Send,
  Sparkles,
  ShieldCheck,
  RefreshCw,
  Sliders,
  Check,
  Globe,
  Wifi,
  Battery,
  AlertCircle
} from 'lucide-react';
import { AppSettings } from '../types';
import defaultFirebaseConfig from '../../firebase-applet-config.json';
import {
  AndroidStudioConfig,
  DEFAULT_ANDROID_CONFIG,
  generateMainActivityJava,
  generateFirebaseMessagingServiceJava,
  generateAndroidManifestXml,
  generateAppBuildGradle,
  generateProjectBuildGradle,
  generateActivityMainXml,
  generateColorsXml,
  generateStylesXml,
  generateNotificationIconXml,
  downloadFile
} from '../utils/androidStudioGenerator';
import { downloadGoogleServicesJsonFile, sendFcmLegacyNotification } from '../utils/googleServicesHelper';

interface AndroidStudioConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings?: (newSettings: AppSettings) => void;
}

export const AndroidStudioConverterModal: React.FC<AndroidStudioConverterModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  // Config state
  const [config, setConfig] = useState<AndroidStudioConfig>({
    webUrl: settings?.android_web_url || 'https://tntimbu.github.io/jesuskingdomchrist/',
    appName: settings?.android_app_name || settings?.nama_gereja || DEFAULT_ANDROID_CONFIG.appName,
    packageName: settings?.android_package_name || settings?.firebase_package_name || DEFAULT_ANDROID_CONFIG.packageName,
    statusBarColor: settings?.android_status_bar_color || DEFAULT_ANDROID_CONFIG.statusBarColor,
    statusBarStyle: settings?.android_status_bar_style || DEFAULT_ANDROID_CONFIG.statusBarStyle,
    navBarColor: settings?.android_nav_bar_color || DEFAULT_ANDROID_CONFIG.navBarColor,
    enablePullToRefresh: settings?.android_enable_pull_to_refresh ?? DEFAULT_ANDROID_CONFIG.enablePullToRefresh,
    enableHardwareAcceleration: settings?.android_enable_hardware_acceleration ?? DEFAULT_ANDROID_CONFIG.enableHardwareAcceleration,
    enableFullscreen: settings?.android_enable_fullscreen ?? DEFAULT_ANDROID_CONFIG.enableFullscreen,
    safeAreaPadding: settings?.android_safe_area_padding ?? DEFAULT_ANDROID_CONFIG.safeAreaPadding,
    splashBgColor: settings?.android_splash_bg_color || DEFAULT_ANDROID_CONFIG.splashBgColor,
    splashDurationMs: settings?.android_splash_duration_ms || DEFAULT_ANDROID_CONFIG.splashDurationMs,
    userAgentSuffix: settings?.android_user_agent_suffix || DEFAULT_ANDROID_CONFIG.userAgentSuffix,
    fcmTopic: settings?.android_fcm_default_topic || DEFAULT_ANDROID_CONFIG.fcmTopic,
    senderId: settings?.firebase_messaging_sender_id || defaultFirebaseConfig.messagingSenderId || '248780279971',
    projectId: settings?.firebase_project_id || defaultFirebaseConfig.projectId || 'gen-lang-client-0499830391'
  });

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'DISPLAY' | 'FIREBASE_FCM' | 'CODE_EXPORT' | 'GUIDE'>('DISPLAY');
  const [selectedCodeFile, setSelectedCodeFile] = useState<
    'MAIN_ACTIVITY' | 'FCM_SERVICE' | 'MANIFEST' | 'APP_GRADLE' | 'PROJECT_GRADLE' | 'ACTIVITY_LAYOUT' | 'COLORS' | 'STYLES'
  >('MAIN_ACTIVITY');

  // Copy feedback state
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // FCM Live Tester State
  const [testTitle, setTestTitle] = useState('📢 Warta Ibadah Minggu - Jesus Kingdom Christ');
  const [testMessage, setTestMessage] = useState('Shalom Jemaat! Jadwal ibadah raya & renungan harian telah diperbarui.');
  const [testTargetUrl, setTestTargetUrl] = useState('https://tntimbu.github.io/jesuskingdomchrist/');
  const [testServerKey, setTestServerKey] = useState(settings?.firebase_fcm_server_key || '');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setConfig((prev) => ({
        ...prev,
        webUrl: settings.android_web_url || prev.webUrl,
        appName: settings.android_app_name || settings.nama_gereja || prev.appName,
        packageName: settings.android_package_name || settings.firebase_package_name || prev.packageName,
        statusBarColor: settings.android_status_bar_color || prev.statusBarColor,
        statusBarStyle: settings.android_status_bar_style || prev.statusBarStyle,
        navBarColor: settings.android_nav_bar_color || prev.navBarColor,
        enablePullToRefresh: settings.android_enable_pull_to_refresh ?? prev.enablePullToRefresh,
        enableHardwareAcceleration: settings.android_enable_hardware_acceleration ?? prev.enableHardwareAcceleration,
        fcmTopic: settings.android_fcm_default_topic || prev.fcmTopic
      }));
      if (settings.firebase_fcm_server_key) {
        setTestServerKey(settings.firebase_fcm_server_key);
      }
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleCopyCode = (code: string, fileName: string) => {
    try {
      navigator.clipboard.writeText(code);
      setCopiedFile(fileName);
      setTimeout(() => setCopiedFile(null), 2500);
    } catch (e) {
      console.warn('Copy failed:', e);
    }
  };

  const handleDownloadGoogleServices = () => {
    downloadGoogleServicesJsonFile(config.packageName, settings);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 3000);
  };

  const handleSaveSettings = () => {
    if (!onUpdateSettings) return;
    const updated: AppSettings = {
      ...settings,
      android_web_url: config.webUrl,
      android_app_name: config.appName,
      android_package_name: config.packageName,
      firebase_package_name: config.packageName,
      android_status_bar_color: config.statusBarColor,
      android_status_bar_style: config.statusBarStyle,
      android_nav_bar_color: config.navBarColor,
      android_enable_pull_to_refresh: config.enablePullToRefresh,
      android_enable_hardware_acceleration: config.enableHardwareAcceleration,
      android_enable_fullscreen: config.enableFullscreen,
      android_safe_area_padding: config.safeAreaPadding,
      android_splash_bg_color: config.splashBgColor,
      android_splash_duration_ms: config.splashDurationMs,
      android_user_agent_suffix: config.userAgentSuffix,
      android_fcm_default_topic: config.fcmTopic,
      firebase_fcm_server_key: testServerKey
    };
    onUpdateSettings(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleSendTestFcm = async () => {
    setIsSendingTest(true);
    setTestResult(null);
    try {
      const res = await sendFcmLegacyNotification(
        testServerKey,
        config.fcmTopic,
        testTitle,
        testMessage,
        testTargetUrl
      );
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Gagal mengirim push notifikasi' });
    } finally {
      setIsSendingTest(false);
    }
  };

  // Get active code string based on selected file
  const getSelectedCodeContent = () => {
    switch (selectedCodeFile) {
      case 'MAIN_ACTIVITY':
        return { filename: 'MainActivity.java', code: generateMainActivityJava(config) };
      case 'FCM_SERVICE':
        return { filename: 'MyFirebaseMessagingService.java', code: generateFirebaseMessagingServiceJava(config) };
      case 'MANIFEST':
        return { filename: 'AndroidManifest.xml', code: generateAndroidManifestXml(config) };
      case 'APP_GRADLE':
        return { filename: 'app_build.gradle', code: generateAppBuildGradle(config) };
      case 'PROJECT_GRADLE':
        return { filename: 'project_build.gradle', code: generateProjectBuildGradle() };
      case 'ACTIVITY_LAYOUT':
        return { filename: 'activity_main.xml', code: generateActivityMainXml() };
      case 'COLORS':
        return { filename: 'colors.xml', code: generateColorsXml(config) };
      case 'STYLES':
        return { filename: 'styles.xml', code: generateStylesXml(config) };
      default:
        return { filename: 'MainActivity.java', code: generateMainActivityJava(config) };
    }
  };

  const currentCode = getSelectedCodeContent();

  const colorPresets = [
    { label: 'Navy Slate', hex: '#0f172a', style: 'LIGHT_ICONS' as const },
    { label: 'Indigo Royal', hex: '#1e1b4b', style: 'LIGHT_ICONS' as const },
    { label: 'Deep Black', hex: '#000000', style: 'LIGHT_ICONS' as const },
    { label: 'Clean White', hex: '#ffffff', style: 'DARK_ICONS' as const },
    { label: 'Emerald Forest', hex: '#064e3b', style: 'LIGHT_ICONS' as const },
    { label: 'Maroon Velvet', hex: '#4c0519', style: 'LIGHT_ICONS' as const }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-indigo-950/90 via-slate-900 to-emerald-950/70 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shrink-0">
              <Smartphone className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Konversi Android Studio &amp; Firebase Push Notification Pro
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/30">
                  Android 14 Ready
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-extrabold border border-amber-500/30">
                  FCM v1 &amp; DeepLink
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Konversi link <code className="text-amber-400 bg-slate-800/80 px-1.5 py-0.5 rounded">{config.webUrl}</code> menjadi aplikasi Android native berperforma tinggi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              {saveSuccess ? <Check className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
              <span>{saveSuccess ? 'Tersimpan!' : 'Simpan Konfigurasi'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition cursor-pointer shrink-0"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/70 px-4 pt-3 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('DISPLAY')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'DISPLAY'
                ? 'border-indigo-500 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>1. Tampilan Profesional (Display &amp; Status Bar)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FIREBASE_FCM')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'FIREBASE_FCM'
                ? 'border-amber-500 text-amber-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>2. Push Notifikasi Firebase (FCM)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('CODE_EXPORT')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'CODE_EXPORT'
                ? 'border-emerald-500 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>3. Salin Kode Android Studio (Java &amp; Gradle)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('GUIDE')}
            className={`pb-3 px-3 border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'GUIDE'
                ? 'border-cyan-500 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>4. Panduan Step-by-Step Android Studio</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          {/* TAB 1: DISPLAY & PROFESSIONAL APPEARANCE */}
          {activeTab === 'DISPLAY' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Form Settings */}
              <div className="lg:col-span-7 space-y-5">
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" />
                    <span>Target URL &amp; Identitas Aplikasi Android</span>
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        URL Web yang Dikonversi:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={config.webUrl}
                          onChange={(e) => setConfig({ ...config, webUrl: e.target.value })}
                          className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                          placeholder="https://tntimbu.github.io/jesuskingdomchrist/"
                        />
                        <a
                          href={config.webUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                          title="Buka URL Web"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Aplikasi Android Studio akan secara otomatis membuka link web ini dengan performa native WebView.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Nama Aplikasi (App Label):
                        </label>
                        <input
                          type="text"
                          value={config.appName}
                          onChange={(e) => setConfig({ ...config, appName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                          placeholder="Jesus Kingdom Christ"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Package Name (Application ID):
                        </label>
                        <input
                          type="text"
                          value={config.packageName}
                          onChange={(e) => setConfig({ ...config, packageName: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                          placeholder="com.jesuskingdomchrist.app"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status Bar & Theming */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-emerald-400" />
                    <span>Status Bar &amp; Navigasi Profesional (NoActionBar)</span>
                  </h4>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Warna Status Bar Atas (Status Bar Color):
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={config.statusBarColor.startsWith('#') ? config.statusBarColor : '#0f172a'}
                          onChange={(e) => setConfig({ ...config, statusBarColor: e.target.value })}
                          className="w-10 h-10 rounded-xl border border-slate-700 bg-slate-800 cursor-pointer p-0.5"
                        />
                        <input
                          type="text"
                          value={config.statusBarColor}
                          onChange={(e) => setConfig({ ...config, statusBarColor: e.target.value })}
                          className="w-28 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                        />
                        <div className="flex flex-wrap gap-1.5 flex-1">
                          {colorPresets.map((preset) => (
                            <button
                              key={preset.hex}
                              type="button"
                              onClick={() => setConfig({ ...config, statusBarColor: preset.hex, statusBarStyle: preset.style })}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition flex items-center gap-1.5 ${
                                config.statusBarColor.toLowerCase() === preset.hex.toLowerCase()
                                  ? 'border-indigo-500 bg-indigo-950/60 text-white font-bold'
                                  : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              <span className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: preset.hex }} />
                              <span>{preset.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Gaya Ikon Status Bar:
                        </label>
                        <select
                          value={config.statusBarStyle}
                          onChange={(e) => setConfig({ ...config, statusBarStyle: e.target.value as any })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                        >
                          <option value="LIGHT_ICONS">Ikon Putih (Untuk background gelap)</option>
                          <option value="DARK_ICONS">Ikon Gelap (Untuk background putih/terang)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Warna Navigation Bar Bawah:
                        </label>
                        <input
                          type="text"
                          value={config.navBarColor}
                          onChange={(e) => setConfig({ ...config, navBarColor: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-indigo-500 focus:outline-none"
                          placeholder="#0f172a"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* UX & Native Features */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-400" />
                    <span>Fitur Interaktif &amp; WebView Optimization</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={config.enablePullToRefresh}
                        onChange={(e) => setConfig({ ...config, enablePullToRefresh: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-700 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Pull-to-Refresh</span>
                        <span className="text-[11px] text-slate-400">Tarik ke bawah untuk memuat ulang warta</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={config.enableHardwareAcceleration}
                        onChange={(e) => setConfig({ ...config, enableHardwareAcceleration: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-700 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Hardware Acceleration</span>
                        <span className="text-[11px] text-slate-400">Rendering 60fps halus &amp; responsif</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={config.safeAreaPadding}
                        onChange={(e) => setConfig({ ...config, safeAreaPadding: e.target.checked })}
                        className="w-4 h-4 text-indigo-600 rounded bg-slate-800 border-slate-700 focus:ring-indigo-500"
                      />
                      <div>
                        <span className="text-xs font-bold text-white block">Safe Area &amp; Notch Safe</span>
                        <span className="text-[11px] text-slate-400">Hindari benturan poni kamera HP</span>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="w-4 h-4 text-emerald-500 rounded bg-slate-800 border-slate-700"
                      />
                      <div>
                        <span className="text-xs font-bold text-emerald-400 block">Dukungan Kamera &amp; Upload</span>
                        <span className="text-[11px] text-slate-400">Upload bukti persembahan &amp; foto</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Phone Mockup Preview */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <div className="w-full max-w-[280px] sm:max-w-[300px] rounded-[40px] p-3.5 bg-slate-950 border-4 border-slate-700 shadow-2xl relative">
                  {/* Phone Notch & Speaker */}
                  <div className="w-28 h-4 bg-slate-800 rounded-b-xl mx-auto mb-2 flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-700"></div>
                    <div className="w-8 h-1 bg-slate-700 rounded-full"></div>
                  </div>

                  {/* Simulated Status Bar */}
                  <div
                    className="rounded-t-2xl px-3 py-1.5 flex items-center justify-between text-[11px] transition-colors"
                    style={{
                      backgroundColor: config.statusBarColor,
                      color: config.statusBarStyle === 'DARK_ICONS' ? '#0f172a' : '#ffffff'
                    }}
                  >
                    <span className="font-semibold">09:41</span>
                    <div className="flex items-center gap-1.5 opacity-90">
                      <Wifi className="w-3 h-3" />
                      <span className="text-[9px] font-bold">4G</span>
                      <Battery className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* App Bar / Top Banner */}
                  <div
                    className="px-3 py-2.5 border-b border-white/10 flex items-center justify-between"
                    style={{ backgroundColor: config.statusBarColor }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-lg bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">
                        ✝
                      </div>
                      <span
                        className="font-bold text-xs truncate max-w-[150px]"
                        style={{ color: config.statusBarStyle === 'DARK_ICONS' ? '#0f172a' : '#ffffff' }}
                      >
                        {config.appName}
                      </span>
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/20 text-white font-mono">
                      Native
                    </span>
                  </div>

                  {/* Simulated WebView Content with Live URL Card */}
                  <div className="h-[360px] bg-slate-900 overflow-hidden flex flex-col justify-between p-3 relative">
                    {/* Simulated Floating Push Notification Banner */}
                    <div className="w-full bg-slate-800/95 border border-amber-500/40 rounded-xl p-2 shadow-lg mb-2 animate-bounce">
                      <div className="flex items-start gap-2">
                        <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
                          <Bell className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-white truncate">Warta Ibadah Minggu</p>
                          <p className="text-[9px] text-slate-300 line-clamp-1">Ibadah dimulai pukul 09.00 WIB. Klik untuk detail...</p>
                        </div>
                      </div>
                    </div>

                    {/* Central Content */}
                    <div className="my-auto text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 mx-auto flex items-center justify-center text-indigo-400">
                        <Globe className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-bold text-white">WebView Active</p>
                      <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto break-all font-mono">
                        {config.webUrl}
                      </p>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-medium border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" />
                        <span>Pull-To-Refresh Siap</span>
                      </div>
                    </div>

                    {/* Bottom simulated navbar */}
                    <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-2 flex items-center justify-around text-slate-400 text-[9px]">
                      <span className="text-indigo-400 font-bold">Warta</span>
                      <span>Renungan</span>
                      <span>Jadwal</span>
                      <span>Profil</span>
                    </div>
                  </div>

                  {/* Simulated Android Navigation Bar */}
                  <div
                    className="rounded-b-2xl py-2 flex items-center justify-center gap-8 text-white/50 text-xs"
                    style={{ backgroundColor: config.navBarColor }}
                  >
                    <span>◀</span>
                    <span className="text-base">●</span>
                    <span>■</span>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2 text-center">
                  Simulasi tampilan antarmuka di layar HP Android jemaat.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: FIREBASE PUSH NOTIFICATIONS (FCM) */}
          {activeTab === 'FIREBASE_FCM' && (
            <div className="space-y-6">
              {/* Banner Info */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-slate-900 to-indigo-950/60 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                    <Bell className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm sm:text-base text-white">
                      Konfigurasi Firebase Cloud Messaging (FCM)
                    </h4>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Kirim pesan warta &amp; renungan langsung ke bilah status (status bar) HP Android jemaat dengan suara dering dan getar secara gratis tanpa batas.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadGoogleServices}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{copiedJson ? 'Terdownload!' : 'Download google-services.json'}</span>
                </button>
              </div>

              {/* Grid: Credentials & FCM Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Identitas Proyek Firebase</span>
                  </h5>

                  <div className="space-y-2.5 text-xs">
                    <div>
                      <span className="text-slate-400 block mb-0.5">Firebase Project ID:</span>
                      <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-emerald-400">
                        {config.projectId}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Messaging Sender ID:</span>
                      <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl font-mono text-indigo-300">
                        {config.senderId}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400 block mb-0.5">Default FCM Topic (Semua Jemaat):</span>
                      <input
                        type="text"
                        value={config.fcmTopic}
                        onChange={(e) => setConfig({ ...config, fcmTopic: e.target.value.replace(/[^a-zA-Z0-9_-]/g, '') })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:border-indigo-500 focus:outline-none"
                        placeholder="all_jemaat"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">
                        Aplikasi Android otomatis mendaftar ke topik ini di background saat pertama kali dibuka.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Server Key & Credentials */}
                <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>FCM Server Key (Untuk Kirim Langsung dari Web)</span>
                  </h5>

                  <div className="space-y-2 text-xs">
                    <label className="text-slate-300 block">
                      Firebase Cloud Messaging Server Key / Key V1:
                    </label>
                    <input
                      type="password"
                      value={testServerKey}
                      onChange={(e) => setTestServerKey(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:border-amber-500 focus:outline-none text-xs"
                      placeholder="AAAA... (Dapatkan dari Firebase Console > Project Settings > Cloud Messaging)"
                    />
                    <p className="text-[11px] text-slate-400">
                      Anda juga dapat mengirim push notifikasi secara visual langsung melalui menu <strong>Firebase Console &gt; Engage &gt; Messaging</strong> tanpa Server Key.
                    </p>
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 text-xs font-semibold mt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Firebase Console</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Form Kirim Tes Push Notifikasi */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Send className="w-4 h-4 text-indigo-400" />
                    <span>Uji Kirim Push Notifikasi ke HP Android (Live Test)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Target Topic: /{config.fcmTopic}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Judul Notifikasi:</label>
                    <input
                      type="text"
                      value={testTitle}
                      onChange={(e) => setTestTitle(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      URL Tujuan Saat Notifikasi Diklik (Deep Link):
                    </label>
                    <input
                      type="text"
                      value={testTargetUrl}
                      onChange={(e) => setTestTargetUrl(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:border-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-slate-300 font-semibold mb-1">Isi Pesan Notifikasi:</label>
                    <textarea
                      rows={2}
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:border-indigo-500 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleSendTestFcm}
                    disabled={isSendingTest}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSendingTest ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    <span>{isSendingTest ? 'Mengirim ke HP...' : 'Kirim Tes Notifikasi Sekarang'}</span>
                  </button>

                  {testResult && (
                    <div
                      className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 border ${
                        testResult.success
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}
                    >
                      {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CODE EXPORT */}
          {activeTab === 'CODE_EXPORT' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-emerald-400" />
                    <span>Source Code Android Studio Lengkap (100% Siap Pakai)</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    File kode di bawah ini sudah dikonfigurasi otomatis dengan URL <code className="text-amber-400">{config.webUrl}</code> dan package name <code className="text-indigo-300">{config.packageName}</code>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyCode(currentCode.code, currentCode.filename)}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedFile === currentCode.filename ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedFile === currentCode.filename ? 'Tersalin!' : `Salin ${currentCode.filename}`}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => downloadFile(currentCode.filename, currentCode.code)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Code File Selector Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs">
                {[
                  { id: 'MAIN_ACTIVITY', label: 'MainActivity.java' },
                  { id: 'FCM_SERVICE', label: 'MyFirebaseMessagingService.java' },
                  { id: 'MANIFEST', label: 'AndroidManifest.xml' },
                  { id: 'APP_GRADLE', label: 'app/build.gradle' },
                  { id: 'PROJECT_GRADLE', label: 'project/build.gradle' },
                  { id: 'ACTIVITY_LAYOUT', label: 'activity_main.xml' },
                  { id: 'COLORS', label: 'colors.xml' },
                  { id: 'STYLES', label: 'styles.xml' }
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSelectedCodeFile(f.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition whitespace-nowrap ${
                      selectedCodeFile === f.id
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Code Viewer Box */}
              <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-inner">
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>{currentCode.filename}</span>
                  <span className="text-[11px] text-slate-500">Android SDK 34 • Java 8+</span>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-[420px] leading-relaxed select-all">
                  {currentCode.code}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: STEP-BY-STEP TUTORIAL */}
          {activeTab === 'GUIDE' && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-500/30 text-xs text-slate-300 space-y-1">
                <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-indigo-400" />
                  <span>Panduan Langkah Demi Langkah Pembuatan di Android Studio</span>
                </h4>
                <p>
                  Ikuti 7 langkah praktis ini untuk menghasilkan file APK dan AAB siap rilis ke Google Play Store dalam hitungan menit.
                </p>
              </div>

              <div className="space-y-4 text-xs">
                {/* Step 1 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">1</span>
                    <h5 className="font-bold text-white text-sm">Buat Project Baru di Android Studio</h5>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-8">
                    <li>Buka aplikasi Android Studio di komputer Anda.</li>
                    <li>Pilih <strong>File &gt; New &gt; New Project</strong>.</li>
                    <li>Pilih template <strong>Empty Views Activity</strong> (atau <em>Empty Activity</em> dengan Java). Lalu klik <strong>Next</strong>.</li>
                    <li>Masukkan Name: <strong className="text-white">{config.appName}</strong></li>
                    <li>Masukkan Package Name: <strong className="text-emerald-400">{config.packageName}</strong></li>
                    <li>Language: <strong>Java</strong>, Minimum SDK: <strong>API 24: Android 7.0 (Nougat)</strong> atau lebih baru.</li>
                    <li>Klik <strong>Finish</strong> dan tunggu Android Studio menyelesaikan build Gradle awal.</li>
                  </ul>
                </div>

                {/* Step 2 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">2</span>
                    <h5 className="font-bold text-white text-sm">Pasang File google-services.json</h5>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-8">
                    <li>Klik tombol <strong>"Download google-services.json"</strong> di Tab 2 di atas.</li>
                    <li>Di Android Studio, ubah tampilan panel kiri dari <em>Android</em> menjadi <strong>Project</strong>.</li>
                    <li>Salin/Drag file <code className="text-amber-400">google-services.json</code> langsung ke dalam folder <code className="text-indigo-300">app/</code> (sejajar dengan <code>build.gradle</code> di dalam folder app).</li>
                  </ul>
                </div>

                {/* Step 3 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">3</span>
                    <h5 className="font-bold text-white text-sm">Konfigurasi Gradle &amp; Sync</h5>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-8">
                    <li>Buka file <code className="text-indigo-300">build.gradle</code> (Project Level), ganti isinya dengan kode dari Tab 3.</li>
                    <li>Buka file <code className="text-indigo-300">app/build.gradle</code>, ganti isinya dengan kode dari Tab 3.</li>
                    <li>Klik tombol <strong>"Sync Now"</strong> yang muncul di bilah atas Android Studio.</li>
                  </ul>
                </div>

                {/* Step 4 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">4</span>
                    <h5 className="font-bold text-white text-sm">Salin Kode Java &amp; Layout XML</h5>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-8">
                    <li>Buka <code className="text-emerald-400">MainActivity.java</code>, timpa isinya dengan kode Tab 3.</li>
                    <li>Buat Java Class baru bernama <code className="text-emerald-400">MyFirebaseMessagingService.java</code> di folder yang sama, lalu salin kodenya.</li>
                    <li>Buka <code className="text-amber-400">AndroidManifest.xml</code>, salin isinya dari Tab 3.</li>
                    <li>Buka <code className="text-cyan-400">res/layout/activity_main.xml</code>, salin layout WebView &amp; SwipeRefresh.</li>
                    <li>Buka <code className="text-indigo-300">res/values/colors.xml</code> &amp; <code className="text-indigo-300">styles.xml</code>, sesuaikan temanya.</li>
                  </ul>
                </div>

                {/* Step 5 */}
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">5</span>
                    <h5 className="font-bold text-white text-sm">Uji Coba &amp; Build APK / AAB Play Store</h5>
                  </div>
                  <ul className="list-disc list-inside text-slate-300 space-y-1 ml-8">
                    <li>Hubungkan HP Android Anda via kabel USB dan aktifkan <em>USB Debugging</em>, lalu klik tombol hijau <strong>Run 'app'</strong>.</li>
                    <li>Aplikasi akan otomatis terinstall di HP, membuka <code className="text-amber-400">{config.webUrl}</code> secara penuh dengan status bar elegan!</li>
                    <li>Untuk membuat file APK/AAB rilis: Klik menu <strong>Build &gt; Generate Signed Bundle / APK</strong>, pilih <em>Android App Bundle</em>, buat keystore, dan selesai!</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Target Web: <strong>https://tntimbu.github.io/jesuskingdomchrist/</strong></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
