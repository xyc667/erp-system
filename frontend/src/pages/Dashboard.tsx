import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  DollarOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
  UserOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'react-i18next'
import PageTitle from '../components/PageTitle'
import { reportService, DashboardStats } from '../services/report'
import { translateStatusChartData } from '../utils/i18nChart'

import { useRegionalStore } from '../store/useRegionalStore'
import { formatCurrency } from '../utils/format'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { currency } = useRegionalStore()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportService.getDashboardStats()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <Spin size="large" className="flex justify-center items-center h-64" />
  }

  if (!data) {
    return (
      <div>
        <PageTitle data-testid="dashboard-title" />
        <div className="text-center mt-20 text-gray-500">{t('dashboard.noData')}</div>
      </div>
    )
  }

  const { stats, charts } = data

  const salesChartOption = {
    title: { text: t('dashboard.salesTrend'), left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: charts.monthlySales.map((m) => m.month),
    },
    yAxis: { type: 'value' },
    series: [{
      name: t('report.salesAmount'),
      type: 'line',
      data: charts.monthlySales.map((m) => m.amount),
      smooth: true,
    }],
  }

  const statusChartOption = {
    title: { text: t('dashboard.orderStatus'), left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: translateStatusChartData(t, charts.salesByStatus),
    }],
  }

  return (
    <div>
      <PageTitle data-testid="dashboard-title" />
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('dashboard.salesTotal')}
              value={stats.salesTotal}
              prefix={<DollarOutlined />}
              formatter={(v) => formatCurrency(Number(v), currency, i18n.language)}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('dashboard.purchaseOrders')}
              value={stats.purchaseOrderCount}
              prefix={<ShoppingCartOutlined />}
              suffix={t('units.order')}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('dashboard.inventoryQty')}
              value={stats.inventoryQuantity}
              prefix={<BuildOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <Card>
            <Statistic
              title={t('dashboard.users')}
              value={stats.userCount}
              prefix={<UserOutlined />}
              suffix={t('units.person')}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.salesTrend')}>
            <ReactECharts option={salesChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={t('dashboard.orderStatus')}>
            <ReactECharts option={statusChartOption} style={{ height: 300 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
