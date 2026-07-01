import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import type { AppNotification } from '../types/api'

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function NotificationsScreen() {
  const [items, setItems] = useState<AppNotification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [list, count] = await Promise.all([getNotifications(), getUnreadCount()])
      setItems(list)
      setUnread(count)
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

  const handleRead = async (item: AppNotification) => {
    if (!item.read) {
      await markNotificationRead(item.id)
      load(true)
    }
  }

  const handleMarkAll = async () => {
    await markAllNotificationsRead()
    load(true)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.unread}>未读 {unread}</Text>
        {unread > 0 ? (
          <TouchableOpacity onPress={handleMarkAll}>
            <Text style={styles.markAll}>全部已读</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a365d" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                load(true)
              }}
            />
          }
          ListEmptyComponent={<Text style={styles.empty}>暂无消息</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.unreadCard]}
              onPress={() => handleRead(item)}
            >
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  unread: { fontSize: 14, fontWeight: '600', color: '#2b6cb0' },
  markAll: { color: '#1a365d', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: '#a0aec0', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  unreadCard: { borderColor: '#bee3f8', backgroundColor: '#ebf8ff' },
  title: { fontSize: 15, fontWeight: '600', color: '#1a202c' },
  message: { fontSize: 14, color: '#4a5568', marginTop: 6, lineHeight: 20 },
  time: { fontSize: 12, color: '#a0aec0', marginTop: 8 },
})
