import { useState, useEffect } from 'react'
import { Button, Form, Input, InputNumber, message, Modal, Select, Space, Tag } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, CheckOutlined, SwapOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { purchaseRequestsService, PurchaseRequest } from '../../services/purchaseRequests'
import { productsService, Product } from '../../services/products'
import { vendorsService, Vendor } from '../../services/vendors'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  draft: 'default', approved: 'blue', converted: 'green', rejected: 'red',
}

export default function PurchaseRequestManagement() {
  const { t } = useTranslation()
  const [requests, setRequests] = useState<PurchaseRequest[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [convertId, setConvertId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [convertForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [reqRes, productRes, vendorRes] = await Promise.all([
        purchaseRequestsService.getAll(),
        productsService.getAll(),
        vendorsService.getAll(),
      ])
      setRequests(reqRes.data)
      setProducts(productRes.data)
      setVendors(vendorRes.data)
    } catch {
      message.error(t('procurement.loadRequestsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.requestNo'), dataIndex: 'requestNo', key: 'requestNo' },
    { title: t('common.title'), dataIndex: 'title', key: 'title' },
    { title: t('common.applicant'), dataIndex: ['createdBy', 'name'], key: 'createdBy' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{t(`status.${status}`, status)}</Tag>
      ),
    },
    { title: t('common.linkedOrder'), dataIndex: ['purchaseOrder', 'orderNo'], key: 'purchaseOrder' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: PurchaseRequest) => (
        <Space>
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<CheckOutlined />} onClick={async () => {
                await purchaseRequestsService.approve(record.id)
                message.success(t('common.approveSuccess'))
                fetchData()
              }}>{t('common.approve')}</Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                Modal.confirm({
                  title: t('common.confirmDelete'),
                  onOk: async () => {
                    await purchaseRequestsService.delete(record.id)
                    message.success(t('common.deleteSuccess'))
                    fetchData()
                  },
                })
              }}>{t('common.delete')}</Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button size="small" icon={<SwapOutlined />} onClick={() => {
              setConvertId(record.id)
              convertForm.resetFields()
              setConvertModalOpen(true)
            }}>{t('common.convertToPo')}</Button>
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
      }}>{t('procurement.createRequest')}</Button>
      <ResponsiveTable columns={columns} dataSource={requests} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      </PageSection>

      <FormModal title={t('procurement.createRequestModal')} open={modalOpen} onCancel={() => setModalOpen(false)} width={720} form={form} onFinish={async (values) => {
          await purchaseRequestsService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="title" label={t('common.title')}><Input /></Form.Item>
          <Form.Item name="reason" label={t('common.reason')}><Input.TextArea rows={2} /></Form.Item>
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
                    <Form.Item {...rest} name={[name, 'estimatedPrice']}>
                      <InputNumber placeholder={t('common.estimatedPrice')} min={0} />
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>{t('common.delete')}</Button>
                  </Space>
                ))}
                <Button onClick={() => add()} block>{t('common.addLine')}</Button>
              </>
            )}
          </Form.List>
      </FormModal>

      <FormModal title={t('procurement.convertModal')} open={convertModalOpen} onCancel={() => setConvertModalOpen(false)} form={convertForm} onFinish={async (values) => {
          if (!convertId) return
          await purchaseRequestsService.convert(convertId, values.vendorId)
          message.success(t('common.convertPoSuccess'))
          setConvertModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="vendorId" label={t('common.vendor')} rules={[{ required: true }]}>
            <Select>
              {vendors.map((v) => <Select.Option key={v.id} value={v.id}>{v.name}</Select.Option>)}
            </Select>
          </Form.Item>
      </FormModal>
    </div>
  )
}
