import { Router } from "express";
import { login, logout, ping } from "../controllers/auth.controller.js";

import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", login);
router.get("/logout", isAuthenticated, logout);
router.get("/ping", isAuthenticated, ping);

export default router;
