const express = require("express");
const cors = require("cors");
const app = express();
const embedRoute = require("./routes/embed");

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
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
