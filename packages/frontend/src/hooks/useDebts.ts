import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { debtsApi, DebtQuery, CreateDebtData, UpdateDebtData, CreatePaymentData } from '../api/debts';
import toast from 'react-hot-toast';

export function useDebts(query?: DebtQuery) {
  return useQuery({
    queryKey: ['debts', query],
    queryFn: () => debtsApi.getAll(query),
  });
}

export function useDebt(id: string) {
  return useQuery({
    queryKey: ['debts', id],
    queryFn: () => debtsApi.getById(id),
    enabled: !!id,
  });
}

export function useDebtSummary() {
  return useQuery({
    queryKey: ['debts', 'summary'],
    queryFn: () => debtsApi.getSummary(),
  });
}

export function useDebtPayments(debtId: string) {
  return useQuery({
    queryKey: ['debts', debtId, 'payments'],
    queryFn: () => debtsApi.getPayments(debtId),
    enabled: !!debtId,
  });
}

export function useCreateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDebtData) => debtsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Deuda creada');
    },
    onError: () => {
      toast.error('Error al crear deuda');
    },
  });
}

export function useUpdateDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDebtData }) =>
      debtsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Deuda actualizada');
    },
    onError: () => {
      toast.error('Error al actualizar deuda');
    },
  });
}

export function useDeleteDebt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => debtsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Deuda eliminada');
    },
    onError: () => {
      toast.error('Error al eliminar deuda');
    },
  });
}

export function useAddDebtPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ debtId, data }: { debtId: string; data: CreatePaymentData }) =>
      debtsApi.addPayment(debtId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Pago registrado');
    },
    onError: () => {
      toast.error('Error al registrar pago');
    },
  });
}

export function useDeleteDebtPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: string) => debtsApi.deletePayment(paymentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Pago eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar pago');
    },
  });
}
