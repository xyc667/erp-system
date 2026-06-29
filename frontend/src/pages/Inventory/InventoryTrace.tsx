import { useEffect, useState } from 'react'
import { Tabs, Form, Input, Button, Descriptions, Tag, message, Modal, Select } from 'antd'
import { SearchOutlined, PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import ResponsiveTable from '../../components/ResponsiveTable'
import { traceService, SerialNumber } from '../../services/trace'
import { blockchainService, BlockchainStatus, VerifyResult } from '../../services/blockchain'
import { productsService, Product } from '../../services/products'
import { warehousesService, Warehouse } from '../../services/warehouses'

export default function InventoryTrace() {
  const { t } = useTranslation()
  const [batchResult, setBatchResult] = useState<{
    batchNo: string
    inventory: unknown[]
    movements: unknown[]
    serials: unknown[]
  } | null>(null)
  const [serialResult, setSerialResult] = useState<{
    serial: SerialNumber & { traces?: unknown[] }
    movements: unknown[]
  } | null>(null)
  const [serials, setSerials] = useState<SerialNumber[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [chainStatus, setChainStatus] = useState<BlockchainStatus | null>(null)
  const [chainLoading, setChainLoading] = useState(false)
  const [registerOpen, setRegisterOpen] = useState(false)
  const [batchForm] = Form.useForm()
  const [registerForm] = Form.useForm()

  useEffect(() => {
    blockchainService.getStatus()
      .then((res) => setChainStatus(res.data))
      .catch(() => setChainStatus(null))
  }, [])

  const loadSerials = async () => {
    const res = await traceService.listSerials()
    setSerials(res.data)
  }

  const searchBatch = async (batchNo: string) => {
    const res = await traceService.traceBatch(batchNo)
    setBatchResult(res.data)
  }

  const searchSerial = async (serialNo: string) => {
    const res = await traceService.traceSerial(serialNo)
    setSerialResult(res.data)
  }

  const openRegister = async () => {
    const [pRes, wRes] = await Promise.all([
      productsService.getAll(),
      warehousesService.getAll(),
    ])
    setProducts(pRes.data)
    setWarehouses(wRes.data)
    registerForm.resetFields()
    setRegisterOpen(true)
  }

  const movementColumns = [
    { title: t('common.type'), dataIndex: 'type', key: 'type' },
    { title: t('common.product'), dataIndex: ['product', 'name'], key: 'product' },
    { title: t('common.warehouse'), dataIndex: ['warehouse', 'name'], key: 'warehouse' },
    { title: t('common.quantity'), dataIndex: 'quantity', key: 'quantity' },
    { title: t('common.referenceNo'), dataIndex: 'referenceNo', key: 'referenceNo' },
    { title: t('common.operator'), dataIndex: ['createdBy', 'name'], key: 'createdBy' },
    { title: t('common.time'), dataIndex: 'createdAt', key: 'createdAt' },
  ]

  return (
    <div>
      <PageTitle />
      {chainStatus && (
        <Descriptions bordered size="small" className="mb-4" column={{ xs: 1, sm: 3 }}>
          <Descriptions.Item label={t('blockchain.rpcEnabled')}>
            <Tag color={chainStatus.rpcEnabled ? 'green' : 'default'}>
              {chainStatus.rpcEnabled ? t('blockchain.rpcConfigured') : t('blockchain.rpcNotConfigured')}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label={t('blockchain.network')}>
            {chainStatus.network ?? '-'}
          </Descriptions.Item>
        </Descriptions>
      )}
      <Tabs items={[
        {
          key: 'batch',
          label: t('inventory.batchTraceTab'),
          children: (
            <>
              <Form form={batchForm} layout="inline" className="mb-4" onFinish={(v) => searchBatch(v.batchNo)}>
                <Form.Item name="batchNo" rules={[{ required: true }]}>
                  <Input placeholder={t('inventory.batchPlaceholder')} style={{ width: 240 }} />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t('common.search')}</Button>
                </Form.Item>
              </Form>
              {batchResult && (
                <>
                  <Descriptions bordered size="small" className="mb-4">
                    <Descriptions.Item label={t('common.batchNo')}>{batchResult.batchNo}</Descriptions.Item>
                    <Descriptions.Item label={t('common.inventoryRecords')}>
                      {batchResult.inventory.length}{t('common.records')}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('common.serials')}>
                      {batchResult.serials.length}{t('common.items')}
                    </Descriptions.Item>
                  </Descriptions>
                  <div className="mb-4 flex flex-wrap gap-2">
                    <Button
                      loading={chainLoading}
                      onClick={async () => {
                        setChainLoading(true)
                        try {
                          await blockchainService.anchorBatch(batchResult.batchNo)
                          message.success(t('blockchain.anchorSuccess'))
                        } catch {
                          message.error(t('blockchain.anchorFailed'))
                        } finally {
                          setChainLoading(false)
                        }
                      }}
                    >
                      {t('blockchain.anchor')}
                    </Button>
                    <Button
                      loading={chainLoading}
                      onClick={async () => {
                        setChainLoading(true)
                        try {
                          const res = await blockchainService.verifyBatch(batchResult.batchNo)
                          setVerifyResult(res.data)
                          message[res.data.verified ? 'success' : 'warning'](
                            res.data.verified ? t('blockchain.verifySuccess') : t('blockchain.verifyFailed'),
                          )
                        } catch {
                          message.error(t('blockchain.verifyFailed'))
                        } finally {
                          setChainLoading(false)
                        }
                      }}
                    >
                      {t('blockchain.verify')}
                    </Button>
                  </div>
                  {verifyResult && (
                    <Descriptions bordered size="small" className="mb-4" column={{ xs: 1, sm: 2 }}>
                      <Descriptions.Item label={t('blockchain.verified')}>
                        <Tag color={verifyResult.verified ? 'green' : 'red'}>
                          {verifyResult.verified ? t('blockchain.verifySuccess') : t('blockchain.notAnchored')}
                        </Tag>
                      </Descriptions.Item>
                      <Descriptions.Item label={t('blockchain.chainValid')}>
                        {verifyResult.chainValid != null ? String(verifyResult.chainValid) : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('blockchain.dataIntact')}>
                        {verifyResult.dataIntact != null ? String(verifyResult.dataIntact) : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('blockchain.blockIndex')}>
                        {verifyResult.latestBlock?.blockIndex ?? '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('blockchain.txHash')}>
                        {verifyResult.onChainTx ?? verifyResult.latestBlock?.txHash ?? '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('blockchain.chainMode')}>
                        {verifyResult.latestBlock?.chainMode
                          ? t(`blockchain.chainMode_${verifyResult.latestBlock.chainMode}`)
                          : '-'}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('blockchain.network')}>
                        {verifyResult.latestBlock?.network ?? '-'}
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                  <h3 className="font-semibold mb-2">{t('common.movements')}</h3>
                  <ResponsiveTable
                    columns={movementColumns}
                    dataSource={batchResult.movements as Record<string, unknown>[]}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </>
              )}
            </>
          ),
        },
        {
          key: 'serial',
          label: t('inventory.serialTraceTab'),
          children: (
            <>
              <div className="mb-4 flex gap-2 flex-wrap">
                <Form layout="inline" onFinish={(v) => searchSerial(v.serialNo)}>
                  <Form.Item name="serialNo" rules={[{ required: true }]}>
                    <Input placeholder={t('inventory.serialPlaceholder')} style={{ width: 240 }} />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>{t('common.search')}</Button>
                  </Form.Item>
                </Form>
                <Button icon={<PlusOutlined />} onClick={openRegister}>{t('inventory.registerSerial')}</Button>
                <Button onClick={loadSerials}>{t('common.refresh')}</Button>
              </div>
              {serialResult && (
                <>
                  <Descriptions bordered size="small" className="mb-4">
                    <Descriptions.Item label={t('common.serialNo')}>{serialResult.serial.serialNo}</Descriptions.Item>
                    <Descriptions.Item label={t('common.product')}>{serialResult.serial.product?.name}</Descriptions.Item>
                    <Descriptions.Item label={t('common.batchNo')}>{serialResult.serial.batchNo ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('common.status')}>
                      <Tag>{serialResult.serial.status}</Tag>
                    </Descriptions.Item>
                  </Descriptions>
                  <h3 className="font-semibold mb-2">{t('common.flowRecords')}</h3>
                  <ResponsiveTable
                    columns={[
                      { title: t('common.actionType'), dataIndex: 'action' },
                      { title: t('common.warehouse'), dataIndex: ['warehouse', 'name'] },
                      { title: t('common.reference'), dataIndex: 'referenceNo' },
                      { title: t('common.time'), dataIndex: 'createdAt' },
                    ]}
                    dataSource={(serialResult.serial.traces ?? []) as Record<string, unknown>[]}
                    rowKey="id"
                    pagination={false}
                    size="small"
                    className="mb-4"
                  />
                  <h3 className="font-semibold mb-2">{t('common.movements')}</h3>
                  <ResponsiveTable
                    columns={movementColumns}
                    dataSource={serialResult.movements as Record<string, unknown>[]}
                    rowKey="id"
                    pagination={{ pageSize: 5 }}
                    size="small"
                  />
                </>
              )}
              {serials.length > 0 && (
                <>
                  <h3 className="font-semibold mb-2 mt-4">{t('common.registeredSerials')}</h3>
                  <ResponsiveTable
                    columns={[
                      { title: t('common.serialNo'), dataIndex: 'serialNo' },
                      { title: t('common.product'), dataIndex: ['product', 'name'] },
                      { title: t('common.batchNo'), dataIndex: 'batchNo' },
                      { title: t('common.warehouse'), dataIndex: ['warehouse', 'name'] },
                      { title: t('common.status'), dataIndex: 'status', render: (s: string) => <Tag>{s}</Tag> },
                    ]}
                    dataSource={serials}
                    rowKey="id"
                    pagination={{ pageSize: 8 }}
                    size="small"
                  />
                </>
              )}
            </>
          ),
        },
      ]} />
      <Modal title={t('inventory.registerSerialModal')} open={registerOpen} onCancel={() => setRegisterOpen(false)} footer={null}>
        <Form form={registerForm} layout="vertical" onFinish={async (values) => {
          await traceService.registerSerial(values)
          message.success(t('common.registerSuccess'))
          setRegisterOpen(false)
          loadSerials()
        }}>
          <Form.Item name="serialNo" label={t('common.serialNo')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="productId" label={t('common.product')} rules={[{ required: true }]}>
            <Select>
              {products.map((p) => <Select.Option key={p.id} value={p.id}>{p.code} - {p.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item name="batchNo" label={t('common.batchNo')}><Input /></Form.Item>
          <Form.Item name="warehouseId" label={t('common.warehouse')}>
            <Select allowClear>
              {warehouses.map((w) => <Select.Option key={w.id} value={w.id}>{w.name}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.save')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
