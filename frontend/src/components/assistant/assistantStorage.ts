const ENABLED_KEY = 'erp_assistant_enabled'
const POS_KEY = 'erp_assistant_pos'
const CAT_NAME_KEY = 'erp_assistant_cat_name'
const DEFAULT_CAT_NAME = ''

export interface AssistantPosition {
  right: number
  bottom: number
}

export function isAssistantEnabled(): boolean {
  const raw = localStorage.getItem(ENABLED_KEY)
  return raw === null ? true : raw === 'true'
}

export function setAssistantEnabled(enabled: boolean) {
  localStorage.setItem(ENABLED_KEY, String(enabled))
}

export function loadAssistantPosition(): AssistantPosition | null {
  try {
    const raw = localStorage.getItem(POS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AssistantPosition
  } catch {
    return null
  }
}

export function saveAssistantPosition(pos: AssistantPosition) {
  localStorage.setItem(POS_KEY, JSON.stringify(pos))
}

export function loadCatName(): string {
  return localStorage.getItem(CAT_NAME_KEY) ?? DEFAULT_CAT_NAME
}

export function saveCatName(name: string) {
  const trimmed = name.trim()
  if (trimmed) {
    localStorage.setItem(CAT_NAME_KEY, trimmed)
  } else {
    localStorage.removeItem(CAT_NAME_KEY)
  }
}
