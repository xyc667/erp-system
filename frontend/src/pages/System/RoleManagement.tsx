import { useState, useEffect, useMemo } from 'react'
import PageTitle from '../../components/PageTitle'
import FormModal from '../../components/FormModal'
import PageSection from '../../components/PageSection'
import { Button, Modal, Form, Input, Checkbox, message, Divider } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { rolesService, Role, CreateRoleRequest, UpdateRoleRequest } from '../../services/roles'
import { permissionsService, Permission } from '../../services/permissions'
import ResponsiveTable from '../../components/ResponsiveTable'

interface RoleWithPermissions extends Role {
  rolePermissions?: Array<{ permission: Permission }>
}

export default function RoleManagement() {
  const { t } = useTranslation()
  const [roles, setRoles] = useState<RoleWithPermissions[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [permModalOpen, setPermModalOpen] = useState(false)
  const [form] = Form.useForm()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [permRoleId, setPermRoleId] = useState<string | null>(null)
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([])

  useEffect(() => {
    fetchRoles()
    fetchPermissions()
  }, [])

  const fetchRoles = async () => {
    setLoading(true)
    try {
      const response = await rolesService.getAll()
      setRoles(response.data as RoleWithPermissions[])
    } catch {
      message.error(t('system.loadRolesFailed'))
    } finally {
      setLoading(false)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await permissionsService.getAll()
      setPermissions(response.data)
    } catch {
      message.error(t('system.loadPermissionsFailed'))
    }
  }

  const groupedPermissions = useMemo(() => {
    return permissions.reduce<Record<string, Permission[]>>((acc, perm) => {
      if (!acc[perm.module]) acc[perm.module] = []
      acc[perm.module].push(perm)
      return acc
    }, {})
  }, [permissions])

  const handleAdd = () => {
    setEditingId(null)
    form.resetFields()
    setModalOpen(true)
  }

  const handleEdit = (role: Role) => {
    setEditingId(role.id)
    form.setFieldsValue({
      name: role.name,
      description: role.description,
    })
    setModalOpen(true)
  }

  const handleAssignPermissions = (role: RoleWithPermissions) => {
    setPermRoleId(role.id)
    const ids = role.rolePermissions?.map((rp) => rp.permission.id) || []
    setSelectedPermIds(ids)
    setPermModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: t('common.confirmDelete'),
      content: t('system.deleteRoleContent'),
      okText: t('common.confirm'),
      cancelText: t('common.cancel'),
      async onOk() {
        try {
          await rolesService.delete(id)
          message.success(t('common.deleteSuccess'))
          fetchRoles()
        } catch {
          message.error(t('common.deleteFailed'))
        }
      },
    })
  }

  const handleSubmit = async (values: CreateRoleRequest) => {
    try {
      if (editingId) {
        const updateData: UpdateRoleRequest = {
          name: values.name,
          description: values.description,
        }
        await rolesService.update(editingId, updateData)
        message.success(t('common.updateSuccess'))
      } else {
        await rolesService.create(values)
        message.success(t('common.createSuccess'))
      }
      setModalOpen(false)
      fetchRoles()
    } catch {
      message.error(t('common.operationFailed'))
    }
  }

  const handleSavePermissions = async () => {
    if (!permRoleId) return
    try {
      await rolesService.assignPermissions(permRoleId, { permissionIds: selectedPermIds })
      message.success(t('system.assignPermissionsSuccess'))
      setPermModalOpen(false)
      fetchRoles()
    } catch {
      message.error(t('system.assignPermissionsFailed'))
    }
  }

  const columns = [
    { title: t('common.roleName'), dataIndex: 'name', key: 'name' },
    { title: t('common.description'), dataIndex: 'description', key: 'description' },
    {
      title: t('common.permCount'),
      key: 'permCount',
      render: (_: unknown, record: RoleWithPermissions) =>
        record.rolePermissions?.length || 0,
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('common.action'),
      key: 'action',
      render: (_: unknown, record: RoleWithPermissions) => (
        <>
          <Button
            icon={<SafetyOutlined />}
            onClick={() => handleAssignPermissions(record)}
            size="small"
            className="mr-2"
          >
            {t('common.permissions')}
          </Button>
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
      <PageSection>
      <Button icon={<PlusOutlined />} onClick={handleAdd} style={{ marginBottom: 20 }}>
        {t('system.addRole')}
      </Button>
      <ResponsiveTable
        columns={columns}
        dataSource={roles}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
      </PageSection>
      <FormModal
        title={editingId ? t('system.editRole') : t('system.addRole')}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        form={form}
        onFinish={handleSubmit}
        okText={editingId ? t('common.save') : t('common.create')}
      >
          <Form.Item
            name="name"
            label={t('common.roleName')}
            rules={[{ required: true, message: t('common.requiredRoleName') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <Input.TextArea />
          </Form.Item>
      </FormModal>

      <Modal
        title={t('system.assignPermissions')}
        open={permModalOpen}
        onCancel={() => setPermModalOpen(false)}
        onOk={handleSavePermissions}
        width={640}
      >
        <Checkbox.Group
          value={selectedPermIds}
          onChange={(values) => setSelectedPermIds(values as string[])}
          style={{ width: '100%' }}
        >
          {Object.entries(groupedPermissions).map(([module, perms]) => (
            <div key={module} className="mb-4">
              <Divider orientation="left">{module}</Divider>
              <div className="grid grid-cols-2 gap-2">
                {perms.map((perm) => (
                  <Checkbox key={perm.id} value={perm.id}>
                    {perm.name}
                  </Checkbox>
                ))}
              </div>
            </div>
          ))}
        </Checkbox.Group>
      </Modal>
    </div>
  )
}
