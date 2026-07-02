import { useState, useEffect, useMemo } from 'react'
import { Row, Col } from 'antd'
import {
  DollarOutlined,
  ShoppingCartOutlined,
  BuildOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'react-i18next'
import { reportService, DashboardStats } from '../services/report'
import { translateStatusChartData } from '../utils/i18nChart'
import { useRegionalStore } from '../store/useRegionalStore'
import { formatCurrency } from '../utils/format'
import { brand, chartPalette, metricVariants } from '../theme/brand'
import DashboardWelcome from '../components/dashboard/DashboardWelcome'
import MetricCard from '../components/dashboard/MetricCard'
import QuickActionsCard from '../components/dashboard/QuickActionsCard'
import PageCard from '../components/PageCard'
import PageState from '../components/PageState'
import { DashboardSkeleton } from '../components/PageSkeleton'

export default function Dashboard() {
  const { t, i18n } = useTranslation()
  const { currency } = useRegionalStore()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportService
      .getDashboardStats()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  const salesChartOption = useMemo(() => {
    if (!data) return {}
    const amounts = data.charts.monthlySales.map((m) => m.amount)
    return {
      color: chartPalette,
      grid: { left: 48, right: 24, top: 24, bottom: 32 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(26, 54, 93, 0.92)',
        borderWidth: 0,
        textStyle: { color: '#fff' },
      },
      xAxis: {
        type: 'category',
        data: data.charts.monthlySales.map((m) => m.month),
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: brand.primaryMuted },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { color: brand.primaryMuted },
      },
      series: [
        {
          name: t('report.salesAmount'),
          type: 'line',
          data: amounts,
          smooth: true,
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: brand.primary },
          itemStyle: { color: brand.primary, borderWidth: 2, borderColor: '#fff' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(26, 54, 93, 0.18)' },
                { offset: 1, color: 'rgba(26, 54, 93, 0)' },
              ],
            },
          },
        },
      ],
    }
  }, [data, t])

  const statusChartOption = useMemo(() => {
    if (!data) return {}
    return {
      color: chartPalette,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(26, 54, 93, 0.92)',
        borderWidth: 0,
        textStyle: { color: '#fff' },
      },
      legend: {
        orient: 'vertical',
        right: 8,
        top: 'center',
        textStyle: { color: brand.primaryMuted, fontSize: 12 },
      },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          center: ['38%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 6,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
          },
          data: translateStatusChartData(t, data.charts.salesByStatus),
        },
      ],
    }
  }, [data, t])

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!data) {
    return (
      <PageState variant="chart" description={t('dashboard.noData')} />
    )
  }

  const { stats } = data

  return (
    <div data-testid="dashboard-page">
      <DashboardWelcome userCount={stats.userCount} />
      <Row gutter={[16, 16]} className="mb-4">
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title={t('dashboard.salesTotal')}
            value={formatCurrency(stats.salesTotal, currency, i18n.language)}
            icon={<DollarOutlined />}
            {...metricVariants.sales}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title={t('dashboard.purchaseOrders')}
            value={stats.purchaseOrderCount}
            suffix={t('units.order')}
            icon={<ShoppingCartOutlined />}
            {...metricVariants.purchase}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <MetricCard
            title={t('dashboard.inventoryQty')}
            value={stats.inventoryQuantity.toLocaleString(i18n.language)}
            icon={<BuildOutlined />}
            {...metricVariants.inventory}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <QuickActionsCard />
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <PageCard
            title={
              <span style={{ fontWeight: 600, color: brand.primary }}>{t('dashboard.salesTrend')}</span>
            }
            styles={{ body: { paddingTop: 8 } }}
          >
            <ReactECharts option={salesChartOption} style={{ height: 320 }} />
          </PageCard>
        </Col>
        <Col xs={24} lg={10}>
          <PageCard
            title={
              <span style={{ fontWeight: 600, color: brand.primary }}>{t('dashboard.orderStatus')}</span>
            }
            styles={{ body: { paddingTop: 8 } }}
          >
            <ReactECharts option={statusChartOption} style={{ height: 320 }} />
          </PageCard>
        </Col>
      </Row>
    </div>
  )
}
