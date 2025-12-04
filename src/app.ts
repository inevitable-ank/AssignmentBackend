import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";

import { env } from "./config/env";
import { errorHandler } from "./middleware/errorHandler";
import authRouter from "./modules/auth/auth.routes";
import tasksRouter from "./modules/tasks/tasks.routes";
import sessionsRouter from "./modules/sessions/sessions.routes";

const app = express();

app.use(helmet());
// CORS configuration - supports single origin or comma-separated multiple origins
const allowedOrigins = env.CORS_ORIGIN.includes(',') 
  ? env.CORS_ORIGIN.split(',').map(o => o.trim())
  : [env.CORS_ORIGIN];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps, Postman, curl)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: false,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// Root route
app.get("/", (_req, res) => {
  res.json({
    message: "TaskFlow API",
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      tasks: "/api/tasks",
      sessions: "/api/sessions",
    },
  });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/sessions", sessionsRouter);

app.use(errorHandler);

export default app;


