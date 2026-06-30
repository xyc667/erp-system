import { useCallback, useEffect, useState } from 'react'
import { Button, DatePicker, Drawer, Form, Input, Modal, Select, Space, Tag, Timeline, Upload, message } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import ResponsiveTable from '../../components/ResponsiveTable'
import { CONTACT_RESULT_I18N, CONTACT_RESULTS, REVIEW_STATUS_I18N } from '../../config/contactResults'
import { contactReportsService } from '../../services/contactReports'
import { Lead, leadsService } from '../../services/leads'

export default function MyLeads() {
  const { t } = useTranslation()
  const [data, setData] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [activeLead, setActiveLead] = useState<Lead | null>(null)
  const [drawerMode, setDrawerMode] = useState<'follow' | 'report' | null>(null)
  const [followForm] = Form.useForm()
  const [reportForm] = Form.useForm()
  const [convertForm] = Form.useForm()
  const [convertOpen, setConvertOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [recordingFileId, setRecordingFileId] = useState<string>()
  const [recordingName, setRecordingName] = useState<string>()
  const reportResult = Form.useWatch('result', reportForm)

  const fetchData = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const res = await leadsService.getMine({ page: p, pageSize: 20 })
      setData(res.data.items)
      setTotal(res.data.total)
      setPage(p)
    } catch {
      message.error(t('leads.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [page, t])

  useEffect(() => { fetchData(1) }, [])

  const daysLeft = (expireAt?: string) => {
    if (!expireAt) return null
    return Math.ceil((new Date(expireAt).getTime() - Date.now()) / 86400000)
  }

  const resultLabel = (key?: string) => {
    if (!key) return null
    const i18nKey = CONTACT_RESULT_I18N[key as keyof typeof CONTACT_RESULT_I18N]
    return i18nKey ? t(`leads.${i18nKey}`) : key
  }

  const openLeadDetail = async (lead: Lead, mode: 'follow' | 'report') => {
    try {
      const res = await leadsService.getById(lead.id)
      setActiveLead(res.data)
      setDrawerMode(mode)
      setRecordingFileId(undefined)
      setRecordingName(undefined)
      if (mode === 'follow') followForm.resetFields()
      else reportForm.resetFields()
    } catch {
      message.error(t('leads.loadFailed'))
    }
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setActiveLead(null)
  }

  const submitFollow = async (values: { type: string; content: string; quality?: string }) => {
    if (!activeLead) return
    try {
      await leadsService.addFollowUp(activeLead.id, values)
      message.success(t('leads.followSuccess'))
      closeDrawer()
      fetchData(page)
    } catch {
      message.error(t('common.operationFailed'))
    }
  }

  const submitReport = async (values: {
    type: string
    result: string
    content: string
    nextActionAt?: dayjs.Dayjs
    quality?: string
  }) => {
    if (!activeLead) return
    try {
      await contactReportsService.submit(activeLead.id, {
        type: values.type,
        result: values.result,
        content: values.content,
        quality: values.quality,
        recordingFileId,
        nextActionAt: values.nextActionAt?.toISOString(),
      })
      message.success(t('leads.reportSuccess'))
      closeDrawer()
      fetchData(page)
    } catch {
      message.error(t('common.operationFailed'))
    }
  }

  const handleRecordingUpload = async (file: File) => {
    setUploading(true)
    try {
      const res = await contactReportsService.uploadRecording(file)
      setRecordingFileId(res.data.id)
      setRecordingName(res.data.fileName)
      message.success(t('leads.recordingUploaded'))
    } catch {
      message.error(t('leads.recordingUploadFailed'))
    } finally {
      setUploading(false)
    }
    return false
  }

  const handleRelease = (id: string) => {
    Modal.confirm({
      title: t('leads.releaseConfirm'),
      onOk: async () => {
        await leadsService.release(id)
        message.success(t('leads.releaseSuccess'))
        fetchData(page)
      },
    })
  }

  const openConvert = (lead: Lead) => {
    setActiveLead(lead)
    setDrawerMode(null)
    convertForm.setFieldsValue({
      name: lead.name,
      contactPhone: lead.phone,
      address: lead.address,
    })
    setConvertOpen(true)
  }

  const submitConvert = async (values: { name: string; contactPhone?: string; address?: string }) => {
    if (!activeLead) return
    try {
      await leadsService.convert(activeLead.id, values)
      message.success(t('leads.convertSuccess'))
      setConvertOpen(false)
      setActiveLead(null)
      fetchData(page)
    } catch {
      message.error(t('common.operationFailed'))
    }
  }

  const handleInvalidate = (lead: Lead, reason: string) => {
    Modal.confirm({
      title: t('leads.invalidateConfirm'),
      onOk: async () => {
        await leadsService.invalidate(lead.id, { reason })
        message.success(t('common.updateSuccess'))
        fetchData(page)
      },
    })
  }

  const columns = [
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.phone'), dataIndex: 'phone', key: 'phone' },
    { title: t('leads.district'), dataIndex: 'district', key: 'district' },
    {
      title: t('leads.protection'),
      key: 'protection',
      render: (_: unknown, r: Lead) => {
        const d = daysLeft(r.expireAt)
        if (d === null) return '—'
        return d <= 3 ? <Tag color="red">{t('leads.daysLeft', { days: d })}</Tag> : t('leads.daysLeft', { days: d })
      },
    },
    { title: t('leads.followCount'), dataIndex: 'followUpCount', key: 'followUpCount' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Lead) => (
        <Space wrap>
          <Button type="primary" size="small" onClick={() => openLeadDetail(record, 'report')}>{t('leads.contactReport')}</Button>
          <Button type="link" size="small" onClick={() => openLeadDetail(record, 'follow')}>{t('leads.follow')}</Button>
          <Button type="link" size="small" onClick={() => openConvert(record)}>{t('leads.convert')}</Button>
          <Button type="link" size="small" onClick={() => handleRelease(record.id)}>{t('leads.release')}</Button>
          <Button type="link" size="small" danger onClick={() => handleInvalidate(record, 'empty_phone')}>{t('leads.markInvalid')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <ResponsiveTable
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ current: page, total, pageSize: 20, onChange: (p) => fetchData(p) }}
      />

      <Drawer
        title={drawerMode === 'report' ? t('leads.contactReport') : t('leads.follow')}
        open={!!activeLead && !!drawerMode && !convertOpen}
        onClose={closeDrawer}
        width={520}
      >
        {activeLead && drawerMode === 'follow' && (
          <>
            <p className="font-medium mb-2">{activeLead.name}</p>
            <Form form={followForm} layout="vertical" onFinish={submitFollow}>
              <Form.Item name="type" label={t('leads.followType')} rules={[{ required: true }]}>
                <Select options={[
                  { value: 'call', label: t('leads.followCall') },
                  { value: 'visit', label: t('leads.followVisit') },
                  { value: 'wechat', label: t('leads.followWechat') },
                  { value: 'other', label: t('leads.followOther') },
                ]} />
              </Form.Item>
              <Form.Item name="content" label={t('leads.followContent')} rules={[{ required: true }]}>
                <Input.TextArea rows={4} />
              </Form.Item>
              <Form.Item name="quality" label={t('leads.qualityMark')}>
                <Select allowClear options={[
                  { value: 'valid', label: t('leads.qualityValid') },
                  { value: 'empty_phone', label: t('leads.qualityEmpty') },
                  { value: 'closed', label: t('leads.qualityClosed') },
                ]} />
              </Form.Item>
              <Button type="primary" htmlType="submit">{t('common.save')}</Button>
            </Form>
            {renderTimeline(activeLead, t, resultLabel)}
          </>
        )}

        {activeLead && drawerMode === 'report' && (
          <>
            <p className="font-medium mb-2">{activeLead.name} · {activeLead.phone || '—'}</p>
            <Form form={reportForm} layout="vertical" onFinish={submitReport}>
              <Form.Item name="type" label={t('leads.followType')} rules={[{ required: true }]}>
                <Select options={[
                  { value: 'call', label: t('leads.followCall') },
                  { value: 'visit', label: t('leads.followVisit') },
                  { value: 'wechat', label: t('leads.followWechat') },
                  { value: 'other', label: t('leads.followOther') },
                ]} />
              </Form.Item>
              <Form.Item name="result" label={t('leads.contactResult')} rules={[{ required: true }]}>
                <Select options={CONTACT_RESULTS.map((r) => ({
                  value: r,
                  label: t(`leads.${CONTACT_RESULT_I18N[r]}`),
                }))} />
              </Form.Item>
              <Form.Item name="content" label={t('leads.reportSummary')} rules={[{ required: true }]}>
                <Input.TextArea rows={4} placeholder={t('leads.reportSummaryHint')} />
              </Form.Item>
              {reportResult === 'schedule_next' && (
                <Form.Item name="nextActionAt" label={t('leads.nextContactAt')} rules={[{ required: true }]}>
                  <DatePicker showTime className="w-full" />
                </Form.Item>
              )}
              <Form.Item label={t('leads.recordingOptional')}>
                <Upload beforeUpload={handleRecordingUpload} maxCount={1} accept="audio/*,.mp3,.m4a,.wav">
                  <Button icon={<UploadOutlined />} loading={uploading}>{t('leads.uploadRecording')}</Button>
                </Upload>
                {recordingName && <div className="text-sm text-gray-500 mt-1">{recordingName}</div>}
              </Form.Item>
              <Form.Item name="quality" label={t('leads.qualityMark')}>
                <Select allowClear options={[
                  { value: 'valid', label: t('leads.qualityValid') },
                  { value: 'empty_phone', label: t('leads.qualityEmpty') },
                  { value: 'closed', label: t('leads.qualityClosed') },
                ]} />
              </Form.Item>
              <Button type="primary" htmlType="submit" block>{t('leads.submitReport')}</Button>
            </Form>
            {renderTimeline(activeLead, t, resultLabel)}
          </>
        )}
      </Drawer>

      <Modal title={t('leads.convert')} open={convertOpen} onCancel={() => setConvertOpen(false)} footer={null}>
        <Form form={convertForm} layout="vertical" onFinish={submitConvert}>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactPhone" label={t('common.phone')}>
            <Input />
          </Form.Item>
          <Form.Item name="address" label={t('common.address')}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>{t('leads.convertSubmit')}</Button>
        </Form>
      </Modal>
    </div>
  )
}

function renderTimeline(
  lead: Lead,
  t: (key: string) => string,
  resultLabel: (key?: string) => string | null,
) {
  if (!lead.followUps?.length) return null
  return (
    <Timeline
      className="mt-6"
      items={lead.followUps.map((f) => ({
        children: (
          <div>
            <div className="text-gray-500 text-sm">
              {f.user?.name} · {new Date(f.createdAt).toLocaleString()}
              {f.isReport && f.reviewStatus && (
                <Tag className="ml-2" color={f.reviewStatus === 'approved' ? 'green' : f.reviewStatus === 'rejected' ? 'red' : 'orange'}>
                  {t(`leads.${REVIEW_STATUS_I18N[f.reviewStatus]}`)}
                </Tag>
              )}
            </div>
            {f.result && <Tag>{resultLabel(f.result)}</Tag>}
            <div>{f.content}</div>
            {f.recordingFile && <div className="text-sm text-gray-500">{f.recordingFile.fileName}</div>}
          </div>
        ),
      }))}
    />
  )
}
