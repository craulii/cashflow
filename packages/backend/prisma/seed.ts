import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
  // Fixed Expenses
  { name: 'Alquiler', type: 'FIXED', icon: 'home', color: '#3B82F6' },
  { name: 'Agua', type: 'FIXED', icon: 'droplet', color: '#06B6D4' },
  { name: 'Luz', type: 'FIXED', icon: 'zap', color: '#F59E0B' },
  { name: 'Gas', type: 'FIXED', icon: 'flame', color: '#EF4444' },
  { name: 'Internet', type: 'FIXED', icon: 'wifi', color: '#8B5CF6' },
  { name: 'Telefono', type: 'FIXED', icon: 'phone', color: '#10B981' },
  { name: 'Seguros', type: 'FIXED', icon: 'shield', color: '#6366F1' },

  // Variable Expenses
  { name: 'Alimentacion', type: 'VARIABLE', icon: 'utensils', color: '#F97316' },
  { name: 'Salud', type: 'VARIABLE', icon: 'heart', color: '#EC4899' },
  { name: 'Transporte', type: 'VARIABLE', icon: 'car', color: '#14B8A6' },
  { name: 'Ropa', type: 'VARIABLE', icon: 'shirt', color: '#A855F7' },
  { name: 'Entretenimiento', type: 'VARIABLE', icon: 'gamepad-2', color: '#F43F5E' },
  { name: 'Regalos', type: 'VARIABLE', icon: 'gift', color: '#D946EF' },
  { name: 'Snacks', type: 'VARIABLE', icon: 'cookie', color: '#FB923C' },

  // Debt Categories
  { name: 'Prestamo personal', type: 'DEBT', icon: 'banknote', color: '#DC2626' },
  { name: 'Tarjeta de credito', type: 'DEBT', icon: 'credit-card', color: '#EA580C' },
  { name: 'Hipoteca', type: 'DEBT', icon: 'building', color: '#B91C1C' },

  // Income Categories
  { name: 'Salario', type: 'INCOME', icon: 'briefcase', color: '#22C55E' },
  { name: 'Freelance', type: 'INCOME', icon: 'laptop', color: '#16A34A' },
  { name: 'Inversiones', type: 'INCOME', icon: 'trending-up', color: '#15803D' },
  { name: 'Otros ingresos', type: 'INCOME', icon: 'plus-circle', color: '#166534' },
];

async function main() {
  console.log('Seeding database...');

  // Delete existing default categories
  await prisma.category.deleteMany({
    where: { isDefault: true },
  });

  // Create default categories (without userId, available to all users)
  for (const category of defaultCategories) {
    await prisma.category.create({
      data: {
        ...category,
        isDefault: true,
        userId: null,
      },
    });
  }

  console.log('Default categories created successfully!');
  console.log(`Total categories: ${defaultCategories.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
