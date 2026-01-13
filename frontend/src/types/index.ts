export interface PowerData {
  value: number | null
  timestamp: string | null
}

export interface PowerHistoryData {
  value: number
  timestamp: string
}

export interface EnergyData {
  value: number
  timestamp: string
}

export interface CumulativeEnergyData {
  today: EnergyData[]
  yesterday: EnergyData[]
}

export interface DailyEnergyData {
  value: number
  timestamp: string
}

export interface MinMaxPower {
  min: number | null
  max: number | null
}

export interface ApiResponse {
  success: boolean
  data?: PowerData | PowerHistoryData[] | EnergyData[] | CumulativeEnergyData | DailyEnergyData[] | MinMaxPower
  error?: string
}
