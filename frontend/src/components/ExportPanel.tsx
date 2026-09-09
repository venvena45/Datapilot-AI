import React from 'react'
import { useAnalysis } from '../hooks/useData'
import { useDataStore } from '../store/dataStore'
import { Download, FileText, FileJson, Loader2 } from 'lucide-react'
import { cn } from '../utils/helpers'

export default function ExportPanel() {
  const { exportPdf, exportDocx } = useAnalysis()
  const { state } = useDataStore()

  if (!state.fileName) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 text-center animate-fade-in">
        <Download className="w-8 h-8 text-text-muted mx-auto mb-2" />
        <p className="text-sm text-text-secondary">Upload a dataset to enable export</p>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
      <h3 className="font-display font-semibold text-text-primary mb-4 flex items-center gap-2">
        <Download className="w-5 h-5 text-tertiary" />
        Export Report
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={exportPdf}
          className="flex items-center gap-3 p-4 bg-surface-elevated border border-border rounded-xl hover:border-tertiary/50 hover:bg-surface-hover transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-red-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-text-primary">Export PDF</div>
            <div className="text-xs text-text-muted">Download formatted report</div>
          </div>
        </button>

        <button
          onClick={exportDocx}
          className="flex items-center gap-3 p-4 bg-surface-elevated border border-border rounded-xl hover:border-primary/50 hover:bg-surface-hover transition-all active:scale-[0.98]"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <FileJson className="w-5 h-5 text-blue-400" />
          </div>
          <div className="text-left">
            <div className="text-sm font-medium text-text-primary">Export DOCX</div>
            <div className="text-xs text-text-muted">Download Word document</div>
          </div>
        </button>
      </div>
    </div>
  )
}
