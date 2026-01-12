export interface PowerData {
  value: number | null
  timestamp: string | null
}

export interface EnergyData {
  value: number
  timestamp: string
}

export interface PowerHistoryData {
  value: number
  timestamp: string
}

export interface HourlyData {
  hour: number
  consumption: number
}

export interface ApiResponse {
  success: boolean
  data: PowerData | EnergyData[] | PowerHistoryData[]
}

export type TimeRange = '5m' | '30m' | '1h' | '6h' | '12h' | '24h'
