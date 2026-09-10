import { triggerStatusBarNotification, playNotificationChimeSound } from './firebaseMessaging';
import { AppSettings } from '../types';

export interface PushNotificationPayload {
  title: string;
  message: string;
  url?: string;
  data?: Record<string, any>;
}

export interface PushNotificationResult {
  success: boolean;
  recipients?: number;
  id?: string;
  error?: string;
  method?: 'onesignal' | 'local_sw' | 'none';
}

/**
 * Sends a Push Notification via OneSignal REST API to all subscribed devices
 * (including Android APK built with Website 2 APK Builder when the app is completely CLOSED)
 */
export async function sendOneSignalPushNotification(
  appId: string,
  restApiKey: string,
  payload: PushNotificationPayload
): Promise<PushNotificationResult> {
  if (!appId || !appId.trim()) {
    return {
      success: false,
      error: 'OneSignal App ID belum dikonfigurasi. Silakan masukkan di menu Pengaturan > Notifikasi HP.'
    };
  }

  const cleanAppId = appId.trim();
  const cleanKey = restApiKey ? restApiKey.trim() : '';

  try {
    const bodyPayload: Record<string, any> = {
      app_id: cleanAppId,
      included_segments: ['All', 'Subscribed Users', 'Total Subscriptions'],
      headings: {
        en: payload.title,
        id: payload.title
      },
      contents: {
        en: payload.message,
        id: payload.message
      },
      url: payload.url || window.location.origin,
      small_icon: 'ic_stat_onesignal_default',
      large_icon: 'https://images.unsplash.com/photo-1548625361-185966347898?w=192&auto=format&fit=crop&q=80',
      android_accent_color: 'FF6366F1', // Indigo
      android_visibility: 1,
      priority: 10,
      data: {
        ...(payload.data || {}),
        timestamp: new Date().toISOString(),
        source: 'gkfc_cms_pro'
      }
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=utf-8'
    };

    if (cleanKey) {
      headers['Authorization'] = `Basic ${cleanKey}`;
    }

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyPayload)
    });

    const resJson = await response.json();

    if (response.ok && !resJson.errors) {
      console.log('[OneSignal] Push sent successfully:', resJson);
      return {
        success: true,
        recipients: resJson.recipients || 1,
        id: resJson.id,
        method: 'onesignal'
      };
    } else {
      console.warn('[OneSignal] Push response error:', resJson);
      const errMsg = Array.isArray(resJson.errors)
        ? resJson.errors.join(', ')
        : typeof resJson.errors === 'string'
        ? resJson.errors
        : resJson.message || 'Gagal mengirim push notification via OneSignal API';
      return {
        success: false,
        error: errMsg,
        method: 'onesignal'
      };
    }
  } catch (err: any) {
    console.error('[OneSignal] Network or execution error:', err);
    return {
      success: false,
      error: err.message || 'Gagal menghubungi server OneSignal API',
      method: 'onesignal'
    };
  }
}

/**
 * Broadcasts an Announcement to all church members:
 * 1. Pushes to Android APK status bar via OneSignal (works even when app is closed)
 * 2. Triggers active browser/webview Service Worker notification & double chime bell sound
 */
export async function broadcastChurchAnnouncement(
  settings: AppSettings,
  title: string,
  message: string,
  targetUrl: string = '/'
): Promise<PushNotificationResult> {
  // Always trigger sound chime immediately
  playNotificationChimeSound();

  // Local status bar notification for active browser/devices
  try {
    await triggerStatusBarNotification(title, message, targetUrl);
  } catch (e) {
    console.warn('[Push] Local status bar notification error:', e);
  }

  // Check if OneSignal is enabled and configured
  const appId = settings.onesignal_app_id;
  const restApiKey = settings.onesignal_rest_api_key;

  if (settings.onesignal_enabled !== false && appId && appId.trim()) {
    const result = await sendOneSignalPushNotification(appId, restApiKey || '', {
      title,
      message,
      url: targetUrl
    });
    return result;
  }

  return {
    success: true,
    method: 'local_sw',
    recipients: 1
  };
}

/**
 * Initializes OneSignal Web SDK in browser if configured
 */
export function initOneSignalWebSDK(appId?: string): void {
  if (typeof window === 'undefined' || !appId || !appId.trim()) return;

  try {
    const existing = document.getElementById('onesignal-sdk-script');
    if (!existing) {
      const script = document.createElement('script');
      script.id = 'onesignal-sdk-script';
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.defer = true;
      document.head.appendChild(script);

      (window as any).OneSignalDeferred = (window as any).OneSignalDeferred || [];
      (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
        await OneSignal.init({
          appId: appId.trim(),
          notifyButton: {
            enable: false
          },
          allowLocalhostAsSecureOrigin: true
        });
        console.log('[OneSignal] Web SDK initialized successfully');
      });
    }
  } catch (err) {
    console.warn('[OneSignal] Web SDK init error:', err);
  }
}
