import { useState, useEffect } from 'react'
import { Form, Select, InputNumber, Input, Button, message } from 'antd'
import { SwapOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import { inventoryTransferService } from '../../services/inventoryTransfer'
import { productsService, Product } from '../../services/products'
import { warehousesService, Warehouse } from '../../services/warehouses'

export default function StockTransfer() {
  const { t } = useTranslation()
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  useEffect(() => {
    Promise.all([productsService.getAll(), warehousesService.getAll()])
      .then(([p, w]) => {
        setProducts(p.data)
        setWarehouses(w.data)
      })
      .catch(() => message.error(t('common.loadMasterFailed')))
  }, [t])

  return (
    <div>
      <PageTitle />
      <p className="text-gray-500 mb-4">{t('inventory.transferHint')}</p>
      <Form
        form={form}
        layout="vertical"
        style={{ maxWidth: 480 }}
        onFinish={async (values) => {
          setLoading(true)
          try {
            const res = await inventoryTransferService.transfer(values)
            message.success(t('common.transferSuccess', { no: res.data.referenceNo }))
            form.resetFields()
          } catch {
            message.error(t('common.transferFailed'))
          } finally {
            setLoading(false)
          }
        }}
      >
        <Form.Item name="productId" label={t('common.product')} rules={[{ required: true }]}>
          <Select showSearch optionFilterProp="children">
            {products.map((p) => (
              <Select.Option key={p.id} value={p.id}>{p.code} - {p.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="fromWarehouseId" label={t('common.sourceWarehouse')} rules={[{ required: true }]}>
          <Select>
            {warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="toWarehouseId" label={t('common.targetWarehouse')} rules={[{ required: true }]}>
          <Select>
            {warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
          </Select>
        </Form.Item>
        <Form.Item name="quantity" label={t('common.quantity')} rules={[{ required: true }]}>
          <InputNumber min={0.0001} style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item name="referenceNo" label={t('common.referenceNo')}>
          <Input placeholder={t('common.optional')} />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" icon={<SwapOutlined />} loading={loading}>
            {t('common.confirmTransfer')}
          </Button>
        </Form.Item>
      </Form>
    </div>
  )
}
