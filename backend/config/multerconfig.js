const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary.js");

// Cloudinary storage — PDFs go directly to Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder:        "docmind-pdfs",   // folder name in your Cloudinary account
    resource_type: "raw",            // required for PDFs (not image/video)
    type:          "upload",
    access_mode:   "public",
    format:        "pdf",
    public_id: (req, file) => {
      // unique filename
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      return unique;
    },
  },
});

// File filter — only PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

module.exports = upload;