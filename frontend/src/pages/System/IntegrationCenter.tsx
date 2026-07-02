import { useState } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import PageCard from '../../components/PageCard'
import { Button, Modal, Typography, message, Space } from 'antd'
import { ApiOutlined, DownloadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { integrationService } from '../../services/integration'

const { Paragraph, Text } = Typography

export default function IntegrationCenter() {
  const { t } = useTranslation()
  const [loading, setLoading] = useState<string | null>(null)
  const [preview, setPreview] = useState<{ title: string; data: unknown } | null>(null)

  const fetchExport = async (key: string, title: string, fn: () => Promise<{ data: unknown }>) => {
    setLoading(key)
    try {
      const res = await fn()
      setPreview({ title, data: res.data })
    } catch {
      message.error(t('system.exportFailed'))
    } finally {
      setLoading(null)
    }
  }

  const endpoints = [
    {
      key: 'master',
      title: t('system.masterDataSync'),
      path: 'GET /api/integration/master-data',
      desc: t('system.masterDataSyncDesc'),
      action: () => fetchExport('master', t('system.exportMasterData'), integrationService.exportMasterData),
    },
    {
      key: 'sales',
      title: t('system.salesOrderSync'),
      path: 'GET /api/integration/orders?type=sales',
      desc: t('system.salesOrderSyncDesc'),
      action: () => fetchExport('sales', t('system.exportSalesOrders'), () => integrationService.exportOrders('sales')),
    },
    {
      key: 'purchase',
      title: t('system.purchaseOrderSync'),
      path: 'GET /api/integration/orders?type=purchase',
      desc: t('system.purchaseOrderSyncDesc'),
      action: () => fetchExport('purchase', t('system.exportPurchaseOrders'), () => integrationService.exportOrders('purchase')),
    },
    {
      key: 'inventory',
      title: t('system.inventorySync'),
      path: 'GET /api/integration/inventory',
      desc: t('system.inventorySyncDesc'),
      action: () => fetchExport('inventory', t('system.exportInventory'), integrationService.exportInventory),
    },
  ]

  return (
    <div>
      <PageTitle />
      <PageSection>
      <Paragraph type="secondary">
        {t('system.integrationHint')}
      </Paragraph>
      <Space direction="vertical" size="middle" className="w-full">
        {endpoints.map((ep) => (
          <PageCard key={ep.key} title={<><ApiOutlined className="mr-2" />{ep.title}</>}>
            <Paragraph><Text code>{ep.path}</Text></Paragraph>
            <Paragraph type="secondary">{ep.desc}</Paragraph>
            <Button
              icon={<DownloadOutlined />}
              loading={loading === ep.key}
              onClick={ep.action}
            >
              {t('system.previewExport')}
            </Button>
          </PageCard>
        ))}
      </Space>
      </PageSection>
      <Modal
        title={preview?.title}
        open={!!preview}
        onCancel={() => setPreview(null)}
        footer={null}
        width={800}
      >
        <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-96 text-xs">
          {JSON.stringify(preview?.data, null, 2)}
        </pre>
      </Modal>
    </div>
  )
}
