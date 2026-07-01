export const CONTACT_RESULTS = [
  'connected',
  'no_answer',
  'interested',
  'rejected',
  'schedule_next',
  'wrong_number',
  'closed',
] as const

export type ContactResult = (typeof CONTACT_RESULTS)[number]

export const CONTACT_RESULT_LABELS: Record<ContactResult, string> = {
  connected: '已接通',
  no_answer: '未接听',
  interested: '有意向',
  rejected: '无意向',
  schedule_next: '约下次联系',
  wrong_number: '空号/错号',
  closed: '已关店',
}

export const FOLLOW_TYPES = [
  { value: 'call', label: '电话' },
  { value: 'visit', label: '拜访' },
  { value: 'wechat', label: '微信' },
  { value: 'other', label: '其他' },
] as const
