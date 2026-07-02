import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Alert,
  Button,
  Collapse,
  Input,
  Steps,
  Table,
  Tag,
  Upload,
  message,
} from 'antd'
import { DownloadOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import PageCard from '../../components/PageCard'
import LeadQuickAddForm from '../../components/leads/LeadQuickAddForm'
import { ImportLeadItem, leadsService } from '../../services/leads'
import {
  ParsedLeadImportRow,
  downloadLeadImportTemplate,
  parseLeadCsv,
  rowsToImportItems,
  summarizeLeadImport,
  validateLeadImportRows,
} from '../../utils/leadImportParse'

const { Dragger } = Upload

export default function LeadImport() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [parsedRows, setParsedRows] = useState<ParsedLeadImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [result, setResult] = useState<{ created: number; skipped: number; failed: number } | null>(null)

  const summary = summarizeLeadImport(parsedRows)

  const handleFile = (text: string, name: string) => {
    const items = parseLeadCsv(text)
    if (items.length === 0) {
      message.warning(t('leads.importEmpty'))
      return
    }
    const rows = validateLeadImportRows(items)
    setParsedRows(rows)
    setFileName(name)
    setResult(null)
    setStep(1)
  }

  const uploadProps: UploadProps = {
    accept: '.csv,.txt',
    showUploadList: false,
    multiple: false,
    beforeUpload: (file) => {
      const reader = new FileReader()
      reader.onload = (e) => handleFile(String(e.target?.result || ''), file.name)
      reader.readAsText(file, 'UTF-8')
      return false
    },
  }

  const runImport = async (items: ImportLeadItem[]) => {
    if (items.length === 0) {
      message.warning(t('leads.importEmpty'))
      return
    }
    setLoading(true)
    try {
      const res = await leadsService.import(items)
      setResult(res.data)
      setStep(2)
      message.success(t('leads.importDone', { created: res.data.created, skipped: res.data.skipped }))
    } catch {
      message.error(t('common.operationFailed'))
    } finally {
      setLoading(false)
    }
  }

  const confirmImport = () => runImport(rowsToImportItems(parsedRows))

  const resetWizard = () => {
    setStep(0)
    setParsedRows([])
    setFileName('')
    setResult(null)
  }

  const issueLabel = (key: string) => t(`leads.importIssue.${key}`, { defaultValue: key })

  const previewColumns = [
    { title: '#', dataIndex: 'rowNum', width: 56 },
    { title: t('leads.quickAddName'), dataIndex: ['item', 'name'], ellipsis: true },
    { title: t('leads.quickAddPhone'), dataIndex: ['item', 'phone'], width: 120, ellipsis: true },
    { title: t('leads.district'), dataIndex: ['item', 'district'], width: 100 },
    { title: t('leads.quickAddCategory'), dataIndex: ['item', 'category'], width: 110, ellipsis: true },
    {
      title: t('leads.importValidation'),
      key: 'issues',
      render: (_: unknown, row: ParsedLeadImportRow) => (
        <span className="flex flex-wrap gap-1">
          {row.issues.length === 0 ? (
            <Tag color="success">{t('leads.importRowOk')}</Tag>
          ) : (
            row.issues.map((issue) => (
              <Tag key={issue.key} color={issue.level === 'error' ? 'error' : 'warning'}>
                {issueLabel(issue.key)}
              </Tag>
            ))
          )}
        </span>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />

      <LeadQuickAddForm />

      <PageCard title={t('leads.importWizardTitle')}>
        <Steps
          className="mb-6"
          current={step}
          items={[
            { title: t('leads.importStepUpload') },
            { title: t('leads.importStepPreview') },
            { title: t('leads.importStepDone') },
          ]}
        />

        {step === 0 && (
          <>
            <Alert
              className="mb-4"
              type="info"
              showIcon
              message={t('leads.importHint')}
              description={t('leads.importWizardDesc')}
            />
            <div className="mb-4">
              <Button icon={<DownloadOutlined />} onClick={() => downloadLeadImportTemplate(i18n.language)}>
                {t('leads.downloadTemplate')}
              </Button>
            </div>
            <Dragger {...uploadProps} className="mb-4">
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">{t('leads.importDragHint')}</p>
              <p className="ant-upload-hint">{t('leads.importDragSub')}</p>
            </Dragger>
            <Collapse
              ghost
              items={[
                {
                  key: 'json',
                  label: t('leads.importAdvanced'),
                  children: (
                    <div>
                      <p className="mb-2 text-gray-500 text-sm">{t('leads.importJsonLabel')}</p>
                      <Input.TextArea
                        rows={6}
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        placeholder='[{"name":"示例店","phone":"024-12345678","district":"铁西区","category":"餐饮服务"}]'
                      />
                      <Button
                        className="mt-2"
                        icon={<UploadOutlined />}
                        onClick={() => {
                          try {
                            const items = JSON.parse(jsonText) as ImportLeadItem[]
                            if (!Array.isArray(items)) throw new Error('not array')
                            const rows = validateLeadImportRows(items)
                            setParsedRows(rows)
                            setFileName('JSON')
                            setResult(null)
                            setStep(1)
                          } catch {
                            message.error(t('leads.importJsonInvalid'))
                          }
                        }}
                      >
                        {t('leads.importJsonPreview')}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </>
        )}

        {step === 1 && (
          <>
            <Alert
              className="mb-4"
              type={summary.invalid > 0 ? 'warning' : 'info'}
              showIcon
              message={t('leads.importPreviewSummary', {
                file: fileName,
                total: summary.total,
                valid: summary.valid,
                invalid: summary.invalid,
                duplicateHints: summary.duplicateHints,
              })}
            />
            <Table
              size="small"
              rowKey="rowNum"
              columns={previewColumns}
              dataSource={parsedRows}
              pagination={{ pageSize: 20, showSizeChanger: parsedRows.length > 20 }}
              rowClassName={(row) => (row.issues.some((i) => i.level === 'error') ? 'bg-red-50' : '')}
              scroll={{ x: 720 }}
            />
            <p className="text-gray-500 text-sm mt-2">{t('leads.importPreviewLimit', { count: summary.valid })}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={resetWizard}>{t('leads.importBack')}</Button>
              <Button
                type="primary"
                loading={loading}
                disabled={summary.valid === 0}
                onClick={confirmImport}
              >
                {t('leads.importConfirm', { count: summary.valid })}
              </Button>
            </div>
          </>
        )}

        {step === 2 && result && (
          <>
            <Alert
              className="mb-4"
              type="success"
              showIcon
              message={t('leads.importResult', result)}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="primary" onClick={resetWizard}>{t('leads.importAgain')}</Button>
              <Button onClick={() => navigate('/sales/leads/pool')}>{t('leads.importGoPool')}</Button>
            </div>
          </>
        )}
      </PageCard>
    </div>
  )
}
