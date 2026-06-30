import { createHash } from 'crypto';

export const LEAD_CLAIM_LIMIT = 50;
export const LEAD_PROTECTION_DAYS = 14;

export const CONTACT_RESULTS = [
  'connected',
  'no_answer',
  'interested',
  'rejected',
  'schedule_next',
  'wrong_number',
  'closed',
] as const;

export type ContactResult = (typeof CONTACT_RESULTS)[number];

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/webm',
  'audio/ogg',
  'audio/aac',
];

export function normalizeLeadName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, '');
}

export function buildLeadDedupKey(name: string, phone?: string | null, district?: string | null): string {
  const raw = `${normalizeLeadName(name)}|${(phone || '').trim()}|${(district || '').trim()}`;
  return createHash('sha256').update(raw).digest('hex');
}

export function addProtectionDays(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() + LEAD_PROTECTION_DAYS);
  return d;
}
