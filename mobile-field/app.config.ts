import type { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'ERP 外勤',
  slug: 'erp-field',
  version: '1.1.1',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  scheme: 'erp-field',
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:3001/api',
  },
  ios: {
    bundleIdentifier: 'com.erp.field',
    buildNumber: '1',
    supportsTablet: false,
    infoPlist: {
      // 内网联调 HTTP；生产环境建议改 HTTPS 并移除此项
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: true,
      },
      LSApplicationQueriesSchemes: ['maps', 'comgooglemaps'],
    },
  },
  android: {
    package: 'com.erp.field',
    versionCode: 5,
    adaptiveIcon: {
      backgroundColor: '#1a365d',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    permissions: ['INTERNET'],
  },
  plugins: [
    'expo-secure-store',
    '@react-native-community/datetimepicker',
    [
      'expo-build-properties',
      {
        android: {
          usesCleartextTraffic: true,
          buildToolsVersion: '37.0.0',
        },
        ios: {
          deploymentTarget: '16.4',
        },
      },
    ],
  ],
})
