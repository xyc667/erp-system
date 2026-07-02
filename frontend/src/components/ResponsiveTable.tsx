import type { TableProps } from 'antd'
import { Spin, Table } from 'antd'
import { useIsMobile } from '../hooks/useIsMobile'
import PageEmpty from './PageEmpty'
import { TableLoadingSkeleton } from './PageSkeleton'

export default function ResponsiveTable<RecordType extends object>({
  embedded,
  className,
  locale,
  loading,
  ...props
}: TableProps<RecordType> & { embedded?: boolean }) {
  const isMobile = useIsMobile()
  const scroll = props.scroll ?? (isMobile ? { x: 'max-content' } : undefined)
  const tableClass = [
    'app-data-table',
    embedded ? 'app-data-table-embedded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const hasRows = Array.isArray(props.dataSource) && props.dataSource.length > 0
  const loadingProp = loading
    ? {
        spinning: true,
        indicator: hasRows ? <Spin /> : <TableLoadingSkeleton rows={isMobile ? 4 : 6} />,
      }
    : false

  return (
    <Table
      {...props}
      loading={loadingProp}
      className={tableClass}
      scroll={scroll}
      size={props.size ?? (isMobile ? 'small' : 'middle')}
      locale={{
        emptyText: <PageEmpty />,
        ...locale,
      }}
    />
  )
}
