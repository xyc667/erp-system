import { useState, useEffect } from 'react'
import { Button, Form, InputNumber, message, Modal, Select, Space, Tag } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, CheckOutlined, SendOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { salesOrdersService, SalesOrder } from '../../services/salesOrders'
import { customersService, Customer } from '../../services/customers'
import { productsService, Product } from '../../services/products'
import { warehousesService, Warehouse } from '../../services/warehouses'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  draft: 'default', approved: 'blue', shipped: 'green', cancelled: 'red',
}

export default function SalesOrderManagement() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<SalesOrder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [shipModalOpen, setShipModalOpen] = useState(false)
  const [shipOrderId, setShipOrderId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [shipForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [orderRes, customerRes, productRes, warehouseRes] = await Promise.all([
        salesOrdersService.getAll(),
        customersService.getAll(),
        productsService.getAll(),
        warehousesService.getAll(),
      ])
      setOrders(orderRes.data)
      setCustomers(customerRes.data)
      setProducts(productRes.data)
      setWarehouses(warehouseRes.data)
    } catch {
      message.error(t('sales.loadOrdersFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.orderNo'), dataIndex: 'orderNo', key: 'orderNo' },
    { title: t('common.customer'), dataIndex: ['customer', 'name'], key: 'customer' },
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
      render: (_: unknown, record: SalesOrder) => (
        <Space>
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<CheckOutlined />} onClick={async () => {
                await salesOrdersService.approve(record.id)
                message.success(t('common.approveSuccess'))
                fetchData()
              }}>{t('common.approve')}</Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                Modal.confirm({
                  title: t('common.confirmDelete'),
                  onOk: async () => {
                    await salesOrdersService.delete(record.id)
                    message.success(t('common.deleteSuccess'))
                    fetchData()
                  },
                })
              }}>{t('common.delete')}</Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button size="small" icon={<SendOutlined />} onClick={() => {
              setShipOrderId(record.id)
              shipForm.resetFields()
              setShipModalOpen(true)
            }}>{t('common.ship')}</Button>
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
      }}>{t('sales.createOrder')}</Button>
      <ResponsiveTable columns={columns} dataSource={orders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      </PageSection>

      <FormModal title={t('sales.createOrderModal')} open={modalOpen} onCancel={() => setModalOpen(false)} width={720} form={form} onFinish={async (values) => {
          await salesOrdersService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="customerId" label={t('common.customer')} rules={[{ required: true }]}>
            <Select>
              {customers.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
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

      <FormModal title={t('sales.shipModal')} open={shipModalOpen} onCancel={() => setShipModalOpen(false)} form={shipForm} onFinish={async (values) => {
          if (!shipOrderId) return
          await salesOrdersService.ship(shipOrderId, values.warehouseId)
          message.success(t('common.shipSuccess'))
          setShipModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="warehouseId" label={t('common.shipWarehouse')} rules={[{ required: true }]}>
            <Select>
              {warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
            </Select>
          </Form.Item>
      </FormModal>
    </div>
  )
}
