import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { UploadCloud, RefreshCw, Loader2, X, FileSpreadsheet, Trash2 } from 'lucide-react'
import { useFileUpload } from '../hooks/useData'
import { useDataStore } from '../store/dataStore'
import { cn } from '../utils/helpers'

export default function ReuploadButton() {
  const { state } = useDataStore()
  const { handleReupload, reset } = useFileUpload()
  const [showDropzone, setShowDropzone] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowDropzone(false)
      }
    }
    if (showDropzone) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [showDropzone])

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleReupload(acceptedFiles[0])
      setShowDropzone(false)
    }
  }

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

  return (
    <>
      <button
        onClick={() => setShowDropzone(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-medium transition-all"
        title="Upload new dataset"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        New Dataset
      </button>

      {showDropzone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0"
            onClick={() => setShowDropzone(false)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl p-6 z-10 animate-fade-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary">Upload New Dataset</h3>
                  <p className="text-[11px] text-text-muted">Replace or upload a new dataset file</p>
                </div>
              </div>
              <button
                onClick={() => setShowDropzone(false)}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-elevated rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {state.isLoading ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Loader2 className="w-7 h-7 text-primary animate-spin" />
                <p className="text-xs text-text-secondary">Processing dataset...</p>
              </div>
            ) : (
              <div
                {...getRootProps()}
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
                  isDragActive
                    ? 'border-primary bg-primary/5 scale-[1.01]'
                    : 'border-border bg-surface-elevated hover:border-primary/50 hover:bg-surface-hover'
                )}
              >
                <input {...getInputProps()} />
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-surface flex items-center justify-center border border-border text-primary shadow-sm">
                  <UploadCloud className="w-5 h-5" />
                </div>
                <p className="text-xs font-medium text-text-primary mb-1">
                  {isDragActive ? 'Drop file to upload' : 'Click to browse or drop file here'}
                </p>
                <p className="text-[11px] text-text-muted">CSV, Excel (.xlsx, .xls), or JSON (Max 25MB)</p>
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  reset()
                  setShowDropzone(false)
                }}
                className="flex items-center justify-center gap-1.5 flex-1 px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </button>
              <button
                type="button"
                onClick={() => setShowDropzone(false)}
                className="px-4 py-2 bg-surface-elevated hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border rounded-xl text-xs font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
