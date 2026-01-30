import apiClient from './client';
import type { Category } from './categories';

export interface DashboardSummary {
  income: number;
  expenses: number;
  balance: number;
  totalDebt: number;
  activeDebts: number;
}

export interface ExpenseCategory {
  category: Category;
  total: number;
}

export interface RecentTransaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  category?: Category;
}

export interface DashboardData {
  summary: DashboardSummary;
  expensesByCategory: ExpenseCategory[];
  recentTransactions: RecentTransaction[];
  period: {
    start: string;
    end: string;
  };
}

export interface MonthlyData {
  period: {
    year: number;
    month: number;
    start: string;
    end: string;
  };
  income: {
    total: number;
    count: number;
    byCategory: Array<{ category: Category | null; total: number; count: number }>;
  };
  expenses: {
    total: number;
    count: number;
    byCategory: Array<{ category: Category; total: number; count: number }>;
  };
  balance: number;
}

export interface ComparisonData {
  year: number;
  month: number;
  monthName: string;
  income: number;
  expenses: number;
  balance: number;
}

export interface TrendData {
  data: ComparisonData[];
  averages: {
    income: number;
    expenses: number;
    balance: number;
  };
  trends: {
    income: {
      direction: 'up' | 'down';
      percentage: number;
    };
    expenses: {
      direction: 'up' | 'down';
      percentage: number;
    };
  };
}

export const analyticsApi = {
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get('/analytics/dashboard');
    return response.data.data;
  },

  getMonthly: async (year?: number, month?: number): Promise<MonthlyData> => {
    const response = await apiClient.get('/analytics/monthly', {
      params: { year, month },
    });
    return response.data.data;
  },

  getComparison: async (months?: number): Promise<ComparisonData[]> => {
    const response = await apiClient.get('/analytics/comparison', {
      params: { months },
    });
    return response.data.data;
  },

  getTrends: async (months?: number): Promise<TrendData> => {
    const response = await apiClient.get('/analytics/trends', {
      params: { months },
    });
    return response.data.data;
  },
};
