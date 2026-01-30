import bcrypt from 'bcryptjs';
import { prisma } from '../../config/prisma.js';
import { ApiError } from '../../utils/apiError.js';
import type { UpdateUserInput } from './users.schema.js';

export class UsersService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateUserInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const updateData: { name?: string; email?: string; password?: string } = {};

    if (data.name) {
      updateData.name = data.name;
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw ApiError.conflict('Email already in use');
      }

      updateData.email = data.email;
    }

    if (data.newPassword && data.currentPassword) {
      const isValidPassword = await bcrypt.compare(data.currentPassword, user.password);

      if (!isValidPassword) {
        throw ApiError.badRequest('Current password is incorrect');
      }

      updateData.password = await bcrypt.hash(data.newPassword, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}

export const usersService = new UsersService();
