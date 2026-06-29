import { motion } from 'framer-motion'

const gradientId = 'logo-grad'
const glowId = 'logo-glow'

export default function LogoIcon({ size = 24, animated = false, className = '' }: { size?: number; animated?: boolean; className?: string }) {
  const s = size

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-label="AVIOS logo"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="32" y2="32">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer subtle ring */}
      <circle cx="16" cy="16" r="14.5" stroke={`url(#${gradientId})`} strokeWidth="1" opacity="0.2" />

      {/* Orbiting dot top-right */}
      {animated ? (
        <motion.circle
          cx="26" cy="6" r="2"
          fill={`url(#${gradientId})`}
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <circle cx="26" cy="6" r="2" fill={`url(#${gradientId})`} opacity="0.6" />
      )}

      {/* Orbiting dot bottom-left */}
      {animated ? (
        <motion.circle
          cx="6" cy="26" r="2"
          fill={`url(#${gradientId})`}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ) : (
        <circle cx="6" cy="26" r="2" fill={`url(#${gradientId})`} opacity="0.6" />
      )}

      {/* Core diamond/sparkle */}
      <path
        d="M16 4L19.5 12.5L28 16L19.5 19.5L16 28L12.5 19.5L4 16L12.5 12.5Z"
        fill={`url(#${gradientId})`}
        filter={animated ? `url(#${glowId})` : undefined}
        opacity="0.9"
      />

      {/* Inner diamond (hollow detail) */}
      <path
        d="M16 9L18.5 13.5L23 16L18.5 18.5L16 23L13.5 18.5L9 16L13.5 13.5Z"
        fill="#050508"
        opacity="0.5"
      />

      {/* Center dot */}
      <circle cx="16" cy="16" r="2.5" fill={`url(#${gradientId})`} />
    </svg>
  )
}
