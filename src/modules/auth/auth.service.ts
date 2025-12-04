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
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: input.email }, { username: input.username }] },
  });

  if (existing) {
    const conflictField =
      existing.email === input.email ? "Email already in use" : "Username already in use";
    const error = new Error(conflictField);
    (error as any).statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      password: hashedPassword,
    },
  });

  const token = jwt.sign(buildTokenPayload(user), env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

  // Create session if device info provided
  if (sessionData) {
    await createSession(user.id, token, sessionData);
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
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

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
  });

  // Create session if device info provided
  if (sessionData) {
    await createSession(user.id, token, sessionData);
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
  const orConditions: Array<{ username?: string; email?: string }> = [];
  if (input.username) {
    orConditions.push({ username: input.username });
  }
  if (input.email) {
    orConditions.push({ email: input.email });
  }

  if (orConditions.length > 0) {
    const existing = await prisma.user.findFirst({
      where: {
        AND: [
          { id: { not: userId } },
          { OR: orConditions },
        ],
      },
    });

    if (existing) {
      const conflictField =
        existing.email === input.email ? "Email already in use" : "Username already in use";
      const error = new Error(conflictField);
      (error as any).statusCode = 409;
      throw error;
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(input.username && { username: input.username }),
      ...(input.email && { email: input.email }),
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

