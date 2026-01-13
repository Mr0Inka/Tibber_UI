import { useState } from 'react'
import { Tabs } from './components/Tabs/Tabs'
import { PowerDisplay, TodayDisplay, MonthDisplay } from './components/PowerDisplay/PowerDisplay'
import { SettingsModal } from './components/SettingsModal/SettingsModal'
import { CurrentPage } from './pages/CurrentPage/CurrentPage'
import { TodayPage } from './pages/TodayPage/TodayPage'
import { MonthPage } from './pages/MonthPage/MonthPage'
import { usePowerData } from './hooks/usePowerData'
import { useAccentColor } from './hooks/useAccentColor'
import { useKwhPrice } from './hooks/useKwhPrice'
import './App.css'

type TabType = 'current' | 'today' | 'month'
type TimeRange = '1m' | '5m' | '30m' | '1h' | '6h' | '12h' | '24h'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('current')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const { accentColor, setAccentColor } = useAccentColor()
  const { kwhPrice, setKwhPrice } = useKwhPrice()
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
    avg15m,
    avg24h,
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
          <button 
            type="button" 
            className="header-button left"
            onClick={() => setSettingsOpen(true)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
            </svg>
          </button>
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
                avg15m={avg15m}
                avg24h={avg24h}
                onRangeChange={handleRangeChange}
              />
            )}
            {activeTab === 'today' && (
              <TodayPage energyData={todayEnergyGraph} yesterdayData={yesterdayEnergyGraph} />
            )}
            {activeTab === 'month' && <MonthPage dailyEnergyHistory={dailyEnergyHistory} kwhPrice={kwhPrice} />}
          </>
        )}
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        accentColor={accentColor}
        onColorChange={setAccentColor}
        kwhPrice={kwhPrice}
        onPriceChange={setKwhPrice}
      />
    </div>
  )
}

export default App
