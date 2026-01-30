import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incomesApi, IncomeQuery, CreateIncomeData, UpdateIncomeData } from '../api/incomes';
import toast from 'react-hot-toast';

export function useIncomes(query?: IncomeQuery) {
  return useQuery({
    queryKey: ['incomes', query],
    queryFn: () => incomesApi.getAll(query),
  });
}

export function useIncome(id: string) {
  return useQuery({
    queryKey: ['incomes', id],
    queryFn: () => incomesApi.getById(id),
    enabled: !!id,
  });
}

export function useIncomeSummary(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['incomes', 'summary', startDate, endDate],
    queryFn: () => incomesApi.getSummary(startDate, endDate),
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateIncomeData) => incomesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Ingreso creado');
    },
    onError: () => {
      toast.error('Error al crear ingreso');
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncomeData }) =>
      incomesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Ingreso actualizado');
    },
    onError: () => {
      toast.error('Error al actualizar ingreso');
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => incomesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incomes'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Ingreso eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar ingreso');
    },
  });
}
