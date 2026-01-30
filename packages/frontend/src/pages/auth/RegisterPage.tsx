import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button, Input, Card, CardBody } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { authApi, RegisterData } from '../../api/auth';
import toast from 'react-hot-toast';

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const password = watch('password');

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const { confirmPassword: _, ...registerData } = data;
      const response = await authApi.register(registerData);
      login(response.user, response.accessToken, response.refreshToken);
      toast.success('Cuenta creada exitosamente');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Error al crear cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary-600">CashFlow</h1>
          <p className="mt-2 text-gray-600">Gestion de economia del hogar</p>
        </div>

        <Card>
          <CardBody>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Crear cuenta
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                id="name"
                type="text"
                label="Nombre"
                placeholder="Tu nombre"
                error={errors.name?.message}
                {...register('name', {
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
                placeholder="tu@email.com"
                error={errors.email?.message}
                {...register('email', {
                  required: 'El correo es requerido',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Correo invalido',
                  },
                })}
              />

              <Input
                id="password"
                type="password"
                label="Contrasena"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password', {
                  required: 'La contrasena es requerida',
                  minLength: {
                    value: 6,
                    message: 'La contrasena debe tener al menos 6 caracteres',
                  },
                })}
              />

              <Input
                id="confirmPassword"
                type="password"
                label="Confirmar contrasena"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Confirma tu contrasena',
                  validate: (value) =>
                    value === password || 'Las contrasenas no coinciden',
                })}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Crear cuenta
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              Ya tienes cuenta?{' '}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Inicia sesion
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
