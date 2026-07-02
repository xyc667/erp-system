import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, Form, Input, InputNumber, message, Modal, Select, Tag } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { qualityInspectionsService, QualityInspection } from '../../services/qualityInspections'
import { workOrdersService, WorkOrder } from '../../services/workOrders'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = { pending: 'default', passed: 'green', failed: 'red' }

export default function QualityManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<QualityInspection[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [inspectionRes, orderRes] = await Promise.all([
        qualityInspectionsService.getAll(),
        workOrdersService.getAll(),
      ])
      setData(inspectionRes.data)
      setWorkOrders(orderRes.data.filter((o) => ['in_progress', 'completed'].includes(o.status)))
    } catch {
      message.error(t('production.loadQualityFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.inspectionNo'), dataIndex: 'inspectionNo', key: 'inspectionNo' },
    { title: t('common.workOrderNo'), dataIndex: ['workOrder', 'orderNo'], key: 'workOrder' },
    { title: t('common.product'), dataIndex: ['product', 'name'], key: 'product' },
    { title: t('common.inspectedQty'), dataIndex: 'inspectedQty', key: 'inspectedQty' },
    { title: t('common.passedQty'), dataIndex: 'passedQty', key: 'passedQty' },
    { title: t('common.failedQty'), dataIndex: 'failedQty', key: 'failedQty' },
    {
      title: t('common.inspectionResult'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'}>{t(`status.${s}`, s)}</Tag>
      ),
    },
    { title: t('common.inspector'), dataIndex: ['inspectedBy', 'name'], key: 'inspectedBy' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: QualityInspection) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
          Modal.confirm({
            title: t('common.confirmDelete'),
            onOk: async () => {
              await qualityInspectionsService.delete(record.id)
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
      <PageSection>
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        setModalOpen(true)
      }}>{t('production.createQuality')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </PageSection>
      <FormModal title={t('production.createQualityModal')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={async (values) => {
          await qualityInspectionsService.create(values)
          message.success(t('production.qualitySaved'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="workOrderId" label={t('common.workOrder')} rules={[{ required: true }]}>
            <Select>
              {workOrders.map((o) => (
                <Select.Option key={o.id} value={o.id}>{o.orderNo} - {o.product.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="inspectedQty" label={t('common.inspectedQty')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="passedQty" label={t('common.passedQtyLabel')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="failedQty" label={t('common.failedQtyLabel')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="result" label={t('common.inspectionNote')}><Input.TextArea /></Form.Item>
      </FormModal>
    </div>
  )
}
