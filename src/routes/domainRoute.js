import express from "express";
import {
  createDomain,
  getDNSRecords,
  verifyDomain,
} from "../controller/domainController.js";
import { authenticateToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authenticateToken);

router.post("/createDomain", createDomain);               // POST /api/domains
router.get("/:domain/records", getDNSRecords); // GET /api/domains/:domain/records
router.post("/:domain/verify", verifyDomain);  // POST /api/domains/:domain/verify

export default router;
