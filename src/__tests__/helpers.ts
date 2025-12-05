import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

export const prisma = new PrismaClient();

// Helper to clean database between tests - order matters for foreign keys
export const cleanDatabase = async () => {
  try {
    // Delete in order to respect foreign key constraints
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    // Ignore errors if tables don't exist yet
    console.warn('Could not clean database:', error);
  }
};

export interface TestUser {
  id: string;
  username: string;
  email: string;
  password: string;
}

export const createTestUser = async (overrides?: {
  username?: string;
  email?: string;
  password?: string;
}): Promise<TestUser> => {
  const username =
    overrides?.username ||
    `testuser_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  // Normalize email to lowercase for consistency
  const email = (
    overrides?.email ||
    `test_${Date.now()}_${Math.random().toString(36).substring(7)}@example.com`
  ).toLowerCase();
  const password = overrides?.password || 'TestPassword123!';
  
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // Ensure we don't collide across parallel tests: clear any user matching username/email
  await prisma.user.deleteMany({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
  });

  try {
    // Create fresh user with normalized email and hashed password
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
      },
    });
  } catch (error: any) {
    // If creation still collides, surface error for debugging
    throw error;
  }

  const finalUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username },
        { email },
      ],
    },
  });

  if (!finalUser) {
    throw new Error('User was not found after creation');
  }

  return {
    id: finalUser.id,
    username: finalUser.username,
    email: finalUser.email,
    password, // Return plain password for testing
  };
};

export const createTestTask = async (userId: string, overrides?: {
  title?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}) => {
  return await prisma.task.create({
    data: {
      title: overrides?.title || 'Test Task',
      description: overrides?.description || 'Test Description',
      status: overrides?.status || 'pending',
      userId,
    },
  });
};


