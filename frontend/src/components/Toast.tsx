import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '../contexts/ChatContext'

export default function Toast() {
  const { toast } = useChat()

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 20, x: '-50%' }}
          className="fixed bottom-24 left-1/2 z-50 px-4 py-2.5 rounded-xl glass border border-white/10 shadow-2xl"
        >
          <div className="flex items-center gap-2 text-sm">
            {toast.type === 'success' ? (
              <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
            ) : (
              <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>
            )}
            <span className="text-gray-200">{toast.message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
