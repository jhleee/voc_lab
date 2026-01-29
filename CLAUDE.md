# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run start        # Start production server

# Database (PostgreSQL via Docker)
npm run db:up        # Start PostgreSQL container
npm run db:down      # Stop PostgreSQL container
npm run db:migrate   # Run Prisma migrations (creates tables from schema)
npm run db:studio    # Open Prisma Studio (GUI for database)
```

## Initial Setup

```bash
npm install
cp .env.example .env   # Then set DATABASE_URL
npm run db:up          # Start PostgreSQL
npm run db:migrate     # Apply migrations
```

Default local DATABASE_URL: `postgresql://voclab:voclab123@localhost:5432/voclab`

## Architecture

Chatbot builder platform: Next.js 16 (App Router), shadcn/ui (new-york style), ReactFlow (@xyflow/react), Prisma + PostgreSQL, Zustand.

### Route Structure

- `(auth)/*` - Authentication pages (login) with centered layout
- `(builder)/*` - Main application with sidebar layout
  - `/project/[projectId]/flow` - ReactFlow-based conversation flow designer
  - `/project/[projectId]/docs` - Document management with drag-and-drop upload
  - `/project/[projectId]/prompt` - System prompt editor

### Key Patterns

**Layouts**: Route groups `(auth)` and `(builder)` define distinct layouts. Builder layout includes:
- `AppSidebar` - Project switcher + navigation menu + user profile
- `ChatDrawer` - Right-side slide-out chat testing panel (controlled via Zustand)

**State Management**:
- `useChatDrawer` hook (Zustand store) controls chat drawer open/close state
- Mock data in `lib/mock-data.ts` provides demo projects, documents, messages

**Flow Editor**:
- Custom ReactFlow nodes in `components/builder/flow/nodes/`
- Node types: `StartNode`, `MessageNode`

### Component Organization

```
components/
├── ui/           # shadcn primitives (auto-generated)
├── auth/         # Login form, Google OAuth button
└── builder/
    ├── sidebar/      # AppSidebar, ProjectSwitcher, NavMenu
    ├── chat-drawer/  # ChatDrawer, ChatInput
    ├── flow/         # FlowCanvas, custom nodes
    ├── docs/         # DocsSearch, DocsGrid, DocCard
    └── prompt/       # PromptEditor
```

### Types

Core interfaces defined in `types/index.ts`: `Project`, `Document`, `ChatMessage`, `FlowNode`, `FlowEdge`, `User`

### Database Schema

Prisma models in `prisma/schema.prisma`: `User` → `Project` → `Document`, `Flow` → `FlowNode`, `FlowEdge`. Cascade deletes are configured.

## TODO Markers

Functions with `// TODO:` comments indicate where real API integrations should replace mock implementations (authentication, file upload, chat API, etc).
