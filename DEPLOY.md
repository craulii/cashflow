# Guia de Despliegue - CashFlow

## 1. Configurar Supabase (Base de Datos)

### Paso 1: Crear cuenta y proyecto
1. Ve a [supabase.com](https://supabase.com) y crea una cuenta gratuita
2. Crea un nuevo proyecto:
   - Nombre: `cashflow`
   - Region: Selecciona la mas cercana a tus usuarios
   - Password: Genera una contrasena segura (guardala!)

### Paso 2: Obtener las URLs de conexion
1. Ve a **Project Settings** > **Database**
2. Scroll hasta **Connection string**
3. Selecciona **URI** y copia las dos URLs:

**Transaction mode (para Prisma):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

**Session mode (para migraciones):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

## 2. Configurar Vercel

### Paso 1: Importar proyecto
1. Ve a [vercel.com](https://vercel.com) e inicia sesion con GitHub
2. Click en **Add New** > **Project**
3. Importa el repositorio `cashflow`

### Paso 2: Configurar variables de entorno
En la configuracion del proyecto, agrega estas variables:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL de Supabase (Transaction mode con puerto 6543) |
| `DIRECT_URL` | URL de Supabase (Session mode con puerto 5432) |
| `JWT_SECRET` | Una clave secreta larga y aleatoria |
| `JWT_REFRESH_SECRET` | Otra clave secreta diferente |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |

### Paso 3: Deploy
1. Click en **Deploy**
2. Espera a que termine el build

## 3. Inicializar la Base de Datos

Despues del primer deploy, necesitas crear las tablas y datos iniciales.

### Opcion A: Desde tu maquina local
```bash
# Configura las variables de entorno localmente
export DATABASE_URL="tu-url-de-supabase"
export DIRECT_URL="tu-direct-url-de-supabase"

# Ejecuta la migracion
npm run db:push

# Ejecuta el seed (categorias por defecto)
npm run db:seed
```

### Opcion B: Usando Vercel CLI
```bash
# Instala Vercel CLI
npm i -g vercel

# Conecta con tu proyecto
vercel link

# Ejecuta con las variables de Vercel
vercel env pull .env.local
npm run db:push
npm run db:seed
```

## 4. Verificar el Despliegue

1. Abre la URL de tu proyecto en Vercel
2. Deberia cargar la pagina de login
3. Registra un nuevo usuario
4. Verifica que puedes:
   - Iniciar sesion
   - Ver el dashboard
   - Agregar ingresos/gastos
   - Ver las categorias por defecto

## Troubleshooting

### Error: "Can't reach database server"
- Verifica que las URLs de Supabase estan correctas
- Asegurate de usar el puerto correcto (6543 para DATABASE_URL, 5432 para DIRECT_URL)
- Revisa que la contrasena no tenga caracteres especiales sin escapar

### Error: "Table does not exist"
- Ejecuta `npm run db:push` para crear las tablas
- Ejecuta `npm run db:seed` para las categorias por defecto

### Error: "Invalid token"
- Verifica que JWT_SECRET y JWT_REFRESH_SECRET estan configurados en Vercel
- Deben ser strings largos y aleatorios

## URLs Importantes

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **GitHub Repo**: https://github.com/craulii/cashflow
