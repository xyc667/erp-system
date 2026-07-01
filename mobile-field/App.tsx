import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/context/AuthContext'
import AppNavigator from './src/navigation/AppNavigator'
import VersionGate from './src/components/VersionGate'

export default function App() {
  return (
    <SafeAreaProvider>
      <VersionGate>
        <AuthProvider>
          <AppNavigator />
          <StatusBar style="light" />
        </AuthProvider>
      </VersionGate>
    </SafeAreaProvider>
  )
}
