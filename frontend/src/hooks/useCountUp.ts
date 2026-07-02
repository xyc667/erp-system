import { useEffect, useRef, useState } from 'react'

/** 数字滚动动画：从当前值缓动到 target */
export function useCountUp(target: number, duration = 1400) {
  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)
  const rafRef = useRef<number>()

  useEffect(() => {
    if (target === displayRef.current) return

    const from = displayRef.current
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - (1 - progress) ** 3
      const next = Math.round(from + (target - from) * eased)
      displayRef.current = next
      setDisplay(next)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        displayRef.current = target
        setDisplay(target)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration])

  return display
}
