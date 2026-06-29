import { useEffect, useRef } from 'react'

type Shortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  shift?: boolean
  handler: () => void
}

export function useKeyboard(shortcuts: Shortcut[]) {
  const ref = useRef(shortcuts)
  ref.current = shortcuts

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const s of ref.current) {
        const ctrl = s.ctrl || false
        const meta = s.meta || false
        const shift = s.shift || false
        const mod = ctrl || meta

        if (
          e.key.toLowerCase() === s.key.toLowerCase() &&
          e.ctrlKey === ctrl &&
          e.metaKey === meta &&
          e.shiftKey === shift &&
          (mod ? !e.altKey : true)
        ) {
          e.preventDefault()
          s.handler()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
