import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Select,
  Modal,
  PageLoader,
  EmptyState,
} from '../../components/ui';
import { useIncomes, useCreateIncome, useUpdateIncome, useDeleteIncome, useCategories } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/format';
import type { CreateIncomeData, Income } from '../../api/incomes';

export function IncomesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useIncomes({ page, limit: 10 });
  const { data: categories } = useCategories('INCOME');
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();
  const deleteIncome = useDeleteIncome();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateIncomeData>();

  const openModal = (income?: Income) => {
    if (income) {
      setEditingIncome(income);
      reset({
        amount: income.amount,
        description: income.description,
        source: income.source || '',
        date: income.date.split('T')[0],
        isRecurring: income.isRecurring,
        categoryId: income.categoryId || '',
      });
    } else {
      setEditingIncome(null);
      reset({
        amount: 0,
        description: '',
        source: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        categoryId: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingIncome(null);
    reset();
  };

  const onSubmit = async (formData: CreateIncomeData) => {
    const submitData = {
      ...formData,
      categoryId: formData.categoryId || undefined,
    };

    if (editingIncome) {
      await updateIncome.mutateAsync({ id: editingIncome.id, data: submitData });
    } else {
      await createIncome.mutateAsync(submitData);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Estas seguro de eliminar este ingreso?')) {
      await deleteIncome.mutateAsync(id);
    }
  };

  if (isLoading) return <PageLoader />;

  const categoryOptions = [
    { value: '', label: 'Sin categoria' },
    ...(categories?.map((c) => ({ value: c.id, label: c.name })) || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ingresos</h1>
          <p className="text-gray-500">Gestiona tus fuentes de ingreso</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo ingreso
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de ingresos
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          {data?.incomes.length === 0 ? (
            <EmptyState
              title="Sin ingresos"
              description="Agrega tu primer ingreso para comenzar a gestionar tus finanzas"
              action={
                <Button onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar ingreso
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descripcion
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data?.incomes.map((income) => (
                    <tr key={income.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {income.description}
                        </div>
                        {income.source && (
                          <div className="text-sm text-gray-500">
                            {income.source}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {income.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(income.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-green-600">
                        +{formatCurrency(income.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(income)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(income.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingIncome ? 'Editar ingreso' : 'Nuevo ingreso'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="amount"
            type="number"
            step="0.01"
            label="Monto"
            error={errors.amount?.message}
            {...register('amount', {
              required: 'El monto es requerido',
              valueAsNumber: true,
              min: { value: 0.01, message: 'El monto debe ser mayor a 0' },
            })}
          />

          <Input
            id="description"
            type="text"
            label="Descripcion"
            error={errors.description?.message}
            {...register('description', {
              required: 'La descripcion es requerida',
            })}
          />

          <Input
            id="source"
            type="text"
            label="Fuente (opcional)"
            {...register('source')}
          />

          <Input
            id="date"
            type="date"
            label="Fecha"
            error={errors.date?.message}
            {...register('date', {
              required: 'La fecha es requerida',
            })}
          />

          <Select
            id="categoryId"
            label="Categoria"
            options={categoryOptions}
            {...register('categoryId')}
          />

          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              {...register('isRecurring')}
            />
            <span className="ml-2 text-sm text-gray-700">Ingreso recurrente</span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createIncome.isPending || updateIncome.isPending}
            >
              {editingIncome ? 'Guardar cambios' : 'Crear ingreso'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
