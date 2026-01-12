import { PowerDisplay } from '../../components/PowerDisplay/PowerDisplay'
import type { PowerData } from '../../types'
import './MonthPage.css'

interface MonthPageProps {
  power: PowerData
  prevPower: number | null
}

export function MonthPage({ power, prevPower }: MonthPageProps) {
  return (
    <div className="page">
      <PowerDisplay 
        power={power} 
        prevPower={prevPower} 
        consumption={null} 
      />
      {/* Month view content can be added here */}
    </div>
  )
}
