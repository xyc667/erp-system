import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, Form, Input, message, Modal } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { departmentsService, Department } from '../../services/departments'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function DepartmentManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Department[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await departmentsService.getAll()
      setData(res.data)
    } catch {
      message.error(t('hr.loadDepartmentsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (values: Partial<Department>) => {
    try {
      if (editingId) {
        await departmentsService.update(editingId, values)
        message.success(t('common.updateSuccess'))
      } else {
        await departmentsService.create(values)
        message.success(t('common.createSuccess'))
      }
      setModalOpen(false)
      fetchData()
    } catch {
      message.error(t('common.operationFailed'))
    }
  }

  const columns = [
    { title: t('common.code'), dataIndex: 'code', key: 'code' },
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Department) => (
        <>
          <Button icon={<EditOutlined />} size="small" className="mr-2" onClick={() => {
            setEditingId(record.id)
            form.setFieldsValue(record)
            setModalOpen(true)
          }}>{t('common.edit')}</Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              onOk: async () => {
                await departmentsService.delete(record.id)
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
      }}>{t('hr.addDepartment')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </PageSection>
      <FormModal title={editingId ? t('hr.editDepartment') : t('hr.addDepartment')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={handleSubmit}>
          <Form.Item name="code" label={t('common.code')} rules={[{ required: true }]}><Input disabled={!!editingId} /></Form.Item>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
      </FormModal>
    </div>
  )
}
