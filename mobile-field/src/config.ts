import Constants from 'expo-constants'

export const API_URL =
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  process.env.EXPO_PUBLIC_API_URL ??
  'http://10.0.2.2:3001/api'

export const MAX_RECORDING_BYTES = 10 * 1024 * 1024
