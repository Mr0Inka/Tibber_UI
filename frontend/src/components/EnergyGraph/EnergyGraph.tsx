import { useState, useRef } from 'react'
import type { EnergyData } from '../../types'
import './EnergyGraph.css'

interface EnergyGraphProps {
  data: EnergyData[]
  yesterdayData: EnergyData[]
}

interface HoverData {
  todayValue: number | null
  yesterdayValue: number | null
  time: string
  x: number
  todayY: number | null
  yesterdayY: number | null
}

export function EnergyGraph({ data, yesterdayData }: EnergyGraphProps) {
  const [hoverData, setHoverData] = useState<HoverData | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  const width = 800
  const height = 800
  const padding = { top: 10, right: 10, bottom: 10, left: 10 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  // Get today's midnight timestamp
  const now = new Date()
  const midnightStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime()
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

  // Find closest point in an array to a given x position
  const findClosestPoint = (points: typeof todayPoints, posX: number) => {
    if (points.length <= 1) return null
    let closest = points[1]
    let closestDist = Math.abs(closest.x - posX)
    
    for (let i = 2; i < points.length; i++) {
      const dist = Math.abs(points[i].x - posX)
      if (dist < closestDist) {
        closestDist = dist
        closest = points[i]
      }
    }
    return closest
  }

  const updateHoverFromPosition = (clientX: number) => {
    if (!svgRef.current) return

    const rect = svgRef.current.getBoundingClientRect()
    const scaleX = width / rect.width
    const posX = (clientX - rect.left) * scaleX - padding.left
    
    // Clamp to chart bounds
    const clampedX = Math.max(0, Math.min(chartWidth, posX))

    // Calculate time from x position
    const dayProgress = clampedX / chartWidth
    const hours = Math.floor(dayProgress * 24)
    const minutes = Math.floor((dayProgress * 24 - hours) * 60)
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`

    // Find closest points
    const closestToday = findClosestPoint(todayPoints, clampedX)
    const closestYesterday = findClosestPoint(yesterdayPoints, clampedX)

    // Only show today's value if we have data at or before this x position
    const todayValue = closestToday && closestToday.x <= clampedX + 20 ? closestToday.value : null
    const yesterdayValue = closestYesterday ? closestYesterday.value : null

    setHoverData({
      todayValue,
      yesterdayValue,
      time: timeStr,
      x: clampedX,
      todayY: todayValue !== null && closestToday ? closestToday.y : null,
      yesterdayY: closestYesterday ? closestYesterday.y : null
    })
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
            <span className="hover-value">
              {hoverData.todayValue !== null ? `${hoverData.todayValue.toFixed(2)} kWh` : '--'}
            </span>
            {hoverData.yesterdayValue !== null && (
              <span className="hover-yesterday">({hoverData.yesterdayValue.toFixed(2)})</span>
            )}
            <span className="hover-time">{hoverData.time}</span>
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
          <linearGradient id="yesterday-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#999" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#999" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        
        <g transform={`translate(${padding.left}, ${padding.top})`}>
          {/* Area under yesterday's curve (behind today) */}
          {yesterdayPathData && yesterdayPoints.length > 0 && (
            <path
              d={`${yesterdayPathData} L ${yesterdayPoints[yesterdayPoints.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`}
              fill="url(#yesterday-gradient)"
            />
          )}

          {/* Area under today's curve */}
          {todayPathData && todayPoints.length > 0 && (
            <path
              d={`${todayPathData} L ${todayPoints[todayPoints.length - 1].x} ${chartHeight} L 0 ${chartHeight} Z`}
              fill="url(#energy-gradient)"
            />
          )}

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


          {/* Hover indicator */}
          {hoverData && (
            <>
              {/* Vertical line - always show */}
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
              {/* Yesterday point (grey) */}
              {hoverData.yesterdayY !== null && (
                <circle
                  cx={hoverData.x}
                  cy={hoverData.yesterdayY}
                  r={5}
                  fill="#bbb"
                  stroke="white"
                  strokeWidth={2}
                  className="hover-point"
                />
              )}
              {/* Today point (orange) - only show if we have today's value */}
              {hoverData.todayY !== null && (
                <circle
                  cx={hoverData.x}
                  cy={hoverData.todayY}
                  r={5}
                  fill="#f97316"
                  stroke="white"
                  strokeWidth={2}
                  className="hover-point"
                />
              )}
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
