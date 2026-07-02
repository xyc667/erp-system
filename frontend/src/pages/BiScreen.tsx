import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from 'react'
import { Row, Col, Button } from 'antd'
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  TeamOutlined,
  FileTextOutlined,
  ProjectOutlined,
  SyncOutlined,
} from '@ant-design/icons'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'react-i18next'
import PageEmpty from '../components/PageEmpty'
import { BiScreenSkeleton } from '../components/PageSkeleton'
import BiDistrictMap from '../components/bi/BiDistrictMap'
import BiScrollOrders from '../components/bi/BiScrollOrders'
import BiEventStream from '../components/bi/BiEventStream'
import BiScreenClock from '../components/bi/BiScreenClock'
import { reportService, DashboardStats, BiFeed } from '../services/report'
import { translateStatusChartData } from '../utils/i18nChart'
import { useRegionalStore } from '../store/useRegionalStore'
import { formatDateTime } from '../utils/format'
import { useCountUp } from '../hooks/useCountUp'

const BI_COLORS = ['#22d3ee', '#3b82f6', '#34d399', '#fbbf24', '#f87171', '#a78bfa']
const CHART_H_LG = 280
const CHART_H_MD = 220

function chartStyle(h: number) {
  return { height: h, width: '100%' as const }
}
const AXIS_LABEL = '#94a3b8'
const SPLIT_LINE = 'rgba(56, 189, 248, 0.12)'

function BiPanel({ title, children, className = '' }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={`bi-screen__panel ${className}`.trim()}>
      <div className="bi-screen__panel-corner bi-screen__panel-corner--tl" aria-hidden />
      <div className="bi-screen__panel-corner bi-screen__panel-corner--tr" aria-hidden />
      <div className="bi-screen__panel-corner bi-screen__panel-corner--bl" aria-hidden />
      <div className="bi-screen__panel-corner bi-screen__panel-corner--br" aria-hidden />
      <div className="bi-screen__panel-head">
        <span className="bi-screen__panel-dot" aria-hidden />
        <h3 className="bi-screen__panel-title">{title}</h3>
      </div>
      <div className="bi-screen__panel-body">{children}</div>
    </div>
  )
}

function BiKpi({
  label,
  value,
  suffix,
  icon,
  accent,
  delay,
}: {
  label: string
  value: number
  suffix?: string
  icon: ReactNode
  accent: string
  delay: number
}) {
  const animated = useCountUp(value)
  const { i18n } = useTranslation()

  return (
    <div className="bi-screen__kpi" style={{ animationDelay: `${delay}ms`, ['--kpi-accent' as string]: accent }}>
      <div className="bi-screen__kpi-icon">{icon}</div>
      <div className="bi-screen__kpi-body">
        <div className="bi-screen__kpi-label">{label}</div>
        <div className="bi-screen__kpi-value">
          {animated.toLocaleString(i18n.language)}
          {suffix ? <span className="bi-screen__kpi-suffix">{suffix}</span> : null}
        </div>
      </div>
    </div>
  )
}

export default function BiScreen() {
  const { t, i18n } = useTranslation()
  const { timezone } = useRegionalStore()
  const [data, setData] = useState<DashboardStats | null>(null)
  const [feed, setFeed] = useState<BiFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const screenRef = useRef<HTMLDivElement>(null)

  const load = useCallback(() => {
    Promise.all([
      reportService.getDashboardStats(),
      reportService.getBiFeed(),
    ])
      .then(([statsRes, feedRes]) => {
        setData(statsRes.data)
        setFeed(feedRes.data)
        setLastUpdated(new Date())
      })
      .catch(() => {
        setData(null)
        setFeed(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
    const timer = setInterval(load, 30_000)
    return () => clearInterval(timer)
  }, [load])

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === screenRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const toggleFullscreen = async () => {
    const el = screenRef.current
    if (!el) return
    try {
      if (document.fullscreenElement === el) {
        await document.exitFullscreen()
      } else if (!document.fullscreenElement) {
        await el.requestFullscreen()
      }
    } catch {
      /* 浏览器可能拒绝全屏 */
    }
  }

  const { stats, charts } = data ?? { stats: null, charts: null }

  const grossMarginPct = useMemo(() => {
    if (!stats?.salesTotal) return 0
    const margin = ((stats.salesTotal - stats.purchaseTotal) / stats.salesTotal) * 100
    return Math.max(0, Math.round(margin * 10) / 10)
  }, [stats])

  const marginAnimated = useCountUp(Math.round(grossMarginPct * 10)) / 10

  const salesOption = useMemo(() => {
    if (!charts) return {}
    return {
      color: BI_COLORS,
      backgroundColor: 'transparent',
      animationDurationUpdate: 0,
      grid: { left: 56, right: 24, top: 16, bottom: 36 },
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(8, 20, 40, 0.92)',
        borderColor: 'rgba(34, 211, 238, 0.35)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
      },
      xAxis: {
        type: 'category',
        data: charts.monthlySales.map((m) => m.month),
        axisLine: { lineStyle: { color: 'rgba(56, 189, 248, 0.25)' } },
        axisLabel: { color: AXIS_LABEL, fontSize: 11 },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: SPLIT_LINE, type: 'dashed' } },
        axisLabel: { color: AXIS_LABEL, fontSize: 11 },
      },
      series: [
        {
          name: t('report.salesAmount'),
          type: 'bar',
          barWidth: '42%',
          data: charts.monthlySales.map((m) => m.amount),
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#22d3ee' },
                { offset: 1, color: 'rgba(34, 211, 238, 0.15)' },
              ],
            },
          },
          animationDuration: 1200,
          animationEasing: 'cubicOut',
        },
      ],
    }
  }, [charts, t])

  const salesPieOption = useMemo(() => {
    if (!charts) return {}
    return {
      color: BI_COLORS,
      backgroundColor: 'transparent',
      animationDurationUpdate: 0,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(8, 20, 40, 0.92)',
        borderColor: 'rgba(34, 211, 238, 0.35)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'middle',
        textStyle: { color: AXIS_LABEL, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['46%', '72%'],
          center: ['38%', '50%'],
          itemStyle: {
            borderRadius: 4,
            borderColor: 'rgba(8, 20, 40, 0.8)',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: { show: true, color: '#e2e8f0', fontSize: 13, fontWeight: 'bold' },
          },
          data: translateStatusChartData(t, charts.salesByStatus),
          animationDuration: 1200,
        },
      ],
    }
  }, [charts, t])

  const purchasePieOption = useMemo(() => {
    if (!charts) return {}
    return {
      color: ['#3b82f6', '#22d3ee', '#34d399', '#fbbf24', '#f87171'],
      backgroundColor: 'transparent',
      animationDurationUpdate: 0,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(8, 20, 40, 0.92)',
        borderColor: 'rgba(59, 130, 246, 0.35)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
      },
      legend: {
        orient: 'vertical',
        right: 0,
        top: 'middle',
        textStyle: { color: AXIS_LABEL, fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: 'pie',
          radius: ['46%', '72%'],
          center: ['38%', '50%'],
          itemStyle: {
            borderRadius: 4,
            borderColor: 'rgba(8, 20, 40, 0.8)',
            borderWidth: 2,
          },
          label: { show: false },
          emphasis: {
            scale: true,
            scaleSize: 6,
            label: { show: true, color: '#e2e8f0', fontSize: 13, fontWeight: 'bold' },
          },
          data: translateStatusChartData(t, charts.purchaseByStatus),
          animationDuration: 1200,
        },
      ],
    }
  }, [charts, t])

  const compareOption = useMemo(() => {
    if (!stats) return {}
    return {
      color: ['#22d3ee', '#3b82f6'],
      backgroundColor: 'transparent',
      animationDurationUpdate: 0,
      grid: { left: 88, right: 48, top: 12, bottom: 12 },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: 'rgba(8, 20, 40, 0.92)',
        borderColor: 'rgba(34, 211, 238, 0.35)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0' },
      },
      xAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: SPLIT_LINE, type: 'dashed' } },
        axisLabel: { color: AXIS_LABEL, fontSize: 11 },
      },
      yAxis: {
        type: 'category',
        data: [t('dashboard.salesTotal'), t('report.purchaseTotal')],
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: '#cbd5e1', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          barWidth: 18,
          data: [stats.salesTotal, stats.purchaseTotal],
          itemStyle: {
            borderRadius: [0, 4, 4, 0],
            color: (params: { dataIndex: number }) =>
              params.dataIndex === 0
                ? {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 1,
                    y2: 0,
                    colorStops: [
                      { offset: 0, color: 'rgba(34, 211, 238, 0.3)' },
                      { offset: 1, color: '#22d3ee' },
                    ],
                  }
                : {
                    type: 'linear',
                    x: 0,
                    y: 0,
                    x2: 1,
                    y2: 0,
                    colorStops: [
                      { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                      { offset: 1, color: '#3b82f6' },
                    ],
                  },
          },
          animationDuration: 1200,
        },
      ],
    }
  }, [stats, t])

  if (loading && !data) {
    return <BiScreenSkeleton />
  }

  if (!data || !stats || !charts) {
    return (
      <div className="bi-screen bi-screen--empty">
        <PageEmpty variant="chart" description={<span className="text-slate-400">{t('bi.noData')}</span>} />
      </div>
    )
  }

  const locale = i18n.language
  const fmtNum = (n: number) => n.toLocaleString(locale)

  const kpiItems = [
    { label: t('dashboard.salesTotal'), value: stats.salesTotal, suffix: t('units.currency'), icon: <DollarOutlined />, accent: '#22d3ee' },
    { label: t('dashboard.purchaseOrders'), value: stats.purchaseOrderCount, suffix: t('units.order'), icon: <ShoppingCartOutlined />, accent: '#3b82f6' },
    { label: t('dashboard.inventoryQty'), value: stats.inventoryQuantity, icon: <InboxOutlined />, accent: '#34d399' },
    { label: t('dashboard.users'), value: stats.userCount, suffix: t('units.person'), icon: <TeamOutlined />, accent: '#a78bfa' },
    { label: t('report.salesOrders'), value: stats.salesOrderCount, suffix: t('units.order'), icon: <FileTextOutlined />, accent: '#fbbf24' },
    { label: t('report.purchaseTotal'), value: stats.purchaseTotal, suffix: t('units.currency'), icon: <ShoppingCartOutlined />, accent: '#60a5fa' },
  ]

  const overviewRows = [
    { label: t('report.employeeCount'), value: `${fmtNum(stats.employeeCount)} ${t('units.person')}` },
    { label: t('bi.projects'), value: `${fmtNum(stats.projectCount)} ${t('bi.projectUnit')}` },
    { label: t('bi.grossMargin'), value: `${marginAnimated}%` },
    {
      label: t('bi.avgOrderValue'),
      value: stats.salesOrderCount
        ? `${fmtNum(Math.round(stats.salesTotal / stats.salesOrderCount))} ${t('units.currency')}`
        : '—',
    },
  ]

  const mapDistricts = feed?.map.districts ?? []
  const mapPoints = feed?.map.points ?? []
  const feedOrders = feed?.orders ?? []
  const feedEvents = feed?.events ?? []

  return (
    <div className="bi-screen" ref={screenRef}>
      <div className="bi-screen__bg" aria-hidden />
      <div className="bi-screen__glow bi-screen__glow--left" aria-hidden />
      <div className="bi-screen__glow bi-screen__glow--right" aria-hidden />
      <div className="bi-screen__scanline" aria-hidden />

      <div className="bi-screen__content">
        <header className="bi-screen__header">
          <div className="bi-screen__header-deco" aria-hidden />
          <div className="bi-screen__header-main">
            <p className="bi-screen__eyebrow">{t('bi.eyebrow')}</p>
            <h1 className="bi-screen__title">{t('bi.title')}</h1>
            <p className="bi-screen__subtitle">
              <SyncOutlined spin={loading} className="bi-screen__refresh-icon" />
              {t('bi.autoRefresh')}
              {lastUpdated ? (
                <span className="bi-screen__updated">
                  · {t('bi.updatedAt')} {formatDateTime(lastUpdated, timezone, locale)}
                </span>
              ) : null}
            </p>
          </div>
          <div className="bi-screen__header-side">
            <BiScreenClock />
            <Button
              type="primary"
              ghost
              className="bi-screen__fullscreen-btn"
              icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            >
              {fullscreen ? t('bi.exitFullscreen') : t('bi.fullscreen')}
            </Button>
          </div>
        </header>

        <section className="bi-screen__kpis">
          {kpiItems.map((item, i) => (
            <BiKpi key={item.label} {...item} delay={i * 80} />
          ))}
        </section>

        <Row gutter={[16, 16]} className="bi-screen__row">
          <Col xs={24} xl={10}>
            <BiPanel title={t('bi.leadMap')}>
              <BiDistrictMap districts={mapDistricts} points={mapPoints} height={280} />
            </BiPanel>
          </Col>
          <Col xs={24} xl={14}>
            <BiPanel title={t('dashboard.salesTrend')}>
              <ReactECharts option={salesOption} style={chartStyle(CHART_H_LG)} lazyUpdate />
            </BiPanel>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="bi-screen__row">
          <Col xs={24} lg={8}>
            <BiPanel title={t('dashboard.orderStatus')}>
              <ReactECharts option={salesPieOption} style={chartStyle(CHART_H_MD)} lazyUpdate />
            </BiPanel>
          </Col>
          <Col xs={24} lg={8}>
            <BiPanel title={t('report.purchaseOrderStatus')}>
              <ReactECharts option={purchasePieOption} style={chartStyle(CHART_H_MD)} lazyUpdate />
            </BiPanel>
          </Col>
          <Col xs={24} lg={8}>
            <BiPanel title={t('bi.overview')}>
              <ul className="bi-screen__overview">
                {overviewRows.map((row) => (
                  <li key={row.label} className="bi-screen__overview-item">
                    <span className="bi-screen__overview-label">{row.label}</span>
                    <span className="bi-screen__overview-value">{row.value}</span>
                  </li>
                ))}
              </ul>
              <div className="bi-screen__margin-ring">
                <div
                  className="bi-screen__margin-fill"
                  style={{ ['--margin-pct' as string]: `${Math.min(grossMarginPct, 100)}%` }}
                />
                <div className="bi-screen__margin-center">
                  <ProjectOutlined className="bi-screen__margin-icon" />
                  <span className="bi-screen__margin-num">{marginAnimated}%</span>
                  <span className="bi-screen__margin-label">{t('bi.grossMargin')}</span>
                </div>
              </div>
            </BiPanel>
          </Col>
        </Row>

        <Row gutter={[16, 16]} className="bi-screen__row">
          <Col xs={24} lg={12}>
            <BiPanel title={t('bi.eventStream')} className="bi-screen__panel--feed">
              <BiEventStream events={feedEvents} />
            </BiPanel>
          </Col>
          <Col xs={24} lg={12}>
            <BiPanel title={t('bi.salesVsPurchase')}>
              <ReactECharts option={compareOption} style={chartStyle(CHART_H_MD)} lazyUpdate />
            </BiPanel>
          </Col>
        </Row>

        <div className="bi-screen__bottom">
          <div className="bi-screen__bottom-label">
            <span className="bi-screen__panel-dot" aria-hidden />
            {t('bi.recentOrders')}
          </div>
          <BiScrollOrders orders={feedOrders} />
        </div>
      </div>
    </div>
  )
}
