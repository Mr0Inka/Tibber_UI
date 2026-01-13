import { useState, useRef } from 'react'
import type { EnergyData } from '../../types'
import './EnergyGraph.css'

interface EnergyGraphProps {
  data: EnergyData[]
}

interface HoverData {
  value: number
  timestamp: string
  x: number
  y: number
}

export function EnergyGraph({ data }: EnergyGraphProps) {
  const [hoverData, setHoverData] = useState<HoverData | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (data.length === 0) return null

  const width = 800
  const height = 750
  const padding = { top: 20, right: 10, bottom: 40, left: 10 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Get max value with some headroom
  const values = data.map(d => d.value)
  const maxValue = Math.max(...values, 0.1) * 1.1

  // Linear scale from 0 to max
  const valueToY = (value: number): number => {
    const normalized = value / maxValue
    return chartHeight - normalized * chartHeight
  }

  // Create SVG path for the line
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth
    const y = valueToY(d.value)
    return { x, y, value: d.value, timestamp: d.timestamp }
  })

  const pathData = points.map((p, i) => 
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ')

  // Format timestamp for hover display
  const formatHoverTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  // Generate time labels for midnight to midnight
  const timeLabels = [0, 6, 12, 18, 24].map(hour => ({
    hour,
    x: (hour / 24) * chartWidth,
    label: `${hour.toString().padStart(2, '0')}:00`
  }))

  // Grid lines for kWh values
  const gridStep = maxValue > 10 ? 5 : maxValue > 5 ? 2 : maxValue > 2 ? 1 : 0.5
  const gridValues: number[] = []
  for (let v = gridStep; v < maxValue; v += gridStep) {
    gridValues.push(v)
  }

  const updateHoverFromPosition = (clientX: number) => {
    if (!svgRef.current || data.length === 0) return

    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = width / rect.width
    const posX = (clientX - rect.left) * scaleX - padding.left

    // Find the closest data point
    const dataIndex = Math.round((posX / chartWidth) * (data.length - 1))
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

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    updateHoverFromPosition(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      updateHoverFromPosition(e.touches[0].clientX)
    }
  }

  const handleTouchMove = (e: React.TouchEvent<SVGSVGElement>) => {
    if (e.touches.length > 0) {
      updateHoverFromPosition(e.touches[0].clientX)
    }
  }

  const handleLeave = () => {
    setHoverData(null)
  }

  return (
    <div className="energy-graph-wrapper">
      {/* Hover info display */}
      <div className="hover-info">
        {hoverData ? (
          <>
            <span className="hover-value">{hoverData.value.toFixed(2)} kWh</span>
            <span className="hover-time">{formatHoverTime(hoverData.timestamp)}</span>
          </>
        ) : (
          <span className="hover-placeholder">Touch to show values</span>
        )}
      </div>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="energy-graph-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleLeave}
      >
        <defs>
          <linearGradient id="energy-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Grid lines */}
          {gridValues.map((value) => {
            const y = valueToY(value)
            return (
              <line
                key={value}
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

          {/* Vertical time grid lines */}
          {timeLabels.slice(1, -1).map(({ hour, x }) => (
            <line
              key={hour}
              x1={x}
              y1={0}
              x2={x}
              y2={chartHeight}
              stroke="#f0f0f0"
              strokeWidth={1}
            />
          ))}

          {/* Area under curve */}
          <path
            d={`${pathData} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`}
            fill="url(#energy-gradient)"
          />

          {/* Line */}
          <path
            d={pathData}
            fill="none"
            stroke="#f97316"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Time labels */}
          {timeLabels.map(({ hour, x, label }) => (
            <text
              key={hour}
              x={x}
              y={chartHeight + 25}
              textAnchor="middle"
              fill="#999"
              fontSize="12"
            >
              {label}
            </text>
          ))}

          {/* Hover indicator */}
          {hoverData && (
            <>
              {/* Vertical line */}
              <line
                x1={hoverData.x}
                y1={0}
                x2={hoverData.x}
                y2={chartHeight}
                stroke="#f97316"
                strokeWidth={1}
                strokeDasharray="4,4"
                className="hover-line"
              />
              {/* Point */}
              <circle
                cx={hoverData.x}
                cy={hoverData.y}
                r={6}
                fill="#f97316"
                stroke="white"
                strokeWidth={2}
                className="hover-point"
              />
            </>
          )}

          {/* Invisible overlay for better touch/hover detection */}
          <rect
            x={0}
            y={0}
            width={chartWidth}
            height={chartHeight}
            fill="transparent"
          />
        </g>
      </svg>
    </div>
  )
}
