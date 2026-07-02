import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, Form, Input, InputNumber, message, Modal, Select, Space } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { bomsService, Bom } from '../../services/boms'
import { productsService, Product } from '../../services/products'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function BomManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Bom[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [bomRes, productRes] = await Promise.all([bomsService.getAll(), productsService.getAll()])
      setData(bomRes.data)
      setProducts(productRes.data)
    } catch {
      message.error(t('production.loadBomsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('production.bomCode'), dataIndex: 'code', key: 'code' },
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.finishedProduct'), dataIndex: ['product', 'name'], key: 'product' },
    { title: t('common.version'), dataIndex: 'version', key: 'version' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => t(`status.${s}`, s),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Bom) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
          Modal.confirm({
            title: t('common.confirmDelete'),
            onOk: async () => {
              await bomsService.delete(record.id)
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
        form.setFieldsValue({ items: [{}] })
        setModalOpen(true)
      }}>{t('production.createBom')}</Button>
      <ResponsiveTable
        columns={columns}
        dataSource={data}
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
                { title: t('common.componentCode'), dataIndex: ['component', 'code'] },
                { title: t('common.componentName'), dataIndex: ['component', 'name'] },
                { title: t('common.dosage'), dataIndex: 'quantity' },
                { title: t('common.unit'), dataIndex: 'unit' },
              ]}
            />
          ),
        }}
      />
      </PageSection>
      <FormModal title={t('production.createBomModal')} open={modalOpen} onCancel={() => setModalOpen(false)} width={720} form={form} onFinish={async (values) => {
          await bomsService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="code" label={t('production.bomCode')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="productId" label={t('common.finishedProduct')} rules={[{ required: true }]}>
            <Select>{products.map((p) => <Select.Option key={p.id} value={p.id}>{p.code} - {p.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="version" label={t('common.version')}><Input placeholder="1.0" /></Form.Item>
          <Form.List name="items">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" className="mb-2">
                    <Form.Item {...rest} name={[name, 'componentId']} rules={[{ required: true }]}>
                      <Select placeholder={t('common.component')} style={{ width: 200 }}>
                        {products.map((p) => <Select.Option key={p.id} value={p.id}>{p.name}</Select.Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'quantity']} rules={[{ required: true }]}>
                      <InputNumber placeholder={t('common.dosage')} min={0.0001} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'unit']} rules={[{ required: true }]}>
                      <Input placeholder={t('common.unit')} style={{ width: 80 }} />
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>{t('common.removeShort')}</Button>
                  </Space>
                ))}
                <Button onClick={() => add()} block>{t('production.addComponent')}</Button>
              </>
            )}
          </Form.List>
      </FormModal>
    </div>
  )
}
