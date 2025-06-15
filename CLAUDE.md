# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

If the user's prompt starts with "EP:", the the user wants to enhance the prompt. Read the [PROMPT ENHANCER](.claude/PROMPT_ENHANCER.md) file and follow the guilelines to enhance the user's prompt. Show the user the enhancement and get user's permission to run it before taking action on the enhanced prompt.

The enhanced prompts will follow the language of the original prompt (e.g., Korean prompt input will output Korean prompt enhancements)

## Project Overview

This is a full-stack TodoList application built as a Bun monorepo with React frontend and Hono backend. The project uses OpenAPI code generation and React Query for type-safe API integration.

## Commands

### Development

```bash
# Install dependencies
bun install

# Start all services (frontend + backend)
bun run dev

# Start individual services
cd backend && bun run dev    # Backend on port 3300
cd frontend && bun run dev   # Frontend on port 5173
```

### Code Quality

```bash
# Format code
bun run format

# Lint code
bun run lint

# Type checking
bun run type-check
```

### Testing

```bash
# Run backend tests
cd backend && bun test
cd backend && bun test --watch
```

### Build & Production

```bash
# Build all workspaces
bun run build

# Start production server
bun run start
```

### API Code Generation

```bash
# Generate API client from OpenAPI spec
cd frontend && bun run orval
```

## Available Scripts

### Root Package Scripts

```bash
bun run dev              # Start all services (frontend + backend)
bun run build            # Build all workspaces
bun run start            # Start production server
bun run test             # Run tests in all workspaces
bun run format           # Format code with Biome
bun run lint             # Lint code with Biome
bun run type-check       # Type check all workspaces
bun run pre-commit       # Run type-check, lint, and test
```

### Backend Scripts

```bash
cd backend
bun run dev              # Start dev server with hot reload
bun run build            # Build for production
bun run start            # Start production server
bun run type-check       # TypeScript type checking
bun run test             # Run tests
bun run test:watch       # Run tests in watch mode
```

### Frontend Scripts

```bash
cd frontend
bun run dev              # Start Vite dev server
bun run build            # Build for production
bun run preview          # Preview production build
bun run type-check       # TypeScript type checking
bun run orval            # Generate API client from OpenAPI
```

## Architecture

### Backend (Hono + TypeScript)

- **Entry Point**: `backend/src/index.ts` - starts server on port 3300
- **App Setup**: `backend/src/app.ts` - OpenAPI Hono app with middleware, CORS, Swagger UI
- **Routes**: `backend/src/routes/` - API endpoints with validation
  - `todos.ts` - Legacy Hono routes
  - `todos.openapi.ts` - OpenAPI-compliant routes (preferred)
- **Services**: `backend/src/services/` - Business logic layer
- **Repository**: `backend/src/repositories/` - Data access layer
- **Storage**: In-memory storage via `backend/src/utils/in-memory-storage.ts`

### Frontend (React + TypeScript + Vite)

- **Entry Point**: `frontend/src/main.tsx` - runs on port 5173
- **App Component**: `frontend/src/App.tsx` - Main app with React Query integration
- **API Layer**: Auto-generated from OpenAPI spec with Vite proxy setup
  - `frontend/src/api/generated.ts` - Generated API client (uses `/api/*` paths)
  - `frontend/src/api/model/` - Generated TypeScript types
  - `frontend/src/orval/mutator.ts` - Custom axios instance for API calls
- **Hooks**: `frontend/src/hooks/useTodos.ts` - React Query hooks for API calls
- **Components**: `frontend/src/components/` - Reusable UI components
  - `common/` - Shared components (AppHeader, QuickAddTodo, ThemeToggle)
  - `todo/` - Todo-specific components (TodoForm, TodoList)
  - `kanban/` - Kanban view components (KanbanCard, KanbanColumn, KanbanView)
  - `ui/` - Base UI components (Modal)
- **Context**: `frontend/src/contexts/` - React Context providers
  - `ThemeContext.tsx` - Theme management (light/dark/system)
- **Utils**: `frontend/src/utils/` - Utility functions
  - `cn.ts` - Tailwind CSS class name utility (clsx wrapper)
- **Proxy Setup**: Vite config proxies `/api/*` to `localhost:3300/*`

### Key Integration Points

- **OpenAPI**: Backend exposes `/openapi.json`, frontend generates client code
- **React Query**: Frontend uses generated hooks with cache invalidation
- **Vite Proxy**: Frontend `/api/*` requests proxied to `localhost:3300/*` (no CORS issues)
- **Swagger UI**: Available at `http://localhost:3300/docs`

## Development Workflow

1. **Backend Changes**: Modify routes/services in `backend/src/`
2. **API Updates**: If OpenAPI schema changes, run `cd frontend && bun run orval`
3. **Frontend Changes**: Use generated API types and React Query hooks
4. **Testing**: Backend has comprehensive test coverage in `backend/src/__tests__/`
5. **Commit Strategy**: After completing a logical unit of work (feature, bugfix, or milestone), stop additional work and create a commit to maintain clear project history

## Development Guidelines & Rules

### Project Implementation Plan

- **Current Phase**: Phase 1 (Core Features) - Basic Todo CRUD with OpenAPI integration
- **Implementation Roadmap**: Follow `docs/plans/core/05-implementation-roadmap.md`
- **Next Priority**: OpenAPI code generation setup (Orval) and frontend component completion

### Development Rules

1. **Follow Feature Specifications**: Refer to `docs/features.md` for complete feature requirements
2. **Implement Phased Approach**: Complete Phase 1 before moving to advanced features (Kanban, Calendar, Dashboard)
3. **Data Model Compliance**: Follow exact data models defined in `docs/plans/core/01-data-models.md`
4. **API Design Standards**: Implement APIs according to `docs/plans/core/02-api-design.md`
5. **Frontend Architecture**: Follow component structure in `docs/plans/core/04-frontend-architecture.md`

### Code Quality Standards

- **TypeScript Strict Mode**: Use strict typing, avoid `any` type
- **Biome Configuration**: Follow `.biome.json` settings (2-space indent, single quotes, semicolons as needed)
- **Component Patterns**: Use functional components with React Hooks only
- **State Management**: Local state (useState/useReducer), Server state (React Query), Global state (Context API)
- **Form Validation**: Use Zod for all data validation (both frontend and backend)

### Implementation Priorities

1. **Phase 1 Must-Complete**:
   - OpenAPI schema generation
   - Orval code generation setup
   - Basic Todo CRUD with React Query
   - ListView and TodoForm components
2. **Phase 2**: Kanban view with drag-and-drop
3. **Phase 3**: Calendar view and Dashboard
4. **Phase 4**: Performance optimization and PWA features

### Documentation Requirements

- **Always Update Documentation**: When implementing features, update corresponding plan files in `docs/plans/`
- **Feature Completion Tracking**: Mark completed items in implementation roadmap
- **API Changes**: Update OpenAPI schema and regenerate client code

### Error Handling Standards

- **Backend**: Standardized error responses with success/error format
- **Frontend**: React Query error boundaries and user-friendly error messages
- **Validation**: Client-side and server-side validation with Zod schemas

## Important Notes

- Uses Biome for linting/formatting (not ESLint/Prettier)
- Backend runs on port 3300 (not 3001 as mentioned in README)
- TailwindCSS v4 is configured and active with dark mode support
- GSAP animation system implemented for enhanced UI interactions
- In-memory storage only - no persistent database yet
- Uses Bun as runtime and package manager throughout
- OpenAPI code generation with Orval is critical for type-safe API integration
- Theme system supports light/dark/system modes with localStorage persistence
