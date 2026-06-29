import { motion } from 'framer-motion'
import { Modal } from './ui'

interface Props {
  open: boolean
  onClose: () => void
}

const shortcuts = [
  { keys: ['Ctrl', 'K'], action: 'Toggle sidebar' },
  { keys: ['Ctrl', 'N'], action: 'New conversation' },
  { keys: ['Shift', 'Enter'], action: 'New line' },
  { keys: ['Enter'], action: 'Send message' },
  { keys: ['Esc'], action: 'Close dialogs / sidebar' },
]

export default function KeyboardShortcuts({ open, onClose }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Keyboard Shortcuts" maxWidth="max-w-md">
      <div className="space-y-3">
        {shortcuts.map(s => (
          <div key={s.action} className="flex items-center justify-between">
            <span className="text-sm text-gray-400">{s.action}</span>
            <div className="flex items-center gap-1">
              {s.keys.map((k, i) => (
                <span key={k}>
                  <kbd className="px-2 py-0.5 text-xs rounded-md bg-white/5 border border-white/10 text-gray-300 font-mono">
                    {k}
                  </kbd>
                  {i < s.keys.length - 1 && <span className="text-gray-600 mx-0.5 text-xs">+</span>}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  )
}
