import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageCard from '../../components/PageCard'
import PageState from '../../components/PageState'
import { ReportSkeleton } from '../../components/PageSkeleton'
import { Row, Col, Statistic } from 'antd'
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

  if (loading) return <ReportSkeleton statCount={4} />
  if (!data) return <PageState variant="chart" description={t('common.noFinanceData')} />

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
          <PageCard><Statistic title={t('finance.arOutstanding')} value={data.receivables.outstanding} suffix={t('units.currency')} /></PageCard>
        </Col>
        <Col span={6}>
          <PageCard><Statistic title={t('finance.apOutstanding')} value={data.payables.outstanding} suffix={t('units.currency')} /></PageCard>
        </Col>
        <Col span={6}>
          <PageCard><Statistic title={t('finance.assetNetValue')} value={data.fixedAssets.netValue} suffix={t('units.currency')} /></PageCard>
        </Col>
        <Col span={6}>
          <PageCard><Statistic title={t('finance.activeAssetCount')} value={data.fixedAssets.count} suffix={t('common.itemsUnit')} /></PageCard>
        </Col>
      </Row>
      <PageCard title={t('finance.trialBalance')} className="mb-6">
        <ResponsiveTable
          columns={trialColumns}
          dataSource={data.trialBalance}
          rowKey="code"
          pagination={{ pageSize: 10 }}
          size="small"
        />
      </PageCard>
      <PageCard title={t('finance.summaryByType')}>
        <Row gutter={16}>
          {Object.entries(data.summaryByType).map(([type, balance]) => (
            <Col span={4} key={type}>
              <Statistic title={t(`accountType.${type}`, type)} value={balance} precision={2} />
            </Col>
          ))}
        </Row>
      </PageCard>
    </div>
  )
}
