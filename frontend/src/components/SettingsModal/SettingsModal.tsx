import { useState } from 'react'
import './SettingsModal.css'

export type AccentColor = 'orange' | 'green' | 'blue' | 'pink' | 'white'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  accentColor: AccentColor
  onColorChange: (color: AccentColor) => void
  kwhPrice: number
  onPriceChange: (price: number) => void
}

const COLORS: { id: AccentColor; hex: string; name: string }[] = [
  { id: 'orange', hex: '#f97316', name: 'Orange' },
  { id: 'green', hex: '#22c55e', name: 'Green' },
  { id: 'blue', hex: '#38bdf8', name: 'Blue' },
  { id: 'pink', hex: '#f472b6', name: 'Pink' },
  { id: 'white', hex: '#ffffff', name: 'White' },
]

export function SettingsModal({ isOpen, onClose, accentColor, onColorChange, kwhPrice, onPriceChange }: SettingsModalProps) {
  const [priceInput, setPriceInput] = useState(kwhPrice.toFixed(2))

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPriceInput(e.target.value)
  }

  const handlePriceBlur = () => {
    const parsed = parseFloat(priceInput)
    if (!isNaN(parsed) && parsed >= 0) {
      onPriceChange(parsed)
      setPriceInput(parsed.toFixed(2))
    } else {
      setPriceInput(kwhPrice.toFixed(2))
    }
  }

  return (
    <div className="settings-backdrop" onClick={handleBackdropClick}>
      <div className="settings-modal">
        <div className="settings-header">
          <h2>Settings</h2>
          <button type="button" className="close-button" onClick={onClose}>
            ×
          </button>
        </div>
        
        <div className="settings-content">
          <div className="setting-group">
            <label className="setting-label">Accent Color</label>
            <div className="color-options">
              {COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  className={`color-option ${accentColor === color.id ? 'active' : ''}`}
                  style={{ '--color': color.hex } as React.CSSProperties}
                  onClick={() => onColorChange(color.id)}
                  title={color.name}
                >
                  <span className="color-swatch"></span>
                  {accentColor === color.id && <span className="check">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="setting-group">
            <label className="setting-label">Electricity Price (€/kWh)</label>
            <div className="price-input-wrapper">
              <span className="price-currency">€</span>
              <input
                type="text"
                inputMode="decimal"
                className="price-input"
                value={priceInput}
                onChange={handlePriceChange}
                onBlur={handlePriceBlur}
                placeholder="0.30"
              />
              <span className="price-unit">/ kWh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper to get hex value for a color
export function getAccentHex(color: AccentColor): string {
  const found = COLORS.find(c => c.id === color)
  return found?.hex || '#f97316'
}
