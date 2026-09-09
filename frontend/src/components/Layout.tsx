import React, { useState } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useDataStore } from '../store/dataStore'
import { cn } from '../utils/helpers'

interface LayoutProps {
  children: React.ReactNode
  activeTab: string
  setActiveTab: (tab: string) => void
  apiKey: string
  setApiKey: (key: string) => void
  modelName: string
  setModelName: (model: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
}

export default function Layout({
  children,
  activeTab,
  setActiveTab,
  apiKey,
  setApiKey,
  modelName,
  setModelName,
  searchQuery,
  setSearchQuery,
}: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const { state } = useDataStore()

  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden font-sans">
      <Sidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiKey={apiKey}
        setApiKey={setApiKey}
        modelName={modelName}
        setModelName={setModelName}
      />
      <div
        className={cn(
          'flex flex-col flex-1 overflow-hidden transition-all duration-300',
          isSidebarOpen ? 'md:ml-sidebar' : 'md:ml-0'
        )}
      >
        <Header
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <main
          className={cn(
            'flex-1 overflow-y-auto p-6 transition-all duration-300',
            !state.fileName && 'flex items-center justify-center'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}