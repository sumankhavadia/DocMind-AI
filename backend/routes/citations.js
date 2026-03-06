const express = require("express");
const router = express.Router();

const { getCitation } = require("../controllers/queryController");
const { protect } = require("../middlewares/authmiddleware");

// GET /api/citations/:messageId
router.get("/:messageId", protect, getCitation);

module.exports = router;
