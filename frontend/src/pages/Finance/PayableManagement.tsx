import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, InputNumber, Tag, message } from 'antd'
import { DollarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { payablesService, Payable } from '../../services/payables'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  open: 'orange', partial: 'blue', paid: 'green',
}

export default function PayableManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Payable[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await payablesService.getAll()
      setData(res.data)
    } catch {
      message.error(t('finance.loadPayablesFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.billNo'), dataIndex: 'billNo', key: 'billNo' },
    { title: t('common.vendor'), dataIndex: ['vendor', 'name'], key: 'vendor' },
    { title: t('routes.procurementOrder'), dataIndex: ['purchaseOrder', 'orderNo'], key: 'purchaseOrder' },
    { title: t('common.payableAmount'), dataIndex: 'amount', key: 'amount' },
    { title: t('common.paidAmount'), dataIndex: 'paidAmount', key: 'paidAmount' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status] || 'default'}>{t(`status.${status}`, status)}</Tag>
      ),
    },
    {
      title: t('common.dueDate'),
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString() : '-',
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Payable) =>
        record.status !== 'paid' ? (
          <Button size="small" icon={<DollarOutlined />} onClick={() => {
            setSelectedId(record.id)
            form.setFieldsValue({
              amount: Number(record.amount) - Number(record.paidAmount),
            })
            setModalOpen(true)
          }}>{t('common.payment')}</Button>
        ) : null,
    },
  ]

  return (
    <div>
      <PageTitle />
      <p className="text-gray-500 mb-4">{t('finance.payableHint')}</p>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      <Modal title={t('finance.registerPayment')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          if (!selectedId) return
          await payablesService.recordPayment(selectedId, values.amount)
          message.success(t('finance.paymentSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="amount" label={t('common.paymentAmount')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} />
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.confirm')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
