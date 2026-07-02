import { useCallback, useEffect, useState } from 'react'
import { Button, Col, Input, Modal, Row, Space, Statistic, Table, Tabs, Tag, message } from 'antd'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import PageCard from '../../components/PageCard'
import { CONTACT_RESULT_I18N, REVIEW_STATUS_I18N } from '../../config/contactResults'
import { ContactReport, contactReportsService } from '../../services/contactReports'

export default function LeadReports() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<Awaited<ReturnType<typeof contactReportsService.getStats>>['data'] | null>(null)
  const [pending, setPending] = useState<ContactReport[]>([])
  const [pendingTotal, setPendingTotal] = useState(0)
  const [allReports, setAllReports] = useState<ContactReport[]>([])
  const [allTotal, setAllTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<ContactReport | null>(null)
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected'>('approved')
  const [reviewComment, setReviewComment] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioTitle, setAudioTitle] = useState('')

  const resultLabel = (key?: string | null) => {
    if (!key) return '—'
    const i18nKey = CONTACT_RESULT_I18N[key as keyof typeof CONTACT_RESULT_I18N]
    return i18nKey ? t(`leads.${i18nKey}`) : key
  }

  const reviewLabel = (key?: string | null) => {
    if (!key) return '—'
    const i18nKey = REVIEW_STATUS_I18N[key]
    return i18nKey ? t(`leads.${i18nKey}`) : key
  }

  const loadStats = useCallback(async () => {
    try {
      const res = await contactReportsService.getStats()
      setStats(res.data)
    } catch {
      message.error(t('leads.loadFailed'))
    }
  }, [t])

  const loadPending = useCallback(async () => {
    setLoading(true)
    try {
      const res = await contactReportsService.list({ reviewStatus: 'pending', page: 1, pageSize: 50 })
      setPending(res.data.items)
      setPendingTotal(res.data.total)
    } catch {
      message.error(t('leads.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  const loadAll = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const res = await contactReportsService.list({ page: p, pageSize: 20 })
      setAllReports(res.data.items)
      setAllTotal(res.data.total)
      setPage(p)
    } catch {
      message.error(t('leads.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, t])

  useEffect(() => {
    loadStats()
    loadPending()
    loadAll(1)
  }, [])

  const playRecording = async (report: ContactReport) => {
    try {
      const res = await contactReportsService.getRecordingUrl(report.id)
      if (res.data.url) {
        setAudioTitle(report.recordingFile?.fileName || report.lead?.name || t('leads.recording'))
        setAudioUrl(res.data.url)
      } else message.warning(t('leads.recordingUnavailable'))
    } catch {
      message.error(t('leads.recordingLoadFailed'))
    }
  }

  const handleReview = (report: ContactReport, status: 'approved' | 'rejected') => {
    setReviewTarget(report)
    setReviewStatus(status)
    setReviewComment('')
  }

  const submitReview = async () => {
    if (!reviewTarget) return
    await contactReportsService.review(reviewTarget.id, { status: reviewStatus, comment: reviewComment || undefined })
    message.success(t('common.updateSuccess'))
    setReviewTarget(null)
    loadPending()
    loadAll(page)
    loadStats()
  }

  const columns = [
    { title: t('leads.reporter'), dataIndex: ['user', 'name'], key: 'user' },
    { title: t('common.name'), dataIndex: ['lead', 'name'], key: 'leadName' },
    { title: t('common.phone'), dataIndex: ['lead', 'phone'], key: 'phone', render: (v: string) => v || '—' },
    {
      title: t('leads.contactResult'),
      dataIndex: 'result',
      key: 'result',
      render: (v: string) => <Tag>{resultLabel(v)}</Tag>,
    },
    { title: t('leads.followContent'), dataIndex: 'content', key: 'content', ellipsis: true },
    {
      title: t('leads.recording'),
      key: 'recording',
      render: (_: unknown, r: ContactReport) =>
        r.recordingFile ? (
          <Button type="link" size="small" onClick={() => playRecording(r)}>{t('leads.playRecording')}</Button>
        ) : '—',
    },
    {
      title: t('leads.reviewStatus'),
      dataIndex: 'reviewStatus',
      key: 'reviewStatus',
      render: (v: string) => {
        const color = v === 'approved' ? 'green' : v === 'rejected' ? 'red' : 'orange'
        return <Tag color={color}>{reviewLabel(v)}</Tag>
      },
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, r: ContactReport) =>
        r.reviewStatus === 'pending' ? (
          <Space>
            <Button type="link" size="small" onClick={() => handleReview(r, 'approved')}>{t('leads.reviewApprove')}</Button>
            <Button type="link" size="small" danger onClick={() => handleReview(r, 'rejected')}>{t('leads.reviewReject')}</Button>
          </Space>
        ) : null,
    },
  ]

  return (
    <div>
      <PageTitle />
      <PageSection>
      <Tabs
        items={[
          {
            key: 'pending',
            label: `${t('leads.reviewPending')} (${pendingTotal})`,
            children: (
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={pending}
                pagination={false}
              />
            ),
          },
          {
            key: 'all',
            label: t('leads.allReports'),
            children: (
              <Table
                rowKey="id"
                loading={loading}
                columns={columns}
                dataSource={allReports}
                pagination={{ current: page, total: allTotal, pageSize: 20, onChange: loadAll }}
              />
            ),
          },
          {
            key: 'stats',
            label: t('leads.contactStats'),
            children: stats ? (
              <>
                <Row gutter={16} className="mb-4">
                  <Col xs={12} sm={6}><PageCard><Statistic title={t('leads.reportTotal')} value={stats.total} /></PageCard></Col>
                  <Col xs={12} sm={6}><PageCard><Statistic title={t('leads.reviewPending')} value={stats.pending} /></PageCard></Col>
                  <Col xs={12} sm={6}><PageCard><Statistic title={t('leads.connectedRate')} value={stats.connectedRate} suffix="%" /></PageCard></Col>
                  <Col xs={12} sm={6}><PageCard><Statistic title={t('leads.interestedRate')} value={stats.interestedRate} suffix="%" /></PageCard></Col>
                </Row>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <PageCard title={t('leads.byResult')}>
                      <Table
                        size="small"
                        pagination={false}
                        rowKey={(r) => r.result || 'unknown'}
                        dataSource={stats.byResult}
                        columns={[
                          { title: t('leads.contactResult'), dataIndex: 'result', render: (v) => resultLabel(v) },
                          { title: t('leads.count'), dataIndex: 'count' },
                        ]}
                      />
                    </PageCard>
                  </Col>
                  <Col xs={24} md={12}>
                    <PageCard title={t('leads.byReporter')}>
                      <Table
                        size="small"
                        pagination={false}
                        rowKey="userId"
                        dataSource={stats.byUser}
                        columns={[
                          { title: t('leads.reporter'), dataIndex: 'userName' },
                          { title: t('leads.reportTotal'), dataIndex: 'count' },
                        ]}
                      />
                    </PageCard>
                  </Col>
                </Row>
              </>
            ) : null,
          },
        ]}
      />
      </PageSection>
      <Modal
        title={reviewStatus === 'approved' ? t('leads.reviewApprove') : t('leads.reviewReject')}
        open={!!reviewTarget}
        onCancel={() => setReviewTarget(null)}
        onOk={submitReview}
      >
        <Input.TextArea
          rows={3}
          value={reviewComment}
          placeholder={t('leads.reviewComment')}
          onChange={(e) => setReviewComment(e.target.value)}
        />
      </Modal>
      <Modal
        title={audioTitle || t('leads.recording')}
        open={!!audioUrl}
        footer={null}
        onCancel={() => setAudioUrl(null)}
        destroyOnClose
      >
        {audioUrl ? (
          <audio controls autoPlay style={{ width: '100%' }} src={audioUrl}>
            <track kind="captions" />
          </audio>
        ) : null}
      </Modal>
    </div>
  )
}
