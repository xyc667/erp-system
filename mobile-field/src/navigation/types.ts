import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import type { Lead } from '../types/api'

export type RootStackParamList = {
  Login: undefined
  Main: undefined
  Report: { lead: Lead }
}

export type MainTabParamList = {
  Pool: undefined
  Mine: undefined
  MyReports: undefined
  Review: undefined
  Notifications: undefined
}

export type ReportScreenProps = NativeStackScreenProps<RootStackParamList, 'Report'>
