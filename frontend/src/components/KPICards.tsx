import React from 'react'
import { useDataStore } from '../store/dataStore'
import { formatNumber } from '../utils/helpers'
import { BarChart3, TrendingUp, RefreshCw, Database } from 'lucide-react'
import { cn } from '../utils/helpers'

export default function KPICards() {
  const { state } = useDataStore()
  const { stats, numericColumns } = state

  // Filter and order metrics based on numericColumns (measures only, no IDs)
  const isIdLike = (name: string) => {
    const lower = name.toLowerCase()
    return lower === 'id' || lower.endsWith('_id') || lower.endsWith(' id') || lower.startsWith('id_')
  }

  const validMetricNames = (numericColumns.length > 0 ? numericColumns : Object.keys(stats))
    .filter((col) => !isIdLike(col) && stats[col])

  const topMetrics = validMetricNames.slice(0, 4).map((col) => [col, stats[col]] as [string, typeof stats[string]])

  const icons = [BarChart3, TrendingUp, RefreshCw, Database]

  if (topMetrics.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">
                No Data
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center" />
            </div>
            <div className="text-2xl font-display font-bold tabular-nums text-text-primary">0</div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
              <span>Mean: 0</span>
              <span>Std: 0</span>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
      {topMetrics.map(([colName, stat], i) => {
        const Icon = icons[i % icons.length] || Database
        const mean = stat.mean || 0
        const std = stat.std ?? 0
        const max = stat.max || 0
        const min = stat.min || 0
        const barWidth = max > min ? Math.min(100, Math.max(10, ((mean - min) / (max - min)) * 100)) : 50

        return (
          <div
            key={colName}
            className="bg-surface border border-border rounded-xl p-5 hover:border-primary/30 transition-all duration-300 group shadow-sm hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-text-secondary uppercase tracking-wider truncate mr-2" title={colName}>
                {colName}
              </span>
              <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center group-hover:bg-primary/10 transition-colors shrink-0">
                <Icon className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
              </div>
            </div>
            <div className="text-2xl font-display font-bold tabular-nums text-text-primary">
              {formatNumber(mean)}
            </div>
            <div className="flex items-center gap-3 mt-2 text-[11px] text-text-muted">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Mean
              </span>
              <span>{formatNumber(mean)}</span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-tertiary" />
                Std
              </span>
              <span>{formatNumber(std)}</span>
            </div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-text-muted">
              <span>Min {formatNumber(min)}</span>
              <span>·</span>
              <span>Max {formatNumber(max)}</span>
            </div>
            <div className="mt-3 h-1 bg-surface-elevated rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-tertiary transition-all duration-700"
                style={{ width: `${barWidth}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}