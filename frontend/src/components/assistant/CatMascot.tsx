import { useEffect, useState } from 'react'

export type CatMood = 'idle' | 'alert' | 'happy'

type IdlePose = 'rest' | 'blink' | 'look-left' | 'look-right' | 'perk-up' | 'tail-flourish' | 'yawn' | 'stretch'

const IDLE_POSE_HOLD_MS: Record<IdlePose, number> = {
  rest: 500,
  blink: 200,
  'look-left': 1000,
  'look-right': 1000,
  'perk-up': 1000,
  'tail-flourish': 1000,
  yawn: 1900,
  stretch: 1700,
}

const IDLE_POSE_CHOICES: IdlePose[] = [
  'blink',
  'look-left',
  'look-right',
  'perk-up',
  'tail-flourish',
  'yawn',
  'stretch',
  'rest',
  'rest',
  'rest',
]

interface CatMascotProps {
  mood?: CatMood
  size?: number
}

function useIdlePose(active: boolean) {
  const [pose, setPose] = useState<IdlePose>('rest')

  useEffect(() => {
    if (!active) {
      setPose('rest')
      return undefined
    }

    let cancelled = false
    let timer = 0

    const schedule = () => {
      const wait = 2200 + Math.random() * 4800
      timer = window.setTimeout(() => {
        if (cancelled) return
        const pick = IDLE_POSE_CHOICES[Math.floor(Math.random() * IDLE_POSE_CHOICES.length)]
        setPose(pick)
        const hold = IDLE_POSE_HOLD_MS[pick]
        timer = window.setTimeout(() => {
          if (cancelled) return
          setPose('rest')
          schedule()
        }, hold)
      }, wait)
    }

    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [active])

  return pose
}

function AdorableEyes() {
  return (
    <g className="cat-eyes">
      <ellipse cx="31" cy="33" rx="6" ry="6.5" fill="#fff" />
      <ellipse cx="49" cy="33" rx="6" ry="6.5" fill="#fff" />
      <circle cx="31.5" cy="34" r="4" fill="#2D3748" />
      <circle cx="48.5" cy="34" r="4" fill="#2D3748" />
      <circle cx="33.5" cy="32" r="1.8" fill="#fff" />
      <circle cx="50.5" cy="32" r="1.8" fill="#fff" />
      <circle cx="29.5" cy="35.5" r="0.7" fill="#fff" opacity="0.85" />
      <circle cx="46.5" cy="35.5" r="0.7" fill="#fff" opacity="0.85" />
      <ellipse className="cat-eyelid cat-eyelid--left" cx="31" cy="33" rx="6" ry="6.5" fill="#FBD38D" />
      <ellipse className="cat-eyelid cat-eyelid--right" cx="49" cy="33" rx="6" ry="6.5" fill="#FBD38D" />
    </g>
  )
}

/** Q 版小猫桌宠形象 */
export default function CatMascot({ mood = 'idle', size = 72 }: CatMascotProps) {
  const idlePose = useIdlePose(mood === 'idle')
  const poseClass = mood === 'idle' ? `cat-mascot--pose-${idlePose}` : ''

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`cat-mascot cat-mascot--${mood} ${poseClass}`.trim()}
      aria-hidden
    >
      <ellipse className="cat-shadow" cx="40" cy="72" rx="22" ry="4" fill="#1a365d" opacity="0.12" />
      <g className="cat-tail">
        <path
          d="M62 48c8 4 12 14 8 22-6-2-10-8-10-14 0-4 1-6 2-8z"
          fill="#F6AD55"
          stroke="#DD6B20"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </g>
      <g className="cat-body">
        <ellipse cx="40" cy="52" rx="24" ry="20" fill="#FBD38D" />
        <ellipse cx="40" cy="56" rx="14" ry="12" fill="#FEEBC8" />
        <g className="cat-paws">
          <ellipse cx="30" cy="66" rx="5" ry="3" fill="#F6AD55" />
          <ellipse cx="50" cy="66" rx="5" ry="3" fill="#F6AD55" />
        </g>
        <g className="cat-stretch-arms">
          <path d="M26 58 Q20 50 22 40" stroke="#F6AD55" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <ellipse cx="21" cy="38" rx="4.5" ry="4" fill="#F6AD55" stroke="#DD6B20" strokeWidth="1" />
          <path d="M54 58 Q60 50 58 40" stroke="#F6AD55" strokeWidth="5.5" strokeLinecap="round" fill="none" />
          <ellipse cx="59" cy="38" rx="4.5" ry="4" fill="#F6AD55" stroke="#DD6B20" strokeWidth="1" />
        </g>
        <path
          className="cat-cheek-fluff"
          d="M28 44c-6-8-2-16 6-14 4 1 6 6 6 10M52 44c6-8 2-16-6-14-4 1-6 6-6 10"
          fill="#F6AD55"
          stroke="#DD6B20"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </g>
      <g className="cat-head">
        <circle cx="40" cy="34" r="22" fill="#FBD38D" />
        <g className="cat-ears">
          <path d="M22 22 L28 34 L18 32 Z" fill="#F6AD55" stroke="#DD6B20" strokeWidth="1.2" />
          <path d="M58 22 L52 34 L62 32 Z" fill="#F6AD55" stroke="#DD6B20" strokeWidth="1.2" />
        </g>
        <ellipse cx="40" cy="40" rx="10" ry="8" fill="#FEEBC8" />
        {mood === 'happy' ? (
          <>
            <path d="M27 32 Q31 27 35 32" stroke="#2D3748" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <path d="M45 32 Q49 27 53 32" stroke="#2D3748" strokeWidth="2.2" fill="none" strokeLinecap="round" />
            <ellipse cx="25" cy="38" rx="3.5" ry="2.2" fill="#FEB2B2" opacity="0.6" />
            <ellipse cx="55" cy="38" rx="3.5" ry="2.2" fill="#FEB2B2" opacity="0.6" />
            <path d="M32 41 Q40 48 48 41" stroke="#2D3748" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <AdorableEyes />
            <ellipse cx="25" cy="38" rx="3.5" ry="2.2" fill="#FEB2B2" opacity="0.5" />
            <ellipse cx="55" cy="38" rx="3.5" ry="2.2" fill="#FEB2B2" opacity="0.5" />
            <g className="cat-mouth-idle">
              <path
                d="M36 42.5 Q38.2 44.8 40 42.5 Q41.8 44.8 44 42.5"
                stroke="#2D3748"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </g>
            <g className="cat-mouth-yawn">
              <ellipse cx="40" cy="43.5" rx="5.5" ry="4.8" fill="#2D3748" opacity="0.2" />
              <ellipse cx="40" cy="43" rx="6.2" ry="5.2" fill="none" stroke="#2D3748" strokeWidth="1.5" />
            </g>
            <g className="cat-yawn-paw">
              <ellipse cx="53" cy="37" rx="4.5" ry="4" fill="#F6AD55" stroke="#DD6B20" strokeWidth="1" />
            </g>
          </>
        )}
        <ellipse cx="40" cy="37" rx="2.2" ry="1.6" fill="#FC8181" />
        <path className="cat-whiskers" d="M24 37 H19 M61 37 H66" stroke="#DD6B20" strokeWidth="1.2" strokeLinecap="round" opacity="0.65" />
      </g>
      <g className="cat-collar">
        <path d="M24 48 Q40 54 56 48" stroke="#1a365d" strokeWidth="3" fill="none" strokeLinecap="round" />
        <g className="cat-bell">
          <circle cx="40" cy="53" r="4" fill="#3182ce" stroke="#1a365d" strokeWidth="1" />
        </g>
      </g>
      {mood === 'alert' && (
        <g className="cat-alert-mark">
          <circle cx="58" cy="18" r="9" fill="#E53E3E" />
          <text x="58" y="22" textAnchor="middle" fill="#fff" fontSize="11" fontWeight="700">!</text>
        </g>
      )}
    </svg>
  )
}
