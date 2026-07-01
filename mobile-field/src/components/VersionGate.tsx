import { useState } from 'react'
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useVersionCheck } from '../hooks/useVersionCheck'

interface VersionGateProps {
  children: React.ReactNode
}

export default function VersionGate({ children }: VersionGateProps) {
  const [skipped, setSkipped] = useState(false)
  const { loading, latest, forced, error, currentName, isIos, openDownload, retry } = useVersionCheck()

  if (!skipped && loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1a365d" />
        <Text style={styles.hint}>正在检查版本…</Text>
      </View>
    )
  }

  if (!skipped && forced && latest) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>需要更新</Text>
        <Text style={styles.subtitle}>
          当前 v{currentName} → 最新 v{latest.versionName}
        </Text>
        {latest.releaseNotes ? (
          <Text style={styles.notes}>{latest.releaseNotes}</Text>
        ) : null}
        <TouchableOpacity
          style={styles.btn}
          onPress={() => openDownload(latest.downloadUrl || latest.apkUrl || '')}
        >
          <Text style={styles.btnText}>{isIos ? '前往 TestFlight 更新' : '下载并安装更新'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={retry}>
          <Text style={styles.linkText}>重新检查</Text>
        </TouchableOpacity>
      </View>
    )
  }

  if (!skipped && error) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>无法连接服务器</Text>
        <Text style={styles.notes}>{error}</Text>
        <TouchableOpacity style={styles.btn} onPress={retry}>
          <Text style={styles.btnText}>重试</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkBtn} onPress={() => setSkipped(true)}>
          <Text style={styles.linkText}>跳过检查（内网调试）</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return <>{children}</>
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: '#f5f7fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  hint: { marginTop: 12, color: '#718096' },
  title: { fontSize: 22, fontWeight: '700', color: '#1a365d', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#4a5568', marginBottom: 12 },
  notes: {
    fontSize: 14,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  btn: {
    backgroundColor: '#1a365d',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 8,
    minWidth: 220,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  linkBtn: { marginTop: 16, padding: 8 },
  linkText: { color: '#2b6cb0', fontSize: 14 },
})
