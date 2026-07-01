import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import {
  getPendingContactReports,
  getRecordingUrl,
  reviewContactReport,
} from '../api/leads'
import {
  CONTACT_RESULT_LABELS,
  FOLLOW_TYPES,
  type ContactResult,
} from '../constants/contactResults'
import type { ContactReport } from '../types/api'

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

export default function ReviewReportsScreen() {
  const [items, setItems] = useState<ContactReport[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [target, setTarget] = useState<ContactReport | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await getPendingContactReports({ page: 1, pageSize: 50 })
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

  const openReview = (item: ContactReport, status: 'approved' | 'rejected') => {
    setTarget(item)
    setReviewStatus(status)
    setComment('')
  }

  const submitReview = async () => {
    if (!target) return
    setSubmitting(true)
    try {
      await reviewContactReport(target.id, {
        status: reviewStatus,
        comment: comment.trim() || undefined,
      })
      setTarget(null)
      load(true)
      Alert.alert('成功', reviewStatus === 'approved' ? '已通过' : '已驳回')
    } catch (e) {
      Alert.alert('操作失败', e instanceof Error ? e.message : '请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const playRecording = async (reportId: string) => {
    try {
      const res = await getRecordingUrl(reportId)
      if (res.url) await Linking.openURL(res.url)
      else Alert.alert('提示', '录音暂不可用')
    } catch {
      Alert.alert('播放失败', '无法获取录音地址')
    }
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                load(true)
              }}
            />
          }
          ListEmptyComponent={<Text style={styles.empty}>暂无待审核上报</Text>}
          renderItem={({ item }) => {
            const resultLabel =
              item.result && item.result in CONTACT_RESULT_LABELS
                ? CONTACT_RESULT_LABELS[item.result as ContactResult]
                : item.result ?? '—'
            return (
              <View style={styles.card}>
                <Text style={styles.leadName}>{item.lead?.name ?? '未知线索'}</Text>
                <Text style={styles.meta}>
                  {item.user?.name ?? '—'} · {formatTime(item.createdAt)} ·{' '}
                  {FOLLOW_TYPE_MAP[item.type] ?? item.type} · {resultLabel}
                </Text>
                <Text style={styles.content}>{item.content}</Text>
                {item.recordingFile ? (
                  <TouchableOpacity onPress={() => playRecording(item.id)}>
                    <Text style={styles.recording}>▶ 播放录音：{item.recordingFile.fileName}</Text>
                  </TouchableOpacity>
                ) : null}
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.btn, styles.approve]}
                    onPress={() => openReview(item, 'approved')}
                  >
                    <Text style={styles.btnText}>通过</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.btn, styles.reject]}
                    onPress={() => openReview(item, 'rejected')}
                  >
                    <Text style={styles.btnText}>驳回</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}

      <Modal visible={!!target} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {reviewStatus === 'approved' ? '通过上报' : '驳回上报'}
            </Text>
            <Text style={styles.modalHint}>审核意见（可选）</Text>
            <TextInput
              style={styles.modalInput}
              multiline
              value={comment}
              onChangeText={setComment}
              placeholder="填写审核说明…"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setTarget(null)}>
                <Text>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalOk}
                onPress={submitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.btnText}>确认</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
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
  leadName: { fontSize: 17, fontWeight: '600', color: '#1a202c' },
  meta: { fontSize: 12, color: '#718096', marginTop: 6, marginBottom: 8 },
  content: { fontSize: 14, color: '#4a5568', lineHeight: 20 },
  recording: { fontSize: 13, color: '#2b6cb0', marginTop: 10 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  btn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 8 },
  approve: { backgroundColor: '#2f855a' },
  reject: { backgroundColor: '#c53030' },
  btnText: { color: '#fff', fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  modalHint: { fontSize: 13, color: '#718096', marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    minHeight: 80,
    padding: 12,
    textAlignVertical: 'top',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 16 },
  modalCancel: { padding: 10 },
  modalOk: { backgroundColor: '#1a365d', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
})
