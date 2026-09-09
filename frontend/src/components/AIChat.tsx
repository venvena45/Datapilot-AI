import React from 'react'
import ReactMarkdown from 'react-markdown'
import { User, Bot, Loader2, Sparkles } from 'lucide-react'
import { useChat } from '../hooks/useData'
import { useDataStore } from '../store/dataStore'
import { cn } from '../utils/helpers'

export default function AIChat() {
  const { inputValue, setInput, sendMessage, chatMessages, isChatLoading } = useChat()
  const { state } = useDataStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim() || isChatLoading) return
    sendMessage(state.apiKey, state.modelName)
  }

  return (
    <div className="bg-surface border border-border rounded-xl flex flex-col animate-fade-in" style={{ height: '600px' }}>
      <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
        <Sparkles className="w-5 h-5 text-primary" />
        <h3 className="font-display font-semibold text-text-primary">AI Assistant</h3>
        <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded-full ml-1">
          Online
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {chatMessages.length === 0 && (
          <div className="text-center py-8">
            <Bot className="w-10 h-10 text-text-muted mx-auto mb-3" />
            <p className="text-sm text-text-secondary">AI Business Consultant</p>
            <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
              Ask about strategies, trends, risks, or recommendations for your business data.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['Business strategy', 'Trend analysis', 'Risk identification', 'Recommendations'].map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    const el = document.querySelector<HTMLInputElement>('.chat-input')
                    if (el) { el.value = q; el.dispatchEvent(new Event('input', { bubbles: true })) }
                  }}
                  className="px-3 py-1 text-[11px] bg-surface-elevated border border-border rounded-lg text-text-secondary hover:text-text-primary hover:border-primary/50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'flex gap-3 animate-fade-in',
              msg.role === 'user' ? 'justify-end' : ''
            )}
          >
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-xl px-4 py-3 text-sm',
                msg.role === 'user'
                  ? 'bg-primary/15 text-text-primary rounded-tr-none'
                  : 'bg-surface-elevated text-text-primary rounded-tl-none border border-border'
              )}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-tertiary/15 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-tertiary" />
              </div>
            )}
          </div>
        ))}

        {isChatLoading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-surface-elevated border border-border rounded-xl px-4 py-3">
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={setInput}
            placeholder="Ask about your data..."
            className="chat-input flex-1 bg-surface-elevated border border-border rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
          />
          <button
            type="submit"
            disabled={isChatLoading || !inputValue.trim()}
            className="px-4 py-2.5 bg-primary hover:bg-primary/80 disabled:opacity-40 text-background rounded-xl text-sm font-medium transition-all active:scale-95"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}
