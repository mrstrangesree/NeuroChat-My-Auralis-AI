import { useState, useEffect, useCallback } from 'react'
import { conversationsAPI } from '../services/api'
import toast from 'react-hot-toast'

export function useConversations() {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await conversationsAPI.list()
      setConversations(data)
    } catch (err) {
      toast.error('Failed to load conversations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const createConversation = useCallback(async (payload) => {
    const { data } = await conversationsAPI.create(payload)
    setConversations((prev) => [data, ...prev])
    return data
  }, [])

  const updateConversation = useCallback(async (id, updates) => {
    const { data } = await conversationsAPI.update(id, updates)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, ...data } : c)))
    return data
  }, [])

  const deleteConversation = useCallback(async (id) => {
    await conversationsAPI.delete(id)
    setConversations((prev) => prev.filter((c) => c.id !== id))
  }, [])

  const deleteAllConversations = useCallback(async () => {
    await conversationsAPI.deleteAll()
    setConversations([])
  }, [])

  const starConversation = useCallback(async (id, isStarred) => {
    return updateConversation(id, { is_starred: isStarred })
  }, [updateConversation])

  return {
    conversations,
    loading,
    fetchConversations,
    createConversation,
    updateConversation,
    deleteConversation,
    deleteAllConversations,
    starConversation,
  }
}
