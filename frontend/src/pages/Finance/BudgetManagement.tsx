import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, Input, InputNumber, Select, Tag, Progress, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { budgetsService, Budget } from '../../services/budgets'
import { departmentsService, Department } from '../../services/departments'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function BudgetManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Budget[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [budgetRes, deptRes] = await Promise.all([
        budgetsService.getAll(),
        departmentsService.getAll(),
      ])
      setData(budgetRes.data)
      setDepartments(deptRes.data)
    } catch {
      message.error(t('finance.loadBudgetsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.code'), dataIndex: 'code', key: 'code' },
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.year'), dataIndex: 'year', key: 'year' },
    {
      title: t('common.category'),
      dataIndex: 'category',
      key: 'category',
      render: (v: string) => t(`budgetCategory.${v}`, v),
    },
    { title: t('common.department'), dataIndex: ['department', 'name'], key: 'department' },
    { title: t('common.totalAmount'), dataIndex: 'totalAmount', key: 'totalAmount' },
    { title: t('common.usedAmount'), dataIndex: 'usedAmount', key: 'usedAmount' },
    {
      title: t('common.usageRate'),
      key: 'usage',
      render: (_: unknown, r: Budget) => {
        const pct = Number(r.totalAmount) > 0
          ? Math.round((Number(r.usedAmount) / Number(r.totalAmount)) * 100)
          : 0
        return (
          <Progress
            percent={pct}
            size="small"
            status={pct > 100 ? 'exception' : pct > 80 ? 'active' : 'normal'}
          />
        )
      },
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={s === 'active' ? 'green' : 'default'}>{t(`status.${s}`, s)}</Tag>,
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Budget) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
          Modal.confirm({
            title: t('common.confirmDelete'),
            onOk: async () => {
              await budgetsService.delete(record.id)
              message.success(t('common.deleteSuccess'))
              fetchData()
            },
          })
        }}>{t('common.delete')}</Button>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        form.setFieldsValue({ year: new Date().getFullYear(), category: 'procurement' })
        setModalOpen(true)
      }}>{t('finance.addBudget')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={t('finance.addBudgetModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await budgetsService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="code" label={t('common.code')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="year" label={t('common.year')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="category" label={t('common.category')} rules={[{ required: true }]}>
            <Select>
              {(['procurement', 'sales', 'general'] as const).map((k) => (
                <Select.Option key={k} value={k}>{t(`budgetCategory.${k}`)}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="departmentId" label={t('common.department')}>
            <Select allowClear>
              {departments.map((d) => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="totalAmount" label={t('common.budgetTotal')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.save')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
