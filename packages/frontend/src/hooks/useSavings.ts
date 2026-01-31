import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { savingsApi, CreateSavingData, CreateDepositData } from '../api/savings';
import toast from 'react-hot-toast';

export function useSavings() {
  return useQuery({
    queryKey: ['savings'],
    queryFn: () => savingsApi.getAll(),
  });
}

export function useSaving(id: string) {
  return useQuery({
    queryKey: ['savings', id],
    queryFn: () => savingsApi.getById(id),
    enabled: !!id,
  });
}

export function useSavingSummary() {
  return useQuery({
    queryKey: ['savings', 'summary'],
    queryFn: () => savingsApi.getSummary(),
  });
}

export function useSavingDeposits(savingId: string) {
  return useQuery({
    queryKey: ['savings', savingId, 'deposits'],
    queryFn: () => savingsApi.getDeposits(savingId),
    enabled: !!savingId,
  });
}

export function useCreateSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSavingData) => savingsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Meta de ahorro creada');
    },
    onError: () => {
      toast.error('Error al crear meta de ahorro');
    },
  });
}

export function useUpdateSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateSavingData> }) =>
      savingsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Meta de ahorro actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar meta de ahorro');
    },
  });
}

export function useDeleteSaving() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => savingsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Meta de ahorro eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar meta de ahorro');
    },
  });
}

export function useAddSavingDeposit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ savingId, data }: { savingId: string; data: CreateDepositData }) =>
      savingsApi.addDeposit(savingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savings'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Deposito registrado');
    },
    onError: () => {
      toast.error('Error al registrar deposito');
    },
  });
}
