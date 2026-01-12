import { useState, useRef } from 'react'
import type { PowerHistoryData } from '../../types'
import './PowerGraph.css'

interface PowerGraphProps {
  data: PowerHistoryData[]
}

interface HoverData {
  value: number
  timestamp: string
  x: number
  y: number
}

export function PowerGraph({ data }: PowerGraphProps) {
  const [hoverData, setHoverData] = useState<HoverData | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

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

  // Format timestamp for hover display
  const formatHoverTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  // Y-axis grid lines (without labels)
  const yTicks = 5
  const yLabels = Array.from({ length: yTicks }, (_, i) => {
    const value = minValue + (maxValue - minValue) * (i / (yTicks - 1))
    return value
  })

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || data.length === 0) return

    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = width / rect.width
    const mouseX = (e.clientX - rect.left) * scaleX - padding.left

    // Find the closest data point
    const dataIndex = Math.round((mouseX / chartWidth) * (data.length - 1))
    const clampedIndex = Math.max(0, Math.min(data.length - 1, dataIndex))
    const point = points[clampedIndex]

    if (point) {
      setHoverData({
        value: point.value,
        timestamp: point.timestamp,
        x: point.x,
        y: point.y
      })
    }
  }

  const handleMouseLeave = () => {
    setHoverData(null)
  }

  return (
    <div className="power-graph-wrapper">
      {/* Hover info display */}
      <div className="hover-info">
        {hoverData ? (
          <>
            <span className="hover-value">{Math.round(hoverData.value)} W</span>
            <span className="hover-time">{formatHoverTime(hoverData.timestamp)}</span>
          </>
        ) : (
          <span className="hover-placeholder">Hover to see values</span>
        )}
      </div>

      <svg 
        ref={svgRef}
        width={width} 
        height={height} 
        className="power-graph-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
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

          {/* Hover indicator */}
          {hoverData && (
            <>
              {/* Vertical line */}
              <line
                x1={hoverData.x}
                y1={0}
                x2={hoverData.x}
                y2={chartHeight}
                stroke="#646cff"
                strokeWidth={1}
                strokeDasharray="4,4"
                className="hover-line"
              />
              {/* Point */}
              <circle
                cx={hoverData.x}
                cy={hoverData.y}
                r={5}
                fill="#646cff"
                stroke="white"
                strokeWidth={2}
                className="hover-point"
              />
            </>
          )}

          {/* Invisible overlay for better hover detection */}
          <rect
            x={0}
            y={0}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
            style={{ cursor: 'crosshair' }}
          />

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
    </div>
  )
}
