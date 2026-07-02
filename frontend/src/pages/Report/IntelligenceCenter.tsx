import { useEffect, useState } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Tabs, Tag, Alert, message, Button, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import ResponsiveTable from '../../components/ResponsiveTable'
import { TablePageSkeleton } from '../../components/PageSkeleton'
import {
  intelligenceService,
  ReplenishmentSuggestion,
  FinanceInsight,
} from '../../services/intelligence'

export default function IntelligenceCenter() {
  const { t } = useTranslation()
  const [replenishment, setReplenishment] = useState<ReplenishmentSuggestion[]>([])
  const [insights, setInsights] = useState<FinanceInsight[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    Promise.all([
      intelligenceService.getReplenishment().then((r) => setReplenishment(r.data)).catch(() => {
        message.error(t('intelligence.loadReplenishmentFailed'))
      }),
      intelligenceService.getFinance().then((r) => setInsights(r.data.insights)).catch(() => {
        message.error(t('intelligence.loadFinanceFailed'))
      }),
    ]).finally(() => setLoading(false))
  }, [t])

  const createRequest = async (productIds?: string[]) => {
    setCreating(true)
    try {
      await intelligenceService.createReplenishmentRequest(productIds)
      message.success(t('intelligence.createRequestSuccess'))
    } catch {
      message.error(t('intelligence.createRequestFailed'))
    } finally {
      setCreating(false)
    }
  }

  const priorityColor = { high: 'red', medium: 'orange', low: 'blue' } as const
  const severityColor = { warning: 'warning', success: 'success', info: 'info' } as const

  const replenishmentColumns = [
    { title: t('common.productCode'), dataIndex: 'productCode', key: 'productCode' },
    { title: t('common.productName'), dataIndex: 'productName', key: 'productName' },
    { title: t('common.currentQty'), dataIndex: 'currentQty', key: 'currentQty' },
    { title: t('common.safetyStock'), dataIndex: 'safetyStock', key: 'safetyStock' },
    { title: t('common.shortage'), dataIndex: 'shortage', key: 'shortage' },
    { title: t('intelligence.suggestedQty'), dataIndex: 'suggestedQty', key: 'suggestedQty' },
    { title: t('intelligence.dailyConsumption'), dataIndex: 'dailyConsumption', key: 'dailyConsumption' },
    {
      title: t('intelligence.coverageDays'),
      dataIndex: 'coverageDays',
      key: 'coverageDays',
      render: (v: number | null) => (v != null ? v : '-'),
    },
    {
      title: t('intelligence.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (p: keyof typeof priorityColor) => (
        <Tag color={priorityColor[p]}>{t(`intelligence.priority_${p}`)}</Tag>
      ),
    },
    {
      title: t('intelligence.reason'),
      dataIndex: 'reasonCode',
      key: 'reasonCode',
      render: (code: string) => t(`intelligence.reason_${code}`, code),
    },
    {
      title: t('common.action'),
      key: 'actions',
      render: (_: unknown, row: ReplenishmentSuggestion) => (
        <Button
          type="link"
          size="small"
          loading={creating}
          onClick={() => createRequest([row.productId])}
        >
          {t('intelligence.createRequest')}
        </Button>
      ),
    },
  ]

  if (loading) {
    return <TablePageSkeleton rows={6} />
  }

  return (
    <div>
      <PageTitle />
      <PageSection>
      <Tabs
        items={[
          {
            key: 'replenishment',
            label: t('intelligence.replenishmentTab'),
            children: (
              <>
                <div className="mb-3">
                  <Space>
                    <Button
                      type="primary"
                      loading={creating}
                      disabled={!replenishment.length}
                      onClick={() => createRequest()}
                    >
                      {t('intelligence.createRequestAll')}
                    </Button>
                  </Space>
                </div>
                <ResponsiveTable
                  columns={replenishmentColumns}
                  dataSource={replenishment}
                  rowKey="productId"
                  pagination={{ pageSize: 10 }}
                />
              </>
            ),
          },
          {
            key: 'finance',
            label: t('intelligence.financeTab'),
            children: (
              <div className="space-y-3">
                {insights.map((item) => (
                  <Alert
                    key={item.code}
                    type={severityColor[item.severity]}
                    showIcon
                    message={t(`intelligence.insight_${item.code}`, item.params)}
                  />
                ))}
              </div>
            ),
          },
        ]}
      />
    </PageSection>
    </div>
  )
}
