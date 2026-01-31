import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

// Import Prisma client
import { PrismaClient } from '@prisma/client';

// Initialize Prisma with connection pooling for serverless
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Config
const config = {
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
};

// ============ UTILS ============
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
  static badRequest(msg: string) { return new ApiError(400, msg); }
  static unauthorized(msg = 'Unauthorized') { return new ApiError(401, msg); }
  static notFound(msg = 'Not found') { return new ApiError(404, msg); }
  static conflict(msg: string) { return new ApiError(409, msg); }
}

interface TokenPayload { userId: string; email: string; }

const generateAccessToken = (payload: TokenPayload): string =>
  jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn as jwt.SignOptions['expiresIn'] });

const generateRefreshToken = (payload: TokenPayload): string =>
  jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpiresIn as jwt.SignOptions['expiresIn'] });

const verifyAccessToken = (token: string): TokenPayload =>
  jwt.verify(token, config.jwt.secret) as TokenPayload;

const verifyRefreshToken = (token: string): TokenPayload =>
  jwt.verify(token, config.jwt.refreshSecret) as TokenPayload;

const getRefreshTokenExpiry = (): Date => {
  const match = config.jwt.refreshExpiresIn.match(/^(\d+)([dhms])$/);
  if (!match) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const multipliers: Record<string, number> = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
  return new Date(Date.now() + parseInt(match[1]) * multipliers[match[2]]);
};

// ============ MIDDLEWARE ============
const authenticate = async (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) throw ApiError.unauthorized('No token provided');

    const payload = verifyAccessToken(authHeader.split(' ')[1]);
    const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, email: true } });
    if (!user) throw ApiError.unauthorized('User not found');

    (req as any).user = { ...payload, id: user.id };
    next();
  } catch (error) { next(error); }
};

const validate = (schema: z.ZodSchema) => (req: express.Request, _res: express.Response, next: express.NextFunction) => {
  try { req.body = schema.parse(req.body); next(); }
  catch (error) { next(error); }
};

// ============ SCHEMAS ============
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

const createIncomeSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  source: z.string().optional(),
  date: z.string().transform(v => new Date(v)),
  isRecurring: z.boolean().optional().default(false),
  categoryId: z.string().optional(),
});

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().transform(v => new Date(v)),
  isRecurring: z.boolean().optional().default(false),
  categoryId: z.string().min(1),
});

const createDebtSchema = z.object({
  name: z.string().min(1),
  totalAmount: z.number().positive(),
  interestRate: z.number().min(0).nullish(),
  minimumPayment: z.number().positive().nullish(),
  dueDate: z.string().nullish().transform(v => v ? new Date(v) : null),
  startDate: z.string().transform(v => new Date(v)),
  categoryId: z.string().nullish().transform(v => v || null),
});

const createPaymentSchema = z.object({
  amount: z.number().positive(),
  date: z.string().transform(v => new Date(v)),
  note: z.string().optional(),
});

const createCategorySchema = z.object({
  name: z.string().min(1),
  type: z.enum(['FIXED', 'VARIABLE', 'DEBT', 'INCOME']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

// ============ EXPRESS APP ============
const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// ============ AUTH ROUTES ============
app.post('/api/auth/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name } = req.body;
    if (await prisma.user.findUnique({ where: { email } })) throw ApiError.conflict('Email already registered');

    const user = await prisma.user.create({
      data: { email, password: await bcrypt.hash(password, 10), name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: getRefreshTokenExpiry() },
    });

    res.status(201).json({ data: { user, accessToken, refreshToken } });
  } catch (e) { next(e); }
});

app.post('/api/auth/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) throw ApiError.unauthorized('Invalid credentials');

    const payload = { userId: user.id, email: user.email };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: getRefreshTokenExpiry() },
    });

    res.json({ data: { user: { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt }, accessToken, refreshToken } });
  } catch (e) { next(e); }
});

app.post('/api/auth/refresh', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const payload = verifyRefreshToken(refreshToken);

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken }, include: { user: true } });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw ApiError.unauthorized('Invalid or expired refresh token');
    }

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const newPayload = { userId: payload.userId, email: payload.email };
    const newAccessToken = generateAccessToken(newPayload);
    const newRefreshToken = generateRefreshToken(newPayload);

    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: payload.userId, expiresAt: getRefreshTokenExpiry() },
    });

    res.json({ data: { user: { id: stored.user.id, email: stored.user.email, name: stored.user.name }, accessToken: newAccessToken, refreshToken: newRefreshToken } });
  } catch (e) { next(e); }
});

app.post('/api/auth/logout', validate(refreshTokenSchema), async (req, res, next) => {
  try {
    await prisma.refreshToken.deleteMany({ where: { token: req.body.refreshToken } });
    res.json({ data: { message: 'Logged out successfully' } });
  } catch (e) { next(e); }
});

// ============ USER ROUTES ============
app.get('/api/users/me', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: (req as any).user.id },
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    res.json({ data: user });
  } catch (e) { next(e); }
});

app.patch('/api/users/me', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { name, email, currentPassword, newPassword } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name;
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) throw ApiError.conflict('Email already in use');
      updateData.email = email;
    }
    if (newPassword && currentPassword) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !(await bcrypt.compare(currentPassword, user.password))) throw ApiError.badRequest('Current password is incorrect');
      updateData.password = await bcrypt.hash(newPassword, 10);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, email: true, name: true, createdAt: true, updatedAt: true },
    });
    res.json({ data: user });
  } catch (e) { next(e); }
});

// ============ CATEGORIES ROUTES ============
app.get('/api/categories', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const type = req.query.type as string | undefined;

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ userId: null, isDefault: true }, { userId }],
        ...(type && { type }),
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
    res.json({ data: categories });
  } catch (e) { next(e); }
});

app.post('/api/categories', authenticate, validate(createCategorySchema), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const category = await prisma.category.create({
      data: { ...req.body, userId, isDefault: false },
    });
    res.status(201).json({ data: category });
  } catch (e) { next(e); }
});

app.delete('/api/categories/:id', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const category = await prisma.category.findFirst({ where: { id: req.params.id, userId } });
    if (!category) throw ApiError.notFound('Category not found');

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ data: { message: 'Category deleted' } });
  } catch (e) { next(e); }
});

// ============ INCOMES ROUTES ============
app.get('/api/incomes', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.income.count({ where: { userId } }),
    ]);

    res.json({ data: { incomes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { next(e); }
});

app.get('/api/incomes/summary', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const result = await prisma.income.aggregate({ where: { userId }, _sum: { amount: true }, _count: true });
    res.json({ data: { total: result._sum.amount || 0, count: result._count } });
  } catch (e) { next(e); }
});

app.post('/api/incomes', authenticate, validate(createIncomeSchema), async (req, res, next) => {
  try {
    const income = await prisma.income.create({
      data: { ...req.body, userId: (req as any).user.id, categoryId: req.body.categoryId || null },
      include: { category: true },
    });
    res.status(201).json({ data: income });
  } catch (e) { next(e); }
});

app.patch('/api/incomes/:id', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const income = await prisma.income.findFirst({ where: { id: req.params.id, userId } });
    if (!income) throw ApiError.notFound('Income not found');

    const updated = await prisma.income.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true },
    });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

app.delete('/api/incomes/:id', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const income = await prisma.income.findFirst({ where: { id: req.params.id, userId } });
    if (!income) throw ApiError.notFound('Income not found');

    await prisma.income.delete({ where: { id: req.params.id } });
    res.json({ data: { message: 'Income deleted' } });
  } catch (e) { next(e); }
});

// ============ EXPENSES ROUTES ============
app.get('/api/expenses', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const categoryType = req.query.categoryType as string | undefined;

    const where: any = { userId };
    if (categoryType) where.category = { type: categoryType };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    res.json({ data: { expenses, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { next(e); }
});

app.get('/api/expenses/by-category', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const grouped = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: { userId },
      _sum: { amount: true },
      _count: true,
    });

    const categoryIds = grouped.map(g => g.categoryId);
    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    res.json({ data: grouped.map(g => ({ category: categoryMap.get(g.categoryId), total: g._sum.amount || 0, count: g._count })) });
  } catch (e) { next(e); }
});

app.get('/api/expenses/summary', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const [total, fixed, variable] = await Promise.all([
      prisma.expense.aggregate({ where: { userId }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { userId, category: { type: 'FIXED' } }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { userId, category: { type: 'VARIABLE' } }, _sum: { amount: true }, _count: true }),
    ]);

    res.json({ data: {
      total: total._sum.amount || 0, count: total._count,
      fixed: { total: fixed._sum.amount || 0, count: fixed._count },
      variable: { total: variable._sum.amount || 0, count: variable._count },
    }});
  } catch (e) { next(e); }
});

app.post('/api/expenses', authenticate, validate(createExpenseSchema), async (req, res, next) => {
  try {
    const expense = await prisma.expense.create({
      data: { ...req.body, userId: (req as any).user.id },
      include: { category: true },
    });
    res.status(201).json({ data: expense });
  } catch (e) { next(e); }
});

app.patch('/api/expenses/:id', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const expense = await prisma.expense.findFirst({ where: { id: req.params.id, userId } });
    if (!expense) throw ApiError.notFound('Expense not found');

    const updated = await prisma.expense.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: true },
    });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

app.delete('/api/expenses/:id', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const expense = await prisma.expense.findFirst({ where: { id: req.params.id, userId } });
    if (!expense) throw ApiError.notFound('Expense not found');

    await prisma.expense.delete({ where: { id: req.params.id } });
    res.json({ data: { message: 'Expense deleted' } });
  } catch (e) { next(e); }
});

// ============ DEBTS ROUTES ============
app.get('/api/debts', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const [debts, total] = await Promise.all([
      prisma.debt.findMany({
        where: { userId },
        include: { category: true, payments: { orderBy: { date: 'desc' }, take: 5 } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.debt.count({ where: { userId } }),
    ]);

    res.json({ data: { debts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } } });
  } catch (e) { next(e); }
});

app.get('/api/debts/summary', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const debts = await prisma.debt.findMany({ where: { userId } });

    const totalDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);

    res.json({ data: {
      totalDebt,
      totalRemaining,
      totalPaid: totalDebt - totalRemaining,
      activeDebts: debts.filter(d => d.remainingAmount > 0).length,
      paidOffDebts: debts.filter(d => d.remainingAmount <= 0).length,
      debtCount: debts.length,
    }});
  } catch (e) { next(e); }
});

app.post('/api/debts', authenticate, validate(createDebtSchema), async (req, res, next) => {
  try {
    const debt = await prisma.debt.create({
      data: { ...req.body, remainingAmount: req.body.totalAmount, userId: (req as any).user.id, categoryId: req.body.categoryId || null },
      include: { category: true },
    });
    res.status(201).json({ data: debt });
  } catch (e) { next(e); }
});

app.patch('/api/debts/:id', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const debt = await prisma.debt.findFirst({ where: { id: req.params.id, userId } });
    if (!debt) throw ApiError.notFound('Debt not found');

    // Clean data - convert empty strings to null
    const data: any = { ...req.body };
    if (data.dueDate === '' || data.dueDate === null) data.dueDate = null;
    else if (data.dueDate) data.dueDate = new Date(data.dueDate);
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.categoryId === '') data.categoryId = null;
    if (data.interestRate === '') data.interestRate = null;
    if (data.minimumPayment === '') data.minimumPayment = null;

    const updated = await prisma.debt.update({
      where: { id: req.params.id },
      data,
      include: { category: true },
    });
    res.json({ data: updated });
  } catch (e) { next(e); }
});

app.delete('/api/debts/:id', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const debt = await prisma.debt.findFirst({ where: { id: req.params.id, userId } });
    if (!debt) throw ApiError.notFound('Debt not found');

    await prisma.debt.delete({ where: { id: req.params.id } });
    res.json({ data: { message: 'Debt deleted' } });
  } catch (e) { next(e); }
});

app.get('/api/debts/:id/payments', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const debt = await prisma.debt.findFirst({ where: { id: req.params.id, userId } });
    if (!debt) throw ApiError.notFound('Debt not found');

    const payments = await prisma.debtPayment.findMany({
      where: { debtId: req.params.id },
      orderBy: { date: 'desc' },
    });
    res.json({ data: payments });
  } catch (e) { next(e); }
});

app.post('/api/debts/:id/payments', authenticate, validate(createPaymentSchema), async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const debt = await prisma.debt.findFirst({ where: { id: req.params.id, userId } });
    if (!debt) throw ApiError.notFound('Debt not found');
    if (debt.remainingAmount <= 0) throw ApiError.badRequest('Debt already paid off');

    const [payment] = await prisma.$transaction([
      prisma.debtPayment.create({ data: { ...req.body, debtId: req.params.id } }),
      prisma.debt.update({
        where: { id: req.params.id },
        data: { remainingAmount: Math.max(0, debt.remainingAmount - req.body.amount) },
      }),
    ]);

    res.status(201).json({ data: payment });
  } catch (e) { next(e); }
});

app.delete('/api/debts/payments/:paymentId', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const payment = await prisma.debtPayment.findFirst({
      where: { id: req.params.paymentId },
      include: { debt: true },
    });
    if (!payment || payment.debt.userId !== userId) throw ApiError.notFound('Payment not found');

    await prisma.$transaction([
      prisma.debtPayment.delete({ where: { id: req.params.paymentId } }),
      prisma.debt.update({
        where: { id: payment.debtId },
        data: { remainingAmount: payment.debt.remainingAmount + payment.amount },
      }),
    ]);

    res.json({ data: { message: 'Payment deleted' } });
  } catch (e) { next(e); }
});

// ============ ANALYTICS ROUTES ============
app.get('/api/analytics/dashboard', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [totalIncome, totalExpenses, expensesByCategory, debtsSummary] = await Promise.all([
      prisma.income.aggregate({ where: { userId, date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
      prisma.expense.aggregate({ where: { userId, date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
      prisma.expense.groupBy({ by: ['categoryId'], where: { userId, date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
      prisma.debt.aggregate({ where: { userId }, _sum: { remainingAmount: true }, _count: true }),
    ]);

    const categoryIds = expensesByCategory.map(e => e.categoryId);
    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
    const categoryMap = new Map(categories.map(c => [c.id, c]));

    // Recent transactions
    const [incomes, expenses] = await Promise.all([
      prisma.income.findMany({ where: { userId }, include: { category: true }, orderBy: { date: 'desc' }, take: 5 }),
      prisma.expense.findMany({ where: { userId }, include: { category: true }, orderBy: { date: 'desc' }, take: 5 }),
    ]);

    const recentTransactions = [
      ...incomes.map(i => ({ ...i, type: 'income' as const })),
      ...expenses.map(e => ({ ...e, type: 'expense' as const })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

    const income = totalIncome._sum.amount || 0;
    const expensesTotal = totalExpenses._sum.amount || 0;

    res.json({ data: {
      summary: {
        income,
        expenses: expensesTotal,
        balance: income - expensesTotal,
        totalDebt: debtsSummary._sum.remainingAmount || 0,
        activeDebts: debtsSummary._count,
      },
      expensesByCategory: expensesByCategory.map(e => ({ category: categoryMap.get(e.categoryId), total: e._sum.amount || 0 })),
      recentTransactions,
      period: { start: startOfMonth.toISOString(), end: endOfMonth.toISOString() },
    }});
  } catch (e) { next(e); }
});

app.get('/api/analytics/comparison', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const months = parseInt(req.query.months as string) || 6;
    const now = new Date();
    const results = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [income, expenses] = await Promise.all([
        prisma.income.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
      ]);

      results.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthName: startDate.toLocaleString('es-ES', { month: 'short' }),
        income: income._sum.amount || 0,
        expenses: expenses._sum.amount || 0,
        balance: (income._sum.amount || 0) - (expenses._sum.amount || 0),
      });
    }

    res.json({ data: results.reverse() });
  } catch (e) { next(e); }
});

app.get('/api/analytics/trends', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const months = parseInt(req.query.months as string) || 12;
    const now = new Date();
    const data = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startDate = new Date(date.getFullYear(), date.getMonth(), 1);
      const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

      const [income, expenses] = await Promise.all([
        prisma.income.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
      ]);

      data.push({
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        monthName: startDate.toLocaleString('es-ES', { month: 'short' }),
        income: income._sum.amount || 0,
        expenses: expenses._sum.amount || 0,
        balance: (income._sum.amount || 0) - (expenses._sum.amount || 0),
      });
    }

    const reversed = data.reverse();
    const incomeValues = reversed.map(c => c.income);
    const expenseValues = reversed.map(c => c.expenses);

    const avgIncome = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
    const avgExpenses = expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length;
    const avgBalance = reversed.map(c => c.balance).reduce((a, b) => a + b, 0) / reversed.length;

    const recentIncome = incomeValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousIncome = incomeValues.slice(-6, -3).reduce((a, b) => a + b, 0) / 3 || recentIncome;
    const recentExpenses = expenseValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousExpenses = expenseValues.slice(-6, -3).reduce((a, b) => a + b, 0) / 3 || recentExpenses;

    res.json({ data: {
      data: reversed,
      averages: { income: avgIncome, expenses: avgExpenses, balance: avgBalance },
      trends: {
        income: { direction: recentIncome >= previousIncome ? 'up' : 'down', percentage: previousIncome > 0 ? ((recentIncome - previousIncome) / previousIncome) * 100 : 0 },
        expenses: { direction: recentExpenses >= previousExpenses ? 'up' : 'down', percentage: previousExpenses > 0 ? ((recentExpenses - previousExpenses) / previousExpenses) * 100 : 0 },
      },
    }});
  } catch (e) { next(e); }
});

app.get('/api/analytics/monthly', authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const now = new Date();
    const year = parseInt(req.query.year as string) || now.getFullYear();
    const month = parseInt(req.query.month as string) || now.getMonth() + 1;

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [incomes, expenses] = await Promise.all([
      prisma.income.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true }, _count: true }),
      prisma.expense.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true }, _count: true }),
    ]);

    res.json({ data: {
      period: { year, month, start: startDate.toISOString(), end: endDate.toISOString() },
      income: { total: incomes._sum.amount || 0, count: incomes._count },
      expenses: { total: expenses._sum.amount || 0, count: expenses._count },
      balance: (incomes._sum.amount || 0) - (expenses._sum.amount || 0),
    }});
  } catch (e) { next(e); }
});

// ============ ERROR HANDLER ============
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  if (err instanceof z.ZodError) {
    return res.status(400).json({ error: 'Validation error', details: err.errors });
  }
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token' });
  }
  // Prisma errors
  if (err.code?.startsWith?.('P')) {
    console.error('Prisma error:', err.code, err.message);
    return res.status(500).json({ error: 'Database error', code: err.code, message: err.message });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message, stack: err.stack });
});

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

export default app;
