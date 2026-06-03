import { useState, useRef, useEffect } from 'react'
import { Send, Square, Paperclip, Mic, Smile } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'
import clsx from 'clsx'

export default function ChatInput({ onSend, isStreaming, onStop, disabled }) {
  const [text, setText] = useState('')
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!isStreaming) textareaRef.current?.focus()
  }, [isStreaming])

  const handleSend = () => {
    const trimmed = text.trim()
    if (!trimmed || isStreaming || disabled) return
    onSend(trimmed)
    setText('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="px-4 pb-4 pt-2">
      <div
        className={clsx(
          'glass rounded-2xl transition-all duration-200',
          !disabled && 'focus-within:border-primary-500/40 focus-within:shadow-lg focus-within:shadow-primary-900/30'
        )}
      >
        <div className="flex items-end gap-2 p-3">
          <TextareaAutosize
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              disabled
                ? 'Select or create a conversation...'
                : isStreaming
                ? 'AI is responding...'
                : 'Message NeuroChat... (Enter to send, Shift+Enter for newline)'
            }
            disabled={disabled || isStreaming}
            minRows={1}
            maxRows={10}
            className="flex-1 bg-transparent resize-none outline-none text-white/90
                       placeholder-white/25 text-sm leading-relaxed py-1 px-1 w-full"
          />

          <div className="flex items-center gap-1 flex-shrink-0">
            {isStreaming ? (
              <button
                onClick={onStop}
                className="w-9 h-9 bg-red-500/20 border border-red-500/30 text-red-400
                           hover:bg-red-500/30 rounded-xl flex items-center justify-center
                           transition-all"
                title="Stop generation"
              >
                <Square size={14} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!text.trim() || disabled}
                className={clsx(
                  'w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200',
                  text.trim() && !disabled
                    ? 'bg-gradient-to-br from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-900/40 hover:-translate-y-0.5 hover:shadow-primary-700/50'
                    : 'bg-white/5 text-white/25 cursor-not-allowed'
                )}
                title="Send (Enter)"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-4 pb-2.5">
          <p className="text-xs text-white/20">
            {isStreaming ? (
              <span className="text-accent-400/70 animate-pulse">● Generating response...</span>
            ) : (
              'Shift+Enter for newline'
            )}
          </p>
          <p className="text-xs text-white/20">{text.length > 0 && `${text.length} chars`}</p>
        </div>
      </div>
    </div>
  )
}
