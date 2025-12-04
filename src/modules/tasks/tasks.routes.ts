import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { createTaskSchema, updateTaskSchema } from "./tasks.schemas";
import {
  createTaskHandler,
  deleteTaskHandler,
  listTasksHandler,
  updateTaskHandler,
} from "./tasks.controller";

const router = Router();

router.use(requireAuth);

router.get("/", listTasksHandler);
router.post("/", validateBody(createTaskSchema), createTaskHandler);
router.put("/:id", validateBody(updateTaskSchema), updateTaskHandler);
router.delete("/:id", deleteTaskHandler);

export default router;


