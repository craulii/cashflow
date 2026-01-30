import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardHeader, CardBody, Button, Input } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import toast from 'react-hot-toast';

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    watch,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>();

  const newPassword = watch('newPassword');

  const onSubmitProfile = async (data: ProfileFormData) => {
    setIsUpdatingProfile(true);
    try {
      const response = await apiClient.patch('/users/me', data);
      setUser(response.data.data);
      toast.success('Perfil actualizado');
    } catch {
      toast.error('Error al actualizar perfil');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    setIsUpdatingPassword(true);
    try {
      await apiClient.patch('/users/me', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Contrasena actualizada');
      resetPassword();
    } catch {
      toast.error('Error al actualizar contrasena');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuracion</h1>
        <p className="text-gray-500">Administra tu cuenta y preferencias</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Informacion del perfil
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4 max-w-md">
            <Input
              id="name"
              type="text"
              label="Nombre"
              error={profileErrors.name?.message}
              {...registerProfile('name', {
                required: 'El nombre es requerido',
                minLength: {
                  value: 2,
                  message: 'El nombre debe tener al menos 2 caracteres',
                },
              })}
            />

            <Input
              id="email"
              type="email"
              label="Correo electronico"
              error={profileErrors.email?.message}
              {...registerProfile('email', {
                required: 'El correo es requerido',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Correo invalido',
                },
              })}
            />

            <Button type="submit" isLoading={isUpdatingProfile}>
              Guardar cambios
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Password Settings */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Cambiar contrasena
          </h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4 max-w-md">
            <Input
              id="currentPassword"
              type="password"
              label="Contrasena actual"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword', {
                required: 'La contrasena actual es requerida',
              })}
            />

            <Input
              id="newPassword"
              type="password"
              label="Nueva contrasena"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword', {
                required: 'La nueva contrasena es requerida',
                minLength: {
                  value: 6,
                  message: 'La contrasena debe tener al menos 6 caracteres',
                },
              })}
            />

            <Input
              id="confirmPassword"
              type="password"
              label="Confirmar nueva contrasena"
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword', {
                required: 'Confirma tu nueva contrasena',
                validate: (value) =>
                  value === newPassword || 'Las contrasenas no coinciden',
              })}
            />

            <Button type="submit" isLoading={isUpdatingPassword}>
              Cambiar contrasena
            </Button>
          </form>
        </CardBody>
      </Card>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Informacion de la cuenta
          </h2>
        </CardHeader>
        <CardBody>
          <div className="space-y-2 text-sm">
            <p className="text-gray-500">
              <span className="font-medium text-gray-700">ID de usuario:</span>{' '}
              {user?.id}
            </p>
            <p className="text-gray-500">
              <span className="font-medium text-gray-700">Cuenta creada:</span>{' '}
              {user?.createdAt && new Date(user.createdAt).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
