import { useState, useEffect } from 'react'
import { Button, Form, InputNumber, message, Modal, Select, Space, Tag } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, CheckOutlined, InboxOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { purchaseOrdersService, PurchaseOrder } from '../../services/purchaseOrders'
import { vendorsService, Vendor } from '../../services/vendors'
import { productsService, Product } from '../../services/products'
import { warehousesService, Warehouse } from '../../services/warehouses'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  draft: 'default', approved: 'blue', completed: 'green', cancelled: 'red',
}

export default function PurchaseOrderManagement() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [receiveModalOpen, setReceiveModalOpen] = useState(false)
  const [receiveOrderId, setReceiveOrderId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [receiveForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [orderRes, vendorRes, productRes, warehouseRes] = await Promise.all([
        purchaseOrdersService.getAll(),
        vendorsService.getAll(),
        productsService.getAll(),
        warehousesService.getAll(),
      ])
      setOrders(orderRes.data)
      setVendors(vendorRes.data)
      setProducts(productRes.data)
      setWarehouses(warehouseRes.data)
    } catch {
      message.error(t('procurement.loadOrdersFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.orderNo'), dataIndex: 'orderNo', key: 'orderNo' },
    { title: t('common.vendor'), dataIndex: ['vendor', 'name'], key: 'vendor' },
    { title: t('common.totalAmount'), dataIndex: 'totalAmount', key: 'totalAmount' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{t(`status.${status}`, status)}</Tag>
      ),
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: PurchaseOrder) => (
        <Space>
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<CheckOutlined />} onClick={async () => {
                await purchaseOrdersService.approve(record.id)
                message.success(t('common.approveSuccess'))
                fetchData()
              }}>{t('common.approve')}</Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                Modal.confirm({
                  title: t('common.confirmDelete'),
                  onOk: async () => {
                    await purchaseOrdersService.delete(record.id)
                    message.success(t('common.deleteSuccess'))
                    fetchData()
                  },
                })
              }}>{t('common.delete')}</Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button size="small" icon={<InboxOutlined />} onClick={() => {
              setReceiveOrderId(record.id)
              receiveForm.resetFields()
              setReceiveModalOpen(true)
            }}>{t('common.receive')}</Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <PageSection>
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        form.setFieldsValue({ items: [{}] })
        setModalOpen(true)
      }}>{t('procurement.createOrder')}</Button>
      <ResponsiveTable columns={columns} dataSource={orders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      </PageSection>

      <FormModal title={t('procurement.createOrderModal')} open={modalOpen} onCancel={() => setModalOpen(false)} width={720} form={form} onFinish={async (values) => {
          await purchaseOrdersService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="vendorId" label={t('common.vendor')} rules={[{ required: true }]}>
            <Select>
              {vendors.map((v) => <Select.Option key={v.id} value={v.id}>{v.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" className="mb-2">
                    <Form.Item {...rest} name={[name, 'productId']} rules={[{ required: true }]}>
                      <Select placeholder={t('common.product')} style={{ width: 200 }}>
                        {products.map((p) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true }]}>
                      <InputNumber placeholder={t('common.quantity')} min={1} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unitPrice']} rules={[{ required: true }]}>
                      <InputNumber placeholder={t('common.unitPrice')} min={0} />
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>{t('common.delete')}</Button>
                  </Space>
                ))}
                <Button onClick={() => add()} block>{t('common.addLine')}</Button>
              </>
            )}
          </Form.List>
      </FormModal>

      <FormModal title={t('procurement.receiveModal')} open={receiveModalOpen} onCancel={() => setReceiveModalOpen(false)} form={receiveForm} onFinish={async (values) => {
          if (!receiveOrderId) return
          await purchaseOrdersService.receive(receiveOrderId, values.warehouseId)
          message.success(t('common.receiveSuccess'))
          setReceiveModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="warehouseId" label={t('common.receiveWarehouse')} rules={[{ required: true }]}>
            <Select>
              {warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
            </Select>
          </Form.Item>
      </FormModal>
    </div>
  )
}
