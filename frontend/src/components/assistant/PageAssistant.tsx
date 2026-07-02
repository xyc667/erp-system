import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Button, Input, List } from 'antd'
import type { InputRef } from 'antd'
import {
  CloseOutlined,
  DashboardOutlined,
  EditOutlined,
  FileSearchOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { notificationRoute } from '../../hooks/useNotifications'
import { useNotificationsContext } from '../../contexts/NotificationsContext'
import { brand } from '../../theme/brand'
import { spriteMaxDisplayHeight } from './catSpriteSheet'
import SpriteCatMascot from './SpriteCatMascot'
import type { CatMood } from './CatMascot'
import {
  isAssistantEnabled,
  loadAssistantPosition,
  loadCatName,
  saveAssistantPosition,
  saveCatName,
  setAssistantEnabled,
} from './assistantStorage'
import { useAssistantTip } from './useAssistantTip'
import { useTypewriter } from './useTypewriter'

const CAT_SIZE = 72
const CAT_HEIGHT = spriteMaxDisplayHeight(CAT_SIZE)
const PANEL_WIDTH = 300
const DRAG_THRESHOLD = 5

interface QuickLink {
  key: string
  label: string
  path: string
  icon: React.ReactNode
}

export default function PageAssistant() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const hasPermission = useAuthStore((s) => s.hasPermission)
  const { notifications, unread, markRead, markAllRead } = useNotificationsContext()
  const { text: tipText, source: tipSource, actionPath } = useAssistantTip(unread, notifications)
  const { displayed: typedTip, done: typewriterDone } = useTypewriter(tipText)

  const [enabled, setEnabled] = useState(isAssistantEnabled)
  const [open, setOpen] = useState(false)
  const [mood, setMood] = useState<CatMood>('idle')
  const [pos, setPos] = useState(() => loadAssistantPosition() ?? { right: 24, bottom: 24 })
  const [catName, setCatName] = useState(loadCatName)
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState(catName)

  const dragging = useRef(false)
  const dragStart = useRef({ x: 0, y: 0, right: 24, bottom: 24 })
  const moved = useRef(false)
  const nameInputRef = useRef<InputRef>(null)

  const displayCatName = catName.trim() || t('assistant.defaultCatName')

  const quickLinks = useMemo(() => {
    const links: QuickLink[] = [
      { key: 'dashboard', label: t('menu.dashboard'), path: '/dashboard', icon: <DashboardOutlined /> },
    ]
    if (hasPermission('lead:view')) {
      links.push({ key: 'pool', label: t('routes.salesLeadPool'), path: '/sales/leads/pool', icon: <TeamOutlined /> })
      links.push({ key: 'mine', label: t('routes.salesLeadMine'), path: '/sales/leads/mine', icon: <UserOutlined /> })
    }
    if (hasPermission('lead:review', 'lead:manage')) {
      links.push({ key: 'reports', label: t('routes.salesLeadReports'), path: '/sales/leads/reports', icon: <FileSearchOutlined /> })
    }
    if (hasPermission('report:center')) {
      links.push({ key: 'report', label: t('menu.report'), path: '/report', icon: <BarChartOutlined /> })
    }
    return links
  }, [hasPermission, t])

  const bubbleNavigates = Boolean(actionPath && actionPath !== pathname)

  useEffect(() => {
    setMood(unread > 0 ? 'alert' : 'idle')
  }, [unread])

  useEffect(() => {
    const onShow = () => setEnabled(true)
    const onHide = () => {
      setEnabled(false)
      setOpen(false)
    }
    window.addEventListener('erp-assistant-show', onShow)
    window.addEventListener('erp-assistant-hide', onHide)
    return () => {
      window.removeEventListener('erp-assistant-show', onShow)
      window.removeEventListener('erp-assistant-hide', onHide)
    }
  }, [])

  useEffect(() => {
    if (editingName) {
      nameInputRef.current?.focus()
      nameInputRef.current?.select()
    }
  }, [editingName])

  const flashHappy = useCallback(() => {
    setMood('happy')
    window.setTimeout(() => setMood(unread > 0 ? 'alert' : 'idle'), 1200)
  }, [unread])

  const clampPosition = useCallback((right: number, bottom: number) => {
    const maxRight = Math.max(8, window.innerWidth - CAT_SIZE - 8)
    const maxBottom = Math.max(8, window.innerHeight - CAT_HEIGHT - 8)
    return {
      right: Math.min(Math.max(8, right), maxRight),
      bottom: Math.min(Math.max(8, bottom), maxBottom),
    }
  }, [])

  useEffect(() => {
    const onResize = () => setPos((p) => clampPosition(p.right, p.bottom))
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [clampPosition])

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    dragging.current = true
    moved.current = false
    dragStart.current = { x: e.clientX, y: e.clientY, right: pos.right, bottom: pos.bottom }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      moved.current = true
      setOpen(false)
    }
    setPos(clampPosition(dragStart.current.right - dx, dragStart.current.bottom - dy))
  }

  const finishDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return
    dragging.current = false
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    setPos((current) => {
      saveAssistantPosition(current)
      return current
    })
    if (!moved.current) {
      setOpen((v) => !v)
    }
  }

  const handleHide = () => {
    setAssistantEnabled(false)
    window.dispatchEvent(new Event('erp-assistant-hide'))
  }

  const handleNotificationClick = async (id: string, type: string, read: boolean) => {
    if (!read) await markRead(id)
    const route = notificationRoute(type)
    if (route) navigate(route)
    setOpen(false)
    flashHappy()
  }

  const handleQuickLink = (path: string) => {
    navigate(path)
    setOpen(false)
    flashHappy()
  }

  const startEditName = () => {
    setNameDraft(catName)
    setEditingName(true)
  }

  const commitCatName = () => {
    const trimmed = nameDraft.trim()
    setCatName(trimmed)
    saveCatName(trimmed)
    setEditingName(false)
    flashHappy()
  }

  const handleBubbleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (!typewriterDone) return

    if (bubbleNavigates && actionPath) {
      navigate(actionPath)
      flashHappy()
      return
    }

    setOpen(true)
  }

  const handleBubbleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      if (!typewriterDone) return
      if (bubbleNavigates && actionPath) {
        navigate(actionPath)
        flashHappy()
        return
      }
      setOpen(true)
    }
  }

  if (!enabled) return null

  return (
    <div
      className="page-assistant"
      style={{ right: pos.right, bottom: pos.bottom }}
      data-testid="page-assistant"
    >
      {open && (
        <div
          className="page-assistant-panel"
          style={{
            width: PANEL_WIDTH,
            bottom: CAT_HEIGHT + 12,
            boxShadow: brand.cardShadowHover,
          }}
        >
          <div className="page-assistant-panel-header">
            <div>
              <div className="page-assistant-greeting">
                {t('assistant.greeting', {
                  name: user?.name || t('common.user'),
                  catName: displayCatName,
                })}
              </div>
              <div className="page-assistant-name-row">
                <span className="page-assistant-name-label">{t('assistant.catNameLabel')}</span>
                {editingName ? (
                  <Input
                    ref={nameInputRef}
                    size="small"
                    className="page-assistant-name-input"
                    value={nameDraft}
                    maxLength={12}
                    placeholder={t('assistant.catNamePlaceholder')}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={commitCatName}
                    onPressEnter={commitCatName}
                  />
                ) : (
                  <button type="button" className="page-assistant-name-display" onClick={startEditName}>
                    <span>{displayCatName}</span>
                    <EditOutlined className="page-assistant-name-edit-icon" />
                  </button>
                )}
              </div>
              <div className="page-assistant-sub">
                {tipSource === 'route' || tipSource === 'module'
                  ? t('assistant.pageTip')
                  : t('assistant.subtitle')}
              </div>
            </div>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              aria-label={t('assistant.close')}
              onClick={() => setOpen(false)}
            />
          </div>

          <div
            className={`page-assistant-tip page-assistant-tip--${tipSource}`}
            data-testid="assistant-page-tip"
          >
            {typedTip}
            {!typewriterDone && <span className="page-assistant-typewriter-cursor" aria-hidden>|</span>}
          </div>

          <div className="page-assistant-section-title">{t('assistant.quickLinks')}</div>
          <div className="page-assistant-links">
            {quickLinks.map((link) => (
              <button
                key={link.key}
                type="button"
                className="page-assistant-link"
                onClick={() => handleQuickLink(link.path)}
              >
                <span className="page-assistant-link-icon">{link.icon}</span>
                {link.label}
              </button>
            ))}
          </div>

          <div className="page-assistant-section-title page-assistant-section-row">
            <span>{t('app.notifications')}</span>
            {unread > 0 && (
              <Button type="link" size="small" onClick={markAllRead}>
                {t('app.markAllRead')}
              </Button>
            )}
          </div>
          <List
            size="small"
            className="page-assistant-notifications"
            dataSource={notifications.slice(0, 5)}
            locale={{ emptyText: t('app.noNotifications') }}
            renderItem={(item) => (
              <List.Item
                className={item.read ? 'opacity-60' : ''}
                onClick={() => handleNotificationClick(item.id, item.type, item.read)}
              >
                <List.Item.Meta
                  title={<span className="text-sm">{item.title}</span>}
                  description={<span className="text-xs text-gray-500">{item.message}</span>}
                />
              </List.Item>
            )}
          />

          <div className="page-assistant-footer">
            <Button type="link" size="small" danger onClick={handleHide}>
              {t('assistant.hide')}
            </Button>
          </div>
        </div>
      )}

      <div
        className="page-assistant-cat"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={finishDrag}
        onPointerCancel={finishDrag}
        role="button"
        aria-label={t('assistant.open')}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setOpen((v) => !v)
          }
        }}
      >
        <Badge count={unread} size="small" offset={[-4, 4]}>
          <SpriteCatMascot mood={mood} size={CAT_SIZE} />
        </Badge>
        {!open && (
          <button
            type="button"
            className={`page-assistant-bubble page-assistant-bubble--${tipSource} page-assistant-bubble--clickable`}
            data-testid="assistant-bubble-tip"
            aria-label={bubbleNavigates ? t('assistant.bubbleGo') : t('assistant.bubbleOpen')}
            onPointerDown={(e) => e.stopPropagation()}
            onClick={handleBubbleClick}
            onKeyDown={handleBubbleKeyDown}
          >
            <span className="page-assistant-bubble-text">
              {typedTip}
              {!typewriterDone && <span className="page-assistant-typewriter-cursor" aria-hidden>|</span>}
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

export function showPageAssistant() {
  setAssistantEnabled(true)
  window.dispatchEvent(new Event('erp-assistant-show'))
}
