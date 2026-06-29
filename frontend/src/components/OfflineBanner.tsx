import { motion, AnimatePresence } from 'framer-motion'
import { useOffline } from '../hooks/useOffline'

export default function OfflineBanner() {
  const isOffline = useOffline()

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 bg-red-500/10 border-b border-red-500/20 backdrop-blur-xl"
        >
          <div className="flex items-center justify-center gap-2 py-2 px-4 text-sm text-red-400">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22.61 16.95A5 5 0 0 0 18 10h-1.26a8 8 0 0 0-7.05-6M5 5a8 8 0 0 0 4 15h9a5 5 0 0 0 1.7-.3M1 1l22 22"/>
            </svg>
            <span>You are currently offline. Some features may be unavailable.</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
