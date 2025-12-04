import type { Request, Response, NextFunction } from "express";
import {
  createTaskForUser,
  deleteTaskForUser,
  listTasksForUser,
  updateTaskForUser,
} from "./tasks.service";

export const listTasksHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const tasks = await listTasksForUser(userId);
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
};

export const createTaskHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const task = await createTaskForUser(userId, req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
};

export const updateTaskHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    await updateTaskForUser(userId, id, req.body);
    res.status(200).json({ message: "Updated" });
  } catch (err) {
    next(err);
  }
};

export const deleteTaskHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    await deleteTaskForUser(userId, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};


