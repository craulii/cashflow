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
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../hooks';
import { cn } from '../../utils/cn';
import type { Category, CreateCategoryData, CategoryType } from '../../api/categories';

type TabType = CategoryType | 'all';

export function CategoriesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCategoryData>();

  const openModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      reset({
        name: category.name,
        type: category.type,
        icon: category.icon || '',
        color: category.color || '#3B82F6',
      });
    } else {
      setEditingCategory(null);
      reset({
        name: '',
        type: 'VARIABLE',
        icon: '',
        color: '#3B82F6',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (formData: CreateCategoryData) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({
        id: editingCategory.id,
        data: {
          name: formData.name,
          icon: formData.icon,
          color: formData.color,
        },
      });
    } else {
      await createCategory.mutateAsync(formData);
    }
    closeModal();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Estas seguro de eliminar esta categoria?')) {
      await deleteCategory.mutateAsync(id);
    }
  };

  if (isLoading) return <PageLoader />;

  const filteredCategories = categories?.filter((c) =>
    activeTab === 'all' ? true : c.type === activeTab
  );

  const typeOptions = [
    { value: 'FIXED', label: 'Gasto fijo' },
    { value: 'VARIABLE', label: 'Gasto variable' },
    { value: 'DEBT', label: 'Deuda' },
    { value: 'INCOME', label: 'Ingreso' },
  ];

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'FIXED', label: 'Gastos fijos' },
    { key: 'VARIABLE', label: 'Gastos variables' },
    { key: 'DEBT', label: 'Deudas' },
    { key: 'INCOME', label: 'Ingresos' },
  ];

  const getTypeBadge = (type: CategoryType) => {
    const variants: Record<CategoryType, { variant: 'info' | 'warning' | 'danger' | 'success'; label: string }> = {
      FIXED: { variant: 'info', label: 'Fijo' },
      VARIABLE: { variant: 'warning', label: 'Variable' },
      DEBT: { variant: 'danger', label: 'Deuda' },
      INCOME: { variant: 'success', label: 'Ingreso' },
    };
    return variants[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-500">Gestiona las categorias de tus transacciones</p>
        </div>
        <Button onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva categoria
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
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
            Lista de categorias
          </h2>
        </CardHeader>
        <CardBody className="p-0">
          {filteredCategories?.length === 0 ? (
            <EmptyState
              title="Sin categorias"
              description="Crea una categoria personalizada para organizar mejor tus finanzas"
              action={
                <Button onClick={() => openModal()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear categoria
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredCategories?.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <div
                      className="w-4 h-4 rounded-full mr-3"
                      style={{ backgroundColor: category.color || '#9ca3af' }}
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {category.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={getTypeBadge(category.type).variant}>
                          {getTypeBadge(category.type).label}
                        </Badge>
                        {category.isDefault && (
                          <Badge>Por defecto</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {!category.isDefault && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openModal(category)}
                        className="p-2 text-gray-400 hover:text-primary-600"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingCategory ? 'Editar categoria' : 'Nueva categoria'}
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

          {!editingCategory && (
            <Select
              id="type"
              label="Tipo"
              options={typeOptions}
              error={errors.type?.message}
              {...register('type', {
                required: 'El tipo es requerido',
              })}
            />
          )}

          <Input
            id="icon"
            type="text"
            label="Icono (opcional)"
            placeholder="ej: home, car, utensils"
            {...register('icon')}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              className="h-10 w-full rounded-md border border-gray-300 cursor-pointer"
              {...register('color')}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button
              type="submit"
              isLoading={createCategory.isPending || updateCategory.isPending}
            >
              {editingCategory ? 'Guardar cambios' : 'Crear categoria'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
