import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import type { CreateIncomeInput, UpdateIncomeInput, IncomeQuery } from './income.schema.js';

export class IncomeService {
  async findAll(userId: string, query: IncomeQuery) {
    const { page, limit, startDate, endDate, source, categoryId } = query;
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
      ...(source && { source: { contains: source } }),
      ...(categoryId && { categoryId }),
    };

    const [incomes, total] = await Promise.all([
      prisma.income.findMany({
        where,
        include: { category: true },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.income.count({ where }),
    ]);

    return {
      incomes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string) {
    const income = await prisma.income.findFirst({
      where: { id, userId },
      include: { category: true },
    });

    if (!income) {
      throw ApiError.notFound('Income not found');
    }

    return income;
  }

  async create(userId: string, data: CreateIncomeInput) {
    return prisma.income.create({
      data: {
        ...data,
        userId,
      },
      include: { category: true },
    });
  }

  async update(id: string, userId: string, data: UpdateIncomeInput) {
    const income = await prisma.income.findFirst({
      where: { id, userId },
    });

    if (!income) {
      throw ApiError.notFound('Income not found');
    }

    return prisma.income.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async delete(id: string, userId: string) {
    const income = await prisma.income.findFirst({
      where: { id, userId },
    });

    if (!income) {
      throw ApiError.notFound('Income not found');
    }

    return prisma.income.delete({
      where: { id },
    });
  }

  async getSummary(userId: string, startDate?: Date, endDate?: Date) {
    const where = {
      userId,
      ...(startDate && endDate && {
        date: { gte: startDate, lte: endDate },
      }),
    };

    const [total, bySource, byCategory] = await Promise.all([
      prisma.income.aggregate({
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.income.groupBy({
        by: ['source'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
      prisma.income.groupBy({
        by: ['categoryId'],
        where,
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Get category details for the grouped results
    const categoryIds = byCategory
      .map((c) => c.categoryId)
      .filter((id): id is string => id !== null);

    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });

    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return {
      total: total._sum.amount || 0,
      count: total._count,
      bySource: bySource.map((s) => ({
        source: s.source || 'Sin fuente',
        total: s._sum.amount || 0,
        count: s._count,
      })),
      byCategory: byCategory.map((c) => ({
        category: c.categoryId ? categoryMap.get(c.categoryId) : null,
        total: c._sum.amount || 0,
        count: c._count,
      })),
    };
  }
}

export const incomeService = new IncomeService();
