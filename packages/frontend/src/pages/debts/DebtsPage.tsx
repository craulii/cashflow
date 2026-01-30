import { useState } from 'react';
import { Plus, Pencil, Trash2, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardBody,
  Button,
  Input,
  Select,
  Modal,
  PageLoader,
  EmptyState,
  Badge,
} from '../../components/ui';
import {
  useDebts,
  useCreateDebt,
  useUpdateDebt,
  useDeleteDebt,
  useAddDebtPayment,
  useCategories,
} from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/format';
import type { CreateDebtData, Debt, CreatePaymentData } from '../../api/debts';

export function DebtsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);
  const [payingDebt, setPayingDebt] = useState<Debt | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useDebts({ page, limit: 10 });
  const { data: categories } = useCategories('DEBT');
  const createDebt = useCreateDebt();
  const updateDebt = useUpdateDebt();
  const deleteDebt = useDeleteDebt();
  const addPayment = useAddDebtPayment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateDebtData>();

  const {
    register: registerPayment,
    handleSubmit: handleSubmitPayment,
    reset: resetPayment,
    formState: { errors: paymentErrors },
  } = useForm<CreatePaymentData>();

  const openModal = (debt?: Debt) => {
    if (debt) {
      setEditingDebt(debt);
      reset({
        name: debt.name,
        totalAmount: debt.totalAmount,
        interestRate: debt.interestRate || undefined,
        minimumPayment: debt.minimumPayment || undefined,
        dueDate: debt.dueDate?.split('T')[0],
        startDate: debt.startDate.split('T')[0],
        categoryId: debt.categoryId || '',
      });
    } else {
      setEditingDebt(null);
      reset({
        name: '',
        totalAmount: 0,
        startDate: new Date().toISOString().split('T')[0],
        categoryId: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDebt(null);
    reset();
  };

  const openPaymentModal = (debt: Debt) => {
    setPayingDebt(debt);
    resetPayment({
      amount: debt.minimumPayment || 0,
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setIsPaymentModalOpen(true);
  };

  const closePaymentModal = () => {
    setIsPaymentModalOpen(false);
    setPayingDebt(null);
    resetPayment();
  };

  const onSubmit = async (formData: CreateDebtData) => {
    const submitData = {
      ...formData,
      categoryId: formData.categoryId || undefined,
    };

    if (editingDebt) {
      await updateDebt.mutateAsync({ id: editingDebt.id, data: submitData });
    } else {
      await createDebt.mutateAsync(submitData);
    }
    closeModal();
  };

  const onSubmitPayment = async (formData: CreatePaymentData) => {
    if (payingDebt) {
      await addPayment.mutateAsync({ debtId: payingDebt.id, data: formData });
      closePaymentModal();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Estas seguro de eliminar esta deuda?')) {
      await deleteDebt.mutateAsync(id);
    }
  };

  if (isLoading) return <PageLoader />;

  const categoryOptions = [
    { value: '', label: 'Sin categoria' },
    ...(categories?.map((c) => ({ value: c.id, label: c.name })) || []),
  ];

  const getProgressPercentage = (debt: Debt) => {
    const paid = debt.totalAmount - debt.remainingAmount;
    return Math.round((paid / debt.totalAmount) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deudas</h1>
          <p className="text-gray-500">Gestiona y da seguimiento a tus deudas</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva deuda
        </Button>
      </div>

      {data?.debts.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Sin deudas"
              description="Felicidades! No tienes deudas registradas"
              action={
                <Button onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Registrar deuda
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6">
          {data?.debts.map((debt) => (
            <Card key={debt.id}>
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {debt.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {debt.category?.name || 'Sin categoria'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {debt.remainingAmount <= 0 ? (
                      <Badge variant="success">Pagada</Badge>
                    ) : (
                      <Badge variant="warning">Activa</Badge>
                    )}
                    <button
                      onClick={() => openModal(debt)}
                      className="p-2 text-gray-400 hover:text-primary-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(debt.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(debt.totalAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Restante</p>
                    <p className="text-lg font-semibold text-red-600">
                      {formatCurrency(debt.remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Pagado</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(debt.totalAmount - debt.remainingAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Fecha inicio</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(debt.startDate)}
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progreso</span>
                    <span className="font-medium">{getProgressPercentage(debt)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full transition-all"
                      style={{ width: `${getProgressPercentage(debt)}%` }}
                    />
                  </div>
                </div>

                {debt.remainingAmount > 0 && (
                  <Button
                    onClick={() => openPaymentModal(debt)}
                    className="w-full"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Registrar pago
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Anterior
          </Button>
          <span className="px-4 py-2 text-sm text-gray-700">
            Pagina {page} de {data.pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            disabled={page === data.pagination.totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}

      {/* Create/Edit Debt Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingDebt ? 'Editar deuda' : 'Nueva deuda'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="name"
            type="text"
            label="Nombre"
            error={errors.name?.message}
            {...register('name', {
              required: 'El nombre es requerido',
            })}
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              label="Monto total"
              error={errors.totalAmount?.message}
              {...register('totalAmount', {
                required: 'El monto es requerido',
                valueAsNumber: true,
                min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
              })}
            />

            <Input
              id="interestRate"
              type="number"
              step="0.01"
              label="Tasa de interes % (opcional)"
              {...register('interestRate', { valueAsNumber: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="minimumPayment"
              type="number"
              step="0.01"
              label="Pago minimo (opcional)"
              {...register('minimumPayment', { valueAsNumber: true })}
            />

            <Select
              id="categoryId"
              label="Categoria"
              options={categoryOptions}
              {...register('categoryId')}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="startDate"
              type="date"
              label="Fecha de inicio"
              error={errors.startDate?.message}
              {...register('startDate', {
                required: 'La fecha de inicio es requerida',
              })}
            />

            <Input
              id="dueDate"
              type="date"
              label="Fecha de vencimiento (opcional)"
              {...register('dueDate')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createDebt.isPending || updateDebt.isPending}
            >
              {editingDebt ? 'Guardar cambios' : 'Crear deuda'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={closePaymentModal}
        title={`Registrar pago - ${payingDebt?.name}`}
      >
        <form onSubmit={handleSubmitPayment(onSubmitPayment)} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">Saldo pendiente</p>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(payingDebt?.remainingAmount || 0)}
            </p>
          </div>

          <Input
            id="paymentAmount"
            type="number"
            step="0.01"
            label="Monto del pago"
            error={paymentErrors.amount?.message}
            {...registerPayment('amount', {
              required: 'El monto es requerido',
              valueAsNumber: true,
              min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
              max: {
                value: payingDebt?.remainingAmount || 0,
                message: 'El monto no puede ser mayor al saldo pendiente',
              },
            })}
          />

          <Input
            id="paymentDate"
            type="date"
            label="Fecha del pago"
            error={paymentErrors.date?.message}
            {...registerPayment('date', {
              required: 'La fecha es requerida',
            })}
          />

          <Input
            id="note"
            type="text"
            label="Nota (opcional)"
            {...registerPayment('note')}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closePaymentModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={addPayment.isPending}>
              Registrar pago
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
