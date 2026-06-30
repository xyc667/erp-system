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

export const CONTACT_RESULT_I18N: Record<ContactResult, string> = {
  connected: 'resultConnected',
  no_answer: 'resultNoAnswer',
  interested: 'resultInterested',
  rejected: 'resultRejected',
  schedule_next: 'resultScheduleNext',
  wrong_number: 'resultWrongNumber',
  closed: 'resultClosed',
}

export const REVIEW_STATUS_I18N: Record<string, string> = {
  pending: 'reviewPending',
  approved: 'reviewApproved',
  rejected: 'reviewRejected',
}
