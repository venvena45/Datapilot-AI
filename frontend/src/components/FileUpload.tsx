import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react'
import { useFileUpload } from '../hooks/useData'
import { useDataStore } from '../store/dataStore'
import { cn } from '../utils/helpers'

export default function FileUpload() {
  const { state } = useDataStore()
  const { handleUpload } = useFileUpload()

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleUpload(acceptedFiles[0])
      }
    },
    [handleUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/json': ['.json'],
    },
    multiple: false,
  })

  if (state.isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-fade-in">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-text-secondary">Processing your dataset...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto text-center animate-fade-in">
      <div className="bg-glow-primary bg-glow-secondary rounded-2xl p-10 space-y-6">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/20">
          <UploadCloud className="w-8 h-8 text-background" />
        </div>

        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            Upload your data, get instant AI insights
          </h2>
          <p className="text-sm text-text-secondary max-w-md mx-auto">
            Drop a CSV, Excel, or JSON file. We'll analyze columns, build charts, and let AI explain what matters.
          </p>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            'border-2 border-dashed rounded-2xl p-10 cursor-pointer transition-all',
            isDragActive
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border bg-surface hover:border-primary/50 hover:bg-surface-elevated'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              {['CSV', 'XLSX', 'JSON'].map((t) => (
                <span key={t} className="px-2 py-0.5 rounded bg-surface-elevated text-[11px] font-medium text-text-secondary border border-border">
                  {t}
                </span>
              ))}
            </div>
            <p className="text-sm text-text-primary font-medium">
              {isDragActive ? 'Drop the file here' : 'Drag & drop your file here, or click to browse'}
            </p>
            <p className="text-xs text-text-muted">Max 25MB · Auto-detects encoding</p>
          </div>
        </div>

        {state.error && (
          <div className="flex items-center gap-2 justify-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            <AlertCircle className="w-4 h-4" />
            {state.error}
          </div>
        )}

        {state.fileName && !state.error && (
          <div className="flex items-center gap-2 justify-center text-sm text-secondary bg-secondary/10 border border-secondary/20 rounded-xl px-4 py-2.5">
            <CheckCircle2 className="w-4 h-4" />
            {state.fileName} loaded · {(state.data?.length || 0)} rows · {state.columns.length} columns
          </div>
        )}
      </div>
    </div>
  )
}