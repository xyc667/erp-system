import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Tabs, Button, Modal, Form, Input, Select, InputNumber, Tag, message, Space, DatePicker } from 'antd'
import { PlusOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { financeService, GlAccount, GlJournal } from '../../services/finance'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function GeneralLedger() {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState<GlAccount[]>([])
  const [journals, setJournals] = useState<GlJournal[]>([])
  const [accountModalOpen, setAccountModalOpen] = useState(false)
  const [journalModalOpen, setJournalModalOpen] = useState(false)
  const [accountForm] = Form.useForm()
  const [journalForm] = Form.useForm()

  const fetchData = async () => {
    try {
      const [accountRes, journalRes] = await Promise.all([
        financeService.getAccounts(),
        financeService.getJournals(),
      ])
      setAccounts(accountRes.data)
      setJournals(journalRes.data)
    } catch {
      message.error(t('finance.loadFailed'))
    }
  }

  useEffect(() => { fetchData() }, [])

  const accountColumns = [
    { title: t('common.accountCode'), dataIndex: 'code', key: 'code' },
    { title: t('common.accountName'), dataIndex: 'name', key: 'name' },
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => t(`accountType.${v}`, v),
    },
    { title: t('common.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: GlAccount) => (
        <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
          Modal.confirm({
            title: t('common.confirmDelete'),
            onOk: async () => {
              await financeService.deleteAccount(record.id)
              message.success(t('common.deleteSuccess'))
              fetchData()
            },
          })
        }}>{t('common.delete')}</Button>
      ),
    },
  ]

  const journalColumns = [
    { title: t('common.journalNo'), dataIndex: 'journalNo', key: 'journalNo' },
    {
      title: t('common.date'),
      dataIndex: 'date',
      key: 'date',
      render: (v: string) => new Date(v).toLocaleDateString(),
    },
    {
      title: t('common.type'),
      dataIndex: 'type',
      key: 'type',
      render: (v: string) => t(`journalType.${v}`, v),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={s === 'posted' ? 'green' : 'default'}>{t(`status.${s}`, s)}</Tag>
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: GlJournal) => (
        <Space>
          {record.status === 'draft' && (
            <>
              <Button size="small" icon={<CheckOutlined />} onClick={async () => {
                await financeService.approveJournal(record.id)
                message.success(t('finance.postSuccess'))
                fetchData()
              }}>{t('common.post')}</Button>
              <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
                Modal.confirm({
                  title: t('common.confirmDelete'),
                  onOk: async () => {
                    await financeService.deleteJournal(record.id)
                    message.success(t('common.deleteSuccess'))
                    fetchData()
                  },
                })
              }}>{t('common.delete')}</Button>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <Tabs items={[
        {
          key: 'accounts',
          label: t('finance.accountsTab'),
          children: (
            <>
              <Button icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => {
                accountForm.resetFields()
                setAccountModalOpen(true)
              }}>{t('finance.addAccount')}</Button>
              <ResponsiveTable columns={accountColumns} dataSource={accounts} rowKey="id" pagination={{ pageSize: 10 }} />
            </>
          ),
        },
        {
          key: 'journals',
          label: t('finance.journalsTab'),
          children: (
            <>
              <Button icon={<PlusOutlined />} style={{ marginBottom: 16 }} onClick={() => {
                journalForm.resetFields()
                journalForm.setFieldsValue({ lines: [{ debit: 0, credit: 0 }, { debit: 0, credit: 0 }] })
                setJournalModalOpen(true)
              }}>{t('finance.createJournal')}</Button>
              <ResponsiveTable
                columns={journalColumns}
                dataSource={journals}
                rowKey="id"
                expandable={{
                  expandedRowRender: (record) => (
                    <ResponsiveTable
                      size="small"
                      pagination={false}
                      rowKey="id"
                      dataSource={record.lines}
                      columns={[
                        { title: t('common.account'), dataIndex: ['account', 'name'] },
                        { title: t('common.debit'), dataIndex: 'debit' },
                        { title: t('common.credit'), dataIndex: 'credit' },
                        { title: t('common.summary'), dataIndex: 'description' },
                      ]}
                    />
                  ),
                }}
              />
            </>
          ),
        },
      ]} />

      <Modal title={t('finance.addAccountModal')} open={accountModalOpen} onCancel={() => setAccountModalOpen(false)} footer={null}>
        <Form form={accountForm} layout="vertical" onFinish={async (values) => {
          await financeService.createAccount(values)
          message.success(t('common.createSuccess'))
          setAccountModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="code" label={t('common.accountCode')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label={t('common.accountName')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="type" label={t('common.type')} rules={[{ required: true }]}>
            <Select>
              {(['asset', 'liability', 'equity', 'revenue', 'expense'] as const).map((k) => (
                <Select.Option key={k} value={k}>{t(`accountType.${k}`)}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}><Input /></Form.Item>
          <Form.Item><Button type="primary" htmlType="submit">{t('common.save')}</Button></Form.Item>
        </Form>
      </Modal>

      <Modal title={t('finance.createJournalModal')} open={journalModalOpen} onCancel={() => setJournalModalOpen(false)} footer={null} width={720}>
        <Form form={journalForm} layout="vertical" onFinish={async (values) => {
          await financeService.createJournal({
            date: values.date.format('YYYY-MM-DD'),
            type: values.type,
            lines: values.lines,
          })
          message.success(t('common.createSuccess'))
          setJournalModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="date" label={t('common.journalDate')} rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="type" label={t('common.journalType')} rules={[{ required: true }]}>
            <Select>
              {(['general', 'payment', 'receipt'] as const).map((k) => (
                <Select.Option key={k} value={k}>{t(`journalType.${k}`)}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" className="mb-2">
                    <Form.Item {...rest} name={[name, 'accountId']} rules={[{ required: true }]}>
                      <Select placeholder={t('common.account')} style={{ width: 180 }}>
                        {accounts.map((a) => <Select.Option key={a.id} value={a.id}>{a.code} {a.name}</Select.Option>)}
                      </Select>
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'debit']} rules={[{ required: true }]}>
                      <InputNumber placeholder={t('common.debit')} min={0} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'credit']} rules={[{ required: true }]}>
                      <InputNumber placeholder={t('common.credit')} min={0} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'description']}>
                      <Input placeholder={t('common.summary')} />
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>{t('common.removeShort')}</Button>
                  </Space>
                ))}
                <Button onClick={() => add()} block>{t('common.addEntry')}</Button>
              </>
            )}
          </Form.List>
          <Form.Item className="mt-4"><Button type="primary" htmlType="submit">{t('common.create')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
