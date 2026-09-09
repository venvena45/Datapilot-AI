import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { useDataStore } from '../store/dataStore'
import { cn, detectChartColors, formatNumber } from '../utils/helpers'
import { TrendingUp, Sparkles, Settings } from 'lucide-react'
import { getAITrendColumn } from '../api/client'

export default function TrendChart() {
  const { state, dispatch } = useDataStore()
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area'>('bar')
  const [isAIDetecting, setIsAIDetecting] = useState(false)
  const [selectedYCol, setSelectedYCol] = useState<string>('')
  const [selectedXCol, setSelectedXCol] = useState<string>('')
  const [smooth, setSmooth] = useState(true)
  const [showDots, setShowDots] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const { data, columns, numericColumns, categoryColumn, datetimeColumn, aiTrendColumn, apiKey, modelName } = state

  // Filter out any ID-like columns from numericColumns
  const validMeasures = useMemo(() => {
    const isIdLike = (name: string) => {
      const lower = name.toLowerCase()
      return lower === 'id' || lower.endsWith('_id') || lower.endsWith(' id') || lower.startsWith('id_')
    }
    return numericColumns.filter((col) => !isIdLike(col))
  }, [numericColumns])

  useEffect(() => {
    if (!data.length || validMeasures.length === 0 || aiTrendColumn) return
    setIsAIDetecting(true)
    getAITrendColumn(apiKey, modelName)
      .then((res) => {
        if (res.trend_column && validMeasures.includes(res.trend_column)) {
          dispatch({ type: 'SET_AI_TREND_COLUMN', payload: res.trend_column })
          setSelectedYCol(res.trend_column)
        }
      })
      .catch(() => {})
      .finally(() => setIsAIDetecting(false))
  }, [data, validMeasures, apiKey, modelName, aiTrendColumn, dispatch])

  const allXCols = columns.filter((col) => {
    const lower = col.toLowerCase()
    return !(lower === 'id' || lower.endsWith('_id') || lower.endsWith(' id') || lower.startsWith('id_'))
  })

  const topCol = selectedYCol || (aiTrendColumn && validMeasures.includes(aiTrendColumn)
    ? aiTrendColumn
    : validMeasures[0] || numericColumns[0])

  const xAxisCol = selectedXCol || datetimeColumn || categoryColumn

  // Aggregate data by xAxisCol
  const aggregatedData = useMemo(() => {
    if (!data.length || !topCol) return []

    if (!xAxisCol) {
      return data.slice(0, 20).map((row, i) => ({
        index: `Row ${i + 1}`,
        value: Number(row[topCol]) || 0,
      }))
    }

    const groups: Record<string, { sum: number; count: number }> = {}
    data.forEach((row) => {
      const key = String(row[xAxisCol] || 'Other')
      const val = Number(row[topCol]) || 0
      if (!groups[key]) {
        groups[key] = { sum: 0, count: 0 }
      }
      groups[key].sum += val
      groups[key].count += 1
    })

    let entries = Object.entries(groups).map(([name, stat]) => ({
      index: name,
      value: Math.round(stat.sum * 100) / 100,
      avg: Math.round((stat.sum / Math.max(stat.count, 1)) * 100) / 100,
    }))

    // Sort chronologically if date-like, or by value
    if (datetimeColumn && xAxisCol === datetimeColumn) {
      entries.sort((a, b) => {
        const tA = new Date(a.index).getTime()
        const tB = new Date(b.index).getTime()
        if (!isNaN(tA) && !isNaN(tB)) return tA - tB
        return a.index.localeCompare(b.index)
      })
    } else {
      entries.sort((a, b) => b.value - a.value)
    }

    return entries.slice(0, 25)
  }, [data, topCol, xAxisCol, datetimeColumn])

  const totalPlotted = aggregatedData.reduce((s, d) => s + d.value, 0)
  const peak = aggregatedData.reduce((p, d) => (d.value > p.value ? d : p), aggregatedData[0] || { value: 0, index: 'N/A' })

  if (!data.length || !topCol) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center animate-fade-in">
        <TrendingUp className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-sm text-text-secondary">Load a dataset to see trend visualizations</p>
      </div>
    )
  }

  const isBar = chartType === 'bar'

  return (
    <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
      {/* Row 1: Title + AI badge */}
      <div className="flex items-center gap-2 mb-1">
        <h3 className="font-display font-semibold text-text-primary whitespace-nowrap">Trend Analysis</h3>
        {aiTrendColumn === topCol && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium whitespace-nowrap">
            <Sparkles className="w-3 h-3" /> AI Selected
          </span>
        )}
        {isAIDetecting && (
          <span className="text-[10px] text-tertiary animate-pulse whitespace-nowrap">AI optimizing...</span>
        )}
      </div>

      {/* Row 2: Subtitle */}
      <p className="text-xs text-text-muted mb-4">
        Total <span className="text-text-primary font-medium">{topCol}</span>{' '}
        across <span className="text-text-primary font-medium">{xAxisCol || 'records'}</span>
      </p>

      {/* Row 3: All controls in one flex row */}
      <div className="flex items-center gap-2 mb-5 flex-wrap">
        {/* Y-axis selector */}
        {validMeasures.length > 1 && (
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">Y:</span>
            <select
              value={topCol}
              onChange={(e) => setSelectedYCol(e.target.value)}
              className="bg-surface-elevated border border-border rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-primary cursor-pointer"
            >
              {validMeasures.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        )}

        {/* X-axis selector */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-text-muted font-semibold uppercase tracking-wider">X:</span>
          <select
            value={xAxisCol || ''}
            onChange={(e) => setSelectedXCol(e.target.value)}
            className="bg-surface-elevated border border-border rounded-lg px-2 py-1 text-xs text-text-secondary focus:outline-none focus:border-primary cursor-pointer"
          >
            {allXCols.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {/* Spacer */}
        <div className="flex-1 min-w-0" />

        {/* Chart type tabs */}
        <div className="flex gap-1 bg-surface-elevated rounded-lg p-1">
          {(['bar', 'line', 'area'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setChartType(type)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium transition-all',
                chartType === type
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Settings */}
        <div className="relative">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={cn(
              'p-1.5 rounded-md transition-all',
              showSettings ? 'text-primary bg-primary/10' : 'text-text-muted hover:text-text-primary'
            )}
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          {showSettings && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-surface border border-border rounded-xl p-3 space-y-2.5 z-10 shadow-xl animate-fade-in">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide mb-2">Line / Area Options</p>
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={smooth}
                  onChange={(e) => setSmooth(e.target.checked)}
                  className="accent-primary"
                />
                Smooth curve
              </label>
              <label className="flex items-center gap-2 text-xs text-text-secondary cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDots}
                  onChange={(e) => setShowDots(e.target.checked)}
                  className="accent-primary"
                />
                Show data points
              </label>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        {chartType === 'bar' ? (
          <BarChart data={aggregatedData} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" vertical={false} />
            <XAxis
              dataKey="index"
              stroke="#8888a0"
              tick={{ fontSize: 10, fill: '#8888a0' }}
              tickLine={false}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#8888a0"
              tick={{ fontSize: 11, fill: '#8888a0' }}
              tickLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1c1f29',
                border: '1px solid #31353f',
                borderRadius: '8px',
                color: '#dfe2ef',
                fontSize: '12px',
              }}
              formatter={(val: any) => [formatNumber(Number(val)), `Total ${topCol}`]}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {aggregatedData.map((_, i) => (
                <Cell key={i} fill={detectChartColors(i)} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        ) : chartType === 'line' ? (
          <LineChart data={aggregatedData} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" vertical={false} />
            <XAxis
              dataKey="index"
              stroke="#8888a0"
              tick={{ fontSize: 10, fill: '#8888a0' }}
              tickLine={false}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#8888a0"
              tick={{ fontSize: 11, fill: '#8888a0' }}
              tickLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1c1f29',
                border: '1px solid #31353f',
                borderRadius: '8px',
                color: '#dfe2ef',
                fontSize: '12px',
              }}
              formatter={(val: any) => [formatNumber(Number(val)), `Total ${topCol}`]}
            />
            <Line
              type={smooth ? 'monotone' : 'linear'}
              dataKey="value"
              stroke="#4edea3"
              strokeWidth={2.5}
              dot={showDots ? { fill: '#4edea3', r: 3 } : false}
              activeDot={{ r: 6, fill: '#c0c1ff' }}
            />
          </LineChart>
        ) : chartType === 'area' ? (
          <AreaChart data={aggregatedData} margin={{ top: 5, right: 10, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2e3a" vertical={false} />
            <XAxis
              dataKey="index"
              stroke="#8888a0"
              tick={{ fontSize: 10, fill: '#8888a0' }}
              tickLine={false}
              angle={-25}
              textAnchor="end"
              height={40}
            />
            <YAxis
              stroke="#8888a0"
              tick={{ fontSize: 11, fill: '#8888a0' }}
              tickLine={false}
              tickFormatter={(v) => formatNumber(v)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1c1f29',
                border: '1px solid #31353f',
                borderRadius: '8px',
                color: '#dfe2ef',
                fontSize: '12px',
              }}
              formatter={(val: any) => [formatNumber(Number(val)), `Total ${topCol}`]}
            />
            <Area
              type={smooth ? 'monotone' : 'linear'}
              dataKey="value"
              stroke="#4edea3"
              fill="#4edea3"
              fillOpacity={0.15}
              strokeWidth={2.5}
              dot={showDots ? { fill: '#4edea3', r: 3 } : false}
              activeDot={{ r: 6, fill: '#c0c1ff' }}
            />
          </AreaChart>
        ) : null}
      </ResponsiveContainer>
      {aggregatedData.length > 0 && (
        <div className="flex items-center justify-between mt-3 text-[11px] text-text-muted">
          <span>Total Plotted: {formatNumber(totalPlotted)}</span>
          <span>Peak: {formatNumber(peak.value)} at {peak.index}</span>
          <span>{aggregatedData.length} categories</span>
        </div>
      )}
    </div>
  )
}
