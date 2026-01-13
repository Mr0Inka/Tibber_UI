import { GraphControls } from '../../components/GraphControls/GraphControls'
import { PowerGraph } from '../../components/PowerGraph/PowerGraph'
import type { PowerHistoryData } from '../../types'
import './CurrentPage.css'

type TimeRange = '1m' | '5m' | '30m' | '1h' | '6h' | '12h' | '24h'

interface CurrentPageProps {
  graphRange: TimeRange
  graphData: PowerHistoryData[]
  onRangeChange: (range: TimeRange) => void
}

export function CurrentPage({ graphRange, graphData, onRangeChange }: CurrentPageProps) {
  return (
    <div className="page">
      <div className="power-graph-container">
        <div className="power-graph">
          {graphData.length > 0 ? (
            <PowerGraph key={graphRange} data={graphData} />
          ) : (
            <div className="graph-empty">No data available</div>
          )}
        </div>
        <GraphControls selectedRange={graphRange} onRangeChange={onRangeChange} />
      </div>
    </div>
  )
}
