import { ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../hooks/useIsMobile'

export default function AppProviders({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const isMobile = useIsMobile()
  const antLocale = i18n.language.startsWith('en') ? enUS : zhCN

  return (
    <ConfigProvider
      locale={antLocale}
      theme={{
        token: {
          borderRadius: 8,
        },
        components: {
          Table: {
            cellPaddingBlock: isMobile ? 8 : 12,
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
