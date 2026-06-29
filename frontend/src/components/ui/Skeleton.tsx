interface Props {
  className?: string
  lines?: number
}

export default function Skeleton({ className = '', lines = 1 }: Props) {
  if (lines > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`h-4 bg-white/5 rounded animate-pulse ${i === lines - 1 ? 'w-3/4' : 'w-full'} ${className}`} />
        ))}
      </div>
    )
  }
  return <div className={`bg-white/5 rounded animate-pulse ${className}`} />
}
