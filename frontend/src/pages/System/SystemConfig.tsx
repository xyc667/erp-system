import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import PageSection from '../../components/PageSection'
import { Button, Form, Input, message, Modal, Tabs } from 'antd'
import FormModal from '../../components/FormModal'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { systemService, SystemConfig, Dictionary } from '../../services/system'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function SystemConfigPage() {
  const { t } = useTranslation()
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [dictionaries, setDictionaries] = useState<Dictionary[]>([])
  const [configModalOpen, setConfigModalOpen] = useState(false)
  const [dictModalOpen, setDictModalOpen] = useState(false)
  const [itemModalOpen, setItemModalOpen] = useState(false)
  const [configForm] = Form.useForm()
  const [dictForm] = Form.useForm()
  const [itemForm] = Form.useForm()
  const [selectedDictId, setSelectedDictId] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [configRes, dictRes] = await Promise.all([
        systemService.getConfigs(),
        systemService.getDictionaries(),
      ])
      setConfigs(configRes.data)
      setDictionaries(dictRes.data)
    } catch {
      message.error(t('system.loadConfigFailed'))
    }
  }

  useEffect(() => { fetchData() }, [])

  const configColumns = [
    { title: t('common.configKey'), dataIndex: 'key', key: 'key' },
    { title: t('common.configValue'), dataIndex: 'value', key: 'value' },
    { title: t('common.group'), dataIndex: 'group', key: 'group' },
    { title: t('common.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: SystemConfig) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
          Modal.confirm({
            title: t('common.confirmDelete'),
            onOk: async () => {
              await systemService.deleteConfig(record.id)
              message.success(t('common.deleteSuccess'))
              fetchData()
            },
          })
        }}>{t('common.delete')}</Button>
      ),
    },
  ]

  const dictColumns = [
    { title: t('common.code'), dataIndex: 'code', key: 'code' },
    { title: t('common.name'), dataIndex: 'name', key: 'name' },
    { title: t('common.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Dictionary) => (
        <>
          <Button size="small" className="mr-2" onClick={() => {
            setSelectedDictId(record.id)
            itemForm.resetFields()
            setItemModalOpen(true)
          }}>{t('system.addDictItem')}</Button>
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              onOk: async () => {
                await systemService.deleteDictionary(record.id)
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
      <Tabs items={[
        {
          key: 'config',
          label: t('system.configTab'),
          children: (
            <>
              <Button icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => {
                configForm.resetFields()
                setConfigModalOpen(true)
              }}>{t('system.addConfig')}</Button>
              <ResponsiveTable columns={configColumns} dataSource={configs} rowKey="id" pagination={{ pageSize: 10 }} />
            </>
          ),
        },
        {
          key: 'dictionary',
          label: t('system.dictionaryTab'),
          children: (
            <>
              <Button icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => {
                dictForm.resetFields()
                setDictModalOpen(true)
              }}>{t('system.addDictionary')}</Button>
              <ResponsiveTable
                columns={dictColumns}
                dataSource={dictionaries}
                rowKey="id"
                expandable={{
                  expandedRowRender: (record) => (
                    <ResponsiveTable
                      embedded
                      size="small"
                      pagination={false}
                      rowKey="id"
                      dataSource={record.items}
                      columns={[
                        { title: t('common.label'), dataIndex: 'label' },
                        { title: t('common.value'), dataIndex: 'value' },
                        { title: t('common.sortOrder'), dataIndex: 'sortOrder' },
                        {
                          title: t('common.action'),
                          render: (_: unknown, item) => (
                            <Button size="small" danger onClick={async () => {
                              await systemService.deleteDictionaryItem(item.id)
                              message.success(t('common.deleteSuccess'))
                              fetchData()
                            }}>{t('common.delete')}</Button>
                          ),
                        },
                      ]}
                    />
                  ),
                }}
              />
            </>
          ),
        },
      ]} />

      </PageSection>

      <FormModal title={t('system.addConfigModal')} open={configModalOpen} onCancel={() => setConfigModalOpen(false)} form={configForm} onFinish={async (values) => {
          await systemService.createConfig(values)
          message.success(t('common.createSuccess'))
          setConfigModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="key" label={t('common.configKey')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="value" label={t('common.configValue')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="group" label={t('common.group')}><Input placeholder="general" /></Form.Item>
          <Form.Item name="description" label={t('common.description')}><Input /></Form.Item>
      </FormModal>

      <FormModal title={t('system.addDictionaryModal')} open={dictModalOpen} onCancel={() => setDictModalOpen(false)} form={dictForm} onFinish={async (values) => {
          await systemService.createDictionary(values)
          message.success(t('common.createSuccess'))
          setDictModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="code" label={t('common.code')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label={t('common.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label={t('common.description')}><Input /></Form.Item>
      </FormModal>

      <FormModal title={t('system.addDictionaryItem')} open={itemModalOpen} onCancel={() => setItemModalOpen(false)} form={itemForm} onFinish={async (values) => {
          if (!selectedDictId) return
          await systemService.addDictionaryItem(selectedDictId, values)
          message.success(t('common.createSuccess'))
          setItemModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="label" label={t('common.label')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="value" label={t('common.value')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sortOrder" label={t('common.sortOrder')}><Input type="number" /></Form.Item>
      </FormModal>
    </div>
  )
}
