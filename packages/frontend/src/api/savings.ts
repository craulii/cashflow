import apiClient from './client';

export interface SavingDeposit {
  id: string;
  amount: number;
  date: string;
  note?: string;
  savingId: string;
  createdAt: string;
}

export interface Saving {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  description?: string;
  color?: string;
  userId: string;
  deposits?: SavingDeposit[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSavingData {
  name: string;
  targetAmount: number;
  targetDate?: string;
  description?: string;
  color?: string;
}

export interface CreateDepositData {
  amount: number;
  date: string;
  note?: string;
}

export interface SavingSummary {
  totalSavings: number;
  totalTarget: number;
  totalCurrent: number;
  totalRemaining: number;
  percentComplete: number;
}

export const savingsApi = {
  getAll: async (): Promise<Saving[]> => {
    const response = await apiClient.get('/savings');
    return response.data.data;
  },

  getById: async (id: string): Promise<Saving> => {
    const response = await apiClient.get(`/savings/${id}`);
    return response.data.data;
  },

  create: async (data: CreateSavingData): Promise<Saving> => {
    const response = await apiClient.post('/savings', data);
    return response.data.data;
  },

  update: async (id: string, data: Partial<CreateSavingData>): Promise<Saving> => {
    const response = await apiClient.patch(`/savings/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/savings/${id}`);
  },

  addDeposit: async (savingId: string, data: CreateDepositData): Promise<SavingDeposit> => {
    const response = await apiClient.post(`/savings/${savingId}/deposits`, data);
    return response.data.data;
  },

  getDeposits: async (savingId: string): Promise<SavingDeposit[]> => {
    const response = await apiClient.get(`/savings/${savingId}/deposits`);
    return response.data.data;
  },

  getSummary: async (): Promise<SavingSummary> => {
    const response = await apiClient.get('/savings/summary');
    return response.data.data;
  },
};
