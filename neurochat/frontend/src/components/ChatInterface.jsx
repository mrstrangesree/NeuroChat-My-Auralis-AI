import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bot, Sparkles, Download, Trash2, Star, Settings2,
  FileText, RefreshCw, AlertCircle, Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { conversationsAPI, documentsAPI } from '../services/api'
import { useChat } from '../hooks/useChat'
import MessageBubble from './MessageBubble'
import ChatInput from './ChatInput'
import ModelSelector from './ModelSelector'
import DocumentUpload from './DocumentUpload'
import SettingsPanel from './SettingsPanel'
import clsx from 'clsx'

const WELCOME_SUGGESTIONS = [
  '🚀 Explain quantum computing in simple terms',
  '💻 Write a REST API with FastAPI and PostgreSQL',
  '✍️ Help me write a professional email',
  '🧮 Solve: What is the time complexity of merge sort?',
  '🌍 What are the latest trends in AI?',
  '📊 Create a Python data analysis script',
]

function WelcomeScreen({ onSuggestion }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary-600 to-accent-500
                   flex items-center justify-center mb-6 shadow-2xl shadow-primary-900/50 glow-primary"
      >
        <Bot size={38} className="text-white" />
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <h1 className="text-3xl font-bold gradient-text mb-2">NeuroChat AI</h1>
        <p className="text-white/50 mb-8 max-w-md">
          Your local AI assistant — private, fast, and fully offline. No API keys needed.
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl"
      >
        {WELCOME_SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s.substring(2))}
            className="glass p-3 text-left text-sm text-white/70 hover:text-white
                       hover:border-primary-500/30 hover:bg-white/[0.07]
                       transition-all duration-150 rounded-xl"
          >
            {s}
          </button>
        ))}
      </motion.div>
    </div>
  )
}

export default function ChatInterface({ conversationId, onConversationUpdate }) {
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [model, setModel] = useState('llama3.2')
  const [documents, setDocuments] = useState([])
  const [showDocuments, setShowDocuments] = useState(false)
  const [chatSettings, setChatSettings] = useState({
    temperature: 0.7,
    maxTokens: null,
    useRag: false,
    webSearch: false,
    systemPrompt: '',
  })

  const bottomRef = useRef(null)
  const { isStreaming, streamingContent, sendMessage, stopStreaming } = useChat()

  // Load conversation
  useEffect(() => {
    if (!conversationId) {
      setConversation(null)
      setMessages([])
      return
    }
    setLoading(true)
    conversationsAPI.get(conversationId)
      .then(({ data }) => {
        setConversation(data)
        setMessages(data.messages || [])
        setModel(data.model || 'llama3.2')
        if (data.system_prompt) {
          setChatSettings((s) => ({ ...s, systemPrompt: data.system_prompt }))
        }
      })
      .catch(() => toast.error('Failed to load conversation'))
      .finally(() => setLoading(false))
  }, [conversationId])

  // Load documents
  useEffect(() => {
    if (!conversationId) return
    documentsAPI.list(conversationId)
      .then(({ data }) => setDocuments(data))
      .catch(() => {})
  }, [conversationId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, streamingContent])

  const handleSend = useCallback(async (text) => {
    if (!conversationId) return

    // Optimistically add user message
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'user', content: text, created_at: new Date().toISOString() },
    ])

    await sendMessage({
      conversationId,
      message: text,
      model,
      temperature: chatSettings.temperature,
      maxTokens: chatSettings.maxTokens,
      useRag: chatSettings.useRag,
      webSearch: chatSettings.webSearch,
      onTitleUpdate: (title) => {
        onConversationUpdate?.(conversationId, { title })
        setConversation((c) => c ? { ...c, title } : c)
      },
      onDone: async () => {
        // Reload messages
        const { data } = await conversationsAPI.get(conversationId)
        setMessages(data.messages || [])
      },
      onError: (err) => {
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        toast.error(err || 'Failed to send message')
      },
    })
  }, [conversationId, model, chatSettings, sendMessage, onConversationUpdate])

  const handleExport = async () => {
    try {
      const { data } = await conversationsAPI.export(conversationId)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${conversation.title.replace(/\s+/g, '_')}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Conversation exported')
    } catch {
      toast.error('Export failed')
    }
  }

  const handleModelChange = async (newModel) => {
    setModel(newModel)
    if (conversationId) {
      await conversationsAPI.update(conversationId, { model: newModel }).catch(() => {})
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          <p className="text-white/40 text-sm">Loading conversation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {conversation && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600/30 to-accent-600/30 border border-white/10 flex items-center justify-center flex-shrink-0">
              <Sparkles size={14} className="text-primary-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">{conversation.title}</h2>
              <p className="text-xs text-white/35">{messages.length} messages</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ModelSelector value={model} onChange={handleModelChange} />
            <button
              onClick={() => setShowDocuments((o) => !o)}
              className={clsx('btn-icon', showDocuments && 'text-primary-400 bg-primary-500/10')}
              title="Documents (RAG)"
            >
              <FileText size={16} />
            </button>
            <button onClick={handleExport} className="btn-icon" title="Export conversation">
              <Download size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Document Panel */}
      <AnimatePresence>
        {showDocuments && conversationId && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-white/[0.06] overflow-hidden"
          >
            <div className="p-4">
              <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
                Documents for RAG
              </h3>
              <DocumentUpload
                conversationId={conversationId}
                documents={documents}
                onDocumentsChange={setDocuments}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-1 chat-scroll">
        {!conversationId && (
          <WelcomeScreen onSuggestion={(text) => {}} />
        )}

        {conversationId && messages.length === 0 && !isStreaming && (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="text-center text-white/30">
              <Bot size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Start the conversation!</p>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <MessageBubble
            message={{ id: 'streaming', role: 'assistant', content: '' }}
            isStreaming={true}
            streamContent={streamingContent}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Settings Panel */}
      {conversationId && (
        <SettingsPanel settings={chatSettings} onChange={setChatSettings} />
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        isStreaming={isStreaming}
        onStop={stopStreaming}
        disabled={!conversationId}
      />
    </div>
  )
}
