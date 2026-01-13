import { useMemo } from 'react'
import { GraphControls } from '../../components/GraphControls/GraphControls'
import { PowerGraph } from '../../components/PowerGraph/PowerGraph'
import type { PowerHistoryData } from '../../types'
import './CurrentPage.css'

type TimeRange = '1m' | '5m' | '30m' | '1h' | '6h' | '12h' | '24h'

interface CurrentPageProps {
  graphRange: TimeRange
  graphData: PowerHistoryData[]
  avg15m: number | null
  avg24h: number | null
  onRangeChange: (range: TimeRange) => void
}

const HIGHER_TEMPLATES = [
  { prefix: "Recent power usage is ", suffix: " higher than the 24-hour average." },
  { prefix: "The last 15 minutes show ", suffix: " more power than usual." },
  { prefix: "Current consumption is ", suffix: " above the daily average." },
]

const LOWER_TEMPLATES = [
  { prefix: "Recent power usage is ", suffix: " lower than the 24-hour average." },
  { prefix: "The last 15 minutes show ", suffix: " less power than usual." },
  { prefix: "Current consumption is ", suffix: " below the daily average." },
]

const SIMILAR_TEMPLATES = [
  { prefix: "Recent power usage is ", highlight: "about normal", suffix: "." },
  { prefix: "Consumption is ", highlight: "typical", suffix: " right now." },
  { prefix: "Power draw is ", highlight: "close to average", suffix: "." },
]

export function CurrentPage({ graphRange, graphData, avg15m, avg24h, onRangeChange }: CurrentPageProps) {
  const isLive = graphRange === '1m' || graphRange === '5m'
  
  const comparison = useMemo(() => {
    if (avg15m === null || avg24h === null || avg24h === 0) return null
    
    const percentDiff = Math.round(((avg15m - avg24h) / avg24h) * 100)
    const absPercent = Math.abs(percentDiff)
    
    // Pick a random template (changes every minute)
    const seed = Math.floor(Date.now() / 60000)
    
    // Format the values for display
    const avg15mDisplay = Math.round(avg15m)
    const avg24hDisplay = Math.round(avg24h)
    const valuesText = `(${avg15mDisplay}W vs ${avg24hDisplay}W avg)`
    
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
  }, [avg15m, avg24h])
  
  return (
    <div className="page">
      <h2 className="page-title">
        Power Usage
        {isLive && (
          <span className="live-badge">
            <span className="live-dot"></span>
            LIVE
          </span>
        )}
      </h2>
      <div className="power-graph-container">
        <div className="power-graph">
          {graphData.length > 0 ? (
            <PowerGraph key={graphRange} data={graphData} isLive={isLive} />
          ) : (
            <div className="graph-empty">No data available</div>
          )}
        </div>
        <div className="power-graph-controls">
          <GraphControls selectedRange={graphRange} onRangeChange={onRangeChange} />
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
