import { useState, useEffect } from 'react'
import { Button, Modal, Form, Select, Input, InputNumber, Tag, message, Space } from 'antd'
import { PlusOutlined, CheckOutlined, EyeOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import { stocktakesService, Stocktake } from '../../services/stocktakes'
import { warehousesService, Warehouse } from '../../services/warehouses'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  draft: 'default', counting: 'blue', completed: 'green',
}

export default function StocktakeManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Stocktake[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const [current, setCurrent] = useState<Stocktake | null>(null)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [stRes, whRes] = await Promise.all([
        stocktakesService.getAll(),
        warehousesService.getAll(),
      ])
      setData(stRes.data)
      setWarehouses(whRes.data)
    } catch {
      message.error(t('inventory.loadStocktakesFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openDetail = async (id: string) => {
    const res = await stocktakesService.getById(id)
    setCurrent(res.data)
    setDetailOpen(true)
  }

  const columns = [
    { title: t('common.stocktakeNo'), dataIndex: 'stocktakeNo', key: 'stocktakeNo' },
    { title: t('common.warehouse'), dataIndex: ['warehouse', 'name'], key: 'warehouse' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag color={statusColors[s] || 'default'}>{t(`status.${s}`, s)}</Tag>,
    },
    { title: t('common.createdBy'), dataIndex: ['createdBy', 'name'], key: 'createdBy' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Stocktake) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => openDetail(record.id)}>{t('common.detail')}</Button>
          {record.status === 'counting' && (
            <Button size="small" type="primary" icon={<CheckOutlined />} onClick={async () => {
              await stocktakesService.complete(record.id)
              message.success(t('inventory.completeStocktakeSuccess'))
              fetchData()
            }}>{t('inventory.completeStocktake')}</Button>
          )}
          {record.status !== 'completed' && (
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
              Modal.confirm({
                title: t('common.confirmDelete'),
                onOk: async () => {
                  await stocktakesService.delete(record.id)
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

  const itemColumns = [
    { title: t('common.product'), dataIndex: ['product', 'name'], key: 'product' },
    { title: t('common.systemQty'), dataIndex: 'systemQty', key: 'systemQty' },
    {
      title: t('common.countedQty'),
      dataIndex: 'countedQty',
      key: 'countedQty',
      render: (v: number | null, record: Stocktake['items'][0]) =>
        current?.status === 'counting' ? (
          <InputNumber
            value={v ?? undefined}
            min={0}
            onChange={async (val) => {
              if (val !== null && val !== undefined && current) {
                await stocktakesService.updateItem(current.id, record.id, val)
                const res = await stocktakesService.getById(current.id)
                setCurrent(res.data)
              }
            }}
          />
        ) : (v ?? '-'),
    },
    { title: t('common.difference'), dataIndex: 'difference', key: 'difference', render: (v: number | null) => v ?? '-' },
  ]

  return (
    <div>
      <PageTitle />
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        setModalOpen(true)
      }}>{t('inventory.createStocktake')}</Button>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

      <Modal title={t('inventory.createStocktakeModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await stocktakesService.create(values)
          message.success(t('inventory.stocktakeCreated'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="warehouseId" label={t('common.warehouse')} rules={[{ required: true }]}>
            <Select>
              {warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="remark" label={t('inventory.remark')}><Input.TextArea rows={2} /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('inventory.startStocktake')}</Button></Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('inventory.stocktakeDetail', { no: current?.stocktakeNo ?? '' })}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={null}
        width={720}
      >
        <ResponsiveTable columns={itemColumns} dataSource={current?.items ?? []} rowKey="id" pagination={false} />
      </Modal>
    </div>
  )
}
