import './GraphControls.css'

type TimeRange = '5m' | '30m' | '1h' | '6h' | '12h' | '24h'

interface GraphControlsProps {
  selectedRange: TimeRange
  onRangeChange: (range: TimeRange) => void
}

const TIME_RANGES: TimeRange[] = ['5m', '30m', '1h', '6h', '12h', '24h']

export function GraphControls({ selectedRange, onRangeChange }: GraphControlsProps) {
  return (
    <div className="graph-controls">
      {TIME_RANGES.map((range: TimeRange) => (
        <button
          key={range}
          className={`range-button ${selectedRange === range ? 'active' : ''}`}
          onClick={() => onRangeChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  )
}
