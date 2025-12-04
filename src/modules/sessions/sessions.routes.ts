import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { getSessionsHandler, revokeSessionHandler, revokeAllOtherSessionsHandler } from "./sessions.controller";

const router = Router();

// All session routes require authentication
router.get("/", requireAuth, getSessionsHandler);
router.delete("/:sessionId", requireAuth, revokeSessionHandler);
router.post("/revoke-all", requireAuth, revokeAllOtherSessionsHandler);

export default router;

