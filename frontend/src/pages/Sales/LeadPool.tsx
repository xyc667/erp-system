import { useCallback, useEffect, useState } from 'react'
import { Button, Form, Input, Select, Space, Tag, message } from 'antd'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import ResponsiveTable from '../../components/ResponsiveTable'
import { Lead, leadsService } from '../../services/leads'
import { LEAD_CATEGORIES, LEAD_DISTRICTS } from '../../config/leadFilters'

export default function LeadPool() {
  const { t } = useTranslation()
  const [form] = Form.useForm()
  const [data, setData] = useState<Lead[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [quota, setQuota] = useState({ claimed: 0, limit: 50, remaining: 50 })

  const fetchQuota = useCallback(async () => {
    try {
      const res = await leadsService.getQuota()
      setQuota(res.data)
    } catch { /* ignore */ }
  }, [])

  const fetchData = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await leadsService.getPool({ ...values, page: p, pageSize: 20 })
      setData(res.data.items)
      setTotal(res.data.total)
      setPage(p)
    } catch {
      message.error(t('leads.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [form, page, t])

  useEffect(() => {
    fetchData(1)
    fetchQuota()
  }, [])

  const handleClaim = async (id: string) => {
    try {
      await leadsService.claim(id)
      message.success(t('leads.claimSuccess'))
      fetchData(page)
      fetchQuota()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      message.error(err.response?.data?.message || t('leads.claimFailed'))
    }
  }

  const handleBatchClaim = async () => {
    if (selected.length === 0) return
    try {
      await leadsService.claimBatch(selected)
      message.success(t('leads.claimSuccess'))
      setSelected([])
      fetchData(page)
      fetchQuota()
    } catch {
      message.error(t('leads.claimFailed'))
    }
  }

  const columns = [
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.phone'), dataIndex: 'phone', key: 'phone', render: (v: string) => v || '—' },
    { title: t('leads.district'), dataIndex: 'district', key: 'district' },
    { title: t('common.category'), dataIndex: 'category', key: 'category' },
    { title: t('common.address'), dataIndex: 'address', key: 'address', ellipsis: true },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Lead) => (
        <Button type="link" size="small" onClick={() => handleClaim(record.id)}>
          {t('leads.claim')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Tag color="blue">{t('leads.quotaHint', { claimed: quota.claimed, limit: quota.limit })}</Tag>
        <Space>
          <Button disabled={selected.length === 0} onClick={handleBatchClaim}>
            {t('leads.batchClaim')} ({selected.length})
          </Button>
          <Button onClick={() => fetchData(page)}>{t('common.refresh')}</Button>
        </Space>
      </div>
      <Form form={form} layout="inline" className="mb-4" onFinish={() => fetchData(1)}>
        <Form.Item name="district">
          <Select allowClear placeholder={t('leads.district')} style={{ width: 130 }} options={LEAD_DISTRICTS.map((d) => ({ value: d, label: d }))} />
        </Form.Item>
        <Form.Item name="category">
          <Select allowClear placeholder={t('common.category')} style={{ width: 160 }} options={LEAD_CATEGORIES.map((c) => ({ value: c, label: c }))} />
        </Form.Item>
        <Form.Item name="hasPhone">
          <Select allowClear placeholder={t('leads.hasPhone')} style={{ width: 120 }} options={[
            { value: 'true', label: t('leads.withPhone') },
            { value: 'false', label: t('leads.noPhone') },
          ]} />
        </Form.Item>
        <Form.Item name="keyword">
          <Input placeholder={t('leads.keyword')} allowClear />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">{t('common.search')}</Button>
        </Form.Item>
      </Form>
      <ResponsiveTable
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        rowSelection={{
          selectedRowKeys: selected,
          onChange: (keys) => setSelected(keys as string[]),
        }}
        pagination={{
          current: page,
          total,
          pageSize: 20,
          onChange: (p) => fetchData(p),
        }}
      />
    </div>
  )
}
