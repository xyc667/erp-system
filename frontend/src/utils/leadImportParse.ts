import { LEAD_CATEGORIES, LEAD_DISTRICTS } from '../config/leadFilters'
import type { ImportLeadItem } from '../services/leads'

export type LeadImportField = keyof ImportLeadItem

const COLUMN_MAP: Record<LeadImportField, string[]> = {
  name: ['name', '店名', '名称', '商户名称', '店铺名称'],
  phone: ['phone', '电话', '联系电话', '手机'],
  phoneBackup: ['phone_backup', 'phonebackup', '备用电话', '备用手机'],
  address: ['address', '地址', '详细地址'],
  district: ['district', '区县', '区域', '所属区县'],
  category: ['category', '品类', '行业', '类别', '大类'],
  poiCategoryRaw: ['poi_category_raw', 'poicategoryraw', '原始品类'],
  lng: ['lng', 'longitude', '经度', 'lon'],
  lat: ['lat', 'latitude', '纬度'],
  source: ['source', '来源'],
  sourceId: ['source_id', 'sourceid', '来源id', '来源ID', 'poi_id'],
  remark: ['remark', '备注', '说明'],
}

const TEMPLATE_HEADERS_ZH = ['店名', '电话', '备用电话', '地址', '区县', '品类', '来源', '来源ID', '经度', '纬度', '备注'] as const

const TEMPLATE_EXAMPLE = [
  '示例餐饮店',
  '024-12345678',
  '',
  '沈阳市铁西区建设大路1号',
  '铁西区',
  '餐饮服务',
  'manual',
  '',
  '',
  '',
  '',
]

/** 解析单行 CSV（支持引号包裹字段） */
export function parseCsvLine(line: string): string[] {
  const cols: string[] = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  cols.push(cur.trim())
  return cols
}

function normalizeHeader(h: string): string {
  return h.trim().replace(/^\uFEFF/, '').toLowerCase()
}

function resolveField(header: string): LeadImportField | null {
  const key = normalizeHeader(header)
  for (const [field, aliases] of Object.entries(COLUMN_MAP) as [LeadImportField, string[]][]) {
    if (aliases.some((a) => a.toLowerCase() === key)) return field
  }
  return null
}

function toOptionalNumber(raw: string | undefined): number | undefined {
  if (!raw?.trim()) return undefined
  const n = Number(raw)
  return Number.isFinite(n) ? n : undefined
}

export function parseLeadCsv(text: string): ImportLeadItem[] {
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim())
  if (lines.length < 2) return []

  const headers = parseCsvLine(lines[0])
  const fieldIndexes = headers.map((h) => resolveField(h))

  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line)
    const row: Partial<ImportLeadItem> = {}
    fieldIndexes.forEach((field, i) => {
      if (!field) return
      const val = (cols[i] ?? '').trim()
      if (!val) return
      if (field === 'lng' || field === 'lat') {
        row[field] = toOptionalNumber(val)
      } else {
        row[field] = val
      }
    })
    if (!row.source) row.source = 'manual'
    return row as ImportLeadItem
  }).filter((r) => r.name?.trim())
}

export interface LeadImportRowIssue {
  key: string
  level: 'error' | 'warning'
}

export interface ParsedLeadImportRow {
  rowNum: number
  item: ImportLeadItem
  issues: LeadImportRowIssue[]
}

function dedupKey(item: ImportLeadItem): string {
  const source = item.source ?? 'manual'
  if (item.sourceId && source !== 'manual') {
    return `${source}|${item.sourceId}|${item.name}`
  }
  return `${item.name}|${item.phone ?? ''}|${item.district ?? ''}`
}

export function validateLeadImportRows(items: ImportLeadItem[]): ParsedLeadImportRow[] {
  const seen = new Map<string, number>()

  return items.map((item, index) => {
    const rowNum = index + 2
    const issues: LeadImportRowIssue[] = []

    if (!item.name?.trim()) {
      issues.push({ key: 'nameRequired', level: 'error' })
    }

    if (item.district && !LEAD_DISTRICTS.includes(item.district as (typeof LEAD_DISTRICTS)[number])) {
      issues.push({ key: 'districtInvalid', level: 'error' })
    }

    if (item.category && !LEAD_CATEGORIES.includes(item.category as (typeof LEAD_CATEGORIES)[number])) {
      issues.push({ key: 'categoryUnknown', level: 'warning' })
    }

    if (item.phone && !/^[\d\s\-+()（）]{6,20}$/.test(item.phone)) {
      issues.push({ key: 'phoneFormat', level: 'warning' })
    }

    const key = dedupKey(item)
    const prev = seen.get(key)
    if (prev != null) {
      issues.push({ key: 'duplicateInFile', level: 'warning' })
    } else {
      seen.set(key, rowNum)
    }

    return { rowNum, item: { ...item, name: item.name.trim() }, issues }
  })
}

export function summarizeLeadImport(rows: ParsedLeadImportRow[]) {
  const total = rows.length
  const invalid = rows.filter((r) => r.issues.some((i) => i.level === 'error')).length
  const valid = total - invalid
  const warnings = rows.filter((r) => r.issues.some((i) => i.level === 'warning') && !r.issues.some((i) => i.level === 'error')).length
  const duplicateHints = rows.filter((r) => r.issues.some((i) => i.key === 'duplicateInFile')).length
  return { total, valid, invalid, warnings, duplicateHints }
}

export function downloadLeadImportTemplate(locale: string) {
  const headerLine = TEMPLATE_HEADERS_ZH.join(',')
  const exampleLine = TEMPLATE_EXAMPLE.map((c) => (c.includes(',') ? `"${c}"` : c)).join(',')
  const bom = '\uFEFF'
  const blob = new Blob([bom + headerLine + '\n' + exampleLine + '\n'], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = locale.startsWith('en') ? 'lead-import-template.csv' : '线索导入模板.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export function rowsToImportItems(rows: ParsedLeadImportRow[]): ImportLeadItem[] {
  return rows
    .filter((r) => !r.issues.some((i) => i.level === 'error'))
    .map((r) => r.item)
}
