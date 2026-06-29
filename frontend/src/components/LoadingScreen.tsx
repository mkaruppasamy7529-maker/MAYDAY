import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const messages = [
  'Initializing MAYDAY...',
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
  const [particles] = useState(() =>
    Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      delay: Math.random() * 3,
      duration: 3 + Math.random() * 4,
      driftX: (Math.random() - 0.5) * 40,
      driftY: -20 - Math.random() * 40,
    }))
  )
  const [streaks] = useState(() =>
    Array.from({ length: 5 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3,
    }))
  )

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

  return (
    <AnimatePresence>
      {phase === 'loading' && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050508]"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeInOut' }}
        >
          {/* Particle field */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map(p => (
              <motion.div
                key={p.id}
                className="absolute rounded-full bg-cyan-400/20"
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size }}
                animate={{
                  opacity: [0, 0.6, 0],
                  x: [0, p.driftX],
                  y: [0, p.driftY],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>

          {/* Light streaks */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {streaks.map(s => (
              <motion.div
                key={s.id}
                className="absolute h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent"
                style={{ left: `${s.x}%`, width: '200px' }}
                initial={{ top: '-10%', opacity: 0 }}
                animate={{ top: '110%', opacity: [0, 1, 0] }}
                transition={{
                  duration: s.duration,
                  repeat: Infinity,
                  delay: s.delay,
                  ease: 'linear',
                }}
              />
            ))}
          </div>

          {/* AI Core */}
          <div className="relative mb-10">
            <motion.div
              className="w-36 h-36 rounded-full border-2 border-cyan-500/20 absolute -inset-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="w-36 h-36 rounded-full border-2 border-transparent border-t-cyan-400/60 absolute -inset-4"
              animate={{ rotate: 360 }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="w-36 h-36 rounded-full border-2 border-transparent border-r-cyan-400/30 absolute -inset-4"
              animate={{ rotate: -360 }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.1)',
                  '0 0 50px rgba(6,182,212,0.6), 0 0 100px rgba(6,182,212,0.2)',
                  '0 0 30px rgba(6,182,212,0.3), 0 0 60px rgba(6,182,212,0.1)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.span
                className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                M
              </motion.span>
            </motion.div>
          </div>

          {/* Title */}
          <motion.h1
            className="text-5xl font-bold tracking-tight mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">MAY</span>
            <span className="text-white/80">DAY</span>
          </motion.h1>

          {/* Dynamic loading text */}
          <motion.p
            key={msgIndex}
            className="text-sm text-cyan-400/70 tracking-widest uppercase mb-8 h-4"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {messages[msgIndex]}
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="w-56 h-1 bg-white/5 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>

          {/* Progress percentage */}
          <motion.p
            className="text-xs text-gray-600 mt-2 font-mono"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {Math.round(progress)}%
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
