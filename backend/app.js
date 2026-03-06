const express = require("express");
const cors = require("cors");
const app = express();
const embedRoute = require("./routes/embed");

const defaultOrigins = [
  "http://localhost:5173",
  "https://sumankhavadia-docmind-ai.vercel.app",
];
const normalizeOrigin = (origin) => origin.replace(/\/+$/, "");
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
  .map(normalizeOrigin);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins].map(normalizeOrigin))];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// ── Health check ──────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "DocMind API running" });
});

app.use("/api/documents", require("./routes/documents"));
app.use("/api/auth", require("./routes/authroutes.js"));
app.use("/api/embed", embedRoute);
app.use("/api/query", require("./routes/query"));
app.use("/api/citations", require("./routes/citations"));


module.exports = app;
