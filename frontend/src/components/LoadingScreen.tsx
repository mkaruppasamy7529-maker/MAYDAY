import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import LogoIcon from './LogoIcon'

const messages = [
  'Initializing AVIOS...',
  'Loading Neural Core...',
  'Building Memory Graph...',
  'Loading Intelligence Modules...',
  'Connecting Knowledge Engine...',
  'Optimizing Responses...',
  'Preparing Dashboard...',
  'Almost Ready...',
  'Welcome.',
]

export default function LoadingScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0)
  const [msgIndex, setMsgIndex] = useState(0)
  const [phase, setPhase] = useState<'loading' | 'fadeout'>('loading')

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setPhase('fadeout')
          setTimeout(onFinish, 700)
          return 100
        }
        const step = Math.random() * 8 + 3
        return Math.min(prev + step, 100)
      })
    }, 400)
    return () => clearInterval(interval)
  }, [onFinish])

  useEffect(() => {
    if (progress < 100) {
      const idx = Math.min(Math.floor((progress / 100) * messages.length), messages.length - 1)
      setMsgIndex(idx)
    }
  }, [progress])

  const circumference = 2 * Math.PI * 54
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <AnimatePresence>
      {phase === 'loading' && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* Ambient background glow */}
          <motion.div
            className="absolute inset-0 opacity-30"
            animate={{
              background: [
                'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)',
                'radial-gradient(ellipse at 50% 50%, rgba(168,85,247,0.15) 0%, transparent 70%)',
                'radial-gradient(ellipse at 50% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)',
              ],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Progress ring */}
          <div className="relative mb-12">
            <svg width="130" height="130" className="transform -rotate-90">
              <circle
                cx="65" cy="65" r="54"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="2"
              />
              <motion.circle
                cx="65" cy="65" r="54"
                fill="none"
                stroke="url(#ringGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{ transition: 'stroke-dashoffset 0.3s ease' }}
              />
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
            </svg>

            {/* Logo animation inside ring */}
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              animate={{ scale: [1, 0.92, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <LogoIcon size={52} animated />
            </motion.div>
          </div>

          {/* Status message */}
          <motion.p
            key={msgIndex}
            className="text-sm text-indigo-400/60 tracking-widest uppercase mb-6 h-4 font-light"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {messages[msgIndex]}
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="w-48 h-0.5 bg-white/5 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                transition: 'width 0.3s ease',
              }}
            />
          </motion.div>

          {/* Percentage */}
          <motion.p
            className="text-xs text-gray-600 mt-2 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(progress)}%
          </motion.p>

          {/* Bottom branding */}
          <motion.p
            className="absolute bottom-8 text-[10px] text-white/10 tracking-[0.3em] uppercase font-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Your intelligent thinking partner
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
