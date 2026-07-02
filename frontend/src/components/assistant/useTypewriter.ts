import { useEffect, useState } from 'react'

interface UseTypewriterOptions {
  enabled?: boolean
  speed?: number
}

export function useTypewriter(
  text: string,
  { enabled = true, speed = 32 }: UseTypewriterOptions = {},
) {
  const [displayed, setDisplayed] = useState(enabled ? '' : text)
  const [done, setDone] = useState(!enabled)

  useEffect(() => {
    if (!enabled) {
      setDisplayed(text)
      setDone(true)
      return undefined
    }

    setDisplayed('')
    setDone(false)

    if (!text) {
      setDone(true)
      return undefined
    }

    let index = 0
    const timer = window.setInterval(() => {
      index += 1
      setDisplayed(text.slice(0, index))
      if (index >= text.length) {
        window.clearInterval(timer)
        setDone(true)
      }
    }, speed)

    return () => window.clearInterval(timer)
  }, [text, enabled, speed])

  return { displayed, done }
}
