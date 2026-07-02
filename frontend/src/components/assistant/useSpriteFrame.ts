import { useEffect, useState } from 'react'
import type { SpriteSequence } from './catSpriteSheet'

function sequenceKey(sequence: SpriteSequence) {
  return [
    sequence.frames.join(','),
    sequence.loop,
    sequence.fps ?? 8,
    sequence.holdEndMs ?? 0,
    sequence.rewind ?? false,
  ].join('|')
}

export function useSpriteSequence(sequence: SpriteSequence, active = true) {
  const [step, setStep] = useState(0)
  const [finished, setFinished] = useState(false)
  const temporalFrame = sequence.frames[step] ?? sequence.frames[0]
  const key = sequenceKey(sequence)

  useEffect(() => {
    if (!active) {
      setStep(0)
      setFinished(false)
      return undefined
    }

    setStep(0)
    setFinished(false)

    const fps = sequence.fps ?? 8
    const frameMs = Math.max(16, Math.round(1000 / fps))
    const holdMs = sequence.holdEndMs ?? (sequence.loop ? 0 : 3000)
    const rewind = sequence.rewind ?? !sequence.loop
    const { frames } = sequence
    let index = 0
    let cancelled = false
    const timers: number[] = []

    const schedule = (fn: () => void, delay: number) => {
      const timer = window.setTimeout(() => {
        if (!cancelled) fn()
      }, delay)
      timers.push(timer)
    }

    const finish = () => {
      setFinished(true)
    }

    const stepReverse = () => {
      if (index <= 0) {
        setStep(0)
        finish()
        return
      }
      index -= 1
      setStep(index)
      schedule(stepReverse, frameMs)
    }

    const startReverse = () => {
      if (frames.length <= 1) {
        finish()
        return
      }
      index = frames.length - 2
      setStep(index)
      schedule(stepReverse, frameMs)
    }

    const playForward = () => {
      if (index >= frames.length - 1) {
        if (sequence.loop) {
          index = 0
          setStep(index)
          schedule(playForward, frameMs)
          return
        }
        setStep(frames.length - 1)
        if (rewind) {
          schedule(startReverse, holdMs)
        } else {
          finish()
        }
        return
      }
      index += 1
      setStep(index)
      schedule(playForward, frameMs)
    }

    schedule(playForward, frameMs)

    return () => {
      cancelled = true
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [key, active, sequence])

  return { step, temporalFrame, finished }
}
