import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatNumber(n: number | string): string {
  if (n === null || n === undefined) return '0'
  const num = typeof n === 'string' ? parseFloat(n) : n
  if (Number.isNaN(num)) return String(n)
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export const CHART_COLORS = [
  '#c0c1ff',
  '#4edea3',
  '#4cd7f6',
  '#f59e0b',
  '#f472b6',
  '#60a5fa',
  '#f87171',
  '#34d399',
]

export function detectChartColors(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length]
}