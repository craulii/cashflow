# CashFlow - Gestión de Economía del Hogar

Aplicación web multi-usuario para gestión de economía del hogar con sistema de autenticación seguro, dashboard analítico y seguimiento completo de finanzas personales.

## Características

- **Autenticación segura** con JWT (access + refresh tokens)
- **Dashboard interactivo** con gráficos analíticos
- **Gestión de ingresos** con filtros y resúmenes
- **Gestión de gastos** categorizados (fijos y variables)
- **Seguimiento de deudas** con historial de pagos
- **Análisis mensual** y comparativo de finanzas

## Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + TypeScript |
| Base de Datos | SQLite + Prisma ORM |
| Autenticación | JWT + bcrypt |
| Gráficos | Recharts |
| Estilos | TailwindCSS |
| Estado | Zustand + React Query |

## Requisitos Previos

- Node.js >= 18.0.0
- pnpm >= 8.0.0

## Instalación

1. Clonar el repositorio:
```bash
git clone <repository-url>
cd cash
```

2. Instalar dependencias:
```bash
pnpm install
```

3. Configurar variables de entorno:
```bash
cp .env.example packages/backend/.env
```

4. Generar cliente Prisma y ejecutar migraciones:
```bash
pnpm db:generate
pnpm db:push
```

5. (Opcional) Ejecutar seed con datos de ejemplo:
```bash
pnpm db:seed
```

## Desarrollo

Iniciar ambos servidores (backend y frontend):
```bash
pnpm dev
```

O iniciar por separado:
```bash
# Backend (puerto 3001)
pnpm dev:backend

# Frontend (puerto 5173)
pnpm dev:frontend
```

## Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Inicia ambos servidores en modo desarrollo |
| `pnpm dev:backend` | Inicia solo el backend |
| `pnpm dev:frontend` | Inicia solo el frontend |
| `pnpm build` | Compila ambos proyectos |
| `pnpm db:generate` | Genera el cliente Prisma |
| `pnpm db:migrate` | Ejecuta migraciones pendientes |
| `pnpm db:push` | Sincroniza schema con BD (dev) |
| `pnpm db:seed` | Ejecuta seeders |
| `pnpm db:studio` | Abre Prisma Studio |

## Estructura del Proyecto

```
cash/
├── package.json
├── pnpm-workspace.yaml
├── .env.example
├── README.md
├── CLAUDE.md
│
└── packages/
    ├── backend/
    │   ├── prisma/schema.prisma
    │   └── src/
    │       ├── index.ts
    │       ├── app.ts
    │       ├── config/
    │       ├── middlewares/
    │       ├── modules/
    │       │   ├── auth/
    │       │   ├── users/
    │       │   ├── income/
    │       │   ├── expenses/
    │       │   ├── categories/
    │       │   ├── debts/
    │       │   └── analytics/
    │       └── utils/
    │
    └── frontend/
        └── src/
            ├── main.tsx
            ├── App.tsx
            ├── api/
            ├── components/
            ├── pages/
            ├── hooks/
            ├── store/
            ├── routes/
            └── utils/
```

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
- `GET /api/incomes/:id` - Obtener ingreso
- `PATCH /api/incomes/:id` - Actualizar ingreso
- `DELETE /api/incomes/:id` - Eliminar ingreso
- `GET /api/incomes/summary` - Resumen de ingresos

### Gastos
- `GET /api/expenses` - Listar gastos
- `POST /api/expenses` - Crear gasto
- `GET /api/expenses/:id` - Obtener gasto
- `PATCH /api/expenses/:id` - Actualizar gasto
- `DELETE /api/expenses/:id` - Eliminar gasto
- `GET /api/expenses/by-category` - Gastos por categoría

### Categorías
- `GET /api/categories` - Listar categorías
- `POST /api/categories` - Crear categoría
- `PATCH /api/categories/:id` - Actualizar categoría
- `DELETE /api/categories/:id` - Eliminar categoría

### Deudas
- `GET /api/debts` - Listar deudas
- `POST /api/debts` - Crear deuda
- `GET /api/debts/:id` - Obtener deuda
- `PATCH /api/debts/:id` - Actualizar deuda
- `DELETE /api/debts/:id` - Eliminar deuda
- `POST /api/debts/:id/payments` - Registrar pago
- `GET /api/debts/:id/payments` - Historial de pagos

### Analíticas
- `GET /api/analytics/dashboard` - Datos del dashboard
- `GET /api/analytics/monthly` - Resumen mensual
- `GET /api/analytics/comparison` - Comparativa
- `GET /api/analytics/trends` - Tendencias

## Licencia

MIT
