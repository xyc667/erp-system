import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, DatePicker, Form, Input, InputNumber, message, Modal, Tag } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, CalculatorOutlined, StopOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useTranslation } from 'react-i18next'
import { fixedAssetsService, FixedAsset } from '../../services/fixedAssets'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  active: 'green', fully_depreciated: 'orange', disposed: 'default',
}

export default function FixedAssetManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<FixedAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fixedAssetsService.getAll()
      setData(res.data)
    } catch {
      message.error(t('finance.loadAssetsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.assetNo'), dataIndex: 'assetNo', key: 'assetNo' },
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.category'), dataIndex: 'category', key: 'category' },
    { title: t('common.originalValue'), dataIndex: 'originalValue', key: 'originalValue' },
    { title: t('common.accumulatedDepreciation'), dataIndex: 'accumulatedDepreciation', key: 'accumulatedDepreciation' },
    {
      title: t('common.netValue'),
      key: 'netValue',
      render: (_: unknown, r: FixedAsset) =>
        (Number(r.originalValue) - Number(r.accumulatedDepreciation)).toFixed(2),
    },
    { title: t('common.usefulLifeMonths'), dataIndex: 'usefulLifeMonths', key: 'usefulLifeMonths' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{t(`status.${s}`, s)}</Tag>,
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: FixedAsset) =>
        record.status === 'active' ? (
          <>
            <Button size="small" icon={<CalculatorOutlined />} className="mr-2" onClick={async () => {
              await fixedAssetsService.depreciate(record.id)
              message.success(t('finance.depreciateSuccess'))
              fetchData()
            }}>{t('finance.depreciate')}</Button>
            <Button size="small" icon={<StopOutlined />} onClick={async () => {
              await fixedAssetsService.dispose(record.id)
              message.success(t('finance.disposeSuccess'))
              fetchData()
            }}>{t('finance.dispose')}</Button>
          </>
        ) : (
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              onOk: async () => {
                await fixedAssetsService.delete(record.id)
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
        form.setFieldsValue({ startDate: dayjs(), usefulLifeMonths: 60 })
        setModalOpen(true)
      }}>{t('finance.addAsset')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </PageSection>
      <FormModal title={t('finance.addAssetModal')} open={modalOpen} onCancel={() => setModalOpen(false)} form={form} onFinish={async (values) => {
          await fixedAssetsService.create({
            ...values,
            startDate: values.startDate.format('YYYY-MM-DD'),
          })
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="category" label={t('common.category')}><Input /></Form.Item>
          <Form.Item name="originalValue" label={t('common.originalValue')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="usefulLifeMonths" label={t('common.usefulLifeMonths')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={1} />
          </Form.Item>
          <Form.Item name="startDate" label={t('common.startDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="location" label={t('common.location')}><Input /></Form.Item>
      </FormModal>
    </div>
  )
}
