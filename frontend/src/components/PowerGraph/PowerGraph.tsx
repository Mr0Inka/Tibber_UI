import { PowerHistoryData } from '../../types'
import './PowerGraph.css'

interface PowerGraphProps {
  data: PowerHistoryData[]
}

export function PowerGraph({ data }: PowerGraphProps) {
  if (data.length === 0) return null

  const width = 800
  const height = 300
  const padding = { top: 20, right: 20, bottom: 40, left: 20 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = data.map(d => d.value)
  const maxValue = Math.max(...values, 1)
  const minValue = Math.min(...values, 0)

  // Create SVG path for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth
    const y = chartHeight - ((d.value - minValue) / (maxValue - minValue || 1)) * chartHeight
    return { x, y, value: d.value, timestamp: d.timestamp }
  })

  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')

  // Format timestamp for x-axis labels
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Y-axis grid lines (without labels)
  const yTicks = 5
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const value = minValue + (maxValue - minValue) * (i / (yTicks - 1))
    return value
  })

  return (
    <svg width={width} height={height} className="power-graph-svg">
      <defs>
        <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#646cff" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#646cff" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      
      <g transform={`translate(${padding.left}, ${padding.top})`}>
        {/* Grid lines (without Y-axis labels) */}
        {yLabels.map((value, i) => {
          const y = chartHeight - (i / (yTicks - 1)) * chartHeight
          return (
            <line
              key={i}
              x1={0}
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="#e5e5e5"
              strokeWidth={1}
              strokeDasharray="2,2"
            />
          )
        })}

        {/* Area under curve */}
        <path
          d={`${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
          fill="url(#gradient)"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#646cff"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={3}
            fill="#646cff"
            className="graph-point"
          />
        ))}

        {/* X-axis labels */}
        {data.length > 0 && (
          <>
            <text
              x={0}
              y={chartHeight + 20}
              textAnchor="start"
              fontSize="11"
              fill="#888"
            >
              {formatTime(data[0].timestamp)}
            </text>
            {data.length > 1 && (
              <text
                x={chartWidth}
                y={chartHeight + 20}
                textAnchor="end"
                fontSize="11"
                fill="#888"
              >
                {formatTime(data[data.length - 1].timestamp)}
              </text>
            )}
          </>
        )}
      </g>
    </svg>
  )
}
