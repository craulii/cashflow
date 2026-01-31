# CLAUDE.md - CashFlow Project Guide

## Project Overview

CashFlow is a multi-user household economy management web application deployed on Vercel with Supabase PostgreSQL. It allows users to track income, expenses, debts, savings, and view analytics.

## Architecture

### Production Setup
- **Frontend:** React SPA deployed as static files on Vercel
- **Backend:** Express API as Vercel Serverless Function (`api/index.ts`)
- **Database:** Supabase PostgreSQL with connection pooling

### Directory Structure
```
cashflow/
├── api/index.ts              # Serverless API (ALL backend routes)
├── prisma/schema.prisma      # Database schema
├── prisma/seed.ts            # Default categories
├── vercel.json               # Vercel configuration
├── packages/
│   ├── backend/              # Local dev backend (not used in prod)
│   └── frontend/             # React frontend
└── .env                      # Environment variables (gitignored)
```

## Key Commands

```bash
npm install           # Install dependencies
npm run dev           # Start both servers locally
npm run db:push       # Push schema to database
npm run db:seed       # Seed default categories
npx vercel --prod     # Deploy to production
```

## Critical Deployment Notes

### Supabase Connection
- **MUST use pooler URL** for production: `?pgbouncer=true`
- Direct connection (port 5432) works for local dev and migrations
- Pooler connection (port 6543) required for Vercel serverless

```
# Wrong (will fail in Vercel):
DATABASE_URL=postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres

# Correct (for Vercel):
DATABASE_URL=postgresql://postgres.xxx:pass@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Vercel Configuration
- Root Directory: empty or `./`
- Framework: Other (NOT Vite)
- Build/Install commands: Leave empty (uses vercel.json)

### Frontend API URL
- Local dev: `VITE_API_URL=http://localhost:3001/api`
- Production: `VITE_API_URL=/api` (relative path)
- This is set in `packages/frontend/.env`

## Common Issues & Solutions

### 1. "prepared statement already exists"
**Cause:** Using direct connection instead of pooler with Supabase
**Fix:** Add `?pgbouncer=true` to DATABASE_URL

### 2. "Tenant or user not found"
**Cause:** Wrong pooler URL format or region
**Fix:** Get exact URL from Supabase Dashboard > Settings > Database > Connection string (Transaction mode)

### 3. Validation errors with null values
**Cause:** Zod schema using `.optional()` but receiving `null`
**Fix:** Use `.nullish()` instead of `.optional()` in Zod schemas

```typescript
// Wrong:
interestRate: z.number().optional(),

// Correct:
interestRate: z.number().nullish(),
```

### 4. "Invalid Date" in database
**Cause:** Empty string being converted to Date
**Fix:** Transform empty strings to null before Date conversion

```typescript
// Wrong:
dueDate: z.string().transform(v => new Date(v)).optional(),

// Correct:
dueDate: z.string().nullish().transform(v => v ? new Date(v) : null),
```

### 5. Empty string in update causing errors
**Cause:** Form sends empty string for optional fields
**Fix:** Clean data before Prisma update

```typescript
const data: any = { ...req.body };
if (data.dueDate === '' || data.dueDate === null) data.dueDate = null;
else if (data.dueDate) data.dueDate = new Date(data.dueDate);
```

## API Structure (api/index.ts)

All backend routes are in a single serverless function:

```typescript
// Authentication
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
POST /api/auth/refresh

// CRUD Routes (all require authentication)
/api/users/me
/api/categories
/api/incomes
/api/expenses
/api/debts
/api/debts/:id/payments
/api/savings
/api/savings/:id/deposits
/api/analytics/*
```

## Database Models

```prisma
User          # Users with auth
Category      # Default + user-created categories
Income        # User income records
Expense       # User expenses
Debt          # User debts
DebtPayment   # Payments on debts
Saving        # Savings goals
SavingDeposit # Deposits into savings
RefreshToken  # JWT refresh tokens
```

## Frontend Structure

```
packages/frontend/src/
├── api/          # Axios client + API calls
├── components/   # UI components
├── hooks/        # React Query hooks
├── pages/        # Route pages
├── store/        # Zustand stores
└── utils/        # Formatting utilities
```

## Category Types

- `FIXED` - Fixed expenses (rent, utilities)
- `VARIABLE` - Variable expenses (food, entertainment)
- `DEBT` - Debt categories
- `INCOME` - Income categories
- `SAVING` - Savings categories (new)

Categories with `userId = null` are system defaults.
Categories with `userId` set are user-created.

## Currency Formatting

Currency is formatted in `utils/format.ts`:
- Default: USD with no decimal places
- Format: `$1,000` (not `$1,000.00`)

## Testing Checklist

1. User registration and login work
2. Protected routes require valid token
3. User can only see their own data
4. Categories show both default and user-created
5. All CRUD operations handle null/empty values
6. Dashboard charts render correctly
7. Debt payments update remaining amount
8. Savings deposits update current amount
