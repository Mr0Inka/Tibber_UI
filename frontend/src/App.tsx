import { useState } from 'react'
import { Tabs } from './components/Tabs/Tabs'
import { TodayPage } from './pages/TodayPage/TodayPage'
import { MonthPage } from './pages/MonthPage/MonthPage'
import { usePowerData } from './hooks/usePowerData'
import { TimeRange } from './types'
import './App.css'

type TabType = 'today' | 'month'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('today')
  const {
    power,
    prevPower,
    todayConsumption,
    hourlyData,
    graphRange,
    graphData,
    graphLoading,
    loading,
    error,
    setGraphRange,
    fetchGraphData,
  } = usePowerData()

  const handleRangeChange = (range: TimeRange) => {
    setGraphRange(range)
    fetchGraphData(range)
  }

  return (
    <div className="app">
      <Tabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="content">
        {activeTab === 'today' ? (
          loading ? (
            <div className="loading">Loading...</div>
          ) : error ? (
            <div className="error">❌ {error}</div>
          ) : (
            <TodayPage
              power={power}
              prevPower={prevPower}
              consumption={todayConsumption}
              graphRange={graphRange}
              graphData={graphData}
              graphLoading={graphLoading}
              onRangeChange={handleRangeChange}
            />
          )
        ) : (
          <MonthPage power={power} prevPower={prevPower} />
        )}
      </div>
    </div>
  )
}

export default App
