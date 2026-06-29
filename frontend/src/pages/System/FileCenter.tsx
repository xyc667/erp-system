import { useState, useEffect } from 'react'
import { Upload, Button, message } from 'antd'
import { UploadOutlined, LinkOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import PageTitle from '../../components/PageTitle'
import api from '../../services/api'
import ResponsiveTable from '../../components/ResponsiveTable'

interface FileAsset {
  id: string
  fileName: string
  mimeType?: string
  size: number
  createdAt: string
  uploadedBy?: { name: string }
}

export default function FileCenter() {
  const { t } = useTranslation()
  const [data, setData] = useState<FileAsset[]>([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get<FileAsset[]>('/files')
      setData(res.data)
    } catch {
      message.error(t('errors.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.file'), dataIndex: 'fileName', key: 'fileName' },
    { title: t('common.type'), dataIndex: 'mimeType', key: 'mimeType' },
    {
      title: t('common.size'),
      dataIndex: 'size',
      key: 'size',
      render: (v: number) => `${(v / 1024).toFixed(1)} KB`,
    },
    { title: t('common.uploader'), dataIndex: ['uploadedBy', 'name'], key: 'uploadedBy' },
    { title: t('common.time'), dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: FileAsset) => (
        <Button
          size="small"
          icon={<LinkOutlined />}
          onClick={async () => {
            const res = await api.get<{ url: string | null }>(`/files/${record.id}/url`)
            if (res.data.url) window.open(res.data.url, '_blank')
            else message.info(t('files.storageDisabled'))
          }}
        >
          {t('common.download')}
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <Upload
        customRequest={async ({ file, onSuccess, onError }) => {
          try {
            const form = new FormData()
            form.append('file', file as File)
            await api.post('/files/upload', form, {
              headers: { 'Content-Type': 'multipart/form-data' },
            })
            message.success(t('files.uploadSuccess'))
            fetchData()
            onSuccess?.(null)
          } catch (e) {
            onError?.(e as Error)
          }
        }}
        showUploadList={false}
      >
        <Button icon={<UploadOutlined />} style={{ marginBottom: 16 }}>{t('common.upload')}</Button>
      </Upload>
      <ResponsiveTable columns={columns} dataSource={data} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
    </div>
  )
}
