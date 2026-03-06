const express = require("express");
const router = express.Router();

const upload = require("../config/multerconfig");
const { protect } = require("../middlewares/authmiddleware");
const { uploadPDF, streamPDF } = require("../controllers/documents");

// POST /api/documents/upload
router.post(
  "/upload",
  upload.single("pdf"),
  uploadPDF
);

// GET /api/documents/:documentId/file
router.get("/:documentId/file", protect, streamPDF);

module.exports = router;
