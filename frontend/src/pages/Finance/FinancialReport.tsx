import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import { reportService, FinanceReport } from '../../services/report'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function FinancialReport() {
  const { t } = useTranslation()
  const [data, setData] = useState<FinanceReport | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportService.getFinanceReport()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />
  if (!data) return <div className="text-center mt-20 text-gray-500">{t('common.noFinanceData')}</div>

  const trialColumns = [
    { title: t('common.accountCode'), dataIndex: 'code', key: 'code' },
    { title: t('common.accountName'), dataIndex: 'name', key: 'name' },
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => t(`accountType.${v}`, v),
    },
    { title: t('common.debit'), dataIndex: 'debit', key: 'debit' },
    { title: t('common.credit'), dataIndex: 'credit', key: 'credit' },
    { title: t('common.balance'), dataIndex: 'balance', key: 'balance' },
  ]

  return (
    <div>
      <PageTitle />
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card><Statistic title={t('finance.arOutstanding')} value={data.receivables.outstanding} suffix={t('units.currency')} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title={t('finance.apOutstanding')} value={data.payables.outstanding} suffix={t('units.currency')} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title={t('finance.assetNetValue')} value={data.fixedAssets.netValue} suffix={t('units.currency')} /></Card>
        </Col>
        <Col span={6}>
          <Card><Statistic title={t('finance.activeAssetCount')} value={data.fixedAssets.count} suffix={t('common.itemsUnit')} /></Card>
        </Col>
      </Row>
      <Card title={t('finance.trialBalance')} className="mb-6">
        <ResponsiveTable
          columns={trialColumns}
          dataSource={data.trialBalance}
          rowKey="code"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </Card>
      <Card title={t('finance.summaryByType')}>
        <Row gutter={16}>
          {Object.entries(data.summaryByType).map(([type, balance]) => (
            <Col span={4} key={type}>
              <Statistic title={t(`accountType.${type}`, type)} value={balance} precision={2} />
            </Col>
          ))}
        </Row>
      </Card>
    </div>
  )
}
