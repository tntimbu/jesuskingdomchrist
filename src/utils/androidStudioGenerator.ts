/**
 * Android Studio Project Generator & Helper for Jesus Kingdom Christ / GKFC
 * Generates production-ready Java/XML source files for WebView + Firebase Cloud Messaging.
 */

export interface AndroidStudioConfig {
  webUrl: string;
  appName: string;
  packageName: string;
  statusBarColor: string;
  statusBarStyle: 'DARK_ICONS' | 'LIGHT_ICONS';
  navBarColor: string;
  enablePullToRefresh: boolean;
  enableHardwareAcceleration: boolean;
  enableFullscreen: boolean;
  safeAreaPadding: boolean;
  splashBgColor: string;
  splashDurationMs: number;
  userAgentSuffix: string;
  fcmTopic: string;
  senderId: string;
  projectId: string;
}

export const DEFAULT_ANDROID_CONFIG: AndroidStudioConfig = {
  webUrl: 'https://tntimbu.github.io/jesuskingdomchrist/',
  appName: 'Jesus Kingdom Christ',
  packageName: 'com.jesuskingdomchrist.app',
  statusBarColor: '#0f172a',
  statusBarStyle: 'LIGHT_ICONS',
  navBarColor: '#0f172a',
  enablePullToRefresh: true,
  enableHardwareAcceleration: true,
  enableFullscreen: false,
  safeAreaPadding: true,
  splashBgColor: '#0f172a',
  splashDurationMs: 1500,
  userAgentSuffix: 'JesusKingdomChrist-AndroidApp/1.0',
  fcmTopic: 'all_jemaat',
  senderId: '248780279971',
  projectId: 'gen-lang-client-0499830391'
};

/**
 * Generates MainActivity.java
 */
export function generateMainActivityJava(config: AndroidStudioConfig): string {
  const isLightStatusBar = config.statusBarStyle === 'DARK_ICONS';
  return `package ${config.packageName};

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.Window;
import android.view.WindowManager;
import android.webkit.ConsoleMessage;
import android.webkit.CookieManager;
import android.webkit.DownloadListener;
import android.webkit.GeolocationPermissions;
import android.webkit.PermissionRequest;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.ProgressBar;
import android.widget.Toast;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout;

import com.google.firebase.messaging.FirebaseMessaging;

public class MainActivity extends AppCompatActivity {

    public static final String TARGET_URL = "${config.webUrl}";
    public static final String FCM_TOPIC = "${config.fcmTopic}";
    private static final int FILE_CHOOSER_REQUEST_CODE = 1001;
    private static final int PERMISSION_REQUEST_CODE = 2002;

    private WebView mWebView;
    private SwipeRefreshLayout mSwipeRefreshLayout;
    private ProgressBar mProgressBar;
    private ValueCallback<Uri[]> mFilePathCallback;
    private boolean doubleBackToExitPressedOnce = false;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure Professional Window & Status Bar
        setupProfessionalWindowAppearance();

        setContentView(R.layout.activity_main);

        mWebView = findViewById(R.id.webView);
        mSwipeRefreshLayout = findViewById(R.id.swipeRefreshLayout);
        mProgressBar = findViewById(R.id.progressBar);

        // 1. Initialize Firebase Cloud Messaging Topic Subscription
        setupFirebaseMessaging();

        // 2. Configure Native WebView Settings
        configureWebViewSettings();

        // 3. Configure Clients (WebChromeClient & WebViewClient)
        configureWebViewClients();

        // 4. Configure Pull-To-Refresh
        configureSwipeRefresh();

        // 5. Handle Hardware Back Press
        setupBackNavigation();

        // 6. Request Notification Permission for Android 13+ (Tiramisu)
        requestNotificationPermissionIfNeeded();

        // 7. Load Target URL (or check Deep Link from FCM Notification)
        handleIntentUrl(getIntent());
    }

    private void setupProfessionalWindowAppearance() {
        Window window = getWindow();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(Color.parseColor("${config.statusBarColor}"));
            window.setNavigationBarColor(Color.parseColor("${config.navBarColor}"));
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            View decor = window.getDecorView();
            int flags = decor.getSystemUiVisibility();
            ${isLightStatusBar ? 'flags |= View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;' : 'flags &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;'}
            decor.setSystemUiVisibility(flags);
        }
    }

    private void setupFirebaseMessaging() {
        // Subscribe this device to general church announcement topic
        FirebaseMessaging.getInstance().subscribeToTopic(FCM_TOPIC)
            .addOnCompleteListener(task -> {
                if (task.isSuccessful()) {
                    // Successfully subscribed to church push notifications
                }
            });
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebViewSettings() {
        WebSettings settings = mWebView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setGeolocationEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);

        // Custom User Agent to detect Android App wrapper
        String defaultUa = settings.getUserAgentString();
        settings.setUserAgentString(defaultUa + " ${config.userAgentSuffix}");

        // Enable Cookies
        CookieManager.getInstance().setAcceptCookie(true);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            CookieManager.getInstance().setAcceptThirdPartyCookies(mWebView, true);
        }

        // Download Listener
        mWebView.setDownloadListener(new DownloadListener() {
            @Override
            public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                Intent i = new Intent(Intent.ACTION_VIEW);
                i.setData(Uri.parse(url));
                startActivity(i);
            }
        });
    }

    private void configureWebViewClients() {
        mWebView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                super.onPageFinished(view, url);
                mProgressBar.setVisibility(View.GONE);
                ${config.enablePullToRefresh ? 'mSwipeRefreshLayout.setRefreshing(false);' : ''}
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                super.onReceivedError(view, request, error);
                if (request.isForMainFrame()) {
                    mProgressBar.setVisibility(View.GONE);
                    ${config.enablePullToRefresh ? 'mSwipeRefreshLayout.setRefreshing(false);' : ''}
                }
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();
                // Open external links (WhatsApp, Phone, Maps, YouTube) in external apps
                if (url.startsWith("tel:") || url.startsWith("whatsapp:") || url.startsWith("mailto:") || url.contains("maps.google") || url.contains("wa.me")) {
                    try {
                        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                        startActivity(intent);
                        return true;
                    } catch (Exception e) {
                        return false;
                    }
                }
                return false;
            }
        });

        mWebView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress < 100) {
                    mProgressBar.setVisibility(View.VISIBLE);
                    mProgressBar.setProgress(newProgress);
                } else {
                    mProgressBar.setVisibility(View.GONE);
                }
            }

            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                callback.invoke(origin, true, false);
            }

            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                    request.grant(request.getResources());
                }
            }

            // File Chooser for Photo, Camera, & Documents Upload (e.g. Bukti Persembahan)
            @Override
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> filePathCallback, FileChooserParams fileChooserParams) {
                if (mFilePathCallback != null) {
                    mFilePathCallback.onReceiveValue(null);
                }
                mFilePathCallback = filePathCallback;

                Intent intent = fileChooserParams.createIntent();
                try {
                    startActivityForResult(intent, FILE_CHOOSER_REQUEST_CODE);
                } catch (Exception e) {
                    mFilePathCallback = null;
                    return false;
                }
                return true;
            }
        });
    }

    private void configureSwipeRefresh() {
        ${config.enablePullToRefresh ? `
        mSwipeRefreshLayout.setColorSchemeColors(Color.parseColor("${config.statusBarColor}"), Color.parseColor("#4f46e5"), Color.parseColor("#10b981"));
        mSwipeRefreshLayout.setOnRefreshListener(() -> mWebView.reload());
        ` : `
        mSwipeRefreshLayout.setEnabled(false);
        `}
    }

    private void setupBackNavigation() {
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                if (mWebView.canGoBack()) {
                    mWebView.goBack();
                } else {
                    if (doubleBackToExitPressedOnce) {
                        finish();
                        return;
                    }
                    doubleBackToExitPressedOnce = true;
                    Toast.makeText(MainActivity.this, "Tekan sekali lagi untuk keluar", Toast.LENGTH_SHORT).show();
                    new Handler(Looper.getMainLooper()).postDelayed(() -> doubleBackToExitPressedOnce = false, 2000);
                }
            }
        });
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
                ActivityCompat.requestPermissions(this, new String[]{Manifest.permission.POST_NOTIFICATIONS}, PERMISSION_REQUEST_CODE);
            }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntentUrl(intent);
    }

    private void handleIntentUrl(Intent intent) {
        String targetUrl = TARGET_URL;
        if (intent != null && intent.hasExtra("target_url")) {
            String deepUrl = intent.getStringExtra("target_url");
            if (deepUrl != null && !deepUrl.trim().isEmpty()) {
                targetUrl = deepUrl;
            }
        }
        mWebView.loadUrl(targetUrl);
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, @Nullable Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode == FILE_CHOOSER_REQUEST_CODE) {
            if (mFilePathCallback != null) {
                Uri[] results = null;
                if (resultCode == Activity.RESULT_OK && data != null) {
                    if (data.getData() != null) {
                        results = new Uri[]{data.getData()};
                    } else if (data.getClipData() != null) {
                        int count = data.getClipData().getItemCount();
                        results = new Uri[count];
                        for (int i = 0; i < count; i++) {
                            results[i] = data.getClipData().getItemAt(i).getUri();
                        }
                    }
                }
                mFilePathCallback.onReceiveValue(results);
                mFilePathCallback = null;
            }
        }
    }
}
`;
}

/**
 * Generates MyFirebaseMessagingService.java
 */
export function generateFirebaseMessagingServiceJava(config: AndroidStudioConfig): string {
  return `package ${config.packageName};

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.BitmapFactory;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;

public class MyFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "ChurchFCM";
    public static final String CHANNEL_ID = "church_announcements_channel";
    public static final String CHANNEL_NAME = "Warta & Pengumuman Gereja";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New Firebase Registration Token: " + token);
        // You may forward this token to your church backend server if user-specific targeting is needed.
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        String title = "${config.appName}";
        String body = "Ada pembaruan warta & renungan baru.";
        String targetUrl = "${config.webUrl}";

        // 1. Extract from Notification payload (if sent via Firebase Console)
        if (remoteMessage.getNotification() != null) {
            if (remoteMessage.getNotification().getTitle() != null) {
                title = remoteMessage.getNotification().getTitle();
            }
            if (remoteMessage.getNotification().getBody() != null) {
                body = remoteMessage.getNotification().getBody();
            }
        }

        // 2. Extract from Data payload (recommended for deep links)
        Map<String, String> data = remoteMessage.getData();
        if (data != null && !data.isEmpty()) {
            if (data.containsKey("title")) {
                title = data.get("title");
            }
            if (data.containsKey("body") || data.containsKey("message")) {
                body = data.containsKey("body") ? data.get("body") : data.get("message");
            }
            if (data.containsKey("url") || data.containsKey("target_url")) {
                targetUrl = data.containsKey("url") ? data.get("url") : data.get("target_url");
            }
        }

        sendNotification(title, body, targetUrl);
    }

    private void sendNotification(String title, String messageBody, String targetUrl) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.putExtra("target_url", targetUrl);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);

        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent pendingIntent = PendingIntent.getActivity(this, (int) System.currentTimeMillis(), intent, flags);

        Uri defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);

        NotificationCompat.Builder notificationBuilder =
                new NotificationCompat.Builder(this, CHANNEL_ID)
                        .setSmallIcon(R.drawable.ic_notification)
                        .setLargeIcon(BitmapFactory.decodeResource(getResources(), R.mipmap.ic_launcher))
                        .setContentTitle(title)
                        .setContentText(messageBody)
                        .setAutoCancel(true)
                        .setSound(defaultSoundUri)
                        .setVibrate(new long[]{0, 300, 200, 300})
                        .setPriority(NotificationCompat.PRIORITY_HIGH)
                        .setColor(Color.parseColor("${config.statusBarColor}"))
                        .setContentIntent(pendingIntent);

        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        // Since android Oreo notification channel is needed.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    CHANNEL_NAME,
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Saluran notifikasi untuk info ibadah, renungan harian, dan pengumuman gereja");
            channel.enableLights(true);
            channel.setLightColor(Color.parseColor("${config.statusBarColor}"));
            channel.enableVibration(true);
            notificationManager.createNotificationChannel(channel);
        }

        notificationManager.notify((int) System.currentTimeMillis(), notificationBuilder.build());
    }
}
`;
}

/**
 * Generates AndroidManifest.xml
 */
export function generateAndroidManifestXml(config: AndroidStudioConfig): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${config.packageName}">

    <!-- Network & Push Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />

    <!-- File Upload, Media & Camera Permissions -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

    <!-- Location for Church Maps -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="${config.appName}"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.JesusKingdomChrist"
        android:usesCleartextTraffic="true"
        ${config.enableHardwareAcceleration ? 'android:hardwareAccelerated="true"' : ''}>

        <!-- Main WebView Activity -->
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout"
            android:windowSoftInputMode="adjustResize">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Firebase Cloud Messaging Service -->
        <service
            android:name=".MyFirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

        <!-- Default Notification Icon & Color -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@drawable/ic_notification" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/statusBarColor" />
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="church_announcements_channel" />

    </application>

</manifest>
`;
}

/**
 * Generates app/build.gradle
 */
export function generateAppBuildGradle(config: AndroidStudioConfig): string {
  return `plugins {
    id 'com.android.application'
    id 'com.google.gms.google-services'
}

android {
    namespace '${config.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${config.packageName}"
        minSdk 24
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'com.google.android.material:material:1.12.0'
    implementation 'androidx.constraintlayout:constraintlayout:2.2.0'
    implementation 'androidx.swiperefreshlayout:swiperefreshlayout:1.1.0'

    // Firebase Cloud Messaging (FCM)
    implementation platform('com.google.firebase:firebase-bom:33.7.0')
    implementation 'com.google.firebase:firebase-messaging'
    implementation 'com.google.firebase:firebase-analytics'
}
`;
}

/**
 * Generates project-level build.gradle
 */
export function generateProjectBuildGradle(): string {
  return `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.4.1'
        classpath 'com.google.gms:google-services:4.4.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

task clean(type: Delete) {
    delete rootProject.buildDir
}
`;
}

/**
 * Generates res/layout/activity_main.xml
 */
export function generateActivityMainXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    android:background="#0f172a"
    tools:context=".MainActivity">

    <ProgressBar
        android:id="@+id/progressBar"
        style="?android:attr/progressBarStyleHorizontal"
        android:layout_width="match_parent"
        android:layout_height="3dp"
        android:indeterminate="false"
        android:max="100"
        android:progress="0"
        android:progressBackgroundTint="#334155"
        android:progressTint="#6366f1"
        android:visibility="gone"
        app:layout_constraintTop_toTopOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent" />

    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipeRefreshLayout"
        android:layout_width="match_parent"
        android:layout_height="0dp"
        app:layout_constraintTop_toBottomOf="@id/progressBar"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintEnd_toEndOf="parent">

        <WebView
            android:id="@+id/webView"
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:scrollbars="none" />

    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

</androidx.constraintlayout.widget.ConstraintLayout>
`;
}

/**
 * Generates res/values/colors.xml
 */
export function generateColorsXml(config: AndroidStudioConfig): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="statusBarColor">${config.statusBarColor}</color>
    <color name="navBarColor">${config.navBarColor}</color>
    <color name="primaryColor">#4f46e5</color>
    <color name="primaryDarkColor">#3730a3</color>
    <color name="accentColor">#f59e0b</color>
    <color name="splashBackground">${config.splashBgColor}</color>
</resources>
`;
}

/**
 * Generates res/values/styles.xml
 */
export function generateStylesXml(config: AndroidStudioConfig): string {
  const isLightStatusBar = config.statusBarStyle === 'DARK_ICONS';
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.JesusKingdomChrist" parent="Theme.MaterialComponents.DayNight.NoActionBar">
        <!-- Status bar color. -->
        <item name="android:statusBarColor">@color/statusBarColor</item>
        <item name="android:navigationBarColor">@color/navBarColor</item>
        <item name="android:windowLightStatusBar">${isLightStatusBar}</item>
        <item name="android:windowBackground">@color/splashBackground</item>
    </style>
</resources>
`;
}

/**
 * Generates drawable/ic_notification.xml (Small monochrome notification bell icon)
 */
export function generateNotificationIconXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="24dp"
    android:height="24dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
  <path
      android:fillColor="#FFFFFFFF"
      android:pathData="M18,16v-5c0,-3.07 -1.63,-5.64 -4.5,-6.32V4c0,-0.83 -0.67,-1.5 -1.5,-1.5s-1.5,0.67 -1.5,1.5v0.68C7.64,5.36 6,7.92 6,11v5l-2,2v1h16v-1l-2,-2zM12,22c1.1,0 2,-0.9 2,-2h-4c0,1.1 0.9,2 2,2z"/>
</vector>
`;
}

/**
 * Helper to trigger downloading any plain text code file in browser
 */
export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain'): void {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error(`Failed to download ${filename}:`, err);
  }
}
