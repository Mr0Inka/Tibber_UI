import { MonthCalendarList } from '../../components/MonthCalendar/MonthCalendar'
import type { DailyEnergyData } from '../../types'
import './MonthPage.css'

interface MonthPageProps {
  dailyEnergyHistory: DailyEnergyData[]
  kwhPrice: number
}

export function MonthPage({ dailyEnergyHistory, kwhPrice }: MonthPageProps) {
  return (
    <div className="page month-page">
      <h2 className="page-title">Daily History</h2>
      <MonthCalendarList dailyEnergyHistory={dailyEnergyHistory} kwhPrice={kwhPrice} />
    </div>
  )
}
