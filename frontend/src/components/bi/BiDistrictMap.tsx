import { useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { useTranslation } from 'react-i18next'
import type { BiFeedMapDistrict, BiFeedMapPoint } from '../../services/report'
import { SHENYANG_BOUNDS } from '../../config/shenyangGeo'

interface BiDistrictMapProps {
  districts: BiFeedMapDistrict[]
  points: BiFeedMapPoint[]
  height?: number | string
}

export default function BiDistrictMap({ districts, points, height = 280 }: BiDistrictMapProps) {
  const { t } = useTranslation()

  const option = useMemo(() => {
    const maxCount = Math.max(...districts.map((d) => d.count), 1)

    return {
      backgroundColor: 'transparent',
      animationDurationUpdate: 0,
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(8, 20, 40, 0.92)',
        borderColor: 'rgba(34, 211, 238, 0.35)',
        borderWidth: 1,
        textStyle: { color: '#e2e8f0', fontSize: 12 },
        formatter: (params: { seriesName: string; data: unknown[] | { name: string; value: number[] } }) => {
          if (params.seriesName === t('bi.mapDistricts')) {
            const d = params.data as { name: string; value: number[] }
            return `${d.name}<br/>${t('bi.leadCount')}: ${d.value[2]}`
          }
          const p = params.data as unknown[]
          return `${p[2]}<br/>${p[3] ?? ''}`
        },
      },
      grid: { left: 8, right: 8, top: 8, bottom: 8 },
      xAxis: {
        type: 'value',
        min: SHENYANG_BOUNDS.lngMin,
        max: SHENYANG_BOUNDS.lngMax,
        show: false,
      },
      yAxis: {
        type: 'value',
        min: SHENYANG_BOUNDS.latMin,
        max: SHENYANG_BOUNDS.latMax,
        show: false,
      },
      series: [
        {
          name: t('bi.mapLeads'),
          type: 'scatter',
          symbolSize: 4,
          itemStyle: { color: 'rgba(34, 211, 238, 0.35)' },
          data: points.map((p) => [p.lng, p.lat, p.name, p.category]),
          animationDuration: 1000,
        },
        {
          name: t('bi.mapDistricts'),
          type: 'effectScatter',
          rippleEffect: { brushType: 'stroke', scale: 2, period: 5 },
          symbolSize: (val: number[]) => 12 + (val[2] / maxCount) * 28,
          itemStyle: {
            color: {
              type: 'radial',
              x: 0.5,
              y: 0.5,
              r: 0.5,
              colorStops: [
                { offset: 0, color: 'rgba(34, 211, 238, 0.9)' },
                { offset: 1, color: 'rgba(34, 211, 238, 0.15)' },
              ],
            },
            shadowBlur: 12,
            shadowColor: 'rgba(34, 211, 238, 0.4)',
          },
          label: {
            show: true,
            formatter: '{b}',
            position: 'right',
            color: '#94a3b8',
            fontSize: 10,
          },
          data: districts.map((d) => ({
            name: d.district,
            value: [d.lng, d.lat, d.count],
          })),
          animationDuration: 1200,
        },
      ],
    }
  }, [districts, points, t])

  return (
    <div className="bi-screen__map-wrap">
      <div className="bi-screen__map-grid" aria-hidden />
      <ReactECharts option={option} style={{ height, width: '100%' }} lazyUpdate />
    </div>
  )
}
