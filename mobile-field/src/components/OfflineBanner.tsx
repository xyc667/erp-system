import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import NetInfo from '@react-native-community/netinfo'

export default function OfflineBanner() {
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false)
    })
    return () => unsub()
  }, [])

  if (online) return null

  return (
    <View style={styles.banner}>
      <Text style={styles.text}>当前离线，部分功能不可用；上报将暂存，恢复网络后自动提交</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  banner: { backgroundColor: '#c53030', paddingHorizontal: 12, paddingVertical: 8 },
  text: { color: '#fff', fontSize: 12, textAlign: 'center' },
})
