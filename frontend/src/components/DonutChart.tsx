import React, { useState, useMemo } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useDataStore } from '../store/dataStore'
import { detectChartColors, formatNumber } from '../utils/helpers'
import { PieChart as PieChartIcon } from 'lucide-react'

export default function DonutChart() {
  const { state } = useDataStore()
  const { data, categoryColumn, columns, numericColumns } = state
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined)
  const [selectedCatCol, setSelectedCatCol] = useState<string>('')

  // Find valid categorical columns (low cardinality, non-ID, non-numeric)
  const availableCatCols = useMemo(() => {
    if (!data.length) return []
    const isIdLike = (name: string) => {
      const lower = name.toLowerCase()
      return lower === 'id' || lower.endsWith('_id') || lower.endsWith(' id') || lower.startsWith('id_')
    }
    return columns.filter((col) => {
      if (isIdLike(col)) return false
      const firstVal = data[0]?.[col]
      if (typeof firstVal === 'number') return false
      const uniqueCount = new Set(data.map((r) => r[col])).size
      return uniqueCount >= 2 && uniqueCount <= 30
    })
  }, [data, columns])

  const activeCatCol = selectedCatCol || categoryColumn || availableCatCols[0]

  const chartData = useMemo(() => {
    if (!data.length || !activeCatCol) return []

    const categoryCounts: Record<string, number> = {}
    data.forEach((row) => {
      const key = String(row[activeCatCol] || 'Unknown')
      categoryCounts[key] = (categoryCounts[key] || 0) + 1
    })

    return Object.entries(categoryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, value]) => ({
        name,
        value,
      }))
  }, [data, activeCatCol])

  const total = useMemo(() => chartData.reduce((acc, d) => acc + d.value, 0), [chartData])

  if (!data.length || !activeCatCol || chartData.length === 0) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center animate-fade-in">
        <PieChartIcon className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-secondary">
          Load a dataset with a categorical column to see distribution
        </p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-display font-semibold text-text-primary">Category Distribution</h3>
          <p className="text-xs text-text-muted mt-1">Breakdown by {activeCatCol}</p>
        </div>
        <div className="flex items-center gap-2">
          {availableCatCols.length > 1 && (
            <select
              value={activeCatCol}
              onChange={(e) => setSelectedCatCol(e.target.value)}
              className="bg-surface-elevated border border-border rounded-lg px-2.5 py-1 text-xs text-text-secondary focus:outline-none focus:border-primary cursor-pointer"
            >
              {availableCatCols.map((col) => (
                <option key={col} value={col}>
                  {col}
                </option>
              ))}
            </select>
          )}
          <span className="text-xs text-text-muted tabular-nums">{formatNumber(total)} total</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-full sm:w-1/2 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex}
                activeShape={{ r: 12, fillOpacity: 1 }}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                data={chartData}
                dataKey="value"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(undefined)}
              >
                {chartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={detectChartColors(index)} fillOpacity={0.9} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1c1f29',
                  border: '1px solid #31353f',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                }}
                itemStyle={{
                  color: '#ffffff',
                }}
                labelStyle={{
                  color: '#ffffff',
                  fontWeight: 600,
                }}
                formatter={(val: any) => [formatNumber(Number(val)), 'Records']}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full sm:w-1/2 space-y-2 max-h-64 overflow-y-auto pr-2">
          <div className="text-center -mt-12 sm:mt-0">
            <span className="font-display text-2xl font-bold text-text-primary tabular-nums">
              {formatNumber(total)}
            </span>
            <p className="text-xs text-text-muted">Total Records</p>
          </div>
          {chartData.map((entry, index) => {
            const percentage = total > 0 ? ((entry.value / total) * 100).toFixed(1) : '0.0'
            return (
              <div key={entry.name} className="flex items-center justify-between py-1.5 hover:bg-surface-elevated/40 px-2 rounded-lg transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: detectChartColors(index) }}
                  />
                  <span className="text-xs text-text-secondary truncate max-w-[140px]" title={entry.name}>
                    {entry.name}
                  </span>
                </div>
                <span className="text-xs text-text-muted tabular-nums font-medium shrink-0">{percentage}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
