import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { useAuth } from '../context/AuthContext'
import OfflineBanner from '../components/OfflineBanner'
import { useOfflineSync } from '../hooks/useOfflineSync'
import { usePermissions } from '../hooks/usePermissions'
import LoginScreen from '../screens/LoginScreen'
import PoolScreen from '../screens/PoolScreen'
import MineScreen from '../screens/MineScreen'
import MyReportsScreen from '../screens/MyReportsScreen'
import ReviewReportsScreen from '../screens/ReviewReportsScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import ReportScreen from '../screens/ReportScreen'
import type { MainTabParamList, RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<MainTabParamList>()

function HeaderRight({ name, onLogout }: { name?: string; onLogout: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
      <Text style={{ color: '#fff', marginRight: 12, fontSize: 13 }}>{name}</Text>
      <TouchableOpacity onPress={onLogout}>
        <Text style={{ color: '#bee3f8', fontSize: 13 }}>退出</Text>
      </TouchableOpacity>
    </View>
  )
}

function MainTabs() {
  const { user, signOut } = useAuth()
  const { canReview, canReport } = usePermissions()
  useOfflineSync()

  const headerRight = () => <HeaderRight name={user?.name} onLogout={signOut} />

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Tab.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#1a365d' },
          headerTintColor: '#fff',
          tabBarActiveTintColor: '#1a365d',
        }}
      >
        <Tab.Screen
          name="Pool"
          component={PoolScreen}
          options={{ title: '公海', headerRight }}
        />
        <Tab.Screen
          name="Mine"
          component={MineScreen}
          options={{ title: '我的线索', headerRight }}
        />
        {canReport ? (
          <Tab.Screen
            name="MyReports"
            component={MyReportsScreen}
            options={{ title: '我的上报', headerRight }}
          />
        ) : null}
        {canReview ? (
          <Tab.Screen
            name="Review"
            component={ReviewReportsScreen}
            options={{ title: '上报审核', headerRight }}
          />
        ) : null}
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{ title: '消息', headerRight }}
        />
      </Tab.Navigator>
    </View>
  )
}

export default function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#1a365d" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen
              name="Report"
              component={ReportScreen}
              options={{
                headerShown: true,
                title: '联系上报',
                headerStyle: { backgroundColor: '#1a365d' },
                headerTintColor: '#fff',
                presentation: 'card',
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}
