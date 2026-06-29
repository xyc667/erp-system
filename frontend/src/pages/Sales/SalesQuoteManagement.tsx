import { useState, useEffect } from 'react'
import { Button, Modal, Form, Select, InputNumber, DatePicker, Tag, message, Space } from 'antd'
import { PlusOutlined, CheckOutlined, SwapOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import { salesQuotesService, SalesQuote } from '../../services/salesQuotes'
import { customersService, Customer } from '../../services/customers'
import { productsService, Product } from '../../services/products'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  draft: 'default', approved: 'blue', converted: 'green',
}

export default function SalesQuoteManagement() {
  const { t } = useTranslation()
  const [quotes, setQuotes] = useState<SalesQuote[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [quoteRes, customerRes, productRes] = await Promise.all([
        salesQuotesService.getAll(),
        customersService.getAll(),
        productsService.getAll(),
      ])
      setQuotes(quoteRes.data)
      setCustomers(customerRes.data)
      setProducts(productRes.data)
    } catch {
      message.error(t('sales.loadQuotesFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.quoteNo'), dataIndex: 'quoteNo', key: 'quoteNo' },
    { title: t('common.customer'), dataIndex: ['customer', 'name'], key: 'customer' },
    { title: t('common.totalAmount'), dataIndex: 'totalAmount', key: 'totalAmount' },
    {
      title: t('common.validUntil'),
      dataIndex: 'validUntil',
      key: 'validUntil',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString() : '-',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{t(`status.${status}`, status)}</Tag>
      ),
    },
    { title: t('common.linkedOrder'), dataIndex: ['salesOrder', 'orderNo'], key: 'salesOrder' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: SalesQuote) => (
        <Space>
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<CheckOutlined />} onClick={async () => {
                await salesQuotesService.approve(record.id)
                message.success(t('common.approveSuccess'))
                fetchData()
              }}>{t('common.approve')}</Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                Modal.confirm({
                  title: t('common.confirmDelete'),
                  onOk: async () => {
                    await salesQuotesService.delete(record.id)
                    message.success(t('common.deleteSuccess'))
                    fetchData()
                  },
                })
              }}>{t('common.delete')}</Button>
            </>
          )}
          {record.status === 'approved' && (
            <Button size="small" icon={<SwapOutlined />} onClick={async () => {
              await salesQuotesService.convert(record.id)
              message.success(t('common.convertSoSuccess'))
              fetchData()
            }}>{t('common.convertToSo')}</Button>
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
        form.setFieldsValue({ items: [{}] })
        setModalOpen(true)
      }}>{t('sales.createQuote')}</Button>
      <ResponsiveTable columns={columns} dataSource={quotes} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title={t('sales.createQuoteModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={720}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await salesQuotesService.create({
            ...values,
            validUntil: values.validUntil?.format('YYYY-MM-DD'),
          })
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="customerId" label={t('common.customer')} rules={[{ required: true }]}>
            <Select>
              {customers.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="validUntil" label={t('common.validUntil')}><DatePicker style={{ width: '100%' }} /></Form.Item>
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
          <Form.Item className="mt-4"><Button type="primary" htmlType="submit">{t('common.create')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
