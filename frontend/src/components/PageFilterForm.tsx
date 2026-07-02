import type { ComponentProps } from 'react'
import { Form } from 'antd'

type PageFilterFormProps = ComponentProps<typeof Form>

/** 列表页筛选表单 — 浅底圆角条 */
export default function PageFilterForm({
  className,
  layout = 'inline',
  ...props
}: PageFilterFormProps) {
  return (
    <Form
      className={`page-filter-form${className ? ` ${className}` : ''}`}
      layout={layout}
      {...props}
    />
  )
}
