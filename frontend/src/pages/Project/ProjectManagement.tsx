import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, Input, InputNumber, Select, Tag, Progress, message, Space } from 'antd'
import { PlusOutlined, PlayCircleOutlined, CheckOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { projectsService, Project } from '../../services/projects'
import { employeesService, Employee } from '../../services/employees'
import ResponsiveTable from '../../components/ResponsiveTable'

const statusColors: Record<string, string> = {
  planning: 'default', active: 'processing', completed: 'green', cancelled: 'red',
}

export default function ProjectManagement() {
  const { t } = useTranslation()
  const [data, setData] = useState<Project[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const fetchData = async () => {
    setLoading(true)
    try {
      const [projRes, empRes] = await Promise.all([projectsService.getAll(), employeesService.getAll()])
      setData(projRes.data)
      setEmployees(empRes.data)
    } catch {
      message.error(t('project.loadFailed'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const columns = [
    { title: t('common.projectCode'), dataIndex: 'code', key: 'code' },
    { title: t('common.projectName'), dataIndex: 'name', key: 'name' },
    { title: t('common.projectManager'), dataIndex: ['manager', 'name'], key: 'manager' },
    { title: t('common.budget'), dataIndex: 'budget', key: 'budget' },
    {
      title: t('common.progress'),
      dataIndex: 'progress',
      key: 'progress',
      render: (p: number) => <Progress percent={p} size="small" style={{ width: 120 }} />,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => (
        <Tag color={statusColors[s] || 'default'}>{t(`status.${s}`, s)}</Tag>
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: Project) => (
        <Space>
          {record.status === 'planning' && (
            <Button size="small" icon={<PlayCircleOutlined />} onClick={async () => {
              await projectsService.activate(record.id)
              message.success(t('project.activateSuccess'))
              fetchData()
            }}>{t('project.activate')}</Button>
          )}
          {record.status === 'active' && (
            <Button size="small" icon={<CheckOutlined />} onClick={async () => {
              await projectsService.complete(record.id)
              message.success(t('project.completeSuccess'))
              fetchData()
            }}>{t('project.completeProject')}</Button>
          )}
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => {
            Modal.confirm({
              title: t('common.confirmDelete'),
              onOk: async () => {
                await projectsService.delete(record.id)
                message.success(t('common.deleteSuccess'))
                fetchData()
              },
            })
          }}>{t('common.delete')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <Button icon={<PlusOutlined />} style={{ marginBottom: 20 }} onClick={() => {
        form.resetFields()
        form.setFieldsValue({ tasks: [{}] })
        setModalOpen(true)
      }}>{t('project.createProject')}</Button>
      <ResponsiveTable
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        expandable={{
          expandedRowRender: (record) => (
            <ResponsiveTable
              size="small"
              pagination={false}
              rowKey="id"
              dataSource={record.tasks}
              columns={[
                { title: t('common.task'), dataIndex: 'name' },
                { title: t('common.assignee'), dataIndex: ['assignee', 'name'] },
                {
                  title: t('common.status'),
                  dataIndex: 'status',
                  render: (s: string) => t(`status.${s}`, s),
                },
                { title: t('common.progress'), dataIndex: 'progress', render: (p: number) => `${p}%` },
              ]}
            />
          ),
        }}
      />
      <Modal title={t('project.createProjectModal')} open={modalOpen} onCancel={() => setModalOpen(false)} footer={null} width={640}>
        <Form form={form} layout="vertical" onFinish={async (values) => {
          await projectsService.create(values)
          message.success(t('common.createSuccess'))
          setModalOpen(false)
          fetchData()
        }}>
          <Form.Item name="code" label={t('common.projectCode')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="name" label={t('common.projectName')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="managerId" label={t('common.projectManager')}>
            <Select allowClear>{employees.map((e) => <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>)}</Select>
          </Form.Item>
          <Form.Item name="budget" label={t('common.budget')}><InputNumber style={{ width: '100%' }} min={0} /></Form.Item>
          <Form.Item name="description" label={t('common.description')}><Input.TextArea /></Form.Item>
          <Form.List name="tasks">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} align="baseline" className="mb-2">
                    <Form.Item {...rest} name={[name, 'name']} rules={[{ required: true }]}>
                      <Input placeholder={t('project.taskNamePlaceholder')} />
                    </Form.Item>
                    <Form.Item {...rest} name={[name, 'assigneeId']}>
                      <Select placeholder={t('project.assigneePlaceholder')} style={{ width: 120 }} allowClear>
                        {employees.map((e) => <Select.Option key={e.id} value={e.id}>{e.name}</Select.Option>)}
                      </Select>
                    </Form.Item>
                    <Button onClick={() => remove(name)} danger>{t('common.removeShort')}</Button>
                  </Space>
                ))}
                <Button onClick={() => add()} block>{t('project.addTask')}</Button>
              </>
            )}
          </Form.List>
          <Form.Item className="mt-4"><Button type="primary" htmlType="submit">{t('common.create')}</Button></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
