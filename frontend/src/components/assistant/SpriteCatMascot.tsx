import { useEffect, useMemo, useRef, useState } from 'react'
import type { CatMood } from './CatMascot'
import {
  CAT_SPRITE_DEFAULT,
  type CatSpritePlayback,
  getSpriteSequence,
  getSpriteSheet,
  playbackDurationMs,
  spriteDisplayHeight,
  temporalFrameToCell,
} from './catSpriteSheet'
import { useSpriteSequence } from './useSpriteFrame'

interface SpriteCatMascotProps {
  mood?: CatMood
  size?: number
}

const imageCache = new Map<string, Promise<HTMLImageElement>>()

function loadSpriteImage(src: string) {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve, reject) => {
        const img = new Image()
        img.decoding = 'async'
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error(`Failed to load sprite: ${src}`))
        img.src = src
      }),
    )
  }
  return imageCache.get(src)!
}

const IDLE_RANDOM_ACTIONS: CatSpritePlayback[] = [
  { sheetId: 'base', sequenceKey: 'stretch' },
  { sheetId: 'rest', sequenceKey: 'act' },
]

function useSpritePlayback(mood: CatMood) {
  const [playback, setPlayback] = useState<CatSpritePlayback>(CAT_SPRITE_DEFAULT)

  useEffect(() => {
    if (mood !== 'idle') return undefined

    let cancelled = false
    let timer = 0

    const schedule = () => {
      const wait = 3200 + Math.random() * 5600
      timer = window.setTimeout(() => {
        if (cancelled) return
        const pick = IDLE_RANDOM_ACTIONS[Math.floor(Math.random() * IDLE_RANDOM_ACTIONS.length)]
        setPlayback(pick)
        timer = window.setTimeout(() => {
          if (cancelled) return
          setPlayback(CAT_SPRITE_DEFAULT)
          schedule()
        }, playbackDurationMs(pick) + 80)
      }, wait)
    }

    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [mood])

  useEffect(() => {
    if (mood === 'happy') {
      const happyPlayback: CatSpritePlayback = { sheetId: 'happy', sequenceKey: 'act' }
      setPlayback(happyPlayback)
      const timer = window.setTimeout(
        () => setPlayback(CAT_SPRITE_DEFAULT),
        playbackDurationMs(happyPlayback) + 80,
      )
      return () => window.clearTimeout(timer)
    }
    if (mood === 'alert') {
      setPlayback(CAT_SPRITE_DEFAULT)
    }
    return undefined
  }, [mood])

  return playback
}

export default function SpriteCatMascot({ mood = 'idle', size = 72 }: SpriteCatMascotProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playback = useSpritePlayback(mood)
  const sheet = getSpriteSheet(playback.sheetId)
  const sequence = getSpriteSequence(playback)
  const { step, temporalFrame } = useSpriteSequence(sequence, true)
  const displayWidth = size
  const displayHeight = spriteDisplayHeight(size, sheet)
  const [imageReady, setImageReady] = useState(false)

  const frameCell = useMemo(
    () => temporalFrameToCell(temporalFrame, sheet),
    [temporalFrame, sheet],
  )

  useEffect(() => {
    let cancelled = false
    loadSpriteImage(sheet.src)
      .then(() => {
        if (!cancelled) setImageReady(true)
      })
      .catch(() => {
        if (!cancelled) setImageReady(false)
      })
    return () => {
      cancelled = true
    }
  }, [sheet.src])

  useEffect(() => {
    if (!imageReady) return undefined

    let cancelled = false
    const paint = async () => {
      const img = await loadSpriteImage(sheet.src)
      if (cancelled) return
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const dpr = window.devicePixelRatio || 1
      const pxWidth = Math.round(displayWidth * dpr)
      const pxHeight = Math.round(displayHeight * dpr)
      if (canvas.width !== pxWidth || canvas.height !== pxHeight) {
        canvas.width = pxWidth
        canvas.height = pxHeight
        canvas.style.width = `${displayWidth}px`
        canvas.style.height = `${displayHeight}px`
      }

      ctx.clearRect(0, 0, pxWidth, pxHeight)
      ctx.imageSmoothingEnabled = false
      const sx = frameCell.col * sheet.frameWidth
      const sy = frameCell.row * sheet.frameHeight
      ctx.drawImage(
        img,
        sx,
        sy,
        sheet.frameWidth,
        sheet.frameHeight,
        0,
        0,
        pxWidth,
        pxHeight,
      )
    }

    paint()
    return () => {
      cancelled = true
    }
  }, [imageReady, sheet, frameCell.col, frameCell.row, displayWidth, displayHeight])

  return (
    <div
      className={`sprite-cat sprite-cat--${mood}`}
      style={{ width: displayWidth, height: displayHeight }}
      data-testid="sprite-cat-mascot"
      data-sprite-sheet={playback.sheetId}
      data-sprite-clip={playback.sequenceKey}
      data-sprite-step={step}
      data-sprite-frame={temporalFrame}
      aria-hidden
    >
      <canvas ref={canvasRef} className="sprite-cat-canvas" />
      {mood === 'alert' && (
        <div className="sprite-cat-alert-mark" aria-hidden>
          !
        </div>
      )}
    </div>
  )
}
