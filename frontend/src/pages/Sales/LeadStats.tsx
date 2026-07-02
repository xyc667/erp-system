import { useEffect, useState } from 'react'
import { Col, Row, Statistic } from 'antd'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import PageCard from '../../components/PageCard'
import ResponsiveTable from '../../components/ResponsiveTable'
import { leadsService } from '../../services/leads'

interface Stats {
  pool: number
  claimed: number
  converted: number
  invalid: number
  byDistrict: { district: string | null; count: number }[]
  byCategory: { category: string | null; count: number }[]
}

export default function LeadStats() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    leadsService.getStats().then((res) => setStats(res.data)).catch(() => {})
  }, [])

  if (!stats) return <PageTitle />

  return (
    <div>
      <PageTitle />
      <Row gutter={16} className="mb-6">
        <Col xs={12} sm={6}><PageCard><Statistic title={t('leads.statPool')} value={stats.pool} /></PageCard></Col>
        <Col xs={12} sm={6}><PageCard><Statistic title={t('leads.statClaimed')} value={stats.claimed} /></PageCard></Col>
        <Col xs={12} sm={6}><PageCard><Statistic title={t('leads.statConverted')} value={stats.converted} /></PageCard></Col>
        <Col xs={12} sm={6}><PageCard><Statistic title={t('leads.statInvalid')} value={stats.invalid} /></PageCard></Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <PageCard title={t('leads.byDistrict')}>
            <ResponsiveTable
              embedded
              size="small"
              pagination={false}
              rowKey={(r) => r.district || 'unknown'}
              dataSource={stats.byDistrict}
              columns={[
                { title: t('leads.district'), dataIndex: 'district', render: (v) => v || '—' },
                { title: t('leads.count'), dataIndex: 'count' },
              ]}
            />
          </PageCard>
        </Col>
        <Col xs={24} md={12}>
          <PageCard title={t('leads.byCategory')}>
            <ResponsiveTable
              embedded
              size="small"
              pagination={false}
              rowKey={(r) => r.category || 'unknown'}
              dataSource={stats.byCategory}
              columns={[
                { title: t('common.category'), dataIndex: 'category', render: (v) => v || '—' },
                { title: t('leads.count'), dataIndex: 'count' },
              ]}
            />
          </PageCard>
        </Col>
      </Row>
    </div>
  )
}
