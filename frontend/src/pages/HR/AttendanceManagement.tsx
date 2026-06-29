import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, Select, DatePicker, Input, Tag, message } from 'antd'
import { PlusOutlined, DeleteOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { attendanceService, Attendance } from '../../services/attendance'
import { employeesService, Employee } from '../../services/employees'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  present: 'green', absent: 'red', late: 'orange', leave: 'blue',
}

export default function AttendanceManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Attendance[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [attRes, empRes] = await Promise.all([attendanceService.getAll(), employeesService.getAll()])
      setData(attRes.data)
      setEmployees(empRes.data)
    } catch {
      message.error(t('hr.loadAttendanceFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.employee'), dataIndex: ['employee', 'name'], key: 'employee' },
    { title: t('common.employeeNo'), dataIndex: ['employee', 'employeeNo'], key: 'employeeNo' },
    { title: t('common.department'), dataIndex: ['employee', 'department', 'name'], key: 'department' },
    {
      title: t('common.date'),
      dataIndex: 'date',
      key: 'date',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'}>{t(`status.${s}`, s)}</Tag>
      ),
    },
    {
      title: t('common.checkIn'),
      dataIndex: 'checkIn',
      key: 'checkIn',
      render: (v: string | null) => v ? new Date(v).toLocaleTimeString() : '-',
    },
    {
      title: t('common.checkOut'),
      dataIndex: 'checkOut',
      key: 'checkOut',
      render: (v: string | null) => v ? new Date(v).toLocaleTimeString() : '-',
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Attendance) => (
        <>
          {!record.checkOut && record.status === 'present' && (
            <Button size="small" icon={<ClockCircleOutlined />} className="mr-2" onClick={async () => {
              await attendanceService.checkOut(record.id)
              message.success(t('hr.checkOutSuccess'))
              fetchData()
            }}>{t('hr.checkOut')}</Button>
          )}
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              onOk: async () => {
                await attendanceService.delete(record.id)
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
      }}>{t('hr.registerAttendance')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={t('hr.registerAttendanceModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await attendanceService.create({
            employeeId: values.employeeId,
            date: values.date.format('YYYY-MM-DD'),
            status: values.status,
            remark: values.remark,
          })
          message.success(t('hr.registerAttendanceSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="employeeId" label={t('common.employee')} rules={[{ required: true }]}>
            <Select>{employees.map((e) => <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="date" label={t('common.date')} rules={[{ required: true }]}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="status" label={t('common.status')} initialValue="present">
            <Select>
              {(['present', 'absent', 'late', 'leave'] as const).map((k) => (
                <Select.Option key={k} value={k}>{t(`status.${k}`)}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label={t('inventory.remark')}><Input.TextArea /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.save')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
