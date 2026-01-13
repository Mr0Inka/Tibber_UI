import { useState, useRef } from 'react'
import type { EnergyData } from '../../types'
import './EnergyGraph.css'

interface EnergyGraphProps {
  data: EnergyData[]
  yesterdayData: EnergyData[]
}

interface HoverData {
  value: number
  timestamp: string
  x: number
  y: number
  yesterdayValue?: number
}

export function EnergyGraph({ data, yesterdayData }: EnergyGraphProps) {
  const [hoverData, setHoverData] = useState<HoverData | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const width = 800
  const height = 750
  const padding = { top: 20, right: 10, bottom: 40, left: 10 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Get today's midnight timestamp
  const now = new Date()
  const midnightStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime()
  const midnightEnd = midnightStart + 24 * 60 * 60 * 1000
  const yesterdayMidnight = midnightStart - 24 * 60 * 60 * 1000

  // Get max value from both datasets
  const todayValues = data.map(d => d.value)
  const yesterdayValues = yesterdayData.map(d => d.value)
  const allValues = [...todayValues, ...yesterdayValues]
  const maxValue = Math.max(...allValues, 0.1) * 1.1

  // Linear scale from 0 to max
  const valueToY = (value: number): number => {
    const normalized = value / maxValue
    return chartHeight - normalized * chartHeight
  }

  // Convert timestamp to X position (based on time of day)
  const timeToX = (timestamp: string, baseMidnight: number): number => {
    const time = new Date(timestamp).getTime()
    const dayProgress = (time - baseMidnight) / (24 * 60 * 60 * 1000)
    return Math.max(0, Math.min(1, dayProgress)) * chartWidth
  }

  // Create today's points - start from origin (0,0 kWh at midnight)
  const todayPoints = data.length > 0 ? [
    { x: 0, y: chartHeight, value: 0, timestamp: new Date(midnightStart).toISOString() },
    ...data.map((d) => ({
      x: timeToX(d.timestamp, midnightStart),
      y: valueToY(d.value),
      value: d.value,
      timestamp: d.timestamp
    }))
  ] : []

  // Create yesterday's points
  const yesterdayPoints = yesterdayData.length > 0 ? [
    { x: 0, y: chartHeight, value: 0, timestamp: new Date(yesterdayMidnight).toISOString() },
    ...yesterdayData.map((d) => ({
      x: timeToX(d.timestamp, yesterdayMidnight),
      y: valueToY(d.value),
      value: d.value,
      timestamp: d.timestamp
    }))
  ] : []

  const todayPathData = todayPoints.length > 0 
    ? todayPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : ''

  const yesterdayPathData = yesterdayPoints.length > 0
    ? yesterdayPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
    : ''

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
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = width / rect.width
    const posX = (clientX - rect.left) * scaleX - padding.left

    // Find the closest today data point
    let closestPoint = todayPoints.length > 1 ? todayPoints[1] : null
    let closestDist = closestPoint ? Math.abs(closestPoint.x - posX) : Infinity
    
    for (let i = 2; i < todayPoints.length; i++) {
      const dist = Math.abs(todayPoints[i].x - posX)
      if (dist < closestDist) {
        closestDist = dist
        closestPoint = todayPoints[i]
      }
    }

    // Find the corresponding yesterday value at the same x position
    let yesterdayValue: number | undefined
    if (yesterdayPoints.length > 1) {
      let closestYesterday = yesterdayPoints[1]
      let closestYesterdayDist = Math.abs(closestYesterday.x - posX)
      
      for (let i = 2; i < yesterdayPoints.length; i++) {
        const dist = Math.abs(yesterdayPoints[i].x - posX)
        if (dist < closestYesterdayDist) {
          closestYesterdayDist = dist
          closestYesterday = yesterdayPoints[i]
        }
      }
      yesterdayValue = closestYesterday.value
    }

    if (closestPoint) {
      setHoverData({
        value: closestPoint.value,
        timestamp: closestPoint.timestamp,
        x: closestPoint.x,
        y: closestPoint.y,
        yesterdayValue
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
            {hoverData.yesterdayValue !== undefined && (
              <span className="hover-yesterday">({hoverData.yesterdayValue.toFixed(2)})</span>
            )}
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

          {/* Yesterday's line (grey dotted) */}
          {yesterdayPathData && (
            <path
              d={yesterdayPathData}
              fill="none"
              stroke="#bbb"
              strokeWidth={2}
              strokeDasharray="6,4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Area under today's curve */}
          {todayPathData && todayPoints.length > 0 && (
            <path
              d={`${todayPathData} L ${todayPoints[todayPoints.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`}
              fill="url(#energy-gradient)"
            />
          )}

          {/* Today's line */}
          {todayPathData && (
            <path
              d={todayPathData}
              fill="none"
              stroke="#f97316"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

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
