import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, Select, Input, InputNumber, Tag, message } from 'antd'
import { PlusOutlined, DeleteOutlined, DollarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { salaryService, SalaryRecord } from '../../services/salary'
import { employeesService, Employee } from '../../services/employees'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function SalaryManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<SalaryRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [salRes, empRes] = await Promise.all([salaryService.getAll(), employeesService.getAll()])
      setData(salRes.data)
      setEmployees(empRes.data)
    } catch {
      message.error(t('hr.loadSalaryFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.employee'), dataIndex: ['employee', 'name'], key: 'employee' },
    { title: t('common.month'), dataIndex: 'yearMonth', key: 'yearMonth' },
    { title: t('common.baseSalary'), dataIndex: 'baseSalary', key: 'baseSalary' },
    { title: t('common.bonus'), dataIndex: 'bonus', key: 'bonus' },
    { title: t('common.deduction'), dataIndex: 'deduction', key: 'deduction' },
    { title: t('common.netSalary'), dataIndex: 'netSalary', key: 'netSalary' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'paid' ? 'green' : 'default'}>
          {s === 'paid' ? t('status.salaryPaid') : t('status.salaryDraft')}
        </Tag>
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: SalaryRecord) => (
        <>
          {record.status === 'draft' && (
            <Button size="small" icon={<DollarOutlined />} className="mr-2" onClick={async () => {
              await salaryService.pay(record.id)
              message.success(t('hr.paySalarySuccess'))
              fetchData()
            }}>{t('common.paySalary')}</Button>
          )}
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              onOk: async () => {
                await salaryService.delete(record.id)
                message.success(t('common.deleteSuccess'))
                fetchData()
              },
            })
          }}>{t('common.delete')}</Button>
        </>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        setModalOpen(true)
      }}>{t('hr.createSalary')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={t('hr.createSalaryModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await salaryService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="employeeId" label={t('common.employee')} rules={[{ required: true }]}>
            <Select>{employees.map((e) => <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="yearMonth" label={t('common.month')} rules={[{ required: true }]}>
            <Input placeholder={t('common.yearMonthPlaceholder')} />
          </Form.Item>
          <Form.Item name="baseSalary" label={t('common.baseSalary')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="bonus" label={t('common.bonus')}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="deduction" label={t('common.deduction')}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.create')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
