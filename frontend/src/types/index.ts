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

export interface ApiResponse {
  success: boolean
  data?: PowerData | PowerHistoryData[] | EnergyData[] | CumulativeEnergyData
  error?: string
}
