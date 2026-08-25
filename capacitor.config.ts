import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gh0st.okulpaneli',
  appName: 'Aurora',
  webDir: 'apk-loader',
  server: {
    // http şeması: https://localhost'tan http://<j7-ip>'ye istek "mixed content" sayılıp engellenmesin
    androidScheme: 'http',
    // Giriş ekranından yazılan http://<j7-ip>:8788 adresine uygulama içinde kalarak geç
    cleartext: true,
    allowNavigation: ['*'],
  },
  android: {
    // chrome://inspect ile hata ayıklama (debug APK)
    webContentsDebuggingEnabled: true,
  },
};

export default config;
