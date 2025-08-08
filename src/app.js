import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const dataLimit = "10mb";

app.use(
  cors({
    origin: process.env.CLIENT_URI,
    credentials: true,
  })
);

app.use(express.json({ limit: dataLimit }));
app.use(express.urlencoded({ extended: true, limit: dataLimit }));

// Health check
app.get("/", (req, res) => {
  res.send("🚀 Email SaaS API is Live!");
});

import authRoutes from "./routes/authRoute.js";
import domainRoutes from "./routes/domainRoute.js";
import mailboxRoutes from "./routes/mailboxRoute.js";


app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/domains", domainRoutes);
app.use("/api/mailboxes", mailboxRoutes);


export default app;
