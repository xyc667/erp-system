import { useState } from 'react'
import { Alert, Button, Input, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import { ImportLeadItem, leadsService } from '../../services/leads'

function parseCsv(text: string): ImportLeadItem[] {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = lines[0].split(',').map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cols = line.split(',')
    const row: Record<string, string> = {}
    headers.forEach((h, i) => { row[h] = (cols[i] || '').trim() })
    return {
      name: row.name,
      phone: row.phone || undefined,
      phoneBackup: row.phone_backup || row.phoneBackup || undefined,
      address: row.address || undefined,
      district: row.district || undefined,
      category: row.category || undefined,
      source: row.source || 'manual',
      sourceId: row.source_id || row.sourceId || undefined,
      lng: row.lng ? Number(row.lng) : undefined,
      lat: row.lat ? Number(row.lat) : undefined,
    }
  }).filter((r) => r.name)
}

export default function LeadImport() {
  const { t } = useTranslation()
  const [jsonText, setJsonText] = useState('')
  const [result, setResult] = useState<{ created: number; skipped: number; failed: number } | null>(null)
  const [loading, setLoading] = useState(false)

  const runImport = async (items: ImportLeadItem[]) => {
    if (items.length === 0) {
      message.warning(t('leads.importEmpty'))
      return
    }
    setLoading(true)
    try {
      const res = await leadsService.import(items)
      setResult(res.data)
      message.success(t('leads.importDone', { created: res.data.created, skipped: res.data.skipped }))
    } catch {
      message.error(t('common.operationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageTitle />
      <Alert
        className="mb-4"
        type="info"
        showIcon
        message={t('leads.importHint')}
        description={t('leads.importCsvFormat')}
      />
      <Upload
        accept=".csv"
        showUploadList={false}
        beforeUpload={(file) => {
          const reader = new FileReader()
          reader.onload = (e) => runImport(parseCsv(String(e.target?.result || '')))
          reader.readAsText(file)
          return false
        }}
      >
        <Button icon={<UploadOutlined />} loading={loading}>{t('leads.uploadCsv')}</Button>
      </Upload>
      <div className="mt-6">
        <p className="mb-2 text-gray-600">{t('leads.importJsonLabel')}</p>
        <Input.TextArea rows={8} value={jsonText} onChange={(e) => setJsonText(e.target.value)} placeholder='[{"name":"示例店","phone":"024-12345678","district":"铁西区","category":"餐饮"}]' />
        <Button className="mt-2" type="primary" loading={loading} onClick={() => {
          try {
            runImport(JSON.parse(jsonText))
          } catch {
            message.error(t('leads.importJsonInvalid'))
          }
        }}>{t('leads.importJsonSubmit')}</Button>
      </div>
      {result && (
        <Alert className="mt-4" type="success" message={t('leads.importResult', result)} />
      )}
    </div>
  )
}
