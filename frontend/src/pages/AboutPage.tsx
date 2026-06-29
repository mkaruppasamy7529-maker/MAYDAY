import { useAuth } from '../contexts/AuthContext'

export default function AboutPage() {
  const { setPage } = useAuth()

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
      <div className="max-w-lg w-full relative">
        <div className="backdrop-blur-xl bg-white/[0.03] rounded-2xl border border-white/[0.06] p-8 shadow-2xl text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mx-auto mb-4 ring-1 ring-cyan-500/20">
            <span className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">A</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AVIOS</h1>
          <p className="text-cyan-400 text-sm mb-6">Your Personal AI Assistant</p>

          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            AVIOS is an intelligent personal AI assistant built with a focus on usability, 
            privacy, speed, and a modern user experience. It leverages cutting-edge AI technology 
            to help you solve problems, learn, create, and explore ideas.
          </p>

          <div className="space-y-3 text-left mb-6">
            <Feature icon="zap" text="Lightning-fast streaming responses" />
            <Feature icon="lock" text="Your privacy is our priority" />
            <Feature icon="message" text="Natural, conversational interactions" />
            <Feature icon="code" text="Code syntax highlighting & markdown" />
            <Feature icon="layers" text="Conversation history & memory" />
            <Feature icon="smartphone" text="Responsive across all devices" />
          </div>

          <p className="text-gray-500 text-xs mb-6">
            Version 2.0.0 &mdash; Built with React, FastAPI, and local AI
          </p>

          <button onClick={() => setPage('chat')}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white rounded-xl font-medium text-sm transition-all shadow-lg shadow-cyan-500/20">
            Start Chatting
          </button>
        </div>
      </div>
    </div>
  )
}

function Feature({ icon, text }: { icon: string; text: string }) {
  const icons: Record<string, string> = {
    zap: '\u26A1',
    lock: '\uD83D\uDD12',
    message: '\uD83D\uDCAC',
    code: '\uD83D\uDCBB',
    layers: '\uD83D\uDCDA',
    smartphone: '\uD83D\uDCF1',
  }
  return (
    <div className="flex items-center gap-3">
      <span className="text-lg">{icons[icon] || '\u2728'}</span>
      <span className="text-gray-300 text-sm">{text}</span>
    </div>
  )
}
