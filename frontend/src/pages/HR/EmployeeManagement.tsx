import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, Form, Input, message, Modal, Select } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { employeesService, Employee } from '../../services/employees'
import { departmentsService, Department } from '../../services/departments'
import { positionsService, Position } from '../../services/positions'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function EmployeeManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [empRes, deptRes, posRes] = await Promise.all([
        employeesService.getAll(),
        departmentsService.getAll(),
        positionsService.getAll(),
      ])
      setData(empRes.data)
      setDepartments(deptRes.data)
      setPositions(posRes.data)
    } catch {
      message.error(t('hr.loadEmployeesFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.employeeNo'), dataIndex: 'employeeNo', key: 'employeeNo' },
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.department'), dataIndex: ['department', 'name'], key: 'department' },
    { title: t('common.position'), dataIndex: ['position', 'name'], key: 'position' },
    { title: t('common.email'), dataIndex: 'email', key: 'email' },
    { title: t('common.status'), dataIndex: 'status', key: 'status' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Employee) => (
        <>
          <Button icon={<EditOutlined />} size="small" className="mr-2" onClick={() => {
            setEditingId(record.id)
            form.setFieldsValue({
              name: record.name,
              departmentId: record.departmentId,
              positionId: record.positionId,
              email: record.email,
              phone: record.phone,
            })
            setModalOpen(true)
          }}>{t('common.edit')}</Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              onOk: async () => {
                await employeesService.delete(record.id)
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
      <PageSection>
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        setEditingId(null)
        form.resetFields()
        setModalOpen(true)
      }}>{t('hr.addEmployee')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </PageSection>
      <FormModal title={editingId ? t('hr.editEmployee') : t('hr.addEmployee')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={async (values) => {
          if (editingId) {
            await employeesService.update(editingId, values)
          } else {
            await employeesService.create(values)
          }
          message.success(t('common.saveSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          {!editingId && (
            <Form.Item name="employeeNo" label={t('common.employeeNo')} rules={[{ required: true }]}><Input /></Form.Item>
          )}
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="departmentId" label={t('common.department')}>
            <Select allowClear>{departments.map((d) => <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="positionId" label={t('common.position')}>
            <Select allowClear>{positions.map((p) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="email" label={t('common.email')}><Input /></Form.Item>
          <Form.Item name="phone" label={t('common.phone')}><Input /></Form.Item>
      </FormModal>
    </div>
  )
}
