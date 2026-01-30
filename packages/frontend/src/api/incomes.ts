import apiClient from './client';
import type { Category } from './categories';

export interface Income {
  id: string;
  amount: number;
  description: string;
  source?: string;
  date: string;
  isRecurring: boolean;
  userId: string;
  categoryId?: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncomeData {
  amount: number;
  description: string;
  source?: string;
  date: string;
  isRecurring?: boolean;
  categoryId?: string;
}

export interface UpdateIncomeData {
  amount?: number;
  description?: string;
  source?: string;
  date?: string;
  isRecurring?: boolean;
  categoryId?: string | null;
}

export interface IncomeQuery {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  source?: string;
  categoryId?: string;
}

export interface IncomeListResponse {
  incomes: Income[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface IncomeSummary {
  total: number;
  count: number;
  bySource: Array<{ source: string; total: number; count: number }>;
  byCategory: Array<{ category: Category | null; total: number; count: number }>;
}

export const incomesApi = {
  getAll: async (query?: IncomeQuery): Promise<IncomeListResponse> => {
    const response = await apiClient.get('/incomes', { params: query });
    return response.data.data;
  },

  getById: async (id: string): Promise<Income> => {
    const response = await apiClient.get(`/incomes/${id}`);
    return response.data.data;
  },

  create: async (data: CreateIncomeData): Promise<Income> => {
    const response = await apiClient.post('/incomes', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateIncomeData): Promise<Income> => {
    const response = await apiClient.patch(`/incomes/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/incomes/${id}`);
  },

  getSummary: async (startDate?: string, endDate?: string): Promise<IncomeSummary> => {
    const response = await apiClient.get('/incomes/summary', {
      params: { startDate, endDate },
    });
    return response.data.data;
  },
};
