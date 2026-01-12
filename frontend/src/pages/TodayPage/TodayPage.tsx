import { PowerDisplay } from '../../components/PowerDisplay/PowerDisplay'
import { GraphControls } from '../../components/GraphControls/GraphControls'
import { PowerGraph } from '../../components/PowerGraph/PowerGraph'
import type { PowerData, PowerHistoryData } from '../../types'
import './TodayPage.css'

type TimeRange = '1m' | '5m' | '30m' | '1h' | '6h' | '12h' | '24h'

interface TodayPageProps {
  power: PowerData
  prevPower: number | null
  consumption: number | null
  graphRange: TimeRange
  graphData: PowerHistoryData[]
  graphLoading: boolean
  onRangeChange: (range: TimeRange) => void
}

export function TodayPage({
  power,
  prevPower,
  consumption,
  graphRange,
  graphData,
  graphLoading,
  onRangeChange,
}: TodayPageProps) {
  return (
    <div className="page">
      <PowerDisplay 
        power={power} 
        prevPower={prevPower} 
        consumption={consumption} 
      />
      
      {/* Power Graph */}
      <div className="power-graph-container">
        <div className="power-graph">
          {graphLoading ? (
            <div className="graph-loading">Loading...</div>
          ) : graphData.length > 0 ? (
            <PowerGraph data={graphData} />
          ) : (
            <div className="graph-empty">No data available</div>
          )}
        </div>
        <GraphControls 
          selectedRange={graphRange} 
          onRangeChange={onRangeChange} 
        />
      </div>
    </div>
  )
}
