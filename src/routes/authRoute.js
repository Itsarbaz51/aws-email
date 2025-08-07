import express from "express";
import { register, login } from "../controller/authController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);   // POST /api/auth/register
router.post("/login", login);         // POST /api/auth/login
// router.get("/me", authenticateToken, get); // GET /api/auth/me

export default router;
