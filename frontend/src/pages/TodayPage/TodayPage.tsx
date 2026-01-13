import { useMemo } from 'react'
import { EnergyGraph } from '../../components/EnergyGraph/EnergyGraph'
import type { EnergyData } from '../../types'
import './TodayPage.css'

interface TodayPageProps {
  energyData: EnergyData[]
  yesterdayData: EnergyData[]
}

const HIGHER_TEMPLATES = [
  { prefix: "You've used ", suffix: " more energy than yesterday at this time." },
  { prefix: "Today's consumption is ", suffix: " higher than yesterday." },
  { prefix: "Energy usage is up ", suffix: " compared to yesterday." },
]

const LOWER_TEMPLATES = [
  { prefix: "You've used ", suffix: " less energy than yesterday at this time." },
  { prefix: "Today's consumption is ", suffix: " lower than yesterday." },
  { prefix: "Energy usage is down ", suffix: " compared to yesterday." },
]

const SIMILAR_TEMPLATES = [
  { prefix: "Today's usage is ", highlight: "similar to yesterday", suffix: "." },
  { prefix: "Consumption is ", highlight: "tracking close to yesterday", suffix: "." },
  { prefix: "Energy use is ", highlight: "about the same", suffix: " as yesterday." },
]

export function TodayPage({ energyData, yesterdayData }: TodayPageProps) {
  const comparison = useMemo(() => {
    if (energyData.length === 0) return null
    
    // Get today's latest value
    const todayLatest = energyData[energyData.length - 1]?.value
    if (!todayLatest) return null
    
    // Find yesterday's value at approximately the same time
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    let yesterdayAtSameTime: number | null = null
    
    if (yesterdayData.length > 0) {
      // Find the yesterday data point closest to current time of day
      for (const point of yesterdayData) {
        const pointDate = new Date(point.timestamp)
        const pointMinutes = pointDate.getHours() * 60 + pointDate.getMinutes()
        if (pointMinutes <= currentMinutes) {
          yesterdayAtSameTime = point.value
        }
      }
    }
    
    // Don't compare if yesterday's data is missing or too low (indicates no real data)
    if (!yesterdayAtSameTime || yesterdayAtSameTime < 0.1) return null
    
    const percentDiff = Math.round(((todayLatest - yesterdayAtSameTime) / yesterdayAtSameTime) * 100)
    const absPercent = Math.abs(percentDiff)
    
    // Format the values for display
    const todayDisplay = todayLatest.toFixed(2)
    const yesterdayDisplay = yesterdayAtSameTime.toFixed(2)
    const valuesText = `(${todayDisplay} kWh today vs ${yesterdayDisplay} kWh yesterday)`
    
    // Pick a random template (changes every minute)
    const seed = Math.floor(Date.now() / 60000)
    
    if (absPercent < 10) {
      const template = SIMILAR_TEMPLATES[seed % SIMILAR_TEMPLATES.length]
      return {
        prefix: template.prefix,
        highlight: template.highlight,
        suffix: template.suffix,
        values: valuesText,
        type: 'similar' as const
      }
    } else if (percentDiff > 0) {
      const template = HIGHER_TEMPLATES[seed % HIGHER_TEMPLATES.length]
      return {
        prefix: template.prefix,
        highlight: `${absPercent}%`,
        suffix: template.suffix,
        values: valuesText,
        type: 'higher' as const
      }
    } else {
      const template = LOWER_TEMPLATES[seed % LOWER_TEMPLATES.length]
      return {
        prefix: template.prefix,
        highlight: `${absPercent}%`,
        suffix: template.suffix,
        values: valuesText,
        type: 'lower' as const
      }
    }
  }, [energyData, yesterdayData])

  return (
    <div className="page">
      <h2 className="page-title">Cumulative Energy</h2>
      <div className="energy-graph-container">
        <div className="energy-graph">
          {energyData.length > 0 || yesterdayData.length > 0 ? (
            <EnergyGraph data={energyData} yesterdayData={yesterdayData} />
          ) : (
            <div className="graph-empty">No data available</div>
          )}
        </div>
      </div>
      {comparison && (
        <div className="graph-description">
          <p>
            {comparison.prefix}
            <span className={`highlight ${comparison.type}`}>{comparison.highlight}</span>
            {comparison.suffix}
          </p>
          <p className="comparison-values">{comparison.values}</p>
        </div>
      )}
    </div>
  )
}
