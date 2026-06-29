# Changelog

## [1.0.0] - 2026-06-28

### Added
- Full-screen loading animation with particles, glow effects, and progress bar
- Dashboard layout with hamburger menu, AVIOS branding, and settings button
- Chat interface with streaming AI responses, markdown rendering, and syntax highlighting
- Message actions: copy, regenerate, edit, delete
- Conversation management: create, search, pin, export, delete conversations
- Smart conversation title generation from context
- Left sidebar with pinned/recent chats and search
- Settings page: theme (dark/light), font size, backend URL config, import/export
- About page with AVIOS introduction
- Keyboard shortcuts (Ctrl+K: sidebar, Ctrl+N: new chat, Ctrl+/: shortcuts)
- Offline detection with banner and input disable
- Blinking cursor animation during AI response streaming
- Reusable UI component library (Button, Modal, Card, Dropdown, Input, Skeleton)
- Toast notification system
- Error boundary with graceful recovery
- Responsive design (desktop-first with mobile support)
- Accessibility features (ARIA labels, keyboard navigation)

### Backend
- FastAPI REST API with clean architecture
- Streaming responses via SSE (Server-Sent Events)
- Session management with JSON file persistence
- Intelligent conversation title generation via AI
- Rate limiting, CORS, and security headers
- Health check endpoint for deployment monitoring
- Graceful shutdown handling
- Request logging and error logging
- Configurable local AI service (Ollama)
- Environment variable configuration

### Infrastructure
- Vite + React + TypeScript + Tailwind CSS frontend
- Modular project structure with services, hooks, contexts, types, utils
- ESLint and Prettier configuration
- EditorConfig for consistent code style
- Production build scripts
- Environment variable examples
