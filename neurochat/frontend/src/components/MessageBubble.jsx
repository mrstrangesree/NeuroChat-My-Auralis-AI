import { forwardRef, memo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check, User, Bot, Zap } from 'lucide-react'
import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { motion } from 'framer-motion'
import clsx from 'clsx'

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'text'
  const code = String(children).replace(/\n$/, '')

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="code-block my-3 group">
      <div className="flex items-center justify-between bg-white/[0.05] border-b border-white/10 px-4 py-2">
        <span className="text-xs font-mono text-white/50 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="btn-icon text-xs flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          {copied ? (
            <><Check size={13} className="text-accent-400" /><span className="text-accent-400">Copied!</span></>
          ) : (
            <><Copy size={13} /><span>Copy</span></>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        style={oneDark}
        language={language}
        PreTag="div"
        customStyle={{
          margin: 0,
          background: 'rgba(0,0,0,0.4)',
          fontSize: '0.85rem',
          padding: '1rem',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

const MarkdownContent = memo(({ content }) => (
  <div className="prose-ai">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code: ({ node, inline, className, children, ...props }) =>
          !inline ? (
            <CodeBlock className={className}>{children}</CodeBlock>
          ) : (
            <code className={clsx('bg-primary-900/50 text-primary-300 px-1.5 py-0.5 rounded-md text-sm font-mono border border-primary-700/30', className)} {...props}>
              {children}
            </code>
          ),
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
))

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      {[0, 0.2, 0.4].map((delay, i) => (
        <span
          key={i}
          className="typing-dot"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  )
}

const MessageBubble = forwardRef(({ message, isStreaming, streamContent }, ref) => {
  const isUser = message.role === 'user'
  const isAssistant = message.role === 'assistant'
  const content = isStreaming ? streamContent : message.content
  const showTyping = isStreaming && !streamContent

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx('flex gap-3 px-4 py-2', isUser && 'flex-row-reverse')}
    >
      {/* Avatar */}
      <div
        className={clsx(
          'w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5',
          isUser
            ? 'bg-gradient-to-br from-primary-600 to-primary-400'
            : 'bg-gradient-to-br from-accent-600 to-accent-400'
        )}
      >
        {isUser ? <User size={15} /> : <Bot size={15} />}
      </div>

      {/* Bubble */}
      <div className={clsx('flex flex-col gap-1', isUser && 'items-end')}>
        <div className={isUser ? 'msg-user' : 'msg-assistant'}>
          {showTyping ? (
            <TypingIndicator />
          ) : (
            isUser ? (
              <p className="text-white/90 whitespace-pre-wrap leading-relaxed">{content}</p>
            ) : (
              <MarkdownContent content={content || ''} />
            )
          )}
          {isStreaming && content && (
            <span className="inline-block w-0.5 h-4 bg-primary-400 ml-0.5 animate-pulse align-text-bottom" />
          )}
        </div>

        {/* Metadata */}
        {!isStreaming && message.created_at && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-xs text-white/30">
              {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
            </span>
            {message.generation_time && (
              <span className="flex items-center gap-0.5 text-xs text-white/20">
                <Zap size={10} /> {message.generation_time}s
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
})

export default MessageBubble
