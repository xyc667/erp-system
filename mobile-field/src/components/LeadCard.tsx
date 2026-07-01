import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import type { Lead } from '../types/api'
import { canNavigateToLead } from '../utils/openMapNavigation'

interface LeadCardProps {
  lead: Lead
  onClaim?: () => void
  onReport?: () => void
  onCall?: () => void
  onNavigate?: () => void
  onSelect?: () => void
  claiming?: boolean
  showClaim?: boolean
  showReport?: boolean
  showNavigate?: boolean
  selectable?: boolean
  selected?: boolean
  daysLeft?: number | null
}

export default function LeadCard({
  lead,
  onClaim,
  onReport,
  onCall,
  onNavigate,
  onSelect,
  claiming,
  showClaim,
  showReport,
  showNavigate,
  selectable,
  selected,
  daysLeft,
}: LeadCardProps) {
  const navigable = showNavigate && canNavigateToLead(lead)
  const Wrapper = selectable ? TouchableOpacity : View
  const wrapperProps = selectable
    ? {
        onPress: onSelect,
        activeOpacity: 0.7,
        style: [styles.card, selected && styles.cardSelected],
      }
    : { style: styles.card }

  return (
    <Wrapper {...wrapperProps}>
      {selectable ? <Text style={styles.check}>{selected ? '☑' : '☐'}</Text> : null}
      <Text style={styles.name}>{lead.name}</Text>
      <TouchableOpacity onPress={onCall} disabled={!lead.phone}>
        <Text style={[styles.phone, !lead.phone && styles.muted]}>
          {lead.phone || '暂无电话'}
        </Text>
      </TouchableOpacity>
      <View style={styles.metaRow}>
        {lead.district ? <Text style={styles.meta}>{lead.district}</Text> : null}
        {lead.category ? <Text style={styles.meta}>{lead.category}</Text> : null}
      </View>
      {lead.address ? <Text style={styles.address} numberOfLines={2}>{lead.address}</Text> : null}
      {daysLeft != null && (
        <Text style={[styles.badge, daysLeft <= 3 && styles.badgeWarn]}>
          保护期剩余 {daysLeft} 天
        </Text>
      )}
      <View style={styles.actions}>
        {navigable && onNavigate && (
          <TouchableOpacity style={[styles.btn, styles.btnNav]} onPress={onNavigate}>
            <Text style={styles.btnNavText}>导航</Text>
          </TouchableOpacity>
        )}
        {showClaim && onClaim && (
          <TouchableOpacity
            style={[styles.btn, styles.btnPrimary]}
            onPress={onClaim}
            disabled={claiming}
          >
            <Text style={styles.btnPrimaryText}>{claiming ? '领取中…' : '领取'}</Text>
          </TouchableOpacity>
        )}
        {showReport && onReport && (
          <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={onReport}>
            <Text style={styles.btnPrimaryText}>联系上报</Text>
          </TouchableOpacity>
        )}
      </View>
    </Wrapper>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e8ecf0',
  },
  cardSelected: { borderColor: '#2b6cb0', backgroundColor: '#ebf8ff' },
  check: { position: 'absolute', top: 12, right: 12, fontSize: 18, color: '#2b6cb0' },
  name: { fontSize: 17, fontWeight: '600', color: '#1a202c', marginBottom: 4 },
  phone: { fontSize: 20, fontWeight: '700', color: '#2b6cb0', marginBottom: 8 },
  muted: { color: '#a0aec0', fontWeight: '400', fontSize: 15 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
  meta: {
    fontSize: 12,
    color: '#4a5568',
    backgroundColor: '#edf2f7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  address: { fontSize: 13, color: '#718096', marginBottom: 8 },
  badge: { fontSize: 12, color: '#2f855a', marginBottom: 10 },
  badgeWarn: { color: '#c53030', fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e0',
  },
  btnPrimary: { backgroundColor: '#1a365d', borderColor: '#1a365d' },
  btnPrimaryText: { color: '#fff', fontWeight: '600' },
  btnNav: { backgroundColor: '#edf2f7', borderColor: '#cbd5e0' },
  btnNavText: { color: '#1a365d', fontWeight: '600' },
})
