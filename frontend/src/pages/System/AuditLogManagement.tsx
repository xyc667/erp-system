import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import PageFilterForm from '../../components/PageFilterForm'
import { Form, Select, Input, DatePicker, Button, Tag, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import { auditLogsService, AuditLog } from '../../services/auditLogs'
import ResponsiveTable from '../../components/ResponsiveTable'

const categoryColors: Record<string, string> = {
  auth: 'blue',
  operation: 'green',
  security: 'red',
}

export default function AuditLogManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<AuditLog[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [form] = Form.useForm()

  const fetchData = async (pageNum = page, size = pageSize) => {
    setLoading(true)
    try {
      const values = form.getFieldsValue()
      const res = await auditLogsService.getAll({
        category: values.category,
        action: values.action,
        username: values.username,
        result: values.result,
        startDate: values.dateRange?.[0]?.format('YYYY-MM-DD'),
        endDate: values.dateRange?.[1]?.format('YYYY-MM-DD'),
        page: pageNum,
        pageSize: size,
      })
      setData(res.data.items)
      setTotal(res.data.total)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const columns = [
    {
      title: t('common.time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: t('common.category'),
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => (
        <Tag color={categoryColors[v] || 'default'}>{t(`auditCategory.${v}`, v)}</Tag>
      ),
    },
    { title: t('common.action'), dataIndex: 'action', key: 'action', width: 120 },
    { title: t('common.user'), dataIndex: 'username', key: 'username', width: 100 },
    { title: t('common.role'), dataIndex: 'role', key: 'role', width: 100 },
    { title: t('common.resource'), dataIndex: 'resource', key: 'resource' },
    {
      title: t('common.result'),
      dataIndex: 'result',
      key: 'result',
      width: 90,
      render: (v: string) => (
        <Tag color={v === 'SUCCESS' ? 'success' : 'error'}>{v}</Tag>
      ),
    },
    { title: 'IP', dataIndex: 'ipAddress', key: 'ipAddress', width: 120 },
    {
      title: t('common.detail'),
      dataIndex: 'detail',
      key: 'detail',
      ellipsis: true,
    },
  ]

  return (
    <div>
      <PageTitle />
      <PageSection>
      <PageFilterForm form={form} onFinish={() => {
        setPage(1)
        fetchData(1, pageSize)
      }}>
        <Form.Item name="category" label={t('common.category')}>
          <Select allowClear style={{ width: 120 }}>
            {(['auth', 'operation', 'security'] as const).map((k) => (
              <Select.Option key={k} value={k}>{t(`auditCategory.${k}`)}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="action" label={t('common.action')}>
          <Input allowClear placeholder="LOGIN / CREATE" style={{ width: 140 }} />
        </Form.Item>
        <Form.Item name="username" label={t('common.user')}>
          <Input allowClear style={{ width: 120 }} />
        </Form.Item>
        <Form.Item name="result" label={t('common.result')}>
          <Select allowClear style={{ width: 100 }}>
            <Select.Option value="SUCCESS">SUCCESS</Select.Option>
            <Select.Option value="FAILURE">FAILURE</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="dateRange" label={t('common.dateRange')}>
          <DatePicker.RangePicker />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit">{t('common.search')}</Button>
            <Button onClick={() => {
              form.resetFields()
              setPage(1)
              fetchData(1, pageSize)
            }}>{t('common.reset')}</Button>
          </Space>
        </Form.Item>
      </PageFilterForm>
      <ResponsiveTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, s) => {
            setPage(p)
            setPageSize(s)
            fetchData(p, s)
          },
        }}
        scroll={{ x: 1100 }}
      />
    </PageSection>
    </div>
  )
}
