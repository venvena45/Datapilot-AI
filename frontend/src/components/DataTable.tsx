import React, { useState, useMemo } from 'react'
import { useDataStore } from '../store/dataStore'
import { formatNumber } from '../utils/helpers'
import { Search, ChevronsDown } from 'lucide-react'

export default function DataTable() {
  const { state } = useDataStore()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const pageSize = 20

  const { columns } = state
  const filtered = useMemo(() => {
    if (!search) return state.data
    return state.data.filter((row) =>
      columns.some((col) =>
        String(row[col] ?? '').toLowerCase().includes(search.toLowerCase())
      )
    )
  }, [state.data, search, columns])

  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize)

  if (!state.data.length) {
    return (
      <div className="bg-surface border border-border rounded-xl p-12 text-center animate-fade-in">
        <p className="text-sm text-text-secondary">Upload a dataset to preview raw data</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0) }}
            placeholder="Filter rows..."
            className="bg-transparent border-none outline-none text-sm text-text-primary placeholder:text-text-muted w-56"
          />
        </div>
        <span className="text-xs text-text-muted tabular-nums">
          {filtered.length} rows
        </span>
      </div>

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-surface-elevated z-10">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-2.5 text-left text-text-muted font-medium whitespace-nowrap border-b border-border"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.map((row, i) => (
              <tr key={i} className="hover:bg-surface-elevated/50 transition-colors">
                {columns.map((col) => (
                  <td
                    key={col}
                    className="px-4 py-2 text-text-primary whitespace-nowrap tabular-nums max-w-[200px] truncate"
                  >
                    {formatNumber(String(row[col] ?? ''))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length > pageSize && (
        <div className="flex items-center justify-between p-3 border-t border-border">
          <span className="text-xs text-text-muted">
            Showing {page * pageSize + 1}-{Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1 rounded-lg text-xs bg-surface-elevated text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={(page + 1) * pageSize >= filtered.length}
              className="px-3 py-1 rounded-lg text-xs bg-surface-elevated text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
