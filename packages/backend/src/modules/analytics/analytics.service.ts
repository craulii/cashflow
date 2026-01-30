import { prisma } from '../../config/prisma.js';

export class AnalyticsService {
  async getDashboard(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const [
      totalIncome,
      totalExpenses,
      expensesByCategory,
      debtsSummary,
      recentTransactions,
    ] = await Promise.all([
      // Total income this month
      prisma.income.aggregate({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),

      // Total expenses this month
      prisma.expense.aggregate({
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),

      // Expenses by category this month
      prisma.expense.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          date: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),

      // Debts summary
      prisma.debt.aggregate({
        where: { userId },
        _sum: { remainingAmount: true },
        _count: true,
      }),

      // Recent transactions (last 5)
      this.getRecentTransactions(userId, 5),
    ]);

    // Get category details
    const categoryIds = expensesByCategory.map((e) => e.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    const income = totalIncome._sum.amount || 0;
    const expenses = totalExpenses._sum.amount || 0;
    const balance = income - expenses;

    return {
      summary: {
        income,
        expenses,
        balance,
        totalDebt: debtsSummary._sum.remainingAmount || 0,
        activeDebts: debtsSummary._count,
      },
      expensesByCategory: expensesByCategory.map((e) => ({
        category: categoryMap.get(e.categoryId),
        total: e._sum.amount || 0,
      })),
      recentTransactions,
      period: {
        start: startOfMonth.toISOString(),
        end: endOfMonth.toISOString(),
      },
    };
  }

  async getMonthly(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [incomes, expenses, expensesByCategory, incomesByCategory] = await Promise.all([
      prisma.income.aggregate({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.expense.aggregate({
        where: {
          userId,
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.getExpensesByCategory(userId, startDate, endDate),
      this.getIncomesByCategory(userId, startDate, endDate),
    ]);

    return {
      period: { year, month, start: startDate.toISOString(), end: endDate.toISOString() },
      income: {
        total: incomes._sum.amount || 0,
        count: incomes._count,
        byCategory: incomesByCategory,
      },
      expenses: {
        total: expenses._sum.amount || 0,
        count: expenses._count,
        byCategory: expensesByCategory,
      },
      balance: (incomes._sum.amount || 0) - (expenses._sum.amount || 0),
    };
  }

  async getComparison(userId: string, months: number = 6) {
    const now = new Date();
    const results = [];

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const [income, expenses] = await Promise.all([
        prisma.income.aggregate({
          where: {
            userId,
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.expense.aggregate({
          where: {
            userId,
            date: { gte: startDate, lte: endDate },
          },
          _sum: { amount: true },
        }),
      ]);

      results.push({
        year,
        month,
        monthName: startDate.toLocaleString('es-ES', { month: 'short' }),
        income: income._sum.amount || 0,
        expenses: expenses._sum.amount || 0,
        balance: (income._sum.amount || 0) - (expenses._sum.amount || 0),
      });
    }

    return results.reverse();
  }

  async getTrends(userId: string, months: number = 12) {
    const comparison = await this.getComparison(userId, months);

    // Calculate trends
    const incomeValues = comparison.map((c) => c.income);
    const expenseValues = comparison.map((c) => c.expenses);
    const balanceValues = comparison.map((c) => c.balance);

    const avgIncome = incomeValues.reduce((a, b) => a + b, 0) / incomeValues.length;
    const avgExpenses = expenseValues.reduce((a, b) => a + b, 0) / expenseValues.length;
    const avgBalance = balanceValues.reduce((a, b) => a + b, 0) / balanceValues.length;

    // Calculate trend direction (comparing last 3 months vs previous 3 months)
    const recentIncome = incomeValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousIncome = incomeValues.slice(-6, -3).reduce((a, b) => a + b, 0) / 3 || recentIncome;

    const recentExpenses = expenseValues.slice(-3).reduce((a, b) => a + b, 0) / 3;
    const previousExpenses = expenseValues.slice(-6, -3).reduce((a, b) => a + b, 0) / 3 || recentExpenses;

    return {
      data: comparison,
      averages: {
        income: avgIncome,
        expenses: avgExpenses,
        balance: avgBalance,
      },
      trends: {
        income: {
          direction: recentIncome >= previousIncome ? 'up' : 'down',
          percentage: previousIncome > 0 ? ((recentIncome - previousIncome) / previousIncome) * 100 : 0,
        },
        expenses: {
          direction: recentExpenses >= previousExpenses ? 'up' : 'down',
          percentage: previousExpenses > 0 ? ((recentExpenses - previousExpenses) / previousExpenses) * 100 : 0,
        },
      },
    };
  }

  private async getRecentTransactions(userId: string, limit: number) {
    const [incomes, expenses] = await Promise.all([
      prisma.income.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: limit,
      }),
      prisma.expense.findMany({
        where: { userId },
        include: { category: true },
        orderBy: { date: 'desc' },
        take: limit,
      }),
    ]);

    const transactions = [
      ...incomes.map((i) => ({ ...i, type: 'income' as const })),
      ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ];

    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  private async getExpensesByCategory(userId: string, startDate: Date, endDate: Date) {
    const grouped = await prisma.expense.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    const categoryIds = grouped.map((g) => g.categoryId);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return grouped.map((g) => ({
      category: categoryMap.get(g.categoryId),
      total: g._sum.amount || 0,
      count: g._count,
    }));
  }

  private async getIncomesByCategory(userId: string, startDate: Date, endDate: Date) {
    const grouped = await prisma.income.groupBy({
      by: ['categoryId'],
      where: {
        userId,
        date: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _count: true,
    });

    const categoryIds = grouped.map((g) => g.categoryId).filter((id): id is string => id !== null);
    const categories = await prisma.category.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c]));

    return grouped.map((g) => ({
      category: g.categoryId ? categoryMap.get(g.categoryId) : null,
      total: g._sum.amount || 0,
      count: g._count,
    }));
  }
}

export const analyticsService = new AnalyticsService();
