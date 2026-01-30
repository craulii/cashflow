import apiClient from './client';
import type { Category } from './categories';

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  note?: string;
  debtId: string;
  createdAt: string;
}

export interface Debt {
  id: string;
  name: string;
  totalAmount: number;
  remainingAmount: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  startDate: string;
  userId: string;
  categoryId?: string;
  category?: Category;
  payments?: DebtPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateDebtData {
  name: string;
  totalAmount: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  startDate: string;
  categoryId?: string;
}

export interface UpdateDebtData {
  name?: string;
  totalAmount?: number;
  interestRate?: number | null;
  minimumPayment?: number | null;
  dueDate?: string | null;
  categoryId?: string | null;
}

export interface CreatePaymentData {
  amount: number;
  date: string;
  note?: string;
}

export interface DebtQuery {
  page?: number;
  limit?: number;
  isPaidOff?: boolean;
}

export interface DebtListResponse {
  debts: Debt[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface DebtSummary {
  totalDebt: number;
  totalRemaining: number;
  totalPaid: number;
  activeDebts: number;
  paidOffDebts: number;
  debtCount: number;
}

export const debtsApi = {
  getAll: async (query?: DebtQuery): Promise<DebtListResponse> => {
    const response = await apiClient.get('/debts', { params: query });
    return response.data.data;
  },

  getById: async (id: string): Promise<Debt> => {
    const response = await apiClient.get(`/debts/${id}`);
    return response.data.data;
  },

  create: async (data: CreateDebtData): Promise<Debt> => {
    const response = await apiClient.post('/debts', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateDebtData): Promise<Debt> => {
    const response = await apiClient.patch(`/debts/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/debts/${id}`);
  },

  addPayment: async (debtId: string, data: CreatePaymentData): Promise<DebtPayment> => {
    const response = await apiClient.post(`/debts/${debtId}/payments`, data);
    return response.data.data;
  },

  getPayments: async (debtId: string): Promise<DebtPayment[]> => {
    const response = await apiClient.get(`/debts/${debtId}/payments`);
    return response.data.data;
  },

  deletePayment: async (paymentId: string): Promise<void> => {
    await apiClient.delete(`/debts/payments/${paymentId}`);
  },

  getSummary: async (): Promise<DebtSummary> => {
    const response = await apiClient.get('/debts/summary');
    return response.data.data;
  },
};
