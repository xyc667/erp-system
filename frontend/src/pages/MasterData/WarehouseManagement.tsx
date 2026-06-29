import { useState, useEffect } from 'react'
import { Button, Modal, Form, Input, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import { warehousesService, Warehouse } from '../../services/warehouses'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function WarehouseManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await warehousesService.getAll()
      setData(res.data)
    } catch {
      message.error(t('inventory.loadWarehousesFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (values: Partial<Warehouse>) => {
    try {
      if (editingId) {
        await warehousesService.update(editingId, values)
        message.success(t('common.updateSuccess'))
      } else {
        await warehousesService.create(values)
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
    { title: t('common.address'), dataIndex: 'address', key: 'address' },
    { title: t('common.status'), dataIndex: 'status', key: 'status' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Warehouse) => (
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
                await warehousesService.delete(record.id)
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
        setEditingId(null)
        form.resetFields()
        setModalOpen(true)
      }}>{t('inventory.addWarehouse')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={editingId ? t('inventory.editWarehouse') : t('inventory.addWarehouse')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="code" label={t('common.code')} rules={[{ required: true }]}><Input disabled={!!editingId} /></Form.Item>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="address" label={t('common.address')}><Input.TextArea /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.save')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
