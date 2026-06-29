import { Breadcrumb } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getBreadcrumbItems } from '../config/routeLabels'

export default function BreadcrumbNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const items = getBreadcrumbItems(location.pathname, t)

  return (
    <Breadcrumb
      className="mb-4"
      items={items.map((item, index) => ({
        title: item.path && index < items.length - 1 ? (
          <a
            onClick={(e) => {
              e.preventDefault()
              navigate(item.path!)
            }}
          >
            {item.title}
          </a>
        ) : (
          item.title
        ),
      }))}
    />
  )
}
