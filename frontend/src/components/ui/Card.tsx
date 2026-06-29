import { ReactNode } from 'react'

interface Props {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: Props) {
  return (
    <div className={`glass rounded-2xl border border-white/5 ${hover ? 'hover:bg-white/[0.07] transition-all' : ''} ${className}`}>
      {children}
    </div>
  )
}
