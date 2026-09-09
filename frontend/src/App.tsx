import React, { useState, useEffect } from 'react'
import { DataProvider, useDataStore } from './store/dataStore'
import Layout from './components/Layout'
import FileUpload from './components/FileUpload'
import KPICards from './components/KPICards'
import TrendChart from './components/TrendChart'
import DonutChart from './components/DonutChart'
import DataTable from './components/DataTable'
import AIChat from './components/AIChat'
import InsightPanel from './components/InsightPanel'
import ExportPanel from './components/ExportPanel'
import ErrorBoundary from './components/ErrorBoundary'
import { getConfig } from './api/client'

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('overview')
  const [searchQuery, setSearchQuery] = useState('')
  const { state, dispatch } = useDataStore()

  useEffect(() => {
    getConfig()
      .then((cfg) => {
        if (cfg.model_name) dispatch({ type: 'SET_MODEL_NAME', payload: cfg.model_name })
      })
      .catch(() => {})
  }, [])

  const handleApiKeyChange = (key: string) => dispatch({ type: 'SET_API_KEY', payload: key })
  const handleModelChange = (model: string) => dispatch({ type: 'SET_MODEL_NAME', payload: model })

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      apiKey={state.apiKey}
      setApiKey={handleApiKeyChange}
      modelName={state.modelName}
      setModelName={handleModelChange}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
    >
      {!state.fileName ? (
        <FileUpload />
      ) : (
        <div className="space-y-6 animate-fade-in">
          <KPICards />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TrendChart />
            <DonutChart />
          </div>

          {activeTab === 'overview' && (
            <>
              <InsightPanel />
              <ExportPanel />
            </>
          )}

          {activeTab === 'data' && <DataTable />}

          {activeTab === 'chat' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AIChat />
              <InsightPanel />
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <InsightPanel />
              <ExportPanel />
            </div>
          )}

          {activeTab === 'trends' && (
            <div className="grid grid-cols-1 gap-6">
              <TrendChart />
              <DonutChart />
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}

function AppContent() {
  return (
    <ErrorBoundary>
      <DataProvider>
        <DashboardContent />
      </DataProvider>
    </ErrorBoundary>
  )
}

export default function App() {
  return <AppContent />
}
