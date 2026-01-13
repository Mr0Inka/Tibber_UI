import { useState, useEffect } from 'react'
import type { AccentColor } from '../components/SettingsModal/SettingsModal'
import { getAccentHex } from '../components/SettingsModal/SettingsModal'

const STORAGE_KEY = 'tibber-accent-color'

export function useAccentColor() {
  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && ['orange', 'green', 'blue', 'pink', 'white'].includes(saved)) {
      return saved as AccentColor
    }
    return 'orange'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, accentColor)
    
    // Update CSS variable
    const hex = getAccentHex(accentColor)
    document.documentElement.style.setProperty('--accent', hex)
    document.documentElement.style.setProperty('--accent-dim', `${hex}26`) // 15% opacity
  }, [accentColor])

  return { accentColor, setAccentColor }
}
