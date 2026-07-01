import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import type { CompositeNavigationProp } from '@react-navigation/native'
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import LeadCard from '../components/LeadCard'
import { getMine } from '../api/leads'
import type { Lead } from '../types/api'
import type { MainTabParamList, RootStackParamList } from '../navigation/types'
import { openMapNavigation } from '../utils/openMapNavigation'

type MineNav = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Mine'>,
  NativeStackNavigationProp<RootStackParamList>
>

function daysLeft(expireAt?: string) {
  if (!expireAt) return null
  return Math.ceil((new Date(expireAt).getTime() - Date.now()) / 86400000)
}

export default function MineScreen() {
  const navigation = useNavigation<MineNav>()
  const [items, setItems] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await getMine({ page: 1, pageSize: 50 })
      setItems(res.items)
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请检查网络')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const callPhone = (phone?: string) => {
    if (!phone) return
    Linking.openURL(`tel:${phone}`)
  }

  return (
    <View style={styles.container}>
      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a365d" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} />
          }
          ListEmptyComponent={<Text style={styles.empty}>暂无线索，请从公海领取</Text>}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              showReport
              showNavigate
              daysLeft={daysLeft(item.expireAt)}
              onCall={() => callPhone(item.phone)}
              onReport={() => navigation.navigate('Report', { lead: item })}
              onNavigate={() => openMapNavigation(item)}
            />
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: '#a0aec0', marginTop: 40 },
})
