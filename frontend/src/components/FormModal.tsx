import type { ReactNode } from 'react'
import type { FormInstance, ModalProps } from 'antd'
import { Form, Modal } from 'antd'
import { useTranslation } from 'react-i18next'

type FormModalProps = Omit<ModalProps, 'onOk' | 'footer' | 'confirmLoading'> & {
  form: FormInstance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onFinish: (values: any) => void | Promise<void>
  children: ReactNode
  okText?: string
  submitLoading?: boolean
}

/** 统一表单弹窗 — 垂直布局 + 底部保存/取消 */
export default function FormModal({
  form,
  onFinish,
  children,
  okText,
  submitLoading,
  onCancel,
  width = 520,
  className,
  styles,
  ...modalProps
}: FormModalProps) {
  const { t } = useTranslation()

  return (
    <Modal
      {...modalProps}
      className={['form-modal', className].filter(Boolean).join(' ')}
      width={width}
      onCancel={onCancel}
      okText={okText ?? t('common.save')}
      cancelText={t('common.cancel')}
      confirmLoading={submitLoading}
      onOk={() => form.submit()}
      destroyOnHidden
      styles={{
        body: { paddingTop: 8, maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' },
        footer: { padding: '12px 24px 16px' },
        ...styles,
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        requiredMark="optional"
        className="form-modal-body"
      >
        {children}
      </Form>
    </Modal>
  )
}
