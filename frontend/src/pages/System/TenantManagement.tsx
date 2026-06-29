import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, Input, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { tenantsService, Tenant } from '../../services/tenants'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function TenantManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await tenantsService.getAll()
      setData(res.data)
    } catch {
      message.error(t('system.loadTenantsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  return (
    <div>
      <PageTitle />
      <p className="text-gray-500 mb-4">{t('system.tenantHint')}</p>
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        setModalOpen(true)
      }}>{t('system.addTenant')}</Button>
      <ResponsiveTable
        columns={[
          { title: t('common.code'), dataIndex: 'code', key: 'code' },
          { title: t('common.name'), dataIndex: 'name', key: 'name' },
        ]}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal title={t('system.addTenantModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await tenantsService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="code" label={t('common.tenantCode')} rules={[{ required: true }]}>
            <Input placeholder={t('system.tenantCodePlaceholder')} />
          </Form.Item>
          <Form.Item name="name" label={t('common.tenantName')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.save')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
