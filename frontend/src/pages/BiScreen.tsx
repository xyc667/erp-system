import { useState, useEffect, useCallback } from 'react'
import { Row, Col, Card, Statistic, Spin, Button } from 'antd'
import { FullscreenOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'react-i18next'
import { reportService, DashboardStats } from '../services/report'
import { translateStatusChartData } from '../utils/i18nChart'

export default function BiScreen() {
  const { t } = useTranslation()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  const load = useCallback(() => {
    reportService.getDashboardStats()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [load])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Spin size="large" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        {t('bi.noData')}
      </div>
    )
  }

  const { stats, charts } = data
  const darkText = '#e2e8f0'

  const salesOption = {
    backgroundColor: 'transparent',
    title: { text: t('dashboard.salesTrend'), textStyle: { color: darkText }, left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: charts.monthlySales.map((m) => m.month),
      axisLabel: { color: darkText },
    },
    yAxis: { type: 'value', axisLabel: { color: darkText } },
    series: [{
      name: t('report.salesAmount'),
      type: 'bar',
      data: charts.monthlySales.map((m) => m.amount),
      itemStyle: { color: '#38bdf8' },
    }],
  }

  const pieOption = {
    backgroundColor: 'transparent',
    title: { text: t('dashboard.orderStatus'), textStyle: { color: darkText }, left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      data: translateStatusChartData(t, charts.salesByStatus),
      label: { color: darkText },
    }],
  }

  const statCards = [
    { title: t('dashboard.salesTotal'), value: stats.salesTotal, suffix: t('units.currency') },
    { title: t('dashboard.purchaseOrders'), value: stats.purchaseOrderCount, suffix: t('units.order') },
    { title: t('dashboard.inventoryQty'), value: stats.inventoryQuantity, suffix: '' },
    { title: t('dashboard.users'), value: stats.userCount, suffix: t('units.person') },
  ]

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold tracking-wide">{t('bi.title')}</h1>
          <p className="text-slate-500 text-sm mt-1">{t('bi.autoRefresh')}</p>
        </div>
        <Button
          type="primary"
          ghost
          icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          onClick={toggleFullscreen}
        >
          {fullscreen ? t('bi.exitFullscreen') : t('bi.fullscreen')}
        </Button>
      </div>
      <Row gutter={[16, 16]} className="mb-6">
        {statCards.map((item) => (
          <Col xs={12} sm={12} md={6} key={item.title}>
            <Card className="!bg-slate-900/80 !border-slate-700">
              <Statistic
                title={<span className="text-slate-400">{item.title}</span>}
                value={item.value}
                suffix={item.suffix}
                valueStyle={{ color: '#38bdf8', fontSize: '1.75rem' }}
              />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card className="!bg-slate-900/80 !border-slate-700">
            <ReactECharts option={salesOption} style={{ height: 360 }} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card className="!bg-slate-900/80 !border-slate-700">
            <ReactECharts option={pieOption} style={{ height: 360 }} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
