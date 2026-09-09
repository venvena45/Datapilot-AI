import React, { createContext, useContext, useReducer, ReactNode } from 'react'
import type { DataState, ColumnStats, ChatMessage } from '../types'

const initialState: DataState = {
  data: [],
  columns: [],
  numericColumns: [],
  categoryColumn: null,
  stats: {},
  fileName: null,
  uploadedAt: null,
  isLoading: false,
  error: null,
  chatMessages: [],
  insightText: null,
  isInsightLoading: false,
  isChatLoading: false,
  apiKey: '',
  modelName: 'gemini-2.5-flash',
  aiTrendColumn: null,
  fullTrend: null,
  vizResult: null,
  vizLoading: false,
  chatCache: {},
}

type Action =
  | { type: 'SET_UPLOADING'; payload: boolean }
  | { type: 'SET_UPLOAD_SUCCESS'; payload: { columns: string[]; numericColumns: string[]; categoryColumn: string | null; datetimeColumn?: string | null; stats: Record<string, ColumnStats>; fileName: string; preview: Record<string, unknown>[]; rows: number } }
  | { type: 'SET_UPLOAD_ERROR'; payload: string }
  | { type: 'SET_CATEGORY_COLUMN'; payload: string | null }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_MESSAGES'; payload: ChatMessage[] }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'SET_INSIGHT'; payload: string }
  | { type: 'SET_INSIGHT_LOADING'; payload: boolean }
  | { type: 'SET_API_KEY'; payload: string }
  | { type: 'SET_MODEL_NAME'; payload: string }
  | { type: 'RESET_ALL' }
  | { type: 'SET_UPLOAD_NEW'; payload: { columns: string[]; numericColumns: string[]; categoryColumn: string | null; datetimeColumn?: string | null; stats: Record<string, ColumnStats>; fileName: string; preview: Record<string, unknown>[]; rows: number } }
  | { type: 'SET_FULL_DATA'; payload: Record<string, unknown>[] }
  | { type: 'SET_AI_TREND_COLUMN'; payload: string }
  | { type: 'SET_FULL_TREND'; payload: Record<string, unknown> }
  | { type: 'SET_VIZ_RESULT'; payload: any }
  | { type: 'SET_VIZ_LOADING'; payload: boolean }
  | { type: 'CACHE_CHAT'; payload: { question: string; answer: string } }

function reducer(state: DataState, action: Action): DataState {
  switch (action.type) {
    case 'SET_UPLOADING':
      return { ...state, isLoading: action.payload, error: null }
    case 'SET_UPLOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        columns: action.payload.columns,
        numericColumns: action.payload.numericColumns,
        categoryColumn: action.payload.categoryColumn,
        datetimeColumn: action.payload.datetimeColumn,
        stats: action.payload.stats,
        fileName: action.payload.fileName,
        uploadedAt: Date.now(),
        data: action.payload.preview,
        error: null,
      }
    case 'SET_UPLOAD_ERROR':
      return { ...state, isLoading: false, error: action.payload }
    case 'SET_CATEGORY_COLUMN':
      return { ...state, categoryColumn: action.payload }
    case 'ADD_CHAT_MESSAGE':
      return { ...state, chatMessages: [...state.chatMessages, action.payload] }
    case 'SET_CHAT_MESSAGES':
      return { ...state, chatMessages: action.payload }
    case 'SET_CHAT_LOADING':
      return { ...state, isChatLoading: action.payload }
    case 'SET_INSIGHT':
      return { ...state, insightText: action.payload, isInsightLoading: false }
    case 'SET_INSIGHT_LOADING':
      return { ...state, isInsightLoading: action.payload }
    case 'SET_API_KEY':
      return { ...state, apiKey: action.payload }
    case 'SET_MODEL_NAME':
      return { ...state, modelName: action.payload }
    case 'RESET_ALL':
      return initialState
    case 'SET_UPLOAD_NEW':
      return {
        ...state,
        isLoading: false,
        columns: action.payload.columns,
        numericColumns: action.payload.numericColumns,
        categoryColumn: action.payload.categoryColumn,
        datetimeColumn: action.payload.datetimeColumn,
        stats: action.payload.stats,
        fileName: action.payload.fileName,
        uploadedAt: Date.now(),
        data: action.payload.preview,
        error: null,
        chatMessages: [],
        insightText: null,
        isInsightLoading: false,
      }
    case 'SET_FULL_DATA':
      return { ...state, data: action.payload }
    case 'SET_AI_TREND_COLUMN':
      return { ...state, aiTrendColumn: action.payload }
    case 'SET_FULL_TREND':
      return { ...state, fullTrend: action.payload }
    case 'SET_VIZ_RESULT':
      return { ...state, vizResult: action.payload, vizLoading: false }
    case 'SET_VIZ_LOADING':
      return { ...state, vizLoading: action.payload }
    case 'CACHE_CHAT':
      return { ...state, chatCache: { ...state.chatCache, [action.payload.question]: action.payload.answer } }
    default:
      return state
  }
}

const DataContext = createContext<{
  state: DataState
  dispatch: React.Dispatch<Action>
} | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return (
    <DataContext.Provider value={{ state, dispatch }}>
      {children}
    </DataContext.Provider>
  )
}

export function useDataStore() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useDataStore must be used within DataProvider')
  return ctx
}