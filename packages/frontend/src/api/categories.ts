import apiClient from './client';

export type CategoryType = 'FIXED' | 'VARIABLE' | 'DEBT' | 'INCOME';

export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isDefault: boolean;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryData {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryData {
  name?: string;
  icon?: string;
  color?: string;
}

export const categoriesApi = {
  getAll: async (type?: CategoryType): Promise<Category[]> => {
    const params = type ? { type } : {};
    const response = await apiClient.get('/categories', { params });
    return response.data.data;
  },

  getById: async (id: string): Promise<Category> => {
    const response = await apiClient.get(`/categories/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCategoryData): Promise<Category> => {
    const response = await apiClient.post('/categories', data);
    return response.data.data;
  },

  update: async (id: string, data: UpdateCategoryData): Promise<Category> => {
    const response = await apiClient.patch(`/categories/${id}`, data);
    return response.data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/categories/${id}`);
  },
};
