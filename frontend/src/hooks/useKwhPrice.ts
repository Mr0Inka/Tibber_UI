import { useState, useEffect } from 'react'

const STORAGE_KEY = 'tibber-kwh-price'
const DEFAULT_PRICE = 0.30 // €0.30 per kWh

export function useKwhPrice() {
  const [kwhPrice, setKwhPrice] = useState<number>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = parseFloat(saved)
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed
      }
    }
    return DEFAULT_PRICE
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, kwhPrice.toString())
  }, [kwhPrice])

  return { kwhPrice, setKwhPrice }
}
