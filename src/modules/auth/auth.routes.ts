import { Router } from "express";
import { validateBody } from "../../middleware/validate";
import { requireAuth } from "../../middleware/auth";
import { loginSchema, registerSchema, updateProfileSchema, changePasswordSchema } from "./auth.schemas";
import { loginHandler, registerHandler, getProfileHandler, updateProfileHandler, changePasswordHandler } from "./auth.controller";

const router = Router();

router.post("/register", validateBody(registerSchema), registerHandler);
router.post("/login", validateBody(loginSchema), loginHandler);

// Protected routes
router.get("/profile", requireAuth, getProfileHandler);
router.put("/profile", requireAuth, validateBody(updateProfileSchema), updateProfileHandler);
router.put("/password", requireAuth, validateBody(changePasswordSchema), changePasswordHandler);

export default router;


