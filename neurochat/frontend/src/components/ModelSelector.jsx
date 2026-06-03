import { useState, useEffect } from 'react'
import { ChevronDown, Cpu, RefreshCw, AlertTriangle } from 'lucide-react'
import { modelsAPI } from '../services/api'
import clsx from 'clsx'

const MODEL_COLORS = {
  llama: 'text-orange-400',
  mistral: 'text-blue-400',
  phi: 'text-purple-400',
  gemma: 'text-red-400',
  qwen: 'text-cyan-400',
  deepseek: 'text-emerald-400',
  default: 'text-primary-400',
}

function getModelColor(name) {
  const lower = name.toLowerCase()
  for (const [key, color] of Object.entries(MODEL_COLORS)) {
    if (lower.includes(key)) return color
  }
  return MODEL_COLORS.default
}

function formatSize(bytes) {
  if (!bytes) return ''
  const gb = bytes / (1024 ** 3)
  return gb >= 1 ? `${gb.toFixed(1)}GB` : `${(bytes / (1024 ** 2)).toFixed(0)}MB`
}

export default function ModelSelector({ value, onChange, className }) {
  const [models, setModels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [open, setOpen] = useState(false)

  const fetchModels = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await modelsAPI.list()
      setModels(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchModels()
  }, [])

  const selectedModel = models.find((m) => m.name === value)

  return (
    <div className={clsx('relative', className)}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-1.5 glass rounded-xl text-sm
                   hover:border-primary-500/40 transition-all duration-150 min-w-[160px]"
      >
        <Cpu size={14} className="text-primary-400 flex-shrink-0" />
        <span className={clsx('flex-1 text-left truncate font-medium', getModelColor(value || 'default'))}>
          {value ? value.split(':')[0] : 'Select model'}
        </span>
        <ChevronDown
          size={14}
          className={clsx('text-white/40 transition-transform flex-shrink-0', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 z-20 glass-dark shadow-2xl rounded-xl
                          border border-white/10 py-1 min-w-[220px] max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/10">
              <span className="text-xs text-white/40 font-medium">Available Models</span>
              <button onClick={fetchModels} className="btn-icon p-1">
                <RefreshCw size={11} className={clsx(loading && 'animate-spin')} />
              </button>
            </div>

            {error && (
              <div className="px-3 py-2 flex items-center gap-2 text-xs text-red-400">
                <AlertTriangle size={12} />
                {error}
              </div>
            )}

            {loading && !error && (
              <div className="px-3 py-3 text-xs text-white/40 text-center">Loading models...</div>
            )}

            {!loading && models.length === 0 && !error && (
              <div className="px-3 py-3 text-xs text-white/40 text-center">
                No models found.<br />Run: <code className="text-primary-400">ollama pull llama3.2</code>
              </div>
            )}

            {models.map((model) => (
              <button
                key={model.name}
                onClick={() => { onChange(model.name); setOpen(false) }}
                className={clsx(
                  'w-full flex items-start gap-3 px-3 py-2 hover:bg-white/5 transition-colors',
                  value === model.name && 'bg-primary-600/20'
                )}
              >
                <div className="w-1.5 h-1.5 rounded-full bg-accent-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className={clsx('text-sm font-medium', getModelColor(model.name))}>
                    {model.name.split(':')[0]}
                  </div>
                  <div className="flex gap-2 text-xs text-white/30 mt-0.5">
                    {model.parameter_size && <span>{model.parameter_size}</span>}
                    {model.size && <span>{formatSize(model.size)}</span>}
                    {model.quantization_level && <span>{model.quantization_level}</span>}
                  </div>
                </div>
                {value === model.name && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-400 mt-1.5" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
