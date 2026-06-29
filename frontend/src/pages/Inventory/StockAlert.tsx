import { useState, useEffect } from 'react'
import { Tag, message } from 'antd'
import { WarningOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import { inventoryAlertsService, type StockAlert } from '../../services/inventoryAlerts'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function StockAlertPage() {
  const { t } = useTranslation()
  const [data, setData] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await inventoryAlertsService.getAll()
      setData(res.data)
    } catch {
      message.error(t('inventory.loadAlertsFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.productCode'), dataIndex: 'productCode', key: 'productCode' },
    { title: t('common.productName'), dataIndex: 'productName', key: 'productName' },
    { title: t('common.category'), dataIndex: 'category', key: 'category', render: (v: string | null) => v || '-' },
    { title: t('common.unit'), dataIndex: 'unit', key: 'unit' },
    { title: t('common.currentQty'), dataIndex: 'currentQty', key: 'currentQty' },
    { title: t('common.safetyStock'), dataIndex: 'safetyStock', key: 'safetyStock' },
    {
      title: t('common.shortage'),
      dataIndex: 'shortage',
      key: 'shortage',
      render: (v: number) => <Tag color="red" icon={<WarningOutlined />}>{v}</Tag>,
    },
  ]

  return (
    <div>
      <PageTitle />
      <p className="text-gray-500 mb-4">{t('inventory.alertHint')}</p>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="productId" loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  )
}
