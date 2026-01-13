import { MonthCalendarList } from '../../components/MonthCalendar/MonthCalendar'
import type { DailyEnergyData } from '../../types'
import './MonthPage.css'

interface MonthPageProps {
  dailyEnergyHistory: DailyEnergyData[]
}

export function MonthPage({ dailyEnergyHistory }: MonthPageProps) {
  return (
    <div className="page month-page">
      <MonthCalendarList dailyEnergyHistory={dailyEnergyHistory} />
    </div>
  )
}
