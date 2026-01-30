import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.schema.js';

export type CategoryType = 'FIXED' | 'VARIABLE' | 'DEBT' | 'INCOME';

export class CategoriesService {
  async findAll(userId: string, type?: CategoryType) {
    const where = {
      OR: [
        { userId: null, isDefault: true },
        { userId },
      ],
      ...(type && { type }),
    };

    return prisma.category.findMany({
      where,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  }

  async findById(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        OR: [
          { userId: null, isDefault: true },
          { userId },
        ],
      },
    });

    if (!category) {
      throw ApiError.notFound('Category not found');
    }

    return category;
  }

  async create(userId: string, data: CreateCategoryInput) {
    // Check for duplicate name for this user and type
    const existing = await prisma.category.findFirst({
      where: {
        name: data.name,
        type: data.type,
        userId,
      },
    });

    if (existing) {
      throw ApiError.conflict('Category with this name already exists');
    }

    return prisma.category.create({
      data: {
        ...data,
        userId,
        isDefault: false,
      },
    });
  }

  async update(id: string, userId: string, data: UpdateCategoryInput) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw ApiError.notFound('Category not found or you cannot edit default categories');
    }

    if (data.name) {
      const existing = await prisma.category.findFirst({
        where: {
          name: data.name,
          type: category.type,
          userId,
          NOT: { id },
        },
      });

      if (existing) {
        throw ApiError.conflict('Category with this name already exists');
      }
    }

    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string, userId: string) {
    const category = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!category) {
      throw ApiError.notFound('Category not found or you cannot delete default categories');
    }

    // Check if category is in use
    const expenseCount = await prisma.expense.count({
      where: { categoryId: id },
    });

    const incomeCount = await prisma.income.count({
      where: { categoryId: id },
    });

    const debtCount = await prisma.debt.count({
      where: { categoryId: id },
    });

    if (expenseCount > 0 || incomeCount > 0 || debtCount > 0) {
      throw ApiError.conflict('Cannot delete category that is in use');
    }

    return prisma.category.delete({
      where: { id },
    });
  }
}

export const categoriesService = new CategoriesService();
