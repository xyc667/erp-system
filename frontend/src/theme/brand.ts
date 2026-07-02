/** 品牌色 — 与侧栏、外勤 App 一致 */
export const brand = {
  primary: '#1a365d',
  primaryLight: '#2c5282',
  primaryMuted: '#4a5568',
  bgPage: '#f8fafc',
  bgPageEnd: '#f1f5f9',
  cardShadow: '0 1px 3px rgba(26, 54, 93, 0.08), 0 4px 12px rgba(26, 54, 93, 0.04)',
  cardShadowHover: '0 4px 16px rgba(26, 54, 93, 0.12)',
} as const

export const chartPalette = [
  '#1a365d',
  '#3182ce',
  '#38a169',
  '#d69e2e',
  '#e53e3e',
  '#805ad5',
]

export const metricVariants = {
  sales: { iconBg: '#e8eef5', iconColor: '#1a365d' },
  purchase: { iconBg: '#e6f2ff', iconColor: '#2563eb' },
  inventory: { iconBg: '#fef9e7', iconColor: '#d97706' },
  users: { iconBg: '#f0eef8', iconColor: '#6b46c1' },
} as const
