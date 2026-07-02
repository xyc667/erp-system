import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, Form, Input, InputNumber, message, Modal, Select, Tag } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { performanceService, PerformanceReview } from '../../services/performance'
import { employeesService, Employee } from '../../services/employees'
import ResponsiveTable from '../../components/ResponsiveTable'

const gradeColors: Record<string, string> = { A: 'green', B: 'blue', C: 'orange', D: 'red' }

export default function PerformanceManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<PerformanceReview[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [perfRes, empRes] = await Promise.all([performanceService.getAll(), employeesService.getAll()])
      setData(perfRes.data)
      setEmployees(empRes.data)
    } catch {
      message.error(t('hr.loadPerformanceFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.employee'), dataIndex: ['employee', 'name'], key: 'employee' },
    { title: t('common.period'), dataIndex: 'period', key: 'period' },
    { title: t('common.score'), dataIndex: 'score', key: 'score' },
    {
      title: t('common.grade'),
      dataIndex: 'grade',
      key: 'grade',
      render: (g: string) => g ? <Tag color={gradeColors[g] || 'default'}>{g}</Tag> : '-',
    },
    { title: t('common.comment'), dataIndex: 'comment', key: 'comment', ellipsis: true },
    { title: t('common.reviewer'), dataIndex: ['reviewer', 'name'], key: 'reviewer' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: PerformanceReview) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
          Modal.confirm({
            title: t('common.confirmDelete'),
            onOk: async () => {
              await performanceService.delete(record.id)
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
      <PageSection>
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        setModalOpen(true)
      }}>{t('hr.createPerformance')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </PageSection>
      <FormModal title={t('hr.createPerformanceModal')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={async (values) => {
          await performanceService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="employeeId" label={t('common.employee')} rules={[{ required: true }]}>
            <Select>{employees.map((e) => <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="period" label={t('common.period')} rules={[{ required: true }]}>
            <Input placeholder={t('hr.periodPlaceholder')} />
          </Form.Item>
          <Form.Item name="score" label={t('common.score')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="comment" label={t('common.comment')}><Input.TextArea /></Form.Item>
      </FormModal>
    </div>
  )
}
