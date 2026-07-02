import { useState } from 'react'
import { Button, Form, Input, Select, message } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { LEAD_CATEGORIES, LEAD_DISTRICTS } from '../../config/leadFilters'
import PageCard from '../PageCard'
import type { ImportLeadItem } from '../../services/leads'
import { leadsService } from '../../services/leads'

interface LeadQuickAddFormProps {
  onImported?: () => void
}

export default function LeadQuickAddForm({ onImported }: LeadQuickAddFormProps) {
  const { t } = useTranslation()
  const [form] = Form.useForm<ImportLeadItem>()
  const [loading, setLoading] = useState(false)

  const submit = async (continueNext: boolean) => {
    let values: ImportLeadItem
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    setLoading(true)
    try {
      const res = await leadsService.import([{ ...values, source: values.source || 'manual' }])
      if (res.data.created > 0) {
        message.success(t('leads.quickAddSuccess'))
      } else if (res.data.skipped > 0) {
        message.warning(t('leads.quickAddDuplicate'))
      } else {
        message.error(t('common.operationFailed'))
      }
      onImported?.()
      if (continueNext) {
        form.resetFields()
        form.setFieldsValue({ source: 'manual' })
      }
    } catch {
      message.error(t('common.operationFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageCard title={t('leads.quickAddTitle')} className="mb-4">
      <Form
        form={form}
        layout="vertical"
        initialValues={{ source: 'manual' }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4"
      >
        <Form.Item
          name="name"
          label={t('leads.quickAddName')}
          rules={[{ required: true, message: t('leads.quickAddNameRequired') }]}
          className="md:col-span-2 lg:col-span-1"
        >
          <Input placeholder={t('leads.quickAddNamePlaceholder')} maxLength={200} />
        </Form.Item>
        <Form.Item name="phone" label={t('leads.quickAddPhone')}>
          <Input placeholder="024-12345678" maxLength={50} />
        </Form.Item>
        <Form.Item name="district" label={t('leads.district')}>
          <Select
            allowClear
            placeholder={t('leads.quickAddDistrictPlaceholder')}
            options={LEAD_DISTRICTS.map((d) => ({ value: d, label: d }))}
          />
        </Form.Item>
        <Form.Item name="category" label={t('leads.quickAddCategory')}>
          <Select
            allowClear
            showSearch
            placeholder={t('leads.quickAddCategoryPlaceholder')}
            options={LEAD_CATEGORIES.map((c) => ({ value: c, label: c }))}
          />
        </Form.Item>
        <Form.Item name="address" label={t('leads.quickAddAddress')} className="md:col-span-2">
          <Input placeholder={t('leads.quickAddAddressPlaceholder')} maxLength={500} />
        </Form.Item>
        <Form.Item name="remark" label={t('leads.quickAddRemark')} className="md:col-span-2 lg:col-span-3">
          <Input.TextArea rows={2} maxLength={500} placeholder={t('leads.quickAddRemarkPlaceholder')} />
        </Form.Item>
      </Form>
      <div className="flex flex-wrap gap-2 mt-2">
        <Button type="primary" icon={<PlusOutlined />} loading={loading} onClick={() => submit(false)}>
          {t('leads.quickAddSubmit')}
        </Button>
        <Button loading={loading} onClick={() => submit(true)}>
          {t('leads.quickAddContinue')}
        </Button>
      </div>
    </PageCard>
  )
}
