import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAnalysis } from '../hooks/useData'
import { useDataStore } from '../store/dataStore'
import { cn } from '../utils/helpers'
import { Sparkles, Copy, CheckCircle2, AlertCircle, Loader2, Bot } from 'lucide-react'

export default function InsightPanel() {
  const { state } = useDataStore()
  const { generateInsightFn } = useAnalysis()
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (state.insightText) {
      navigator.clipboard.writeText(state.insightText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (state.insightText) {
    return (
      <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-secondary" />
            <h3 className="font-display font-semibold text-text-primary">Business Intelligence Report</h3>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-elevated border border-border rounded-lg text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            {copied ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-secondary" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copy
              </>
            )}
          </button>
        </div>
        <div className="bg-surface-elevated border border-border rounded-xl p-5 text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
          {state.insightText}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6 animate-fade-in">
      <div className="text-center py-6 space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-secondary to-tertiary flex items-center justify-center shadow-xl shadow-secondary/20">
          <Bot className="w-7 h-7 text-background" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-text-primary text-lg">AI Business Consultant</h3>
          <p className="text-sm text-text-secondary mt-1 max-w-md mx-auto">
            Let AI analyze your data and generate a comprehensive business intelligence report with actionable recommendations.
          </p>
        </div>
        <button
          onClick={() => generateInsightFn(state.apiKey, state.modelName)}
          disabled={state.isInsightLoading || !state.fileName}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-secondary to-tertiary hover:from-secondary/80 hover:to-tertiary/80 disabled:opacity-40 text-background rounded-xl text-sm font-medium transition-all active:scale-95 shadow-lg shadow-secondary/20"
        >
          {state.isInsightLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
          {state.isInsightLoading ? 'Generating Report...' : 'Generate BI Report'}
        </button>
      </div>
    </div>
  )
}
