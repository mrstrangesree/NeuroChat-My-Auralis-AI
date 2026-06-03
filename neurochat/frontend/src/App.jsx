import { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import ChatInterface from './components/ChatInterface'
import { useConversations } from './hooks/useConversations'
import { healthAPI, conversationsAPI } from './services/api'

export default function App() {
  const [activeConversationId, setActiveConversationId] = useState(null)
  const [ollamaStatus, setOllamaStatus] = useState('checking')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [defaultModel, setDefaultModel] = useState('llama3.2')

  const {
    conversations,
    loading,
    createConversation,
    updateConversation,
    deleteConversation,
    deleteAllConversations,
    starConversation,
  } = useConversations()

  // Check Ollama status
  useEffect(() => {
    const check = async () => {
      try {
        const { data } = await healthAPI.check()
        setOllamaStatus(data.ollama === 'connected' ? 'connected' : 'disconnected')
      } catch {
        setOllamaStatus('disconnected')
      }
    }
    check()
    const interval = setInterval(check, 30000)
    return () => clearInterval(interval)
  }, [])

  // Get default model from info
  useEffect(() => {
    healthAPI.info().then(({ data }) => {
      if (data.default_model) setDefaultModel(data.default_model)
    }).catch(() => {})
  }, [])

  const handleNewChat = useCallback(async () => {
    try {
      const conv = await createConversation({
        title: 'New Conversation',
        model: defaultModel,
      })
      setActiveConversationId(conv.id)
    } catch {
      toast.error('Failed to create conversation')
    }
  }, [createConversation, defaultModel])

  const handleDeleteConversation = useCallback(async (id) => {
    try {
      await deleteConversation(id)
      if (activeConversationId === id) {
        setActiveConversationId(null)
      }
      toast.success('Conversation deleted')
    } catch {
      toast.error('Failed to delete conversation')
    }
  }, [deleteConversation, activeConversationId])

  const handleDeleteAll = useCallback(async () => {
    if (!window.confirm('Delete all conversations? This cannot be undone.')) return
    try {
      await deleteAllConversations()
      setActiveConversationId(null)
      toast.success('All conversations deleted')
    } catch {
      toast.error('Failed to delete conversations')
    }
  }, [deleteAllConversations])

  const handleRename = useCallback(async (id, title) => {
    try {
      await updateConversation(id, { title })
    } catch {
      toast.error('Failed to rename conversation')
    }
  }, [updateConversation])

  const handleConversationUpdate = useCallback((id, updates) => {
    updateConversation(id, updates).catch(() => {})
  }, [updateConversation])

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          conversations={conversations}
          activeId={activeConversationId}
          onSelect={setActiveConversationId}
          onCreate={handleNewChat}
          onDelete={handleDeleteConversation}
          onStar={starConversation}
          onRename={handleRename}
          onDeleteAll={handleDeleteAll}
          ollamaStatus={ollamaStatus}
          loading={loading}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((o) => !o)}
        />

        <main className="flex-1 overflow-hidden">
          <ChatInterface
            conversationId={activeConversationId}
            onConversationUpdate={handleConversationUpdate}
          />
        </main>
      </div>

      {/* Attribution footer */}
      <div className="attribution-footer">
        💡 Concept, Design &amp; Creation by{' '}
        <a
          href="https://github.com/mrstrangesree/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Mr.StrangeSree
        </a>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1c1c2e',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </div>
  )
}
