import React from 'react'
import { Search, Upload, Menu, User, Bell } from 'lucide-react'
import { useDataStore } from '../store/dataStore'
import ReuploadButton from './ReuploadButton'

interface HeaderProps {
  onToggleSidebar: () => void
  onOpenUpload?: () => void
  searchQuery?: string
  setSearchQuery?: (q: string) => void
}

export default function Header({ onToggleSidebar, onOpenUpload, searchQuery, setSearchQuery }: HeaderProps) {
  const { state } = useDataStore()

  return (
    <header className="h-16 border-b border-border bg-surface/50 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="relative hidden sm:block w-72">
          <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery?.(e.target.value)}
            placeholder="Search data, columns, insights..."
            className="w-full bg-surface-light border border-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-medium transition-all"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload Dataset
          </button>
        )}
        {state.fileName && <ReuploadButton />}
        <button className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-xl transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 rounded-full bg-secondary absolute top-1.5 right-1.5" />
        </button>

        <div className="h-6 w-[1px] bg-border mx-1" />

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-tertiary flex items-center justify-center text-background font-bold text-xs">
            A
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-medium text-text-primary">Analyst User</div>
            <div className="text-[10px] text-text-muted">Pro Workspace</div>
          </div>
        </div>
      </div>
    </header>
  )
}
