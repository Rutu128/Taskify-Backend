import { Router } from "express";
import { login, logout,  } from "../controllers/auth.controller.js";

import { isAuthenticated } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/", login);
router.get("/logout", isAuthenticated, logout);

export default router;
