import { useState, useEffect } from 'react'

export function useStreamingAnimation(isStreaming: boolean) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (!isStreaming) {
      setVisible(false)
      return
    }
    const interval = setInterval(() => {
      setVisible(v => !v)
    }, 530)
    return () => clearInterval(interval)
  }, [isStreaming])

  return { showCursor: isStreaming && visible }
}
