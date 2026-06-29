import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, Select, Input, InputNumber, DatePicker, Tag, message, Space } from 'antd'
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { productionPlansService, ProductionPlan } from '../../services/productionPlans'
import { productsService, Product } from '../../services/products'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = { draft: 'default', approved: 'green' }

export default function ProductionPlanManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<ProductionPlan[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [planRes, productRes] = await Promise.all([
        productionPlansService.getAll(),
        productsService.getAll(),
      ])
      setData(planRes.data)
      setProducts(productRes.data)
    } catch {
      message.error(t('production.loadPlansFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.planNo'), dataIndex: 'planNo', key: 'planNo' },
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.product'), dataIndex: ['product', 'name'], key: 'product' },
    { title: t('common.plannedQty'), dataIndex: 'plannedQty', key: 'plannedQty' },
    {
      title: t('common.startDate'),
      dataIndex: 'startDate',
      key: 'startDate',
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
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: ProductionPlan) => (
        <Space>
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<CheckOutlined />} onClick={async () => {
                await productionPlansService.approve(record.id)
                message.success(t('common.approveSuccess'))
                fetchData()
              }}>{t('common.approve')}</Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                Modal.confirm({
                  title: t('common.confirmDelete'),
                  onOk: async () => {
                    await productionPlansService.delete(record.id)
                    message.success(t('common.deleteSuccess'))
                    fetchData()
                  },
                })
              }}>{t('common.delete')}</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        setModalOpen(true)
      }}>{t('production.createPlan')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={t('production.createPlanModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await productionPlansService.create({
            name: values.name,
            productId: values.productId,
            plannedQty: values.plannedQty,
            startDate: values.startDate.format('YYYY-MM-DD'),
            endDate: values.endDate?.format('YYYY-MM-DD'),
          })
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="name" label={t('common.planName')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="productId" label={t('common.product')} rules={[{ required: true }]}>
            <Select>{products.map((p) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="plannedQty" label={t('common.plannedQty')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="startDate" label={t('common.startDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="endDate" label={t('common.endDate')}><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.create')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
