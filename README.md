# CashFlow - Gestión de Economía del Hogar

Aplicación web multi-usuario para gestión de economía del hogar con sistema de autenticación seguro, dashboard analítico y seguimiento completo de finanzas personales.

## Características

- **Autenticación segura** con JWT (access + refresh tokens)
- **Dashboard interactivo** con gráficos analíticos
- **Gestión de ingresos** con filtros y resúmenes
- **Gestión de gastos** categorizados (fijos y variables)
- **Seguimiento de deudas** con historial de pagos
- **Gestión de ahorros** con metas y seguimiento
- **Categorías personalizables** creadas por el usuario
- **Análisis mensual** y comparativo de finanzas

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express + TypeScript (Vercel Serverless) |
| Frontend | React + Vite + TypeScript |
| Base de Datos | PostgreSQL (Supabase) + Prisma ORM |
| Autenticación | JWT + bcrypt |
| Gráficos | Recharts |
| Estilos | TailwindCSS |
| Estado | Zustand + React Query |
| Deploy | Vercel |

## Demo

**URL Producción:** https://cash-livid-pi.vercel.app

## Requisitos Previos

- Node.js >= 18.0.0
- npm >= 9.0.0
- Cuenta en Supabase (gratis)
- Cuenta en Vercel (gratis)

## Instalación Local

1. Clonar el repositorio:
```bash
git clone https://github.com/craulii/cashflow.git
cd cashflow
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
```bash
# Crear archivo .env en la raíz con:
DATABASE_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres"
JWT_SECRET="tu-secret-key"
JWT_REFRESH_SECRET="tu-refresh-secret-key"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Crear packages/frontend/.env con:
VITE_API_URL=http://localhost:3001/api
```

4. Configurar base de datos:
```bash
npm run db:push    # Crear tablas
npm run db:seed    # Crear categorías por defecto
```

5. Iniciar desarrollo:
```bash
npm run dev
```

## Despliegue en Vercel

### 1. Configurar Supabase

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Obtener la URL de conexión (Transaction mode, puerto 6543):
   ```
   postgresql://postgres.PROJECT:PASSWORD@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 2. Configurar Vercel

1. Importar repositorio en [vercel.com](https://vercel.com)
2. Configurar variables de entorno:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL de Supabase con `?pgbouncer=true` |
| `DIRECT_URL` | URL directa de Supabase (puerto 5432) |
| `JWT_SECRET` | Clave secreta para tokens |
| `JWT_REFRESH_SECRET` | Clave secreta para refresh tokens |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |

3. Deploy automático

### Notas importantes de despliegue

- **Root Directory:** Dejar vacío o `./`
- **Framework:** Other (no Vite)
- **DATABASE_URL debe usar el pooler** de Supabase con `?pgbouncer=true` para evitar errores de "prepared statement already exists"
- **VITE_API_URL** en frontend debe ser `/api` para producción

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia ambos servidores en modo desarrollo |
| `npm run dev:backend` | Inicia solo el backend |
| `npm run dev:frontend` | Inicia solo el frontend |
| `npm run build` | Compila el proyecto |
| `npm run db:push` | Sincroniza schema con BD |
| `npm run db:seed` | Ejecuta seeders |
| `npm run db:studio` | Abre Prisma Studio |

## API Endpoints

### Autenticación
- `POST /api/auth/register` - Registro de usuario
- `POST /api/auth/login` - Inicio de sesión
- `POST /api/auth/logout` - Cerrar sesión
- `POST /api/auth/refresh` - Refrescar token

### Usuarios
- `GET /api/users/me` - Obtener perfil
- `PATCH /api/users/me` - Actualizar perfil

### Ingresos
- `GET /api/incomes` - Listar ingresos
- `POST /api/incomes` - Crear ingreso
- `PATCH /api/incomes/:id` - Actualizar ingreso
- `DELETE /api/incomes/:id` - Eliminar ingreso

### Gastos
- `GET /api/expenses` - Listar gastos
- `POST /api/expenses` - Crear gasto
- `PATCH /api/expenses/:id` - Actualizar gasto
- `DELETE /api/expenses/:id` - Eliminar gasto

### Categorías
- `GET /api/categories` - Listar categorías (default + usuario)
- `POST /api/categories` - Crear categoría personalizada
- `PATCH /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Deudas
- `GET /api/debts` - Listar deudas
- `POST /api/debts` - Crear deuda
- `PATCH /api/debts/:id` - Actualizar deuda
- `DELETE /api/debts/:id` - Eliminar deuda
- `POST /api/debts/:id/payments` - Registrar pago

### Ahorros
- `GET /api/savings` - Listar metas de ahorro
- `POST /api/savings` - Crear meta de ahorro
- `PATCH /api/savings/:id` - Actualizar meta
- `DELETE /api/savings/:id` - Eliminar meta
- `POST /api/savings/:id/deposits` - Agregar depósito

### Analíticas
- `GET /api/analytics/dashboard` - Datos del dashboard
- `GET /api/analytics/monthly` - Resumen mensual

## Licencia

MIT
