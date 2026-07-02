import { useState, useEffect } from 'react'
import { Button, Form, Select, InputNumber, message } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { inventoryService, StockMovement } from '../../services/inventory'
import { productsService, Product } from '../../services/products'
import { warehousesService, Warehouse } from '../../services/warehouses'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function StockInOut() {
  const { t } = useTranslation()
  const [data, setData] = useState<StockMovement[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [moveRes, productRes, warehouseRes] = await Promise.all([
        inventoryService.getMovements(),
        productsService.getAll(),
        warehousesService.getAll(),
      ])
      setData(moveRes.data)
      setProducts(productRes.data)
      setWarehouses(warehouseRes.data)
    } catch {
      message.error(t('inventory.loadMovementsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => t(`movementType.${v}`, v),
    },
    { title: t('common.product'), dataIndex: ['product', 'name'], key: 'product' },
    { title: t('common.warehouse'), dataIndex: ['warehouse', 'name'], key: 'warehouse' },
    { title: t('common.quantity'), dataIndex: 'quantity', key: 'quantity' },
    { title: t('common.referenceNo'), dataIndex: 'referenceNo', key: 'referenceNo' },
    { title: t('common.operator'), dataIndex: ['createdBy', 'name'], key: 'createdBy' },
    {
      title: t('common.time'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ]

  return (
    <div>
      <PageTitle />
      <PageSection>
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        setModalOpen(true)
      }}>{t('inventory.adjustStock')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </PageSection>
      <FormModal title={t('inventory.adjustStockModal')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={async (values) => {
          await inventoryService.adjustStock(values)
          message.success(t('common.adjustSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="type" label={t('common.type')} rules={[{ required: true }]}>
            <Select>
              <Select.Option value="adjustment">{t('movementType.adjustment')}</Select.Option>
              <Select.Option value="transfer">{t('movementType.transfer')}</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="productId" label={t('common.product')} rules={[{ required: true }]}>
            <Select>
              {products.map((p) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="warehouseId" label={t('common.warehouse')} rules={[{ required: true }]}>
            <Select>
              {warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="quantity" label={t('common.qtyChangeHint')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
      </FormModal>
    </div>
  )
}
