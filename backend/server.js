/**
 * BreastGuard AI — Backend Server
 * Express.js REST API
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
require("dotenv").config();

const chatRoutes = require("./routes/chat");
const riskRoutes = require("./routes/risk");
const mammogramRoutes = require("./routes/mammogram");
const screeningRoutes = require("./routes/screening");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:3000" }));
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

// Rate limiting — protect AI endpoints
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50,
  message: { error: "Too many requests. Please try again shortly." },
});

// Routes
app.use("/api/chat", aiLimiter, chatRoutes);
app.use("/api/risk", riskRoutes);
app.use("/api/mammogram", mammogramRoutes);
app.use("/api/screening", screeningRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

app.listen(PORT, () => {
  console.log(`BreastGuard AI backend running on port ${PORT}`);
});

module.exports = app;
