import { useState, useCallback } from 'react'
import { useDataStore } from '../store/dataStore'
import type { ChatMessage } from '../types'
import { uploadFile, generateInsight, chatWithAI, exportReport, getFullData, getAITrendColumn, getFullTrend } from '../api/client'

async function fetchAndStoreFullData(dispatch: React.Dispatch<any>) {
  try {
    const first = await getFullData(1, 1)
    const total = first.total || 0
    if (total > 0) {
      const res = await getFullData(1, total)
      dispatch({ type: 'SET_FULL_DATA', payload: res.data })
    }
  } catch { /* ignore */ }
}

export function useFileUpload() {
  const { dispatch } = useDataStore()
  const [progress, setProgress] = useState(0)

  const handleUpload = useCallback((file: File) => {
    dispatch({ type: 'SET_UPLOADING', payload: true })
    uploadFile(file)
      .then((res) => {
        dispatch({
          type: 'SET_UPLOAD_SUCCESS',
          payload: {
            columns: res.columns,
            numericColumns: res.numeric_columns,
            categoryColumn: res.category_column,
            datetimeColumn: res.datetime_column,
            stats: res.stats,
            fileName: res.filename,
            preview: res.preview,
            rows: res.rows,
          },
        })
        fetchAndStoreFullData(dispatch)
      })
      .catch((err: any) => {
        dispatch({ type: 'SET_UPLOAD_ERROR', payload: err.message })
      })
      .finally(() => {
        dispatch({ type: 'SET_UPLOADING', payload: false })
      })
  }, [dispatch])

  const handleReupload = useCallback((file: File) => {
    dispatch({ type: 'SET_UPLOADING', payload: true })
    uploadFile(file)
      .then((res) => {
        dispatch({
          type: 'SET_UPLOAD_NEW',
          payload: {
            columns: res.columns,
            numericColumns: res.numeric_columns,
            categoryColumn: res.category_column,
            datetimeColumn: res.datetime_column,
            stats: res.stats,
            fileName: res.filename,
            preview: res.preview,
            rows: res.rows,
          },
        })
        fetchAndStoreFullData(dispatch)
      })
      .catch((err: any) => {
        dispatch({ type: 'SET_UPLOAD_ERROR', payload: err.message })
      })
      .finally(() => {
        dispatch({ type: 'SET_UPLOADING', payload: false })
      })
  }, [dispatch])

  const reset = useCallback(() => {
    dispatch({ type: 'RESET_ALL' })
  }, [dispatch])

  return { handleUpload, handleReupload, reset, progress }
}

export function useAnalysis() {
  const { dispatch, state } = useDataStore()

  const generateInsightFn = useCallback(async (apiKey?: string, modelName?: string) => {
    dispatch({ type: 'SET_INSIGHT_LOADING', payload: true })
    dispatch({ type: 'SET_INSIGHT', payload: '' })
    try {
      const result = await generateInsight(apiKey || state.apiKey, modelName || state.modelName)
      dispatch({ type: 'SET_INSIGHT', payload: result.insight })
    } catch (err: any) {
      dispatch({ type: 'SET_INSIGHT', payload: err.message || 'Failed to generate insight' })
    } finally {
      dispatch({ type: 'SET_INSIGHT_LOADING', payload: false })
    }
  }, [dispatch, state.apiKey, state.modelName])

  const exportPdf = useCallback(() => {
    exportReport('pdf')
  }, [])

  const exportDocx = useCallback(() => {
    exportReport('docx')
  }, [])

  return { generateInsightFn, exportPdf, exportDocx }
}

export function useChat() {
  const { dispatch, state } = useDataStore()
  const [inputValue, setInputValue] = useState('')

  const sendMessage = useCallback(async (apiKey?: string, modelName?: string) => {
    if (!inputValue.trim()) return
    const key = apiKey || state.apiKey
    const model = modelName || state.modelName
    const userMsg: ChatMessage = { role: 'user', content: inputValue, timestamp: Date.now() }
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: userMsg })
    setInputValue('')
    dispatch({ type: 'SET_CHAT_LOADING', payload: true })

    const cacheKey = inputValue.trim().toLowerCase()
    if (state.chatCache[cacheKey]) {
      const cachedMsg: ChatMessage = { role: 'assistant', content: state.chatCache[cacheKey], timestamp: Date.now() }
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: cachedMsg })
      dispatch({ type: 'SET_CHAT_LOADING', payload: false })
      return
    }

    try {
      const result = await chatWithAI(state.chatMessages.concat(userMsg), key, model)
      const aiMsg: ChatMessage = { role: 'assistant', content: result.response, timestamp: Date.now() }
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: aiMsg })
      dispatch({ type: 'CACHE_CHAT', payload: { question: cacheKey, answer: result.response } })
    } catch (err: any) {
      dispatch({ type: 'ADD_CHAT_MESSAGE', payload: { role: 'assistant', content: err.message || 'Chat failed', timestamp: Date.now() } })
    } finally {
      dispatch({ type: 'SET_CHAT_LOADING', payload: false })
    }
  }, [dispatch, inputValue, state.chatMessages, state.apiKey, state.modelName, state.chatCache])

  const setInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }, [])

  const clearChat = useCallback(() => {
    dispatch({ type: 'SET_CHAT_MESSAGES', payload: [] })
    setInputValue('')
  }, [dispatch])

  return {
    inputValue,
    setInput,
    sendMessage,
    clearChat,
    chatMessages: state.chatMessages,
    isChatLoading: state.isChatLoading,
  }
}

export function useAnalysisWithData() {
  const { dispatch, state } = useDataStore()

  const generateInsightWithData = useCallback(async (apiKey?: string, modelName?: string) => {
    dispatch({ type: 'SET_INSIGHT_LOADING', payload: true })
    dispatch({ type: 'SET_INSIGHT', payload: '' })
    try {
      const result = await generateInsight(apiKey || state.apiKey, modelName || state.modelName)
      dispatch({ type: 'SET_INSIGHT', payload: result.insight })
    } catch (err: any) {
      dispatch({ type: 'SET_INSIGHT', payload: err.message || 'Failed to generate insight' })
    } finally {
      dispatch({ type: 'SET_INSIGHT_LOADING', payload: false })
    }
  }, [dispatch, state.apiKey, state.modelName])

  return { generateInsightWithData }
}

export function useAITrend() {
  const { dispatch, state } = useDataStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAISelectedTrend = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getAITrendColumn(state.apiKey, state.modelName)
      dispatch({ type: 'SET_AI_TREND_COLUMN', payload: res.trend_column })
    } catch (err: any) {
      setError(err.message || 'AI trend selection failed')
    } finally {
      setIsLoading(false)
    }
  }, [state.apiKey, state.modelName])

  const fetchFullTrend = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getFullTrend()
      dispatch({ type: 'SET_FULL_TREND', payload: res as any })
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trend')
    } finally {
      setIsLoading(false)
    }
  }, [])

  return { fetchAISelectedTrend, fetchFullTrend, isLoading, error }
}