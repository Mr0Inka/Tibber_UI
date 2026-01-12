import { HourlyData } from '../../types'
import './HourlyChart.css'

interface HourlyChartProps {
  data: HourlyData[]
}

export function HourlyChart({ data }: HourlyChartProps) {
  if (data.length === 0) return null

  const maxConsumption = Math.max(...data.map(d => d.consumption), 0.01)
  const currentHour = new Date().getHours()

  return (
    <div className="hourly-chart">
      <div className="chart-bars">
        <div className="chart-timeline"></div>
        {Array.from({ length: 24 }, (_, hour) => {
          const hourData = data.find(d => d.hour === hour)
          const consumption = hourData?.consumption || 0
          const height = maxConsumption > 0 ? (consumption / maxConsumption) * 200 : 0
          const isCurrentHour = currentHour === hour
          const leftPosition = (hour / 24) * 100
          
          return (
            <div 
              key={hour} 
              className="chart-bar-container"
              style={{ left: `${leftPosition}%` }}
            >
              {consumption > 0 && (
                <div 
                  className={`chart-bar ${isCurrentHour ? 'current' : ''}`}
                  style={{ height: `${Math.max(height, 2)}px` }}
                  title={`${hour}:00 - ${consumption.toFixed(3)} kWh`}
                />
              )}
              <div className="bar-label">{hour}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
