import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, Form, Input, message, Modal } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { positionsService, Position } from '../../services/positions'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function PositionManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Position[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await positionsService.getAll()
      setData(res.data)
    } catch {
      message.error(t('hr.loadPositionsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (values: Partial<Position>) => {
    try {
      if (editingId) {
        await positionsService.update(editingId, values)
        message.success(t('common.updateSuccess'))
      } else {
        await positionsService.create(values)
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
    { title: t('common.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Position) => (
        <>
          <Button icon={<EditOutlined />} size="small" className="mr-2" onClick={() => {
            setEditingId(record.id)
            form.setFieldsValue(record)
            setModalOpen(true)
          }}>{t('common.edit')}</Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              content: t('hr.deletePositionContent'),
              onOk: async () => {
                await positionsService.delete(record.id)
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
      }}>{t('hr.addPosition')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </PageSection>
      <FormModal title={editingId ? t('hr.editPosition') : t('hr.addPosition')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={handleSubmit}>
          <Form.Item name="code" label={t('common.code')} rules={[{ required: true }]}>
            <Input disabled={!!editingId} />
          </Form.Item>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <Input.TextArea rows={3} />
          </Form.Item>
      </FormModal>
    </div>
  )
}
