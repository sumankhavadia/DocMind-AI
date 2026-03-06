const express = require("express");
const cors = require("cors");
const app = express();
const embedRoute = require("./routes/embed");

const defaultOrigins = ["http://localhost:5173"];
const envOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(express.json());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.get("/health", (req, res) => {
  res.send("SmartDoc AI Backend is running");
});

app.use("/api/documents", require("./routes/documents"));
app.use("/api/auth", require("./routes/authroutes.js"));
app.use("/api/embed", embedRoute);
app.use("/api/query", require("./routes/query"));
app.use("/api/citations", require("./routes/citations"));


module.exports = app;
