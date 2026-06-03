import { useState, useRef } from 'react'
import { Upload, File, Trash2, Check, AlertCircle, FileText, Loader2 } from 'lucide-react'
import { documentsAPI } from '../services/api'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import clsx from 'clsx'

const ICONS = {
  pdf: '📄', txt: '📝', md: '📋', docx: '📃', csv: '📊',
}

function FileItem({ doc, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete(doc.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="flex items-center gap-3 p-2.5 glass rounded-xl"
    >
      <span className="text-xl flex-shrink-0">{ICONS[doc.file_type] || '📁'}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white/80 truncate font-medium">{doc.original_filename}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-white/30">
            {(doc.file_size / 1024).toFixed(1)}KB
          </span>
          {doc.is_indexed ? (
            <span className="flex items-center gap-0.5 text-xs text-accent-400">
              <Check size={10} /> {doc.chunk_count} chunks
            </span>
          ) : (
            <span className="text-xs text-yellow-400">Indexing...</span>
          )}
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleting}
        className="btn-icon p-1.5 hover:text-red-400"
      >
        {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
      </button>
    </motion.div>
  )
}

export default function DocumentUpload({ conversationId, documents, onDocumentsChange }) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef(null)

  const handleUpload = async (files) => {
    const file = files[0]
    if (!file) return

    const allowedExts = ['.pdf', '.txt', '.md', '.docx', '.csv']
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!allowedExts.includes(ext)) {
      toast.error(`Unsupported file type. Allowed: ${allowedExts.join(', ')}`)
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    if (conversationId) formData.append('conversation_id', conversationId)

    try {
      const { data } = await documentsAPI.upload(formData)
      onDocumentsChange?.([data, ...documents])
      toast.success(`"${file.name}" uploaded and indexed!`)
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (docId) => {
    try {
      await documentsAPI.delete(docId)
      onDocumentsChange?.(documents.filter((d) => d.id !== docId))
      toast.success('Document removed')
    } catch (err) {
      toast.error('Failed to delete document')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleUpload(Array.from(e.dataTransfer.files))
  }

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200',
          isDragging
            ? 'border-primary-500 bg-primary-500/10'
            : 'border-white/15 hover:border-white/30 hover:bg-white/[0.03]',
          uploading && 'pointer-events-none opacity-60'
        )}
      >
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          accept=".pdf,.txt,.md,.docx,.csv"
          onChange={(e) => handleUpload(Array.from(e.target.files))}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 size={24} className="text-primary-400 animate-spin" />
            <p className="text-sm text-white/60">Uploading & indexing...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload size={22} className="text-white/40" />
            <p className="text-sm text-white/60">
              Drop a file or <span className="text-primary-400">browse</span>
            </p>
            <p className="text-xs text-white/30">PDF, TXT, MD, DOCX, CSV (max 50MB)</p>
          </div>
        )}
      </div>

      {/* Document List */}
      <AnimatePresence>
        {documents?.length > 0 && (
          <div className="space-y-2">
            {documents.map((doc) => (
              <FileItem key={doc.id} doc={doc} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
