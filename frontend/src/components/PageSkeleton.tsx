import { Col, Row, Skeleton } from 'antd'
import { brand } from '../theme/brand'

function MetricSkeleton() {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: '20px 22px',
        boxShadow: brand.cardShadow,
        height: '100%',
      }}
    >
      <Skeleton.Input active size="small" style={{ width: 96, marginBottom: 12 }} />
      <Skeleton.Input active size="large" style={{ width: '60%' }} />
    </div>
  )
}

function ChartCardSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        padding: 20,
        boxShadow: brand.cardShadow,
        height: '100%',
      }}
    >
      <Skeleton.Input active size="small" style={{ width: 120, marginBottom: 16 }} />
      <Skeleton.Node active style={{ width: '100%', height }}>
        <div />
      </Skeleton.Node>
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="page-skeleton" data-testid="dashboard-skeleton">
      <div
        style={{
          background: `linear-gradient(135deg, ${brand.primary} 0%, ${brand.primaryLight} 100%)`,
          borderRadius: 12,
          padding: '24px 28px',
          marginBottom: 16,
        }}
      >
        <Skeleton.Input active size="large" style={{ width: 220, marginBottom: 8 }} />
        <Skeleton.Input active size="small" style={{ width: 160 }} />
      </div>
      <Row gutter={[16, 16]} className="mb-4">
        {[0, 1, 2, 3].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <MetricSkeleton />
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <ChartCardSkeleton />
        </Col>
        <Col xs={24} lg={10}>
          <ChartCardSkeleton height={280} />
        </Col>
      </Row>
    </div>
  )
}

export function ReportSkeleton({ statCount = 6 }: { statCount?: number }) {
  return (
    <div className="page-skeleton">
      <Skeleton.Input active size="large" style={{ width: 180, marginBottom: 20 }} />
      <Row gutter={16} className="mb-6">
        {Array.from({ length: statCount }).map((_, i) => (
          <Col xs={24} sm={12} md={8} lg={4} key={i}>
            <MetricSkeleton />
          </Col>
        ))}
      </Row>
      <Row gutter={16}>
        <Col xs={24} lg={12}>
          <ChartCardSkeleton />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ChartCardSkeleton height={280} />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <ChartCardSkeleton height={280} />
        </Col>
      </Row>
    </div>
  )
}

export function TablePageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="page-skeleton">
      <Skeleton.Input active size="large" style={{ width: 160, marginBottom: 20 }} />
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: '16px 20px',
          boxShadow: brand.cardShadow,
        }}
      >
        <Skeleton.Button active size="default" style={{ width: 100, marginBottom: 16 }} />
        <Skeleton active paragraph={{ rows }} title={false} />
      </div>
    </div>
  )
}

export function TableLoadingSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="table-loading-skeleton" style={{ padding: '8px 0' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          active
          title={false}
          paragraph={{ rows: 1, width: ['100%'] }}
          style={{ marginBottom: 12 }}
        />
      ))}
    </div>
  )
}

export function BiScreenSkeleton() {
  return (
    <div className="bi-screen">
      <div className="bi-screen__bg" aria-hidden />
      <div className="bi-screen__content">
        <Skeleton.Input active size="large" style={{ width: 280, marginBottom: 8 }} />
        <Skeleton.Input active size="small" style={{ width: 160, marginBottom: 20 }} />
        <Row gutter={[12, 12]} className="mb-4">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Col xs={12} sm={8} lg={4} key={i}>
              <Skeleton.Node active style={{ width: '100%', height: 72 }}>
                <div />
              </Skeleton.Node>
            </Col>
          ))}
        </Row>
        <Row gutter={[16, 16]}>
          <Col xs={24} xl={14}>
            <Skeleton.Node active style={{ width: '100%', height: 300 }}>
              <div />
            </Skeleton.Node>
          </Col>
          <Col xs={24} xl={10}>
            <Skeleton.Node active style={{ width: '100%', height: 300 }}>
              <div />
            </Skeleton.Node>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export type PageSkeletonVariant = 'dashboard' | 'report' | 'table' | 'bi'

export default function PageSkeleton({
  variant = 'table',
  statCount,
}: {
  variant?: PageSkeletonVariant
  statCount?: number
}) {
  switch (variant) {
    case 'dashboard':
      return <DashboardSkeleton />
    case 'report':
      return <ReportSkeleton statCount={statCount} />
    case 'bi':
      return <BiScreenSkeleton />
    default:
      return <TablePageSkeleton />
  }
}
