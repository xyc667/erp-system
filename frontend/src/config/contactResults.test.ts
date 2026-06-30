import { describe, it, expect } from 'vitest'
import { CONTACT_RESULTS, CONTACT_RESULT_I18N, REVIEW_STATUS_I18N } from './contactResults'

describe('contactResults', () => {
  it('covers all contact result codes with i18n keys', () => {
    for (const code of CONTACT_RESULTS) {
      expect(CONTACT_RESULT_I18N[code]).toBeTruthy()
    }
  })

  it('maps review statuses used by reports UI', () => {
    expect(Object.keys(REVIEW_STATUS_I18N).sort()).toEqual(['approved', 'pending', 'rejected'])
  })
})
