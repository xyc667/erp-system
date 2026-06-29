import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, Select, Input, Tag, message, Space } from 'antd'
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { serviceTicketsService, ServiceTicket } from '../../services/serviceTickets'
import { customersService, Customer } from '../../services/customers'
import { salesOrdersService } from '../../services/salesOrders'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  open: 'orange', in_progress: 'blue', resolved: 'green', closed: 'default',
}

export default function ServiceTicketManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<ServiceTicket[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [orders, setOrders] = useState<{ id: string; orderNo: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [resolveOpen, setResolveOpen] = useState(false)
  const [resolveId, setResolveId] = useState<string | null>(null)
  const [form] = Form.useForm()
  const [resolveForm] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ticketRes, customerRes, orderRes] = await Promise.all([
        serviceTicketsService.getAll(),
        customersService.getAll(),
        salesOrdersService.getAll(),
      ])
      setData(ticketRes.data)
      setCustomers(customerRes.data)
      setOrders(orderRes.data.map((o) => ({ id: o.id, orderNo: o.orderNo })))
    } catch {
      message.error(t('sales.loadTicketsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.ticketNo'), dataIndex: 'ticketNo', key: 'ticketNo' },
    { title: t('common.customer'), dataIndex: ['customer', 'name'], key: 'customer' },
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => t(`ticketType.${v}`, v),
    },
    {
      title: t('common.priority'),
      dataIndex: 'priority',
      key: 'priority',
      render: (v: string) => t(`priority.${v}`, v),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'}>{t(`status.${s}`, s)}</Tag>
      ),
    },
    { title: t('common.salesOrder'), dataIndex: ['salesOrder', 'orderNo'], key: 'salesOrder' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: ServiceTicket) => (
        <Space>
          {record.status === 'open' && (
            <Button size="small" onClick={async () => {
              await serviceTicketsService.updateStatus(record.id, 'in_progress')
              message.success(t('sales.acceptSuccess'))
              fetchData()
            }}>{t('sales.acceptTicket')}</Button>
          )}
          {record.status === 'in_progress' && (
            <Button size="small" icon={<CheckOutlined />} onClick={() => {
              setResolveId(record.id)
              resolveForm.resetFields()
              setResolveOpen(true)
            }}>{t('sales.resolveTicket')}</Button>
          )}
          {['open', 'in_progress'].includes(record.status) && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
              Modal.confirm({
                title: t('common.confirmDelete'),
                onOk: async () => {
                  await serviceTicketsService.delete(record.id)
                  message.success(t('common.deleteSuccess'))
                  fetchData()
                },
              })
            }}>{t('common.delete')}</Button>
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
      }}>{t('sales.createTicket')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title={t('sales.createTicketModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await serviceTicketsService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="customerId" label={t('common.customer')} rules={[{ required: true }]}>
            <Select>
              {customers.map((c) => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="salesOrderId" label={t('sales.linkedSalesOrder')}>
            <Select allowClear>
              {orders.map((o) => <Select.Option key={o.id} value={o.id}>{o.orderNo}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="type" label={t('common.type')} initialValue="repair">
            <Select>
              {(['repair', 'return', 'complaint'] as const).map((k) => (
                <Select.Option key={k} value={k}>{t(`ticketType.${k}`)}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="priority" label={t('common.priority')} initialValue="normal">
            <Select>
              {(['low', 'normal', 'high'] as const).map((k) => (
                <Select.Option key={k} value={k}>{t(`priority.${k}`)}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label={t('sales.issueDescription')}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.submit')}</Button></Form.Item>
        </Form>
      </Modal>

      <Modal title={t('sales.resolveTicketModal')} open={resolveOpen} onCancel={() => setResolveOpen(false)} footer={null}>
        <Form form={resolveForm} layout="vertical" onFinish={async (values) => {
          if (!resolveId) return
          await serviceTicketsService.resolve(resolveId, values.resolution)
          message.success(t('sales.resolveSuccess'))
          setResolveOpen(false)
          fetchData()
        }}>
          <Form.Item name="resolution" label={t('sales.resolution')}><Input.TextArea rows={3} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.confirm')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
