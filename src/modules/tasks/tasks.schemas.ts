import { z } from "zod";

export const taskBaseSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["pending", "in-progress", "completed"]).optional(),
  priority: z.enum(["low", "medium", "high"]).optional(),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).optional(),
  dueDate: z.string().datetime().optional(),
});

export const createTaskSchema = taskBaseSchema.extend({
  status: z.enum(["pending", "in-progress", "completed"]).default("pending"),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  recurrence: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
});

export const updateTaskSchema = taskBaseSchema.partial();

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;


