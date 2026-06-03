import { useState } from 'react'
import {
  Plus, MessageSquare, Star, StarOff, Trash2, Search,
  ChevronLeft, ChevronRight, Bot, Loader2, MoreHorizontal,
  Download, Edit3, Check, X, Cpu, Wifi, WifiOff
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'
import toast from 'react-hot-toast'

function ConversationItem({ conv, isActive, onSelect, onDelete, onStar, onRename }) {
  const [showMenu, setShowMenu] = useState(false)
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(conv.title)

  const handleRename = () => {
    if (title.trim() && title !== conv.title) {
      onRename(conv.id, title.trim())
    }
    setEditing(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={clsx(
        'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150 mx-1',
        isActive
          ? 'bg-primary-600/20 border border-primary-500/30 text-white'
          : 'text-white/60 hover:text-white hover:bg-white/[0.07]'
      )}
      onClick={() => !editing && onSelect(conv.id)}
    >
      <MessageSquare size={14} className={clsx('flex-shrink-0', isActive ? 'text-primary-400' : 'text-white/30')} />

      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') { setTitle(conv.title); setEditing(false) }
              }}
              className="flex-1 bg-transparent outline-none text-sm text-white border-b border-primary-500/50 pb-0.5"
            />
            <button onClick={handleRename} className="p-0.5 text-accent-400 hover:text-accent-300">
              <Check size={11} />
            </button>
            <button onClick={() => { setTitle(conv.title); setEditing(false) }} className="p-0.5 text-white/40 hover:text-white/70">
              <X size={11} />
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium truncate">{conv.title}</p>
            <p className="text-xs text-white/30 mt-0.5">
              {conv.message_count} msg · {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
            </p>
          </>
        )}
      </div>

      {!editing && (
        <div
          className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onStar(conv.id, !conv.is_starred)}
            className={clsx('p-1 rounded-lg hover:bg-white/10 transition-colors', conv.is_starred ? 'text-yellow-400' : 'text-white/30 hover:text-yellow-400')}
          >
            {conv.is_starred ? <Star size={11} fill="currentColor" /> : <Star size={11} />}
          </button>
          <button
            onClick={() => setShowMenu((o) => !o)}
            className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-colors"
          >
            <MoreHorizontal size={11} />
          </button>
        </div>
      )}

      {showMenu && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-1 top-8 z-20 glass-dark border border-white/10 rounded-xl py-1 shadow-2xl min-w-[130px]">
            {[
              { icon: Edit3, label: 'Rename', action: () => { setEditing(true); setShowMenu(false) } },
              { icon: Trash2, label: 'Delete', action: () => { onDelete(conv.id); setShowMenu(false) }, danger: true },
            ].map(({ icon: Icon, label, action, danger }) => (
              <button
                key={label}
                onClick={action}
                className={clsx(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors hover:bg-white/5',
                  danger ? 'text-red-400 hover:text-red-300' : 'text-white/70 hover:text-white'
                )}
              >
                <Icon size={12} />
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </motion.div>
  )
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onCreate,
  onDelete,
  onStar,
  onRename,
  onDeleteAll,
  ollamaStatus,
  loading,
  collapsed,
  onToggleCollapse,
}) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | starred

  const filtered = conversations.filter((c) => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || (filter === 'starred' && c.is_starred)
    return matchSearch && matchFilter
  })

  return (
    <motion.div
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ duration: 0.25, type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col h-full bg-surface-900/60 border-r border-white/[0.06] flex-shrink-0 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/[0.06] flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-600 to-accent-500 flex items-center justify-center shadow-lg">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold gradient-text">NeuroChat</h1>
              <div className="flex items-center gap-1">
                {ollamaStatus === 'connected' ? (
                  <><Wifi size={9} className="text-accent-400" /><span className="text-xs text-accent-400">Online</span></>
                ) : (
                  <><WifiOff size={9} className="text-red-400" /><span className="text-xs text-red-400">Offline</span></>
                )}
              </div>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="btn-icon ml-auto"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* New Chat button */}
          <div className="px-3 py-2.5">
            <button
              onClick={onCreate}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm py-2"
            >
              <Plus size={16} />
              New Chat
            </button>
          </div>

          {/* Search */}
          <div className="px-3 pb-2">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations..."
                className="input-base text-sm w-full pl-8 py-2 text-sm"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1 px-3 pb-2">
            {[['all', 'All'], ['starred', '★ Starred']].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={clsx(
                  'text-xs px-3 py-1 rounded-lg transition-all',
                  filter === key
                    ? 'bg-primary-600/30 text-primary-300 border border-primary-500/30'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto py-1 space-y-0.5">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 size={18} className="text-white/30 animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-8 text-white/25 text-sm px-4">
                {search ? `No results for "${search}"` : 'No conversations yet'}
              </div>
            ) : (
              filtered.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeId}
                  onSelect={onSelect}
                  onDelete={onDelete}
                  onStar={onStar}
                  onRename={onRename}
                />
              ))
            )}
          </div>

          {/* Footer */}
          {conversations.length > 0 && (
            <div className="p-3 border-t border-white/[0.06]">
              <button
                onClick={onDeleteAll}
                className="w-full flex items-center justify-center gap-2 text-xs text-white/30
                           hover:text-red-400 py-2 px-3 rounded-xl hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={11} />
                Clear all conversations
              </button>
            </div>
          )}
        </>
      )}

      {collapsed && (
        <div className="flex flex-col items-center gap-2 pt-2">
          <button
            onClick={onCreate}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
            title="New Chat"
          >
            <Plus size={18} />
          </button>
          {conversations.slice(0, 6).map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={clsx(
                'w-10 h-10 rounded-xl flex items-center justify-center transition-all',
                conv.id === activeId ? 'bg-primary-600/30 border border-primary-500/30' : 'hover:bg-white/10'
              )}
              title={conv.title}
            >
              <MessageSquare size={14} className={conv.id === activeId ? 'text-primary-400' : 'text-white/40'} />
            </button>
          ))}
        </div>
      )}
    </motion.div>
  )
}
