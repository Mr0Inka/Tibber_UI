import { useState } from 'react'
import { Tabs } from './components/Tabs/Tabs'
import { PowerDisplay, TodayDisplay, MonthDisplay } from './components/PowerDisplay/PowerDisplay'
import { CurrentPage } from './pages/CurrentPage/CurrentPage'
import { TodayPage } from './pages/TodayPage/TodayPage'
import { MonthPage } from './pages/MonthPage/MonthPage'
import { usePowerData } from './hooks/usePowerData'
import './App.css'

type TabType = 'current' | 'today' | 'month'
type TimeRange = '1m' | '5m' | '30m' | '1h' | '6h' | '12h' | '24h'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('current')
  const {
    power,
    prevPower,
    todayConsumption,
    todayEnergyGraph,
    yesterdayEnergyGraph,
    monthConsumption,
    dailyAverage,
    graphRange,
    graphData,
    dailyEnergyHistory,
    todayMinMax,
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
      <div className="sticky-header">
        <header className="header">
          <button type="button" className="header-button left"></button>
          <Tabs activeTab={activeTab} onTabChange={setActiveTab} />
          <button type="button" className="header-button right"></button>
        </header>
        
        {!loading && !error && (
          <section className="top-section">
            {activeTab === 'current' && (
              <PowerDisplay 
                power={power} 
                prevPower={prevPower} 
                consumption={todayConsumption}
              />
            )}
            {activeTab === 'today' && (
              <TodayDisplay 
                minMax={todayMinMax}
                consumption={todayConsumption}
              />
            )}
            {activeTab === 'month' && (
              <MonthDisplay 
                dailyAverage={dailyAverage}
                monthConsumption={monthConsumption}
              />
            )}
          </section>
        )}
      </div>

      <div className="content">
        {loading ? (
          <div className="loading">Loading...</div>
        ) : error ? (
          <div className="error">❌ {error}</div>
        ) : (
          <>
            {activeTab === 'current' && (
              <CurrentPage
                graphRange={graphRange}
                graphData={graphData}
                onRangeChange={handleRangeChange}
              />
            )}
            {activeTab === 'today' && (
              <TodayPage energyData={todayEnergyGraph} yesterdayData={yesterdayEnergyGraph} />
            )}
            {activeTab === 'month' && <MonthPage dailyEnergyHistory={dailyEnergyHistory} />}
          </>
        )}
      </div>
    </div>
  )
}

export default App
