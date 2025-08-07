import express from "express";

import { authenticateToken } from "../middlewares/authMiddleware.js";
import { createMailbox, sendTestEmail } from "../controller/domainController.js";

const router = express.Router();
router.use(authenticateToken);

router.post("/", createMailbox);           // POST /api/mailboxes
router.post("/send", sendTestEmail);            // POST /api/mailboxes/send
// router.get("/:email/inbox", receiveMail);  // GET  /api/mailboxes/:email/inbox

export default router;
