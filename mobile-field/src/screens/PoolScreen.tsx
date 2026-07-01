import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { Picker } from '@react-native-picker/picker'
import LeadCard from '../components/LeadCard'
import { claimBatch, claimLead, getPool, getQuota } from '../api/leads'
import { LEAD_CATEGORIES, LEAD_DISTRICTS } from '../constants/leadFilters'
import type { Lead, LeadQuota } from '../types/api'
import { openMapNavigation } from '../utils/openMapNavigation'

export default function PoolScreen() {
  const [items, setItems] = useState<Lead[]>([])
  const [quota, setQuota] = useState<LeadQuota | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [claimingId, setClaimingId] = useState<string | null>(null)
  const [keyword, setKeyword] = useState('')
  const [district, setDistrict] = useState('')
  const [category, setCategory] = useState('')
  const [hasPhone, setHasPhone] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [batchClaiming, setBatchClaiming] = useState(false)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const [pool, q] = await Promise.all([
        getPool({
          keyword: keyword || undefined,
          district: district || undefined,
          category: category || undefined,
          hasPhone: hasPhone || undefined,
          page: 1,
          pageSize: 20,
        }),
        getQuota(),
      ])
      setItems(pool.items)
      setQuota(q)
    } catch (e) {
      Alert.alert('加载失败', e instanceof Error ? e.message : '请检查网络')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [keyword, district, category, hasPhone])

  useEffect(() => {
    load()
  }, [load])

  const onRefresh = () => {
    setRefreshing(true)
    load(true)
  }

  const handleClaim = async (id: string) => {
    setClaimingId(id)
    try {
      await claimLead(id)
      Alert.alert('成功', '已领取到我的线索')
      load(true)
    } catch (e) {
      Alert.alert('领取失败', e instanceof Error ? e.message : '请稍后重试')
    } finally {
      setClaimingId(null)
    }
  }

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 10) {
        Alert.alert('提示', '单次最多选择 10 条')
        return prev
      }
      return [...prev, id]
    })
  }

  const handleBatchClaim = async () => {
    if (selected.length === 0) return
    setBatchClaiming(true)
    try {
      const res = await claimBatch(selected)
      Alert.alert('成功', `已领取 ${res.claimed} 条到我的线索`)
      setSelected([])
      setSelectMode(false)
      load(true)
    } catch (e) {
      Alert.alert('批量领取失败', e instanceof Error ? e.message : '请稍后重试')
    } finally {
      setBatchClaiming(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.quota}>
          已持有 {quota?.claimed ?? '—'} / {quota?.limit ?? 50} 条
        </Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => {
              setSelectMode((v) => !v)
              setSelected([])
            }}
          >
            <Text style={styles.filterToggle}>{selectMode ? '取消批量' : '批量'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowFilters((v) => !v)}>
            <Text style={styles.filterToggle}>{showFilters ? '收起筛选' : '筛选'}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {selectMode ? (
        <View style={styles.batchBar}>
          <Text style={styles.batchText}>已选 {selected.length} / 10</Text>
          <TouchableOpacity
            style={[styles.batchBtn, selected.length === 0 && styles.batchBtnDisabled]}
            onPress={handleBatchClaim}
            disabled={selected.length === 0 || batchClaiming}
          >
            <Text style={styles.batchBtnText}>{batchClaiming ? '领取中…' : '批量领取'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      {showFilters && (
        <View style={styles.filters}>
          <TextInput
            style={styles.input}
            placeholder="店名/电话/地址"
            value={keyword}
            onChangeText={setKeyword}
          />
          <View style={styles.pickerWrap}>
            <Picker selectedValue={district} onValueChange={setDistrict}>
              <Picker.Item label="全部区县" value="" />
              {LEAD_DISTRICTS.map((d) => (
                <Picker.Item key={d} label={d} value={d} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={category} onValueChange={setCategory}>
              <Picker.Item label="全部分类" value="" />
              {LEAD_CATEGORIES.map((c) => (
                <Picker.Item key={c} label={c} value={c} />
              ))}
            </Picker>
          </View>
          <View style={styles.pickerWrap}>
            <Picker selectedValue={hasPhone} onValueChange={setHasPhone}>
              <Picker.Item label="电话不限" value="" />
              <Picker.Item label="有电话" value="true" />
              <Picker.Item label="无电话" value="false" />
            </Picker>
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={() => load()}>
            <Text style={styles.searchBtnText}>查询</Text>
          </TouchableOpacity>
        </View>
      )}
      {loading && !refreshing ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color="#1a365d" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<Text style={styles.empty}>暂无公海线索</Text>}
          renderItem={({ item }) => (
            <LeadCard
              lead={item}
              showClaim={!selectMode}
              showNavigate={!selectMode}
              selectable={selectMode}
              selected={selected.includes(item.id)}
              claiming={claimingId === item.id}
              onClaim={() => handleClaim(item.id)}
              onNavigate={() => openMapNavigation(item)}
              onSelect={() => toggleSelect(item.id)}
            />
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
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  quota: { fontSize: 14, fontWeight: '600', color: '#2b6cb0' },
  headerActions: { flexDirection: 'row', gap: 16 },
  filterToggle: { color: '#1a365d', fontWeight: '600' },
  batchBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#ebf8ff',
    borderBottomWidth: 1,
    borderBottomColor: '#bee3f8',
  },
  batchText: { fontSize: 14, fontWeight: '600', color: '#2b6cb0' },
  batchBtn: { backgroundColor: '#1a365d', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  batchBtnDisabled: { opacity: 0.5 },
  batchBtnText: { color: '#fff', fontWeight: '600' },
  filters: { padding: 16, backgroundColor: '#fff', gap: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickerWrap: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 8, overflow: 'hidden' },
  searchBtn: {
    backgroundColor: '#1a365d',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  searchBtnText: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingBottom: 32 },
  empty: { textAlign: 'center', color: '#a0aec0', marginTop: 40 },
})
