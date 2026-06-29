import type { TableProps } from 'antd'
import { Table } from 'antd'
import { useIsMobile } from '../hooks/useIsMobile'

export default function ResponsiveTable<RecordType extends object>(
  props: TableProps<RecordType>,
) {
  const isMobile = useIsMobile()
  const scroll = props.scroll ?? (isMobile ? { x: 'max-content' } : undefined)

  return (
    <Table
      {...props}
      scroll={scroll}
      size={props.size ?? (isMobile ? 'small' : 'middle')}
    />
  )
}
