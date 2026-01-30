import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import type { CreateDebtInput, UpdateDebtInput, CreatePaymentInput, DebtQuery } from './debts.schema.js';

export class DebtsService {
  async findAll(userId: string, query: DebtQuery) {
    const { page, limit, isPaidOff } = query;
    const skip = (page - 1) * limit;

    const where = {
      userId,
      ...(isPaidOff !== undefined && {
        remainingAmount: isPaidOff ? { lte: 0 } : { gt: 0 },
      }),
    };

    const [debts, total] = await Promise.all([
      prisma.debt.findMany({
        where,
        include: {
          category: true,
          payments: {
            orderBy: { date: 'desc' },
            take: 5,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.debt.count({ where }),
    ]);

    return {
      debts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, userId: string) {
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
      include: {
        category: true,
        payments: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!debt) {
      throw ApiError.notFound('Debt not found');
    }

    return debt;
  }

  async create(userId: string, data: CreateDebtInput) {
    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [
            { userId: null, isDefault: true },
            { userId },
          ],
          type: 'DEBT',
        },
      });

      if (!category) {
        throw ApiError.badRequest('Invalid debt category');
      }
    }

    return prisma.debt.create({
      data: {
        ...data,
        remainingAmount: data.totalAmount,
        userId,
      },
      include: { category: true },
    });
  }

  async update(id: string, userId: string, data: UpdateDebtInput) {
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw ApiError.notFound('Debt not found');
    }

    if (data.categoryId) {
      const category = await prisma.category.findFirst({
        where: {
          id: data.categoryId,
          OR: [
            { userId: null, isDefault: true },
            { userId },
          ],
          type: 'DEBT',
        },
      });

      if (!category) {
        throw ApiError.badRequest('Invalid debt category');
      }
    }

    // If totalAmount is updated, recalculate remainingAmount
    let remainingAmount = debt.remainingAmount;
    if (data.totalAmount && data.totalAmount !== debt.totalAmount) {
      const totalPaid = debt.totalAmount - debt.remainingAmount;
      remainingAmount = Math.max(0, data.totalAmount - totalPaid);
    }

    return prisma.debt.update({
      where: { id },
      data: {
        ...data,
        remainingAmount,
      },
      include: { category: true },
    });
  }

  async delete(id: string, userId: string) {
    const debt = await prisma.debt.findFirst({
      where: { id, userId },
    });

    if (!debt) {
      throw ApiError.notFound('Debt not found');
    }

    return prisma.debt.delete({
      where: { id },
    });
  }

  async addPayment(debtId: string, userId: string, data: CreatePaymentInput) {
    const debt = await prisma.debt.findFirst({
      where: { id: debtId, userId },
    });

    if (!debt) {
      throw ApiError.notFound('Debt not found');
    }

    if (debt.remainingAmount <= 0) {
      throw ApiError.badRequest('This debt is already paid off');
    }

    const newRemainingAmount = Math.max(0, debt.remainingAmount - data.amount);

    const [payment] = await prisma.$transaction([
      prisma.debtPayment.create({
        data: {
          ...data,
          debtId,
        },
      }),
      prisma.debt.update({
        where: { id: debtId },
        data: { remainingAmount: newRemainingAmount },
      }),
    ]);

    return payment;
  }

  async getPayments(debtId: string, userId: string) {
    const debt = await prisma.debt.findFirst({
      where: { id: debtId, userId },
    });

    if (!debt) {
      throw ApiError.notFound('Debt not found');
    }

    return prisma.debtPayment.findMany({
      where: { debtId },
      orderBy: { date: 'desc' },
    });
  }

  async deletePayment(paymentId: string, userId: string) {
    const payment = await prisma.debtPayment.findFirst({
      where: { id: paymentId },
      include: { debt: true },
    });

    if (!payment || payment.debt.userId !== userId) {
      throw ApiError.notFound('Payment not found');
    }

    await prisma.$transaction([
      prisma.debtPayment.delete({
        where: { id: paymentId },
      }),
      prisma.debt.update({
        where: { id: payment.debtId },
        data: {
          remainingAmount: payment.debt.remainingAmount + payment.amount,
        },
      }),
    ]);
  }

  async getSummary(userId: string) {
    const debts = await prisma.debt.findMany({
      where: { userId },
    });

    const totalDebt = debts.reduce((sum, d) => sum + d.totalAmount, 0);
    const totalRemaining = debts.reduce((sum, d) => sum + d.remainingAmount, 0);
    const totalPaid = totalDebt - totalRemaining;
    const activeDebts = debts.filter((d) => d.remainingAmount > 0).length;
    const paidOffDebts = debts.filter((d) => d.remainingAmount <= 0).length;

    return {
      totalDebt,
      totalRemaining,
      totalPaid,
      activeDebts,
      paidOffDebts,
      debtCount: debts.length,
    };
  }
}

export const debtsService = new DebtsService();
