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
  Badge,
} from '../../components/ui';
import { useExpenses, useCreateExpense, useUpdateExpense, useDeleteExpense, useCategories } from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/format';
import { cn } from '../../utils/cn';
import type { CreateExpenseData, Expense, ExpenseQuery } from '../../api/expenses';

type TabType = 'all' | 'FIXED' | 'VARIABLE';

export function ExpensesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [page, setPage] = useState(1);

  const query: ExpenseQuery = {
    page,
    limit: 10,
    ...(activeTab !== 'all' && { categoryType: activeTab }),
  };

  const { data, isLoading } = useExpenses(query);
  const { data: fixedCategories } = useCategories('FIXED');
  const { data: variableCategories } = useCategories('VARIABLE');
  const createExpense = useCreateExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const allCategories = [...(fixedCategories || []), ...(variableCategories || [])];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateExpenseData>();

  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      reset({
        amount: expense.amount,
        description: expense.description,
        date: expense.date.split('T')[0],
        isRecurring: expense.isRecurring,
        categoryId: expense.categoryId,
      });
    } else {
      setEditingExpense(null);
      reset({
        amount: 0,
        description: '',
        date: new Date().toISOString().split('T')[0],
        isRecurring: false,
        categoryId: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
    reset();
  };

  const onSubmit = async (formData: CreateExpenseData) => {
    if (editingExpense) {
      await updateExpense.mutateAsync({ id: editingExpense.id, data: formData });
    } else {
      await createExpense.mutateAsync(formData);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Estas seguro de eliminar este gasto?')) {
      await deleteExpense.mutateAsync(id);
    }
  };

  if (isLoading) return <PageLoader />;

  const categoryOptions = allCategories.map((c) => ({
    value: c.id,
    label: `${c.name} (${c.type === 'FIXED' ? 'Fijo' : 'Variable'})`,
  }));

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'FIXED', label: 'Fijos' },
    { key: 'VARIABLE', label: 'Variables' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
          <p className="text-gray-500">Gestiona tus gastos fijos y variables</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo gasto
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                setPage(1);
              }}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm',
                activeTab === tab.key
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Lista de gastos
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          {data?.expenses.length === 0 ? (
            <EmptyState
              title="Sin gastos"
              description="Agrega tu primer gasto para comenzar a gestionar tus finanzas"
              action={
                <Button onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar gasto
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
                  {data?.expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {expense.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-900">
                            {expense.category?.name}
                          </span>
                          <Badge
                            variant={expense.category?.type === 'FIXED' ? 'info' : 'warning'}
                          >
                            {expense.category?.type === 'FIXED' ? 'Fijo' : 'Variable'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-red-600">
                        -{formatCurrency(expense.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(expense)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
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
        title={editingExpense ? 'Editar gasto' : 'Nuevo gasto'}
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
            placeholder="Selecciona una categoria"
            error={errors.categoryId?.message}
            {...register('categoryId', {
              required: 'La categoria es requerida',
            })}
          />

          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              {...register('isRecurring')}
            />
            <span className="ml-2 text-sm text-gray-700">Gasto recurrente</span>
          </label>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createExpense.isPending || updateExpense.isPending}
            >
              {editingExpense ? 'Guardar cambios' : 'Crear gasto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
