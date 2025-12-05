import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Clean up database before each test suite
beforeAll(async () => {
  // Clean up test data
  try {
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    // Ignore errors if tables don't exist yet
    console.warn('Could not clean database:', error);
  }
});

afterAll(async () => {
  await prisma.$disconnect();
});

// Helper to clean database between tests
export const cleanDatabase = async () => {
  try {
    await prisma.session.deleteMany();
    await prisma.task.deleteMany();
    await prisma.user.deleteMany();
  } catch (error) {
    // Ignore errors if tables don't exist yet
    console.warn('Could not clean database:', error);
  }
};

