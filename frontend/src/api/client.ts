import type { UploadResponse, ChatMessage, InsightRequest } from '../types'

const API_BASE = '/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Request failed')
  }
  return res.json()
}

export async function uploadFile(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: form })
  return handleResponse<UploadResponse>(res)
}

export async function getEda() {
  const res = await fetch(`${API_BASE}/analyze/eda`)
  return handleResponse<Record<string, unknown>>(res)
}

export async function getData(page = 1, pageSize = 50, search = '') {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
    search,
  })
  const res = await fetch(`${API_BASE}/analyze/data?${params}`)
  return handleResponse<{ data: Record<string, unknown>[]; total: number }>(res)
}

export async function generateInsight(apiKey?: string, modelName?: string) {
  const body: InsightRequest = {}
  if (apiKey) body.api_key = apiKey
  if (modelName) body.model_name = modelName
  const res = await fetch(`${API_BASE}/analyze/insight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<{ insight: string }>(res)
}

export async function chatWithAI(
  messages: ChatMessage[],
  apiKey?: string,
  modelName?: string
) {
  const body: { messages: ChatMessage[]; api_key?: string; model_name?: string } = {
    messages,
  }
  if (apiKey) body.api_key = apiKey
  if (modelName) body.model_name = modelName
  const res = await fetch(`${API_BASE}/analyze/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<{ response: string }>(res)
}

export async function explainChart(
  chartType: string,
  dataSummary: string,
  apiKey?: string,
  modelName?: string
) {
  const body: Record<string, string> = {
    chart_type: chartType,
    data_summary: dataSummary,
  }
  if (apiKey) body.api_key = apiKey
  if (modelName) body.model_name = modelName
  const res = await fetch(`${API_BASE}/analyze/explain-chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<{ explanation: string }>(res)
}

export async function exportReport(format: 'pdf' | 'docx') {
  const res = await fetch(`${API_BASE}/export/${format}`, { method: 'POST' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Export failed')
  }
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `analytics-report.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function getFullData(page = 1, limit = 999999, search = '') {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    search,
  })
  const res = await fetch(`${API_BASE}/analyze/data?${params}`)
  return handleResponse<{ total: number; page: number; limit: number; data: Record<string, unknown>[] }>(res)
}

export async function getAITrendColumn(apiKey?: string, modelName?: string) {
  const body: { api_key?: string; model_name?: string } = {}
  if (apiKey) body.api_key = apiKey
  if (modelName) body.model_name = modelName
  const res = await fetch(`${API_BASE}/analyze/trend-column`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<{ trend_column: string; numeric_columns: string[] }>(res)
}

export async function getFullTrend() {
  const res = await fetch(`${API_BASE}/analyze/trend`)
  return handleResponse<Record<string, unknown>>(res)
}

export async function getConfig() {
  const res = await fetch(`${API_BASE}/analyze/config`)
  return handleResponse<{
    api_key_set: boolean
    api_key_preview: string
    model_name: string
    loaded_from_env: boolean
  }>(res)
}

export async function getVisualization() {
  const res = await fetch(`${API_BASE}/visualization/full`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Visualization failed')
  }
  return handleResponse<{
    profile: Record<string, any>
    recommendation: Record<string, any>
    validation: Record<string, any>
    chart: Record<string, any>
    donut?: Record<string, any>
    kpis: Record<string, any>
  }>(res)
}