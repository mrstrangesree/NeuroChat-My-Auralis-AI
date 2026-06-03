import { useState, useCallback, useRef } from 'react'
import { createChatStream } from '../services/api'

export function useChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const abortRef = useRef(null)

  const sendMessage = useCallback(
    async ({
      conversationId,
      message,
      model,
      temperature = 0.7,
      maxTokens,
      useRag = false,
      webSearch = false,
      onTitleUpdate,
      onDone,
      onError,
    }) => {
      if (isStreaming) return

      setIsStreaming(true)
      setStreamingContent('')

      abortRef.current = createChatStream(
        {
          conversation_id: conversationId,
          message,
          model,
          temperature,
          max_tokens: maxTokens || null,
          use_rag: useRag,
          web_search: webSearch,
          stream: true,
        },
        (token) => {
          setStreamingContent((prev) => prev + token)
        },
        null,
        (event) => {
          if (event.isTitleUpdate) {
            onTitleUpdate?.(event.title)
            return
          }
          setIsStreaming(false)
          setStreamingContent('')
          onDone?.(event)
        },
        (err) => {
          setIsStreaming(false)
          setStreamingContent('')
          onError?.(err)
        }
      )
    },
    [isStreaming]
  )

  const stopStreaming = useCallback(() => {
    abortRef.current?.()
    setIsStreaming(false)
    setStreamingContent('')
  }, [])

  return { isStreaming, streamingContent, sendMessage, stopStreaming }
}
