import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Picker } from '@react-native-picker/picker'
import type { ReportScreenProps } from '../navigation/types'
import { submitContactReport, uploadRecording } from '../api/leads'
import {
  CONTACT_RESULTS,
  CONTACT_RESULT_LABELS,
  FOLLOW_TYPES,
} from '../constants/contactResults'
import { useAudioPicker } from '../hooks/useAudioPicker'
import { enqueueReport } from '../utils/offlineReportQueue'

export default function ReportScreen({ route, navigation }: ReportScreenProps) {
  const { lead } = route.params
  const audio = useAudioPicker()
  const [type, setType] = useState('call')
  const [result, setResult] = useState('')
  const [content, setContent] = useState('')
  const [nextActionAt, setNextActionAt] = useState<Date | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!type || !result || !content.trim()) {
      Alert.alert('提示', '请填写跟进方式、联系结果和沟通摘要')
      return
    }
    if (result === 'schedule_next' && !nextActionAt) {
      Alert.alert('提示', '约下次联系时请选择时间')
      return
    }
    setSubmitting(true)
    const payload = {
      type,
      result,
      content: content.trim(),
      nextActionAt: nextActionAt?.toISOString(),
    }

    const saveOffline = async () => {
      await enqueueReport({
        leadId: lead.id,
        leadName: lead.name,
        payload,
        audioUri: audio.file?.uri,
        audioName: audio.file?.name,
        audioMime: audio.file?.mimeType,
      })
      Alert.alert('已暂存', '当前离线或网络异常，上报已保存，恢复网络后自动提交', [
        { text: '确定', onPress: () => navigation.goBack() },
      ])
    }

    try {
      const net = await NetInfo.fetch()
      if (net.isConnected === false) {
        await saveOffline()
        return
      }

      let recordingFileId: string | undefined
      if (audio.file) {
        const uploaded = await uploadRecording(
          audio.file.uri,
          audio.file.name,
          audio.file.mimeType,
        )
        recordingFileId = uploaded.id
      }
      await submitContactReport(lead.id, { ...payload, recordingFileId })
      Alert.alert('提交成功', '联系上报已提交，等待主管审核', [
        { text: '确定', onPress: () => navigation.goBack() },
      ])
    } catch (e) {
      const err = e as { code?: string; message?: string }
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network')) {
        await saveOffline()
        return
      }
      Alert.alert('提交失败', e instanceof Error ? e.message : '请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.leadTitle}>{lead.name}</Text>
      <Text style={styles.leadPhone}>{lead.phone || '暂无电话'}</Text>

      <Text style={styles.label}>跟进方式</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={type} onValueChange={setType}>
          {FOLLOW_TYPES.map((o) => (
            <Picker.Item key={o.value} label={o.label} value={o.value} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>联系结果</Text>
      <View style={styles.pickerWrap}>
        <Picker selectedValue={result} onValueChange={setResult}>
          <Picker.Item label="请选择" value="" />
          {CONTACT_RESULTS.map((r) => (
            <Picker.Item key={r} label={CONTACT_RESULT_LABELS[r]} value={r} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>沟通摘要</Text>
      <TextInput
        style={styles.textArea}
        multiline
        numberOfLines={4}
        value={content}
        onChangeText={setContent}
        placeholder="客户反馈、意向、下次计划…"
        textAlignVertical="top"
      />

      {result === 'schedule_next' && (
        <>
          <Text style={styles.label}>下次联系时间</Text>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowPicker(true)}>
            <Text>
              {nextActionAt
                ? nextActionAt.toLocaleString('zh-CN')
                : '点击选择日期时间'}
            </Text>
          </TouchableOpacity>
          {showPicker && (
            <DateTimePicker
              value={nextActionAt ?? new Date()}
              mode="datetime"
              display={Platform.OS === 'android' ? 'default' : 'spinner'}
              onChange={(_, date) => {
                setShowPicker(Platform.OS === 'ios')
                if (date) setNextActionAt(date)
              }}
            />
          )}
        </>
      )}

      <Text style={styles.label}>电话录音（可选，从手机选择，最大 10MB）</Text>
      <View style={styles.recordBox}>
        {audio.file ? (
          <>
            <Text style={styles.fileName} numberOfLines={2}>
              {audio.file.name}
            </Text>
            <Text style={styles.fileMeta}>{audio.sizeLabel}</Text>
          </>
        ) : (
          <Text style={styles.fileHint}>支持 mp3、m4a、wav 等常见格式</Text>
        )}
        {audio.error ? <Text style={styles.recordError}>{audio.error}</Text> : null}
        <View style={styles.recordActions}>
          <TouchableOpacity
            style={styles.recordBtn}
            onPress={audio.pick}
            disabled={audio.picking}
          >
            {audio.picking ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.recordBtnText}>
                {audio.file ? '重新选择' : '选择录音文件'}
              </Text>
            )}
          </TouchableOpacity>
          {audio.file ? (
            <TouchableOpacity style={[styles.recordBtn, styles.recordSecondary]} onPress={audio.clear}>
              <Text style={styles.recordSecondaryText}>清除</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submit, submitting && styles.submitDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>提交上报</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16, paddingBottom: 40 },
  leadTitle: { fontSize: 20, fontWeight: '700', color: '#1a202c' },
  leadPhone: { fontSize: 18, color: '#2b6cb0', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#4a5568', marginTop: 12, marginBottom: 6 },
  pickerWrap: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 12,
    minHeight: 100,
    fontSize: 15,
  },
  dateBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 12,
  },
  recordBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },
  fileName: { fontSize: 15, fontWeight: '600', color: '#1a202c', marginBottom: 4 },
  fileMeta: { fontSize: 13, color: '#718096', marginBottom: 8 },
  fileHint: { fontSize: 14, color: '#718096', marginBottom: 8 },
  recordError: { color: '#c53030', marginBottom: 8 },
  recordActions: { flexDirection: 'row', gap: 10 },
  recordBtn: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  recordSecondary: { backgroundColor: '#edf2f7' },
  recordBtnText: { color: '#fff', fontWeight: '600' },
  recordSecondaryText: { color: '#1a365d', fontWeight: '600' },
  submit: {
    backgroundColor: '#2b6cb0',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  submitDisabled: { opacity: 0.7 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
