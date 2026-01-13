import { EnergyGraph } from '../../components/EnergyGraph/EnergyGraph'
import type { EnergyData } from '../../types'
import './TodayPage.css'

interface TodayPageProps {
  energyData: EnergyData[]
  yesterdayData: EnergyData[]
}

export function TodayPage({ energyData, yesterdayData }: TodayPageProps) {
  return (
    <div className="page">
      <div className="energy-graph-container">
        <div className="energy-graph">
          {energyData.length > 0 || yesterdayData.length > 0 ? (
            <EnergyGraph data={energyData} yesterdayData={yesterdayData} />
          ) : (
            <div className="graph-empty">No data available</div>
          )}
        </div>
      </div>
    </div>
  )
}
