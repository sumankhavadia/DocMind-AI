const express = require("express");
const app = express();

app.use(express.json());

app.get("/health", (req, res) => {
  res.send("SmartDoc AI Backend is running");
});

module.exports = app;
