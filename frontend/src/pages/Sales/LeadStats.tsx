import { useEffect, useState } from 'react'
import { Card, Col, Row, Statistic, Table } from 'antd'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
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
        <Col xs={12} sm={6}><Card><Statistic title={t('leads.statPool')} value={stats.pool} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title={t('leads.statClaimed')} value={stats.claimed} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title={t('leads.statConverted')} value={stats.converted} /></Card></Col>
        <Col xs={12} sm={6}><Card><Statistic title={t('leads.statInvalid')} value={stats.invalid} /></Card></Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} md={12}>
          <Card title={t('leads.byDistrict')}>
            <Table
              size="small"
              pagination={false}
              rowKey={(r) => r.district || 'unknown'}
              dataSource={stats.byDistrict}
              columns={[
                { title: t('leads.district'), dataIndex: 'district', render: (v) => v || '—' },
                { title: t('leads.count'), dataIndex: 'count' },
              ]}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title={t('leads.byCategory')}>
            <Table
              size="small"
              pagination={false}
              rowKey={(r) => r.category || 'unknown'}
              dataSource={stats.byCategory}
              columns={[
                { title: t('common.category'), dataIndex: 'category', render: (v) => v || '—' },
                { title: t('leads.count'), dataIndex: 'count' },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
