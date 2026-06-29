import { useState, useEffect } from 'react'
import PageTitle from '../../components/PageTitle'
import { Button, Modal, Form, Input, Select, Switch, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { usersService, User, CreateUserRequest, UpdateUserRequest } from '../../services/users'
import { rolesService, Role } from '../../services/roles'
import ResponsiveTable from '../../components/ResponsiveTable'

export default function UserManagement() {
  const { t } = useTranslation()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState<string | null>(null)

  useEffect(() => {
    fetchUsers()
    fetchRoles()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await usersService.getAll()
      setUsers(response.data)
    } catch {
      message.error(t('system.loadUsersFailed'))
    } finally {
      setLoading(false)
    }
  }

  const fetchRoles = async () => {
    try {
      const response = await rolesService.getAll()
      setRoles(response.data)
    } catch {
      message.error(t('system.loadRolesFailed'))
    }
  }

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (user: User) => {
    setEditingId(user.id)
    form.setFieldsValue({
      username: user.username,
      name: user.name,
      email: user.email,
      phone: user.phone,
      roleId: user.roleId,
      status: user.status === 'active',
    })
    setModalVisible(true)
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: t('system.deleteUserContent'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      async onOk() {
        try {
          await usersService.delete(id)
          message.success(t('common.deleteSuccess'))
          fetchUsers()
        } catch {
          message.error(t('common.deleteFailed'))
        }
      },
    })
  }

  const handleSubmit = async (values: CreateUserRequest & { status: boolean }) => {
    try {
      if (editingId) {
        const updateData: UpdateUserRequest = {
          name: values.name,
          email: values.email,
          phone: values.phone,
          roleId: values.roleId,
          status: values.status ? 'active' : 'inactive',
          password: values.password,
        }
        await usersService.update(editingId, updateData)
        message.success(t('common.updateSuccess'))
      } else {
        await usersService.create(values)
        message.success(t('common.createSuccess'))
      }
      setModalVisible(false)
      fetchUsers()
    } catch {
      message.error(t('common.operationFailed'))
    }
  }

  const columns = [
    { title: t('app.username'), dataIndex: 'username', key: 'username' },
    { title: t('common.fullName'), dataIndex: 'name', key: 'name' },
    { title: t('common.email'), dataIndex: 'email', key: 'email' },
    { title: t('common.phone'), dataIndex: 'phone', key: 'phone' },
    {
      title: t('common.role'),
      dataIndex: 'role',
      key: 'role',
      render: (role: { name: string }) => role.name,
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Switch checked={status === 'active'} disabled />
      ),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: User) => (
        <>
          <Button
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
            className="mr-2"
          >
            {t('common.edit')}
          </Button>
          <Button
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
            size="small"
            danger
          >
            {t('common.delete')}
          </Button>
        </>
      ),
    },
  ]

  return (
    <div>
      <PageTitle />
      <Button
        icon={<PlusOutlined />}
        onClick={handleAdd}
        style={{ marginBottom: 20 }}
      >
        {t('system.addUser')}
      </Button>
      <ResponsiveTable
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      <Modal
        title={editingId ? t('system.editUser') : t('system.addUser')}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
        >
          <Form.Item
            name="username"
            label={t('app.username')}
            rules={[{ required: true, message: t('common.requiredUsername') }]}
          >
            <Input disabled={!!editingId} />
          </Form.Item>
          {!editingId && (
            <Form.Item
              name="password"
              label={t('app.password')}
              rules={[{ required: true, message: t('common.requiredPassword') }]}
            >
              <Input.Password />
            </Form.Item>
          )}
          {editingId && (
            <Form.Item
              name="password"
              label={t('common.newPasswordOptional')}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item
            name="name"
            label={t('common.fullName')}
            rules={[{ required: true, message: t('common.requiredFullName') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="email" label={t('common.email')}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label={t('common.phone')}>
            <Input />
          </Form.Item>
          <Form.Item
            name="roleId"
            label={t('common.role')}
            rules={[{ required: true, message: t('common.requiredRole') }]}
          >
            <Select>
              {roles.map((role) => (
                <Select.Option key={role.id} value={role.id}>
                  {role.name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="status" label={t('common.status')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              {editingId ? t('common.save') : t('common.create')}
            </Button>
            <Button onClick={() => setModalVisible(false)} className="ml-2">
              {t('common.cancel')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
