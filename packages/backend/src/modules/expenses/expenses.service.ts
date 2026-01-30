import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import type { CreateExpenseInput, UpdateExpenseInput, ExpenseQuery } from './expenses.schema.js';

export class ExpensesService {
  async findAll(userId: string, query: ExpenseQuery) {
    const { page, limit, startDate, endDate, categoryId, categoryType } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
      ...(startDate && !endDate && {
        date: { gte: startDate },
      }),
      ...(!startDate && endDate && {
        date: { lte: endDate },
      }),
      ...(categoryId && { categoryId }),
      ...(categoryType && {
        category: { type: categoryType },
      }),
    };

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!expense) {
      throw ApiError.notFound('Expense not found');
    }

    return expense;
  }

  async create(userId: string, data: CreateExpenseInput) {
    // Verify category exists and is valid for this user
    const category = await prisma.category.findFirst({
      where: {
        id: data.categoryId,
        OR: [
          { userId: null, isDefault: true },
          { userId },
        ],
        type: { in: ['FIXED', 'VARIABLE'] },
      },
    });

    if (!category) {
      throw ApiError.badRequest('Invalid category');
    }

    return prisma.expense.create({
      data: {
        ...data,
        userId,
      },
      include: { category: true },
    });
  }

  async update(id: string, userId: string, data: UpdateExpenseInput) {
    const expense = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw ApiError.notFound('Expense not found');
    }

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [
            { userId: null, isDefault: true },
            { userId },
          ],
          type: { in: ['FIXED', 'VARIABLE'] },
        },
      });

      if (!category) {
        throw ApiError.badRequest('Invalid category');
      }
    }

    return prisma.expense.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string, userId: string) {
    const expense = await prisma.expense.findFirst({
      where: { id, userId },
    });

    if (!expense) {
      throw ApiError.notFound('Expense not found');
    }

    return prisma.expense.delete({
      where: { id },
    });
  }

  async getByCategory(userId: string, startDate?: Date, endDate?: Date) {
    const where = {
      userId,
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
    };

    const expenses = await prisma.expense.groupBy({
      by: ['categoryId'],
      where,
      _sum: { amount: true },
      _count: true,
    });

    const categoryIds = expenses.map((e) => e.categoryId);

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return expenses.map((e) => ({
      category: categoryMap.get(e.categoryId),
      total: e._sum.amount || 0,
      count: e._count,
    }));
  }

  async getSummary(userId: string, startDate?: Date, endDate?: Date) {
    const where = {
      userId,
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
    };

    const [total, fixed, variable] = await Promise.all([
      prisma.expense.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...where, category: { type: 'FIXED' } },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: { ...where, category: { type: 'VARIABLE' } },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      total: total._sum.amount || 0,
      count: total._count,
      fixed: {
        total: fixed._sum.amount || 0,
        count: fixed._count,
      },
      variable: {
        total: variable._sum.amount || 0,
        count: variable._count,
      },
    };
  }
}

export const expensesService = new ExpensesService();
