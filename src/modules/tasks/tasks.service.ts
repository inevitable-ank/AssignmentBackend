import { prisma } from "../../config/prisma";
import type { CreateTaskInput, UpdateTaskInput } from "./tasks.schemas";

export const listTasksForUser = async (userId: string) => {
  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Map DB enums to frontend-friendly strings
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description ?? "",
    status: t.status.replace("_", "-") as "pending" | "in-progress" | "completed",
    createdAt: t.createdAt.toISOString(),
    priority: t.priority,
    recurrence: t.recurrence,
    dueDate: t.dueDate ? t.dueDate.toISOString() : undefined,
  }));
};

export const createTaskForUser = async (userId: string, input: CreateTaskInput) => {
  const task = await prisma.task.create({
    data: {
      title: input.title,
      description: input.description,
      status: input.status?.replace("-", "_") as any,
      priority: input.priority,
      recurrence: input.recurrence,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      userId,
    },
  });

  return {
    id: task.id,
    title: task.title,
    description: task.description ?? "",
    status: task.status.replace("_", "-") as "pending" | "in-progress" | "completed",
    createdAt: task.createdAt.toISOString(),
    priority: task.priority,
    recurrence: task.recurrence,
    dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
  };
};

export const updateTaskForUser = async (
  userId: string,
  taskId: string,
  updates: UpdateTaskInput
) => {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing || existing.userId !== userId) {
    const error = new Error("Task not found");
    (error as any).statusCode = 404;
    throw error;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title: updates.title,
      description: updates.description,
      status: updates.status ? (updates.status.replace("-", "_") as any) : undefined,
      priority: updates.priority,
      recurrence: updates.recurrence,
      dueDate: updates.dueDate ? new Date(updates.dueDate) : undefined,
    },
  });

  return {
    id: updated.id,
    title: updated.title,
    description: updated.description ?? "",
    status: updated.status.replace("_", "-") as "pending" | "in-progress" | "completed",
    createdAt: updated.createdAt.toISOString(),
    priority: updated.priority,
    recurrence: updated.recurrence,
    dueDate: updated.dueDate ? updated.dueDate.toISOString() : undefined,
  };
};

export const deleteTaskForUser = async (userId: string, taskId: string) => {
  const existing = await prisma.task.findUnique({ where: { id: taskId } });

  if (!existing || existing.userId !== userId) {
    const error = new Error("Task not found");
    (error as any).statusCode = 404;
    throw error;
  }

  await prisma.task.delete({ where: { id: taskId } });
};


