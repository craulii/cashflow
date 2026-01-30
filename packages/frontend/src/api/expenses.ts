import apiClient from './client';
import type { Category } from './categories';

export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  userId: string;
  categoryId: string;
  category: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CreateExpenseData {
  amount: number;
  description: string;
  date: string;
  isRecurring?: boolean;
  categoryId: string;
}

export interface UpdateExpenseData {
  amount?: number;
  description?: string;
  date?: string;
  isRecurring?: boolean;
  categoryId?: string;
}

export interface ExpenseQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  categoryId?: string;
  categoryType?: 'FIXED' | 'VARIABLE';
}

export interface ExpenseListResponse {
  expenses: Expense[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ExpenseByCategory {
  category: Category;
  total: number;
  count: number;
}

export interface ExpenseSummary {
  total: number;
  count: number;
  fixed: { total: number; count: number };
  variable: { total: number; count: number };
}

export const expensesApi = {
  getAll: async (query?: ExpenseQuery): Promise<ExpenseListResponse> => {
    const response = await apiClient.get('/expenses', { params: query });
    return response.data.data;
  },

  getById: async (id: string): Promise<Expense> => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data.data;
  },

  create: async (data: CreateExpenseData): Promise<Expense> => {
    const response = await apiClient.post('/expenses', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateExpenseData): Promise<Expense> => {
    const response = await apiClient.patch(`/expenses/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/expenses/${id}`);
  },

  getByCategory: async (startDate?: string, endDate?: string): Promise<ExpenseByCategory[]> => {
    const response = await apiClient.get('/expenses/by-category', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },

  getSummary: async (startDate?: string, endDate?: string): Promise<ExpenseSummary> => {
    const response = await apiClient.get('/expenses/summary', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },
};
