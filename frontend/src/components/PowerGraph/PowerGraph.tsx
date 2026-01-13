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
  const height = 750
  const padding = { top: 20, right: 10, bottom: 10, left: 10 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const values = data.map(d => d.value)
  const highestValue = Math.max(...values, 1)
  
  // Logarithmic scale: min 1W, max is highest value + headroom
  const minLog = 0 // log10(1) = 0
  const maxLog = Math.log10(Math.max(highestValue * 1.2, 100))
  const logRange = maxLog - minLog

  // Convert value to Y position using log scale
  const valueToY = (value: number): number => {
    const safeValue = Math.max(value, 1) // Prevent log(0)
    const logValue = Math.log10(safeValue)
    const normalized = (logValue - minLog) / logRange
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
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })
  }

  // Logarithmic grid lines at powers of 10 and mid-points
  const gridValues = [1, 10, 100, 1000, 10000, 100000].filter(v => v <= Math.pow(10, maxLog))

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
    <div className="power-graph-wrapper">
      {/* Hover info display */}
      <div className="hover-info">
        {hoverData ? (
          <>
            <span className="hover-value">{Math.round(hoverData.value)} W</span>
            <span className="hover-time">{formatHoverTime(hoverData.timestamp)}</span>
          </>
        ) : (
          <span className="hover-placeholder">Touch graph to see values</span>
        )}
      </div>

      <svg 
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="power-graph-svg"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleLeave}
      >
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#646cff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#646cff" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Logarithmic grid lines */}
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
                r={6}
                fill="#646cff"
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
