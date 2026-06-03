import { useState } from 'react'
import {
  Settings, X, Thermometer, Hash, Globe, Database,
  Brain, ChevronDown, ChevronUp
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'

const SYSTEM_PRESETS = [
  { label: 'Default Assistant', value: '' },
  { label: '💻 Code Expert', value: 'You are an expert software engineer. Provide clean, well-documented code with explanations. Use best practices and modern approaches.' },
  { label: '✍️ Creative Writer', value: 'You are a creative writer with a flair for storytelling. Be imaginative, descriptive, and engaging.' },
  { label: '🎓 Teacher', value: 'You are a patient and knowledgeable teacher. Explain concepts clearly with examples, breaking down complex topics step by step.' },
  { label: '🔬 Researcher', value: 'You are a thorough researcher. Provide detailed, well-structured analysis with multiple perspectives and considerations.' },
  { label: '💼 Business Analyst', value: 'You are a professional business analyst. Provide strategic insights, data-driven recommendations, and clear business language.' },
  { label: '🛡️ Cybersecurity Expert', value: 'You are a cybersecurity expert. Provide security-focused advice, identify vulnerabilities, and suggest mitigations.' },
]

function Slider({ label, icon: Icon, value, onChange, min, max, step, format }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-white/70">
          {Icon && <Icon size={13} />}
          {label}
        </div>
        <span className="text-sm font-mono text-primary-400 bg-primary-900/30 px-2 py-0.5 rounded-lg">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-primary-500 [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(99,102,241,0.6)]"
      />
    </div>
  )
}

export default function SettingsPanel({ settings, onChange }) {
  const [open, setOpen] = useState(false)
  const [showPresets, setShowPresets] = useState(false)

  return (
    <div className="border-t border-white/[0.06]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-2.5
                   text-white/50 hover:text-white/80 transition-colors text-sm"
      >
        <div className="flex items-center gap-2">
          <Settings size={14} />
          <span>Generation Settings</span>
        </div>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4">
              <Slider
                label="Temperature"
                icon={Thermometer}
                value={settings.temperature}
                onChange={(v) => onChange({ ...settings, temperature: v })}
                min={0}
                max={2}
                step={0.05}
                format={(v) => v.toFixed(2)}
              />

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/70">
                  <Hash size={13} />
                  Max Tokens
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={settings.maxTokens || ''}
                    onChange={(e) => onChange({ ...settings, maxTokens: e.target.value ? Number(e.target.value) : null })}
                    placeholder="Unlimited"
                    className="input-base text-sm w-full py-1.5"
                    min={1}
                    max={8192}
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                {[
                  { key: 'useRag', label: 'Use Documents (RAG)', icon: Database },
                  { key: 'webSearch', label: 'Web Search', icon: Globe },
                ].map(({ key, label, icon: Icon }) => (
                  <label key={key} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2 text-sm text-white/70 group-hover:text-white/90">
                      <Icon size={13} />
                      {label}
                    </div>
                    <div
                      onClick={() => onChange({ ...settings, [key]: !settings[key] })}
                      className={clsx(
                        'w-9 h-5 rounded-full transition-colors relative cursor-pointer',
                        settings[key] ? 'bg-primary-500' : 'bg-white/20'
                      )}
                    >
                      <span className={clsx(
                        'absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform',
                        settings[key] ? 'translate-x-4' : 'translate-x-0.5'
                      )} />
                    </div>
                  </label>
                ))}
              </div>

              {/* System Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Brain size={13} />
                    System Prompt
                  </div>
                  <button
                    onClick={() => setShowPresets((o) => !o)}
                    className="text-xs text-primary-400 hover:text-primary-300"
                  >
                    Presets
                  </button>
                </div>

                <AnimatePresence>
                  {showPresets && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden space-y-1"
                    >
                      {SYSTEM_PRESETS.map((p) => (
                        <button
                          key={p.label}
                          onClick={() => {
                            onChange({ ...settings, systemPrompt: p.value })
                            setShowPresets(false)
                          }}
                          className="w-full text-left px-3 py-1.5 glass rounded-lg text-xs text-white/70 hover:text-white hover:border-primary-500/30 transition-all"
                        >
                          {p.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                <textarea
                  value={settings.systemPrompt || ''}
                  onChange={(e) => onChange({ ...settings, systemPrompt: e.target.value })}
                  placeholder="Custom system prompt..."
                  rows={3}
                  className="input-base text-sm w-full resize-none text-white/80 leading-relaxed"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
