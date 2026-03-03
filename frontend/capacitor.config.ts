import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.luma',
  appName: 'Luma',
  webDir: 'dist',
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#FDFBF7",
      showSpinner: false,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP"
    },
    Keyboard: {
      resize: "body",
      style: "light"
    },
    StatusBar: {
      style: "LIGHT",
      overlaysWebView: true
    }
  },
  server: {
    androidScheme: 'http',
    cleartext: true
  }
};

export default config;
