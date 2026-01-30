import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Button, Input, Card, CardBody } from '../../components/ui';
import { useAuthStore } from '../../store/authStore';
import { authApi, LoginData } from '../../api/auth';
import toast from 'react-hot-toast';

export function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      login(response.user, response.accessToken, response.refreshToken);
      toast.success('Bienvenido de vuelta');
      navigate('/');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      toast.error(err.response?.data?.error || 'Error al iniciar sesion');
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
              Iniciar sesion
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                })}
              />

              <Button
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Iniciar sesion
              </Button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              No tienes cuenta?{' '}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-500 font-medium"
              >
                Registrate aqui
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
