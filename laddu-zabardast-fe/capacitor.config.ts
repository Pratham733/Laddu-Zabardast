import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ladduzabardast.app',
  appName: 'Laddu Zabardast',
  webDir: 'dist-mobile',
  android: {
    path: '../laddu-zabardast-mobile/android',
    allowMixedContent: process.env.MOBILE_ALLOW_HTTP === "1",
  },
  ios: {
    path: '../laddu-zabardast-mobile/ios',
    contentInset: 'always',
  },
  server: { androidScheme: 'https' },
  plugins: {
    CapacitorHttp: { enabled: true },
    SystemBars: { insetsHandling: 'native', style: 'DEFAULT' },
    SplashScreen: { launchAutoHide: true, launchShowDuration: 500, backgroundColor: '#ea580c' },
  },
};
export default config;
