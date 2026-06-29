import { motion } from 'framer-motion'

interface Props { onClose: () => void }

export default function About({ onClose }: Props) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="glass rounded-2xl border border-white/5 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="text-lg font-semibold">
            <span className="text-gradient">AVI</span>
            <span className="text-white/60">OS</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-300 leading-relaxed">
            AVIOS is Your Intelligent Thinking Partner — an AI assistant designed to help with information, reasoning, coding, learning, and everyday tasks.
          </p>
          <p className="text-sm text-gray-500 leading-relaxed">
            AVIOS was created by a group of developers guided by Mr. Karuppasamy.
          </p>

          <div>
            <h3 className="text-sm font-medium text-gray-200 mb-2">Capabilities</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Conversation', icon: '💬' }, { label: 'Programming', icon: '💻' },
                { label: 'Research', icon: '🔍' }, { label: 'Learning', icon: '📚' },
                { label: 'Problem Solving', icon: '🧩' }, { label: 'Productivity', icon: '⚡' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 p-2 rounded-lg bg-white/5 text-sm text-gray-400">
                  <span>{item.icon}</span> {item.label}
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-600">Version 1.0.0 &middot; Your Intelligent Thinking Partner</p>
        </div>
      </motion.div>
    </motion.div>
  )
}
