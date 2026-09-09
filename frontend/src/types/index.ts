export interface ColumnStats {
  sum?: number
  mean?: number
  std?: number
  min?: number
  max?: number
  count: number
  null_count: number
  dtype: string
}

export interface UploadResponse {
  status?: string
  filename: string
  rows: number
  columns: string[]
  numeric_columns: string[]
  category_column: string | null
  datetime_column?: string | null
  stats: Record<string, ColumnStats>
  preview: Record<string, unknown>[]
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatRequest {
  messages: ChatMessage[]
  api_key?: string
  model_name?: string
}

export interface InsightRequest {
  api_key?: string
  model_name?: string
  analysis_type?: string
}

export interface DataState {
  data: Record<string, unknown>[]
  columns: string[]
  numericColumns: string[]
  categoryColumn: string | null
  datetimeColumn?: string | null
  stats: Record<string, ColumnStats>
  fileName: string | null
  uploadedAt: number | null
  isLoading: boolean
  error: string | null
  chatMessages: ChatMessage[]
  insightText: string | null
  isInsightLoading: boolean
  isChatLoading: boolean
  apiKey: string
  modelName: string
  aiTrendColumn: string | null
  fullTrend: Record<string, any> | null
  vizResult: any | null
  vizLoading: boolean
  chatCache: Record<string, string>
}