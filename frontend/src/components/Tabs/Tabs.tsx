import './Tabs.css'

type TabType = 'today' | 'month'

interface TabsProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

export function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="tabs-container">
      <div className="tabs">
        <button
          type="button"
          className={`tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => onTabChange('today')}
        >
          Today
        </button>
        <button
          type="button"
          className={`tab ${activeTab === 'month' ? 'active' : ''}`}
          onClick={() => onTabChange('month')}
        >
          This Month
        </button>
      </div>
    </div>
  )
}
