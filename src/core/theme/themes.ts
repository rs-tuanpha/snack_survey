export const THEME_STORAGE_KEY = 'snack-survey-theme'

export const THEME_IDS = ['classic', 'snack', 'stall'] as const

export type ThemeId = (typeof THEME_IDS)[number]

export type ThemeDefinition = {
  id: ThemeId
  label: string
}

/** Registry of available themes. */
export const THEMES: ThemeDefinition[] = [
  { id: 'classic', label: 'Classic' },
  { id: 'snack', label: 'Snack Survey' },
  { id: 'stall', label: 'Stall Label' }
]

export const DEFAULT_THEME: ThemeId = 'snack'

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && THEME_IDS.includes(value as ThemeId)
}
