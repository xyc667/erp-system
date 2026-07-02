import { useState, useEffect } from 'react'
import { Button, Form, Input, InputNumber, message, Modal } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { customersService, Customer } from '../../services/customers'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function CustomerManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Customer[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await customersService.getAll()
      setData(res.data)
    } catch {
      message.error(t('sales.loadCustomersFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (values: Partial<Customer>) => {
    try {
      if (editingId) {
        await customersService.update(editingId, values)
        message.success(t('common.updateSuccess'))
      } else {
        await customersService.create(values)
        message.success(t('common.createSuccess'))
      }
      setModalOpen(false)
      fetchData()
    } catch {
      message.error(t('common.operationFailed'))
    }
  }

  const columns = [
    { title: t('common.code'), dataIndex: 'code', key: 'code' },
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.contact'), dataIndex: 'contactName', key: 'contactName' },
    { title: t('common.creditLimit'), dataIndex: 'creditLimit', key: 'creditLimit' },
    { title: t('common.status'), dataIndex: 'status', key: 'status' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Customer) => (
        <>
          <Button icon={<EditOutlined />} size="small" className="mr-2" onClick={() => {
            setEditingId(record.id)
            form.setFieldsValue(record)
            setModalOpen(true)
          }}>{t('common.edit')}</Button>
          <Button icon={<DeleteOutlined />} size="small" danger onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              onOk: async () => {
                await customersService.delete(record.id)
                message.success(t('common.deleteSuccess'))
                fetchData()
              },
            })
          }}>{t('common.delete')}</Button>
        </>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <PageSection>
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        setEditingId(null)
        form.resetFields()
        setModalOpen(true)
      }}>{t('sales.addCustomer')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </PageSection>
      <FormModal title={editingId ? t('sales.editCustomer') : t('sales.addCustomer')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={handleSubmit}>
          <Form.Item name="code" label={t('common.code')} rules={[{ required: true }]}><Input disabled={!!editingId} /></Form.Item>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="contactName" label={t('common.contact')}><Input /></Form.Item>
          <Form.Item name="contactPhone" label={t('common.phone')}><Input /></Form.Item>
          <Form.Item name="creditLimit" label={t('common.creditLimit')}><InputNumber style={{ width: '100%' }} /></Form.Item>
      </FormModal>
    </div>
  )
}
