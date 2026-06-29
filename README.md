# AVIOS — Your Intelligent Thinking Partner

AVIOS is a production-quality AI assistant web application. It features a modern chat interface with streaming responses, conversation management, and a clean, premium UI.

## Project Structure

```
web/
├── frontend/              # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   └── ui/         # Design system primitives (Button, Modal, Card, etc.)
│   │   ├── pages/          # Page-level components
│   │   ├── hooks/          # Custom React hooks (useKeyboard, useOffline, etc.)
│   │   ├── contexts/       # React contexts (ChatContext)
│   │   ├── services/       # API communication layer
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── styles/         # Global styles (Tailwind)
│   ├── .eslintrc.json      # ESLint configuration
│   ├── .prettierrc         # Prettier configuration
│   └── vite.config.ts      # Vite build configuration
├── backend/               # FastAPI (Python)
│   ├── api/               # Route handlers
│   ├── services/          # Business logic (LLM, session)
│   ├── models/            # Pydantic schemas
│   ├── config/            # Environment configuration
│   ├── middleware/         # CORS, rate limiting, security
│   ├── prompts/           # System prompts
│   └── .env.example       # Environment variable template
├── LICENSE                # MIT License
├── CHANGELOG.md           # Version history
├── .editorconfig          # Editor settings
└── .gitignore
```

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.12+
- Ollama (with a model pulled)

### Backend Setup

```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (backend/.env):**

| Variable | Default | Description |
|----------|---------|-------------|
| OLLAMA_URL | http://127.0.0.1:11434 | Local AI service URL |
| OLLAMA_MODEL | llama3.2:latest | Model name |
| CORS_ORIGINS | http://localhost:5173 | Allowed origins |
| HOST | 0.0.0.0 | Server host |
| PORT | 8000 | Server port |
| SESSION_SECRET | change-me | Session secret |
| RATE_LIMIT_WINDOW_MS | 60000 | Rate limit window |
| RATE_LIMIT_MAX_REQUESTS | 30 | Max requests per window |

**Frontend (frontend/.env):**

| Variable | Default | Description |
|----------|---------|-------------|
| VITE_API_URL | http://localhost:8000 | Backend API URL |

### Development

Start both servers:

```bash
# Terminal 1 - Backend
cd backend && python main.py

# Terminal 2 - Frontend
cd frontend && npm run dev
```

Open http://localhost:5173 in your browser.

### Build for Production

```bash
cd frontend
npm run build
# Output in frontend/dist/
```

## Deployment

### Frontend (Render)

1. Connect your repository
2. Set build command: `cd frontend && npm install && npm run build`
3. Set publish directory: `frontend/dist`
4. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`

### Backend (Render)

1. Create a Web Service
2. Set start command: `cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Add environment variables from backend/.env.example

## Features

- Modern, premium UI with glassmorphism design and blur effects
- Full-screen loading animation with particles, glow effects, and progress bar
- Streaming AI responses with blinking cursor animation
- Markdown rendering with code syntax highlighting and copy button
- Conversation management (create, search, pin, export, delete, edit)
- AI-powered intelligent session naming
- Dark/light theme with configurable font size
- Responsive design (desktop-first with mobile compatibility)
- Keyboard shortcuts (Ctrl+K: sidebar, Ctrl+N: new chat, Ctrl+/: shortcuts help)
- Offline detection with graceful input disable
- Reusable UI component library (Button, Modal, Card, Dropdown, Input, Skeleton)
- Toast notification system
- Error boundaries with graceful recovery
- Code splitting and lazy loading for performance
- Rate limiting, CORS, and security headers
- Configurable backend endpoint in settings

## Scripts

```bash
# Frontend
npm run dev       # Start development server
npm run build     # Production build
npm run preview   # Preview production build

# Backend
python main.py    # Start FastAPI server
```

## License

MIT
