import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesApi, ExpenseQuery, CreateExpenseData, UpdateExpenseData } from '../api/expenses';
import toast from 'react-hot-toast';

export function useExpenses(query?: ExpenseQuery) {
  return useQuery({
    queryKey: ['expenses', query],
    queryFn: () => expensesApi.getAll(query),
  });
}

export function useExpense(id: string) {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expensesApi.getById(id),
    enabled: !!id,
  });
}

export function useExpensesByCategory(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['expenses', 'by-category', startDate, endDate],
    queryFn: () => expensesApi.getByCategory(startDate, endDate),
  });
}

export function useExpenseSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['expenses', 'summary', startDate, endDate],
    queryFn: () => expensesApi.getSummary(startDate, endDate),
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseData) => expensesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Gasto creado');
    },
    onError: () => {
      toast.error('Error al crear gasto');
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseData }) =>
      expensesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Gasto actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar gasto');
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Gasto eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar gasto');
    },
  });
}
