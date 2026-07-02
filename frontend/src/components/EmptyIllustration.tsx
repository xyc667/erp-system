import { brand } from '../theme/brand'

export type EmptyVariant = 'default' | 'chart' | 'search'

interface EmptyIllustrationProps {
  variant?: EmptyVariant
  size?: number
}

/** 品牌风 SVG 空状态插画（无外链资源） */
export default function EmptyIllustration({
  variant = 'default',
  size = 120,
}: EmptyIllustrationProps) {
  if (variant === 'chart') {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden>
        <rect x="8" y="72" width="18" height="32" rx="4" fill="#e8eef5" />
        <rect x="34" y="52" width="18" height="52" rx="4" fill="#bee3f8" />
        <rect x="60" y="36" width="18" height="68" rx="4" fill={brand.primaryLight} />
        <rect x="86" y="58" width="18" height="46" rx="4" fill="#e8eef5" />
        <path
          d="M14 44c12-10 26-14 46-10 20 4 34 2 46-8"
          stroke={brand.primary}
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.35"
        />
        <circle cx="60" cy="24" r="10" fill="#e8eef5" stroke={brand.primaryLight} strokeWidth="2" />
      </svg>
    )
  }

  if (variant === 'search') {
    return (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden>
        <circle cx="52" cy="52" r="28" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
        <path d="M72 72l22 22" stroke={brand.primaryLight} strokeWidth="4" strokeLinecap="round" />
        <path d="M40 52h24M52 40v24" stroke="#cbd5e1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none" aria-hidden>
      <rect x="24" y="28" width="72" height="56" rx="8" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
      <path d="M24 44h72" stroke="#e2e8f0" strokeWidth="2" />
      <rect x="36" y="56" width="32" height="4" rx="2" fill="#cbd5e1" />
      <rect x="36" y="66" width="48" height="4" rx="2" fill="#e2e8f0" />
      <circle cx="84" cy="84" r="18" fill="#e8eef5" stroke={brand.primaryLight} strokeWidth="2" />
      <path d="M78 84h12M84 78v12" stroke={brand.primary} strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}
