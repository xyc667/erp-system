import { describe, expect, it } from 'vitest'
import { parseCsvLine, parseLeadCsv, validateLeadImportRows } from './leadImportParse'

describe('leadImportParse', () => {
  it('parses quoted CSV fields', () => {
    expect(parseCsvLine('a,"b,c",d')).toEqual(['a', 'b,c', 'd'])
  })

  it('maps Chinese headers', () => {
    const csv = '店名,电话,区县,品类\n测试店,024-111,铁西区,餐饮服务'
    const items = parseLeadCsv(csv)
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe('测试店')
    expect(items[0].district).toBe('铁西区')
    expect(items[0].source).toBe('manual')
  })

  it('flags invalid district', () => {
    const rows = validateLeadImportRows([{ name: 'A', district: '不存在区' }])
    expect(rows[0].issues.some((i) => i.key === 'districtInvalid')).toBe(true)
  })

  it('detects duplicates in file', () => {
    const rows = validateLeadImportRows([
      { name: '同店', phone: '1', district: '铁西区' },
      { name: '同店', phone: '1', district: '铁西区' },
    ])
    expect(rows[1].issues.some((i) => i.key === 'duplicateInFile')).toBe(true)
  })
})
