import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import type { LoginInput, RegisterInput, UpdateProfileInput, ChangePasswordInput } from "./auth.schemas";
import { createSession, type SessionData } from "../sessions/sessions.service";

const SALT_ROUNDS = 10;

const buildTokenPayload = (user: { id: string; email: string; username: string }) => ({
  userId: user.id,
  email: user.email,
  username: user.username,
});

export const registerUser = async (input: RegisterInput, sessionData?: SessionData) => {
  // Normalize email to lowercase for comparison
  const normalizedEmail = input.email.toLowerCase();
  
  // Check for existing user with same username (exact match)
  const existingByUsername = await prisma.user.findUnique({
    where: { username: input.username },
  });

  if (existingByUsername) {
    const error = new Error("Username already in use");
    (error as any).statusCode = 409;
    throw error;
  }

  // Check for existing user with same email (case-insensitive)
  // Since emails are stored normalized, we can use exact match
  // But to be safe, we also check case-insensitively
  const existingByEmail = await prisma.user.findFirst({
    where: {
      email: {
        equals: normalizedEmail,
      },
    },
  });

  if (existingByEmail) {
    const error = new Error("Email already in use");
    (error as any).statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: normalizedEmail, // Store normalized email
      password: hashedPassword,
    },
  });

  const token = jwt.sign(buildTokenPayload(user), env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  // Create session if device info provided
  if (sessionData) {
    try {
      // Ensure user exists before creating session
      const userExists = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      });
      
      if (userExists) {
        await createSession(user.id, token, sessionData);
      } else {
        console.warn('User not found when creating session, skipping session creation');
      }
    } catch (error) {
      // Log error but don't fail registration if session creation fails
      console.warn('Failed to create session:', error);
    }
  }

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  };
};

export const loginUser = async (input: LoginInput, sessionData?: SessionData) => {
  // Normalize email to lowercase for case-insensitive lookup
  const normalizedEmail = input.email.toLowerCase();
  
  // Try to find user by normalized email (most users should have normalized emails)
  let user = await prisma.user.findFirst({
    where: {
      email: normalizedEmail,
    },
  });

  // If not found, try case-insensitive search (for legacy users with mixed-case emails)
  if (!user) {
    const allUsers = await prisma.user.findMany();
    const foundUser = allUsers.find((u) => u.email.toLowerCase() === normalizedEmail);
    user = foundUser || null;
  }

  if (!user) {
    const error = new Error("Invalid email or password");
    (error as any).statusCode = 401;
    throw error;
  }

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) {
    const error = new Error("Invalid email or password");
    (error as any).statusCode = 401;
    throw error;
  }

  const token = jwt.sign(buildTokenPayload(user), env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);

  // Create session if device info provided
  if (sessionData) {
    try {
      // Ensure user exists before creating session
      const userExists = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true },
      });
      
      if (userExists) {
        await createSession(user.id, token, sessionData);
      } else {
        console.warn('User not found when creating session, skipping session creation');
      }
    } catch (error) {
      // Log error but don't fail login if session creation fails
      console.warn('Failed to create session:', error);
    }
  }

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  };
};

export const getProfile = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    const error = new Error("User not found");
    (error as any).statusCode = 404;
    throw error;
  }

  return { user };
};

export const updateProfile = async (userId: string, input: UpdateProfileInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    (error as any).statusCode = 404;
    throw error;
  }

  // Check if username or email is already taken by another user
  if (input.username) {
    const existingByUsername = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        username: input.username,
      },
    });

    if (existingByUsername) {
      const error = new Error("Username already in use");
      (error as any).statusCode = 409;
      throw error;
    }
  }

  if (input.email) {
    const normalizedInputEmail = input.email.toLowerCase();
    
    // Try exact match first (most users should have normalized emails)
    let existingByEmail = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        email: normalizedInputEmail,
      },
    });

    // If not found, try case-insensitive search (for legacy users)
    if (!existingByEmail) {
      const potentialConflicts = await prisma.user.findMany({
        where: {
          id: { not: userId },
        },
      });
      const foundConflict = potentialConflicts.find(
        (u) => u.email.toLowerCase() === normalizedInputEmail
      );
      existingByEmail = foundConflict || null;
    }

    if (existingByEmail) {
      const error = new Error("Email already in use");
      (error as any).statusCode = 409;
      throw error;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.username && { username: input.username }),
      ...(input.email && { email: input.email.toLowerCase() }), // Normalize email
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return { user: updatedUser };
};

export const changePassword = async (userId: string, input: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    const error = new Error("User not found");
    (error as any).statusCode = 404;
    throw error;
  }

  // Verify current password
  const valid = await bcrypt.compare(input.currentPassword, user.password);
  if (!valid) {
    const error = new Error("Current password is incorrect");
    (error as any).statusCode = 401;
    throw error;
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

  // Update password
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password updated successfully" };
};

