import type { PowerData, MinMaxPower } from '../../types'
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

interface MonthDisplayProps {
  dailyAverage: number | null
  monthConsumption: number | null
}

export function MonthDisplay({ dailyAverage, monthConsumption }: MonthDisplayProps) {
  return (
    <div className="power-display">
      <div className="value-box">
        <div className="consumption">
          <span className="consumption-number">
            {dailyAverage !== null ? dailyAverage.toFixed(2) : '--'}
          </span>
          <span className="unit">kWh</span>
        </div>
        <div className="subtitle">Daily Average</div>
      </div>
      <div className="value-box">
        <div className="consumption">
          <span className="consumption-number">
            {monthConsumption !== null ? monthConsumption.toFixed(2) : '--'}
          </span>
          <span className="unit">kWh</span>
        </div>
        <div className="subtitle">This Month</div>
      </div>
    </div>
  )
}

interface TodayDisplayProps {
  minMax: MinMaxPower
  consumption: number | null
}

export function TodayDisplay({ minMax, consumption }: TodayDisplayProps) {
  return (
    <div className="power-display today-display">
      <div className="value-box minmax-box">
        <div className="minmax-values">
          <div className="minmax-item">
            <span className="minmax-number">
              {minMax.min !== null ? Math.round(minMax.min) : '--'}
            </span>
            <span className="unit">W</span>
          </div>
          <span className="minmax-separator">–</span>
          <div className="minmax-item">
            <span className="minmax-number">
              {minMax.max !== null ? Math.round(minMax.max) : '--'}
            </span>
            <span className="unit">W</span>
          </div>
        </div>
        <div className="subtitle">Min – Max</div>
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
