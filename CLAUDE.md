# CLAUDE.md - CashFlow Project Guide

## Project Overview

CashFlow is a multi-user household economy management web application. It allows users to track income, expenses, debts, and view analytics about their financial health.

## Architecture

### Monorepo Structure (pnpm workspaces)
- `packages/backend` - Express + TypeScript API server
- `packages/frontend` - React + Vite SPA

### Technology Stack
- **Backend**: Node.js, Express, TypeScript, Prisma (SQLite), JWT, bcrypt, Zod
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Zustand, React Query, Recharts

## Key Commands

```bash
# Install all dependencies
pnpm install

# Development (both servers)
pnpm dev

# Backend only (port 3001)
pnpm dev:backend

# Frontend only (port 5173)
pnpm dev:frontend

# Database operations
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
pnpm db:migrate   # Run migrations
pnpm db:seed      # Seed database
pnpm db:studio    # Open Prisma Studio

# Build for production
pnpm build
```

## Backend Structure

### Entry Points
- `src/index.ts` - Server startup
- `src/app.ts` - Express app configuration

### Modules Pattern
Each module follows this structure:
```
modules/[name]/
├── [name].controller.ts  # HTTP handlers
├── [name].service.ts     # Business logic
├── [name].routes.ts      # Route definitions
├── [name].schema.ts      # Zod validation schemas
└── [name].types.ts       # TypeScript types
```

### Key Middleware
- `auth.middleware.ts` - JWT verification, user extraction
- `error.middleware.ts` - Global error handling
- `validate.middleware.ts` - Request validation with Zod

### Database Schema (Prisma)
Main models: User, Category, Income, Expense, Debt, DebtPayment

## Frontend Structure

### State Management
- **Zustand** (`store/`) - Client state (auth, UI)
- **React Query** (`hooks/`) - Server state (data fetching)

### Key Directories
- `api/` - Axios instance and API calls
- `components/ui/` - Reusable UI components
- `components/charts/` - Recharts wrappers
- `pages/` - Route pages
- `routes/` - React Router configuration

### Authentication Flow
1. Login/Register -> Receive tokens
2. Store tokens in localStorage + Zustand
3. Axios interceptor adds Authorization header
4. 401 response triggers token refresh
5. Refresh failure -> Logout

## Environment Variables

### Backend (.env)
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="secret-key"
JWT_REFRESH_SECRET="refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=3001
```

### Frontend (.env)
```
VITE_API_URL="http://localhost:3001/api"
```

## API Conventions

- All routes prefixed with `/api`
- Protected routes require `Authorization: Bearer <token>`
- Response format: `{ data: T }` or `{ error: string, message: string }`
- Pagination: `?page=1&limit=10`
- Date filters: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

## Category Types
- `FIXED` - Fixed expenses (rent, utilities)
- `VARIABLE` - Variable expenses (food, entertainment)
- `DEBT` - Debt categories
- `INCOME` - Income categories

## Common Patterns

### Adding a New Endpoint
1. Define Zod schema in `module.schema.ts`
2. Add service method in `module.service.ts`
3. Add controller handler in `module.controller.ts`
4. Register route in `module.routes.ts`

### Adding a New Page
1. Create page component in `pages/`
2. Add route in `routes/index.tsx`
3. Create data hook in `hooks/`
4. Add API calls in `api/`

## Testing Checklist

1. User registration works
2. User login returns tokens
3. Protected routes require valid token
4. User can only see their own data
5. CRUD operations work for all entities
6. Dashboard charts render correctly
7. Responsive design works on mobile
