import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, Form, InputNumber, message, Modal, Select, Space, Tag } from 'antd'
import FormModal from '../../components/FormModal'
import {
  PlusOutlined, PlayCircleOutlined, CheckOutlined, DeleteOutlined, SendOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { workOrdersService, WorkOrder } from '../../services/workOrders'
import { bomsService, Bom } from '../../services/boms'
import { productionPlansService, ProductionPlan } from '../../services/productionPlans'
import { productsService, Product } from '../../services/products'
import { warehousesService, Warehouse } from '../../services/warehouses'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  draft: 'default', released: 'blue', in_progress: 'processing', completed: 'green',
}

export default function WorkOrderManagement() {
  const { t } = useTranslation()
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [boms, setBoms] = useState<Bom[]>([])
  const [plans, setPlans] = useState<ProductionPlan[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [completeModalOpen, setCompleteModalOpen] = useState(false)
  const [completeOrderId, setCompleteOrderId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [completeForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [orderRes, bomRes, planRes, productRes, warehouseRes] = await Promise.all([
        workOrdersService.getAll(),
        bomsService.getAll(),
        productionPlansService.getAll(),
        productsService.getAll(),
        warehousesService.getAll(),
      ])
      setOrders(orderRes.data)
      setBoms(bomRes.data)
      setPlans(planRes.data.filter((p) => p.status === 'approved'))
      setProducts(productRes.data)
      setWarehouses(warehouseRes.data)
    } catch {
      message.error(t('production.loadWorkOrdersFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.workOrderNo'), dataIndex: 'orderNo', key: 'orderNo' },
    { title: t('common.product'), dataIndex: ['product', 'name'], key: 'product' },
    { title: t('common.plannedQty'), dataIndex: 'plannedQty', key: 'plannedQty' },
    { title: t('common.completedQty'), dataIndex: 'completedQty', key: 'completedQty' },
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
      render: (_: unknown, record: WorkOrder) => (
        <Space wrap>
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<SendOutlined />} onClick={async () => {
                await workOrdersService.release(record.id)
                message.success(t('production.releaseSuccess'))
                fetchData()
              }}>{t('production.release')}</Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                Modal.confirm({
                  title: t('common.confirmDelete'),
                  onOk: async () => {
                    await workOrdersService.delete(record.id)
                    message.success(t('common.deleteSuccess'))
                    fetchData()
                  },
                })
              }}>{t('common.delete')}</Button>
            </>
          )}
          {record.status === 'released' && (
            <Button size="small" icon={<PlayCircleOutlined />} onClick={async () => {
              await workOrdersService.start(record.id)
              message.success(t('production.startSuccess'))
              fetchData()
            }}>{t('production.start')}</Button>
          )}
          {['in_progress', 'released'].includes(record.status) && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => {
              setCompleteOrderId(record.id)
              completeForm.resetFields()
              setCompleteModalOpen(true)
            }}>{t('production.complete')}</Button>
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
        setModalOpen(true)
      }}>{t('production.createWorkOrder')}</Button>
      <ResponsiveTable
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        expandable={{
          expandedRowRender: (record) => (
            <ResponsiveTable
              embedded
              size="small"
              pagination={false}
              rowKey="id"
              dataSource={record.items}
              columns={[
                { title: t('common.material'), dataIndex: ['product', 'name'] },
                { title: t('common.requiredQty'), dataIndex: 'requiredQty' },
                { title: t('common.consumedQty'), dataIndex: 'consumedQty' },
              ]}
            />
          ),
        }}
      />

      </PageSection>

      <FormModal title={t('production.createWorkOrderModal')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={async (values) => {
          await workOrdersService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="productId" label={t('common.product')} rules={[{ required: true }]}>
            <Select>{products.map((p) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="bomId" label={t('production.bomCode')}>
            <Select allowClear>{boms.map((b) => <Select.Option key={b.id} value={b.id}>{b.code} - {b.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="planId" label={t('production.productionPlan')}>
            <Select allowClear>{plans.map((p) => <Select.Option key={p.id} value={p.id}>{p.planNo} - {p.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="plannedQty" label={t('common.plannedQty')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
      </FormModal>

      <FormModal title={t('production.completeWorkOrderModal')} open={completeModalOpen} onCancel={() => setCompleteModalOpen(false)} form={completeForm} onFinish={async (values) => {
          if (!completeOrderId) return
          await workOrdersService.complete(completeOrderId, values.warehouseId)
          message.success(t('production.completeSuccess'))
          setCompleteModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="warehouseId" label={t('common.receiveWarehouse')} rules={[{ required: true }]}>
            <Select>{warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}</Select>
          </Form.Item>
      </FormModal>
    </div>
  )
}
