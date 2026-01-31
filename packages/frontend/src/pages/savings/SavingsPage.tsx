import { useState } from 'react';
import { Plus, Pencil, Trash2, PiggyBank } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  Card,
  CardBody,
  Button,
  Input,
  Modal,
  PageLoader,
  EmptyState,
  Badge,
} from '../../components/ui';
import {
  useSavings,
  useCreateSaving,
  useUpdateSaving,
  useDeleteSaving,
  useAddSavingDeposit,
} from '../../hooks';
import { formatCurrency, formatDate } from '../../utils/format';
import type { CreateSavingData, Saving, CreateDepositData } from '../../api/savings';

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'
];

export function SavingsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null);
  const [depositingSaving, setDepositingSaving] = useState<Saving | null>(null);

  const { data: savings, isLoading } = useSavings();
  const createSaving = useCreateSaving();
  const updateSaving = useUpdateSaving();
  const deleteSaving = useDeleteSaving();
  const addDeposit = useAddSavingDeposit();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSavingData>();

  const {
    register: registerDeposit,
    handleSubmit: handleSubmitDeposit,
    reset: resetDeposit,
    formState: { errors: depositErrors },
  } = useForm<CreateDepositData>();

  const openModal = (saving?: Saving) => {
    if (saving) {
      setEditingSaving(saving);
      reset({
        name: saving.name,
        targetAmount: saving.targetAmount,
        targetDate: saving.targetDate?.split('T')[0],
        description: saving.description || '',
        color: saving.color || defaultColors[0],
      });
    } else {
      setEditingSaving(null);
      reset({
        name: '',
        targetAmount: 0,
        targetDate: '',
        description: '',
        color: defaultColors[0],
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSaving(null);
    reset();
  };

  const openDepositModal = (saving: Saving) => {
    setDepositingSaving(saving);
    resetDeposit({
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      note: '',
    });
    setIsDepositModalOpen(true);
  };

  const closeDepositModal = () => {
    setIsDepositModalOpen(false);
    setDepositingSaving(null);
    resetDeposit();
  };

  const onSubmit = async (formData: CreateSavingData) => {
    const submitData = {
      ...formData,
      targetDate: formData.targetDate || undefined,
      description: formData.description || undefined,
    };

    if (editingSaving) {
      await updateSaving.mutateAsync({ id: editingSaving.id, data: submitData });
    } else {
      await createSaving.mutateAsync(submitData);
    }
    closeModal();
  };

  const onSubmitDeposit = async (formData: CreateDepositData) => {
    if (depositingSaving) {
      await addDeposit.mutateAsync({ savingId: depositingSaving.id, data: formData });
      closeDepositModal();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Estas seguro de eliminar esta meta de ahorro?')) {
      await deleteSaving.mutateAsync(id);
    }
  };

  if (isLoading) return <PageLoader />;

  const getProgressPercentage = (saving: Saving) => {
    return Math.min(100, Math.round((saving.currentAmount / saving.targetAmount) * 100));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Ahorros</h1>
          <p className="text-gray-500">Gestiona tus metas de ahorro</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva meta
        </Button>
      </div>

      {savings?.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              title="Sin metas de ahorro"
              description="Crea tu primera meta de ahorro"
              action={
                <Button onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear meta
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {savings?.map((saving) => (
            <Card key={saving.id}>
              <CardBody>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: saving.color || '#3B82F6' }}
                    >
                      <PiggyBank className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {saving.name}
                      </h3>
                      {saving.description && (
                        <p className="text-sm text-gray-500">{saving.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getProgressPercentage(saving) >= 100 ? (
                      <Badge variant="success">Completado</Badge>
                    ) : (
                      <Badge variant="warning">En progreso</Badge>
                    )}
                    <button
                      onClick={() => openModal(saving)}
                      className="p-2 text-gray-400 hover:text-primary-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(saving.id)}
                      className="p-2 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Meta</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatCurrency(saving.targetAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Ahorrado</p>
                    <p className="text-lg font-semibold text-green-600">
                      {formatCurrency(saving.currentAmount)}
                    </p>
                  </div>
                </div>

                {saving.targetDate && (
                  <p className="text-sm text-gray-500 mb-4">
                    Fecha objetivo: {formatDate(saving.targetDate)}
                  </p>
                )}

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-500">Progreso</span>
                    <span className="font-medium">{getProgressPercentage(saving)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="h-3 rounded-full transition-all"
                      style={{
                        width: `${getProgressPercentage(saving)}%`,
                        backgroundColor: saving.color || '#3B82F6',
                      }}
                    />
                  </div>
                </div>

                {getProgressPercentage(saving) < 100 && (
                  <Button
                    onClick={() => openDepositModal(saving)}
                    className="w-full"
                  >
                    <PiggyBank className="h-4 w-4 mr-2" />
                    Agregar deposito
                  </Button>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Saving Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingSaving ? 'Editar meta' : 'Nueva meta de ahorro'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            id="name"
            type="text"
            label="Nombre de la meta"
            placeholder="Ej: Vacaciones, Fondo de emergencia"
            error={errors.name?.message}
            {...register('name', {
              required: 'El nombre es requerido',
            })}
          />

          <Input
            id="targetAmount"
            type="number"
            step="1"
            label="Monto objetivo"
            error={errors.targetAmount?.message}
            {...register('targetAmount', {
              required: 'El monto es requerido',
              valueAsNumber: true,
              min: { value: 1, message: 'El monto debe ser mayor a 0' },
            })}
          />

          <Input
            id="targetDate"
            type="date"
            label="Fecha objetivo (opcional)"
            {...register('targetDate')}
          />

          <Input
            id="description"
            type="text"
            label="Descripcion (opcional)"
            {...register('description')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color
            </label>
            <div className="flex gap-2">
              {defaultColors.map((color) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    value={color}
                    {...register('color')}
                    className="sr-only"
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-transparent hover:border-gray-400"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createSaving.isPending || updateSaving.isPending}
            >
              {editingSaving ? 'Guardar cambios' : 'Crear meta'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Deposit Modal */}
      <Modal
        isOpen={isDepositModalOpen}
        onClose={closeDepositModal}
        title={`Agregar deposito - ${depositingSaving?.name}`}
      >
        <form onSubmit={handleSubmitDeposit(onSubmitDeposit)} className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500">Ahorrado</p>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(depositingSaving?.currentAmount || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Restante</p>
                <p className="text-xl font-bold text-gray-900">
                  {formatCurrency(
                    (depositingSaving?.targetAmount || 0) - (depositingSaving?.currentAmount || 0)
                  )}
                </p>
              </div>
            </div>
          </div>

          <Input
            id="depositAmount"
            type="number"
            step="1"
            label="Monto del deposito"
            error={depositErrors.amount?.message}
            {...registerDeposit('amount', {
              required: 'El monto es requerido',
              valueAsNumber: true,
              min: { value: 1, message: 'El monto debe ser mayor a 0' },
            })}
          />

          <Input
            id="depositDate"
            type="date"
            label="Fecha del deposito"
            error={depositErrors.date?.message}
            {...registerDeposit('date', {
              required: 'La fecha es requerida',
            })}
          />

          <Input
            id="note"
            type="text"
            label="Nota (opcional)"
            {...registerDeposit('note')}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeDepositModal}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={addDeposit.isPending}>
              Agregar deposito
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
