import { Router } from "express";
import { isAuthenticated } from "../middlewares/auth.middleware.js";
import { dashboard } from "../controllers/task.controller.js";

const router = Router();

router.get("/", isAuthenticated, dashboard);

export default router;
