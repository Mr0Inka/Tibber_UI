import type { DailyEnergyData } from '../../types'
import './MonthCalendar.css'

interface MonthCalendarProps {
  year: number
  month: number // 0-indexed (0 = January)
  dailyData: Map<string, number> // key: "YYYY-MM-DD", value: kWh
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

export function MonthCalendar({ year, month, dailyData }: MonthCalendarProps) {
  const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' })
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startDayOfWeek = firstDay.getDay() // 0 = Sunday
  
  // Calculate total for the month
  let monthTotal = 0
  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    monthTotal += dailyData.get(dateKey) || 0
  }
  
  // Create calendar grid
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []
  
  // Fill in empty days at the start
  for (let i = 0; i < startDayOfWeek; i++) {
    currentWeek.push(null)
  }
  
  // Fill in days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  
  // Fill in remaining empty days at the end
  while (currentWeek.length > 0 && currentWeek.length < 7) {
    currentWeek.push(null)
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek)
  }
  
  // Get value for a day
  const getDayValue = (day: number): number => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dailyData.get(dateKey) || 0
  }
  
  // Check if we have actual data for this day (exists in the map)
  const hasDataForDay = (day: number): boolean => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return dailyData.has(dateKey)
  }
  
  // Check if day is in the past (not today or future)
  const isPastDay = (day: number): boolean => {
    const today = new Date()
    const dayDate = new Date(year, month, day)
    return dayDate < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  }
  
  // Check if day is today
  const isToday = (day: number): boolean => {
    const today = new Date()
    return year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
  }

  return (
    <div className="month-calendar">
      <div className="month-header">
        <h3 className="month-title">{monthName}, {year}</h3>
        <div className="month-total">
          <span className="total-value">{monthTotal.toFixed(2)}</span>
          <span className="total-unit">kWh</span>
        </div>
      </div>
      
      <div className="calendar-grid">
        <div className="weekday-row">
          {WEEKDAYS.map(day => (
            <div key={day} className="weekday">{day}</div>
          ))}
        </div>
        
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="week-row">
            {week.map((day, dayIndex) => {
              if (day === null) {
                return <div key={dayIndex} className="day-cell empty" />
              }
              
              const today = isToday(day)
              const isPast = isPastDay(day)
              const hasData = hasDataForDay(day)
              const value = getDayValue(day)
              
              // Determine CSS class:
              // - today: orange background
              // - past with data: white with orange stroke
              // - past without data: greyed out
              // - future: greyed out
              let valueClass = 'future'
              if (today) {
                valueClass = 'today'
              } else if (isPast && hasData) {
                valueClass = 'past-has-data'
              } else if (isPast) {
                valueClass = 'past-no-data'
              }
              
              return (
                <div key={dayIndex} className="day-cell">
                  <span className="day-number">{day}</span>
                  <div className={`day-value ${valueClass}`}>
                    {(today || isPast) ? value.toFixed(2) : ''}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

interface MonthCalendarListProps {
  dailyEnergyHistory: DailyEnergyData[]
}

export function MonthCalendarList({ dailyEnergyHistory }: MonthCalendarListProps) {
  // Create a map of date -> value for quick lookup
  const dailyDataMap = new Map<string, number>()
  
  console.log('📊 Raw daily energy history:', dailyEnergyHistory)
  
  dailyEnergyHistory.forEach(entry => {
    const date = new Date(entry.timestamp)
    
    // InfluxDB aggregateWindow returns END of window timestamp
    // For full day windows, timestamp is midnight -> subtract 1ms to get previous day
    // For partial windows (today), timestamp is current time -> use as-is
    const isFullDayWindow = date.getHours() === 0 && date.getMinutes() === 0 && date.getSeconds() === 0
    if (isFullDayWindow) {
      date.setDate(date.getDate() - 1) // Go back to the actual day
    }
    
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    dailyDataMap.set(dateKey, entry.value)
    console.log(`📅 ${entry.timestamp} -> ${dateKey} = ${entry.value.toFixed(2)} kWh (fullDay: ${isFullDayWindow})`)
  })
  
  // Generate list of months (current month and 11 previous months)
  const months: { year: number; month: number }[] = []
  const now = new Date()
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ year: date.getFullYear(), month: date.getMonth() })
  }
  
  return (
    <div className="month-calendar-list">
      {months.map(({ year, month }) => (
        <MonthCalendar
          key={`${year}-${month}`}
          year={year}
          month={month}
          dailyData={dailyDataMap}
        />
      ))}
    </div>
  )
}
