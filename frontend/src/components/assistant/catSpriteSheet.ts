export interface SpriteSequence {
  frames: number[]
  loop: boolean
  fps?: number
  /** 非循环动作：最后一帧停留时长（毫秒） */
  holdEndMs?: number
  /** 非循环动作：停留后倒带回第一帧 */
  rewind?: boolean
}

export interface CatSpriteSheetDef {
  src: string
  columns: number
  rows: number
  frameWidth: number
  frameHeight: number
  frameOrder: 'column-major'
  sequences: Record<string, SpriteSequence>
}

/** 三张图均为 4 列 × 6 行，按列优先填充时间轴 */
export const CAT_SPRITE_SHEETS = {
  /** 1111.png — 坐姿 / 伸懒腰 */
  base: {
    src: '/assistant/1111.png',
    columns: 4,
    rows: 6,
    frameWidth: 320,
    frameHeight: 348,
    frameOrder: 'column-major',
    sequences: {
      idle: { frames: [0, 6, 12, 18], loop: true, fps: 4 },
      stretch: { frames: [0, 1, 2, 3, 4, 5], loop: false, fps: 7, holdEndMs: 3000, rewind: true },
    },
  },
  /** 2222.png — 歪头 / 冒爱心 */
  happy: {
    src: '/assistant/2222.png',
    columns: 4,
    rows: 6,
    frameWidth: 320,
    frameHeight: 337,
    frameOrder: 'column-major',
    sequences: {
      idle: { frames: [0, 6, 12, 18], loop: true, fps: 4 },
      act: { frames: [0, 1, 2, 3, 4, 5], loop: false, fps: 7, holdEndMs: 3000, rewind: true },
    },
  },
  /** 3333.png — 舔毛 / 趴下睡觉 */
  rest: {
    src: '/assistant/3333.png',
    columns: 4,
    rows: 6,
    frameWidth: 320,
    frameHeight: 345,
    frameOrder: 'column-major',
    sequences: {
      idle: { frames: [0], loop: true, fps: 4 },
      act: { frames: [0, 1, 2, 3, 4, 5], loop: false, fps: 6, holdEndMs: 3000, rewind: true },
    },
  },
} satisfies Record<string, CatSpriteSheetDef>

export type CatSpriteSheetId = keyof typeof CAT_SPRITE_SHEETS

export interface CatSpritePlayback {
  sheetId: CatSpriteSheetId
  sequenceKey: string
}

export const CAT_SPRITE_DEFAULT: CatSpritePlayback = {
  sheetId: 'base',
  sequenceKey: 'idle',
}

export function getSpriteSheet(sheetId: CatSpriteSheetId): CatSpriteSheetDef {
  return CAT_SPRITE_SHEETS[sheetId]
}

export function getSpriteSequence(playback: CatSpritePlayback): SpriteSequence {
  const sheet = getSpriteSheet(playback.sheetId)
  return sheet.sequences[playback.sequenceKey] ?? sheet.sequences.idle
}

export function sequenceDurationMs(sequence: SpriteSequence) {
  const fps = sequence.fps ?? 8
  const frameMs = 1000 / fps
  if (sequence.loop) {
    return Math.ceil(sequence.frames.length * frameMs)
  }

  const holdMs = sequence.holdEndMs ?? 3000
  const rewind = sequence.rewind ?? true
  const steps = Math.max(0, sequence.frames.length - 1)
  const forwardMs = steps * frameMs
  const reverseMs = rewind ? steps * frameMs : 0
  return Math.ceil(forwardMs + holdMs + reverseMs)
}

export function playbackDurationMs(playback: CatSpritePlayback) {
  return sequenceDurationMs(getSpriteSequence(playback))
}

/** 时间轴帧号 → 雪碧图网格坐标 */
export function temporalFrameToCell(temporalIndex: number, sheet: CatSpriteSheetDef) {
  if (sheet.frameOrder === 'column-major') {
    return {
      row: temporalIndex % sheet.rows,
      col: Math.floor(temporalIndex / sheet.rows),
    }
  }
  return {
    row: Math.floor(temporalIndex / sheet.columns),
    col: temporalIndex % sheet.columns,
  }
}

export function spriteDisplayHeight(width: number, sheet: CatSpriteSheetDef = CAT_SPRITE_SHEETS.base) {
  return Math.round(width * (sheet.frameHeight / sheet.frameWidth))
}

export function spriteMaxDisplayHeight(width: number) {
  const sheets = Object.values(CAT_SPRITE_SHEETS) as CatSpriteSheetDef[]
  return Math.max(...sheets.map((sheet) => spriteDisplayHeight(width, sheet)))
}
