import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Card, Row, Col, Statistic, Spin } from 'antd'
import {
  DollarOutlined, ShoppingCartOutlined, BuildOutlined, TeamOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import ReactECharts from 'echarts-for-react'
import { reportService, DashboardStats } from '../../services/report'
import { translateStatusChartData } from '../../utils/i18nChart'

export default function ReportCenter() {
  const { t } = useTranslation()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportService.getOverview()
      .then((res) => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spin size="large" className="flex justify-center mt-20" />
  if (!data) return <div className="text-center mt-20 text-gray-500">{t('report.noData')}</div>

  const { stats, charts } = data

  const salesChartOption = {
    title: { text: t('dashboard.salesTrend'), left: 'center' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: charts.monthlySales.map((m) => m.month) },
    yAxis: { type: 'value' },
    series: [{
      name: t('report.salesAmount'),
      type: 'line',
      data: charts.monthlySales.map((m) => m.amount),
      smooth: true,
      areaStyle: {},
    }],
  }

  const statusChartOption = {
    title: { text: t('report.salesOrderStatus'), left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: translateStatusChartData(t, charts.salesByStatus),
    }],
  }

  const purchaseChartOption = {
    title: { text: t('report.purchaseOrderStatus'), left: 'center' },
    tooltip: { trigger: 'item' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: translateStatusChartData(t, charts.purchaseByStatus),
    }],
  }

  return (
    <div>
      <PageTitle />
      <Row gutter={16} className="mb-6">
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card><Statistic title={t('dashboard.salesTotal')} value={stats.salesTotal} prefix={<DollarOutlined />} suffix={t('common.suffixYuan')} /></Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card><Statistic title={t('report.purchaseTotal')} value={stats.purchaseTotal} prefix={<ShoppingCartOutlined />} suffix={t('common.suffixYuan')} /></Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card><Statistic title={t('report.salesOrders')} value={stats.salesOrderCount} suffix={t('common.suffixOrder')} /></Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card><Statistic title={t('dashboard.purchaseOrders')} value={stats.purchaseOrderCount} suffix={t('common.suffixOrder')} /></Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card><Statistic title={t('dashboard.inventoryQty')} value={stats.inventoryQuantity} prefix={<BuildOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card><Statistic title={t('report.employeeCount')} value={stats.employeeCount} prefix={<TeamOutlined />} suffix={t('common.suffixPerson')} /></Card>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <Card><ReactECharts option={salesChartOption} style={{ height: 320 }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><ReactECharts option={statusChartOption} style={{ height: 320 }} /></Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card><ReactECharts option={purchaseChartOption} style={{ height: 320 }} /></Card>
        </Col>
      </Row>
    </div>
  )
}
