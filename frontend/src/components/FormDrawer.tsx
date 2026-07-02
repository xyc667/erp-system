import type { ReactNode } from 'react'
import type { DrawerProps, FormInstance } from 'antd'
import { Button, Drawer, Form, Space } from 'antd'
import { useTranslation } from 'react-i18next'
import { DrawerSubtitle } from './PageDrawer'

type FormDrawerProps = Omit<DrawerProps, 'onClose' | 'footer'> & {
  form: FormInstance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFinish: (values: any) => void | Promise<void>
  children: ReactNode
  onClose: () => void
  subtitle?: ReactNode
  footerExtra?: ReactNode
  okText?: string
  submitLoading?: boolean
  blockSubmit?: boolean
}

/** 统一表单抽屉 — 垂直表单 + 底部操作栏 */
export default function FormDrawer({
  form,
  onFinish,
  children,
  onClose,
  subtitle,
  footerExtra,
  okText,
  submitLoading,
  blockSubmit = false,
  width = 520,
  className,
  styles,
  ...drawerProps
}: FormDrawerProps) {
  const { t } = useTranslation()

  return (
    <Drawer
      {...drawerProps}
      onClose={onClose}
      width={width}
      className={['form-drawer', className].filter(Boolean).join(' ')}
      styles={{
        header: { borderBottom: '1px solid #f1f5f9', padding: '16px 24px' },
        body: { padding: '16px 24px 8px' },
        footer: { borderTop: '1px solid #f1f5f9', padding: '12px 24px' },
        ...styles,
      }}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="primary"
            loading={submitLoading}
            block={blockSubmit}
            onClick={() => form.submit()}
          >
            {okText ?? t('common.save')}
          </Button>
        </Space>
      }
    >
      {subtitle ? <DrawerSubtitle>{subtitle}</DrawerSubtitle> : null}
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
        className="form-drawer-body"
      >
        {children}
      </Form>
      {footerExtra}
    </Drawer>
  )
}
