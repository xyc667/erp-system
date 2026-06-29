import { useState, useEffect } from 'react'
import { Button, Modal, Form, Input, InputNumber, Select, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import { productsService, Product, ProductCategory } from '../../services/products'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function ProductManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        productsService.getAll(),
        productsService.getCategories(),
      ])
      setData(productsRes.data)
      setCategories(categoriesRes.data)
    } catch {
      message.error(t('inventory.loadProductsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (values: Partial<Product>) => {
    try {
      if (editingId) {
        await productsService.update(editingId, values)
        message.success(t('common.updateSuccess'))
      } else {
        await productsService.create(values)
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
    { title: t('common.category'), dataIndex: ['category', 'name'], key: 'category' },
    { title: t('common.unit'), dataIndex: 'unit', key: 'unit' },
    { title: t('common.referencePrice'), dataIndex: 'price', key: 'price' },
    { title: t('common.safetyStock'), dataIndex: 'safetyStock', key: 'safetyStock' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Product) => (
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
                await productsService.delete(record.id)
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
      }}>{t('inventory.addProduct')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={editingId ? t('inventory.editProduct') : t('inventory.addProduct')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="code" label={t('common.code')} rules={[{ required: true }]}><Input disabled={!!editingId} /></Form.Item>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="categoryId" label={t('common.category')}>
            <Select allowClear>
              {categories.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="unit" label={t('common.unit')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="price" label={t('common.referencePrice')}><InputNumber style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="safetyStock" label={t('common.safetyStock')}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.save')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
