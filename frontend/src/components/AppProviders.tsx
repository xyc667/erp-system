import { ReactNode } from 'react'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import { useTranslation } from 'react-i18next'
import { useIsMobile } from '../hooks/useIsMobile'
import { brand } from '../theme/brand'
import GlobalEmpty from './GlobalEmpty'

export default function AppProviders({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation()
  const isMobile = useIsMobile()
  const antLocale = i18n.language.startsWith('en') ? enUS : zhCN

  return (
    <ConfigProvider
      locale={antLocale}
      renderEmpty={() => <GlobalEmpty />}
      theme={{
        token: {
          colorPrimary: brand.primary,
          borderRadius: 8,
          colorBgContainer: '#ffffff',
          colorText: brand.primary,
          colorTextSecondary: brand.primaryMuted,
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
        components: {
          Menu: {
            darkItemBg: brand.primary,
            darkSubMenuItemBg: brand.primary,
            darkItemSelectedBg: 'rgba(255,255,255,0.1)',
          },
          Card: {
            borderRadiusLG: 12,
          },
          Table: {
            cellPaddingBlock: isMobile ? 8 : 12,
            cellPaddingInline: isMobile ? 8 : 16,
            headerBg: '#f8fafc',
            headerColor: brand.primary,
            headerSplitColor: '#e2e8f0',
            rowHoverBg: '#f1f5f9',
            borderColor: '#e2e8f0',
          },
          Form: {
            labelColor: brand.primary,
            labelFontSize: 13,
            itemMarginBottom: isMobile ? 12 : 16,
          },
          Input: {
            activeBorderColor: brand.primaryLight,
            hoverBorderColor: '#cbd5e1',
          },
          Select: {
            optionSelectedBg: '#e8eef5',
          },
          Modal: {
            borderRadiusLG: 12,
            headerBg: '#fff',
            titleFontSize: 16,
            paddingContentHorizontal: 24,
            paddingMD: 20,
          },
          Drawer: {
            paddingLG: 24,
            footerPaddingBlock: 12,
            footerPaddingInline: 24,
          },
          Skeleton: {
            gradientFromColor: '#f1f5f9',
            gradientToColor: '#e2e8f0',
          },
          Button: {
            primaryShadow: '0 2px 0 rgba(26, 54, 93, 0.06)',
          },
        },
      }}
    >
      {children}
    </ConfigProvider>
  )
}
