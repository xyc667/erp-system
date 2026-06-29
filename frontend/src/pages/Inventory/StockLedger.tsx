import { useState, useEffect } from 'react'
import { Button, Modal, Form, Select, InputNumber, Input, message } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import { inventoryService, StockRecord } from '../../services/inventory'
import { productsService, Product } from '../../services/products'
import { warehousesService, Warehouse } from '../../services/warehouses'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function StockLedger() {
  const { t } = useTranslation()
  const [data, setData] = useState<StockRecord[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stockRes, productRes, warehouseRes] = await Promise.all([
        inventoryService.getStock(),
        productsService.getAll(),
        warehousesService.getAll(),
      ])
      setData(stockRes.data)
      setProducts(productRes.data)
      setWarehouses(warehouseRes.data)
    } catch {
      message.error(t('inventory.loadStockFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.productCode'), dataIndex: ['product', 'code'], key: 'productCode' },
    { title: t('common.productName'), dataIndex: ['product', 'name'], key: 'productName' },
    { title: t('common.warehouse'), dataIndex: ['warehouse', 'name'], key: 'warehouse' },
    { title: t('common.quantity'), dataIndex: 'quantity', key: 'quantity' },
    { title: t('common.unit'), dataIndex: 'unit', key: 'unit' },
    { title: t('common.batchNo'), dataIndex: 'batchNo', key: 'batchNo' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: StockRecord) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
          Modal.confirm({
            title: t('common.confirmDelete'),
            onOk: async () => {
              await inventoryService.deleteStock(record.id)
              message.success(t('common.deleteSuccess'))
              fetchData()
            },
          })
        }}>{t('common.delete')}</Button>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        setModalOpen(true)
      }}>{t('inventory.entryStock')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={t('inventory.entryStockModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          const product = products.find((p) => p.id === values.productId)
          if (!product) return
          await inventoryService.createStock({
            productId: values.productId,
            warehouseId: values.warehouseId,
            quantity: values.quantity,
            unit: product.unit,
            batchNo: values.batchNo,
          })
          message.success(t('common.entrySuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="productId" label={t('common.product')} rules={[{ required: true }]}>
            <Select>
              {products.map((p) => <Select.Option key={p.id} value={p.id}>{p.code} - {p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="warehouseId" label={t('common.warehouse')} rules={[{ required: true }]}>
            <Select>
              {warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label={t('common.quantity')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="batchNo" label={t('common.batchNo')}>
            <Input placeholder={t('common.batchOptional')} />
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.save')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
