import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

// ── Conversations ────────────────────────────────────────────────────────────
export const conversationsAPI = {
  list: (params) => api.get('/conversations', { params }),
  create: (data) => api.post('/conversations', data),
  get: (id) => api.get(`/conversations/${id}`),
  update: (id, data) => api.put(`/conversations/${id}`, data),
  delete: (id) => api.delete(`/conversations/${id}`),
  deleteAll: () => api.delete('/conversations'),
  export: (id) => api.post(`/conversations/${id}/export`),
}

// ── Models ───────────────────────────────────────────────────────────────────
export const modelsAPI = {
  list: () => api.get('/models'),
  pull: (modelName) => `/api/models/pull`,  // SSE endpoint
  delete: (name) => api.delete(`/models/${encodeURIComponent(name)}`),
}

// ── Documents ────────────────────────────────────────────────────────────────
export const documentsAPI = {
  upload: (formData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (conversationId) =>
    api.get('/documents', { params: { conversation_id: conversationId } }),
  delete: (id) => api.delete(`/documents/${id}`),
}

// ── Health ───────────────────────────────────────────────────────────────────
export const healthAPI = {
  check: () => api.get('/health'),
  info: () => api.get('/info'),
}

// ── Chat (SSE Streaming) ─────────────────────────────────────────────────────
export function createChatStream(request, onToken, onStart, onDone, onError) {
  const controller = new AbortController()

  fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ detail: 'Stream failed' }))
        onError(err.detail || 'Stream failed')
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (!data) continue
          try {
            const event = JSON.parse(data)
            switch (event.type) {
              case 'start':
                onStart?.(event)
                break
              case 'token':
                onToken?.(event.content)
                break
              case 'title_update':
                onDone?.({ ...event, isTitleUpdate: true })
                break
              case 'done':
                onDone?.(event)
                break
              case 'error':
                onError?.(event.message)
                break
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') {
        onError?.(err.message || 'Connection error')
      }
    })

  return () => controller.abort()
}

export default api
