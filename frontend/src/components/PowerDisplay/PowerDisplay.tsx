import type { PowerData } from '../../types'
import './PowerDisplay.css'

interface PowerDisplayProps {
  power: PowerData
  prevPower: number | null
  consumption: number | null
}

export function PowerDisplay({ power, prevPower, consumption }: PowerDisplayProps) {
  return (
    <div className="power-display">
      <div className="power-value">
        {prevPower !== null && (
          <span className="power-number old-value">
            {Math.round(prevPower)}
          </span>
        )}
        <span key={power.value} className="power-number new-value">
          {power.value !== null ? `${Math.round(power.value)}` : '--'}
        </span>
        <span className="unit">W</span>
      </div>
      <div className="consumption">
        {consumption !== null ? consumption.toFixed(2) : '--'}
        <span className="unit">kWh</span>
      </div>
    </div>
  )
}
