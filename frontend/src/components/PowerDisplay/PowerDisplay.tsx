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
      <div className="value-box">
        <div className="power-value">
          <span className="number-container">
            {prevPower !== null && (
              <span className="power-number old-value">
                {Math.round(prevPower)}
              </span>
            )}
            <span key={power.value} className="power-number new-value">
              {power.value !== null ? `${Math.round(power.value)}` : '--'}
            </span>
          </span>
          <span className="unit">W</span>
        </div>
        <div className="subtitle">Current Power</div>
      </div>
      <div className="value-box">
        <div className="consumption">
          <span className="consumption-number">
            {consumption !== null ? consumption.toFixed(2) : '--'}
          </span>
          <span className="unit">kWh</span>
        </div>
        <div className="subtitle">Today</div>
      </div>
    </div>
  )
}
