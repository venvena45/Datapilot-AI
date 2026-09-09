import React, { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  TrendingUp,
  Table,
  Sparkles,
  MessageSquare,
  Key,
  ChevronDown,
  FileSpreadsheet,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { cn } from '../utils/helpers'
import { useDataStore } from '../store/dataStore'
import { getConfig } from '../api/client'
import ReuploadButton from './ReuploadButton'

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  apiKey: string
  setApiKey: (key: string) => void
  modelName: string
  setModelName: (model: string) => void
}

export default function Sidebar({
  isOpen,
  setIsOpen,
  activeTab,
  setActiveTab,
  apiKey,
  setApiKey,
  modelName,
  setModelName,
}: SidebarProps) {
  const { state, dispatch } = useDataStore()
  const [showApiKey, setShowApiKey] = useState(false)
  const [envStatus, setEnvStatus] = useState<{ loaded: boolean; model: string } | null>(null)

  useEffect(() => {
    getConfig()
      .then((cfg) => {
        setEnvStatus({ loaded: cfg.loaded_from_env, model: cfg.model_name })
        if (cfg.loaded_from_env && cfg.model_name) {
          dispatch({ type: 'SET_MODEL_NAME', payload: cfg.model_name })
        }
      })
      .catch(() => {})
  }, [])

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'trends', label: 'Trend Analysis', icon: TrendingUp },
    { id: 'data', label: 'Raw Data', icon: Table },
    { id: 'insights', label: 'AI Insights', icon: Sparkles },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
  ]

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 w-sidebar bg-surface border-r border-border flex flex-col transition-transform duration-300 md:translate-x-0',
        !isOpen && '-translate-x-full'
      )}
    >
      <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
        <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
          <Sparkles className="w-5 h-5 text-background" />
          {envStatus?.loaded && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-surface" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-display font-bold text-base bg-gradient-to-r from-primary via-tertiary to-secondary bg-clip-text text-transparent block leading-tight truncate">
            NexusAnalytics
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[11px] text-text-muted leading-none">AI Data Studio</span>
            {envStatus?.loaded && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-[10px] font-medium leading-none shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                Connected
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-6 space-y-6 overflow-y-auto">
        {state.fileName && (
          <div className="p-3 rounded-xl bg-surface-light border border-border flex items-center justify-between">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileSpreadsheet className="w-4 h-4 text-secondary shrink-0" />
              <span className="text-xs truncate text-text-primary font-medium">{state.fileName}</span>
            </div>
            <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded shrink-0">
              {(state.data?.length || 0)} rows
            </span>
          </div>
        )}

        {state.fileName && (
          <div className="px-3">
            <ReuploadButton />
          </div>
        )}

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm border border-primary/20'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary'
                )}
              >
                <Icon className={cn('w-4 h-4', isActive ? 'text-primary' : 'text-text-muted')} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border bg-surface-light/50 space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-amber" /> Gemini API Key
            </label>
            {envStatus?.loaded && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-secondary bg-secondary/10 border border-secondary/20 px-1.5 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" /> .env
              </span>
            )}
          </div>
          <div className="relative">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={envStatus?.loaded ? 'Configured in .env' : 'AIza...'}
              className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary pr-12"
            />
            <button
              onClick={() => setShowApiKey(!showApiKey)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-text-muted hover:text-text-primary"
            >
              {showApiKey ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-text-secondary">Model</label>
          <div className="relative">
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary appearance-none focus:outline-none focus:border-primary pr-8"
            >
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
              <option value="gemini-2.0-flash-lite">Gemini 2.0 Flash Lite</option>
            </select>
            <ChevronDown className="w-4 h-4 text-text-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </aside>
  )
}