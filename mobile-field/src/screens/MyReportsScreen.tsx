import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import { getMyContactReports, getRecordingUrl } from '../api/leads'
import {
  CONTACT_RESULT_LABELS,
  FOLLOW_TYPES,
  type ContactResult,
} from '../constants/contactResults'
import { REVIEW_STATUS_COLORS, REVIEW_STATUS_LABELS } from '../constants/reviewStatus'
import type { ContactReport } from '../types/api'
import { canNavigateToLead, openMapNavigation } from '../utils/openMapNavigation'

const FOLLOW_TYPE_MAP = Object.fromEntries(FOLLOW_TYPES.map((t) => [t.value, t.label]))

function formatTime(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function ReportCard({ item }: { item: ContactReport }) {
  const lead = item.lead
  const status = item.reviewStatus ?? 'pending'
  const statusColor = REVIEW_STATUS_COLORS[status] ?? '#718096'
  const resultLabel =
    item.result && item.result in CONTACT_RESULT_LABELS
      ? CONTACT_RESULT_LABELS[item.result as ContactResult]
      : item.result ?? '—'

  const handleNavigate = () => {
    if (!lead) {
      Alert.alert('无法导航', '线索信息缺失')
      return
    }
    if (!canNavigateToLead(lead)) {
      Alert.alert('无法导航', '该线索暂无地址或坐标')
      return
    }
    openMapNavigation({ ...lead, name: lead.name })
  }

  const playRecording = async () => {
    try {
      const res = await getRecordingUrl(item.id)
      if (res.url) await Linking.openURL(res.url)
      else Alert.alert('提示', '录音暂不可用')
    } catch {
      Alert.alert('播放失败', '无法获取录音地址')
    }
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.leadName} numberOfLines={1}>
          {lead?.name ?? '未知线索'}
        </Text>
        <Text style={[styles.statusBadge, { color: statusColor }]}>
          {REVIEW_STATUS_LABELS[status] ?? status}
        </Text>
      </View>
      <Text style={styles.meta}>
        {formatTime(item.createdAt)} · {FOLLOW_TYPE_MAP[item.type] ?? item.type} · {resultLabel}
      </Text>
      <Text style={styles.content} numberOfLines={3}>
        {item.content}
      </Text>
      {item.reviewStatus === 'rejected' && item.reviewComment ? (
        <Text style={styles.rejectReason}>驳回原因：{item.reviewComment}</Text>
      ) : null}
      {item.recordingFile ? (
        <TouchableOpacity onPress={playRecording}>
          <Text style={styles.recordingTag}>▶ 播放录音：{item.recordingFile.fileName}</Text>
        </TouchableOpacity>
      ) : null}
      {item.nextActionAt ? (
        <Text style={styles.nextAction}>下次联系：{formatTime(item.nextActionAt)}</Text>
      ) : null}
      {lead && canNavigateToLead(lead) ? (
        <TouchableOpacity style={styles.navBtn} onPress={handleNavigate}>
          <Text style={styles.navBtnText}>地图导航到店</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  )
}

export default function MyReportsScreen() {
  const [items, setItems] = useState<ContactReport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [reviewStatus, setReviewStatus] = useState('')

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true)
      try {
        const res = await getMyContactReports({
          reviewStatus: reviewStatus || undefined,
          page: 1,
          pageSize: 50,
        })
        setItems(res.items)
      } catch (e) {
        Alert.alert('加载失败', e instanceof Error ? e.message : '请检查网络')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [reviewStatus],
  )

  useEffect(() => {
    load()
  }, [load])

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <View style={styles.pickerWrap}>
          <Picker selectedValue={reviewStatus} onValueChange={setReviewStatus}>
            <Picker.Item label="全部状态" value="" />
            <Picker.Item label="待审核" value="pending" />
            <Picker.Item label="已通过" value="approved" />
            <Picker.Item label="已驳回" value="rejected" />
          </Picker>
        </View>
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
          ListEmptyComponent={<Text style={styles.empty}>暂无上报记录</Text>}
          renderItem={({ item }) => <ReportCard item={item} />}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  pickerWrap: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: '#a0aec0', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  leadName: { flex: 1, fontSize: 17, fontWeight: '600', color: '#1a202c' },
  statusBadge: { fontSize: 13, fontWeight: '700' },
  meta: { fontSize: 12, color: '#718096', marginTop: 6, marginBottom: 8 },
  content: { fontSize: 14, color: '#4a5568', lineHeight: 20 },
  rejectReason: { fontSize: 13, color: '#c53030', marginTop: 8 },
  recordingTag: { fontSize: 12, color: '#2b6cb0', marginTop: 8 },
  nextAction: { fontSize: 12, color: '#2f855a', marginTop: 6 },
  navBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#edf2f7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  navBtnText: { color: '#1a365d', fontWeight: '600', fontSize: 13 },
})
