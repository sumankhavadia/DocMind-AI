const fs = require("fs");
const path = require("path");
const os = require("os");
const axios = require("axios");
const Document = require("../models/documentmodel.js");
const ingestionPipeline = require("../pipeline/ingestion.pipeline.js");
const cloudinary = require("../config/cloudinary.js");

function getSignedCloudinaryUrl(publicId) {
  if (!publicId) return null;
  try {
    const expiresAt = Math.floor(Date.now() / 1000) + 60 * 10;
    return cloudinary.utils.private_download_url(publicId, "pdf", {
      resource_type: "raw",
      type: "upload",
      expires_at: expiresAt,
    });
  } catch (err) {
    console.warn("[CLOUDINARY] Failed to create signed URL:", err.message);
    return null;
  }
}

async function downloadRemotePDFToTemp(fileUrl) {
  const tempDir = path.join(os.tmpdir(), "docmind");
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `${Date.now()}-${Math.round(Math.random() * 1e9)}.pdf`);
  const response = await axios.get(fileUrl, { responseType: "stream", timeout: 30000 });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(tempFilePath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return tempFilePath;
}

async function downloadCloudPDFToTemp(fileUrl, publicId) {
  try {
    return await downloadRemotePDFToTemp(fileUrl);
  } catch (err) {
    const status = err?.response?.status;
    if (status !== 401 && status !== 403) {
      throw err;
    }

    const signedUrl = getSignedCloudinaryUrl(publicId);
    if (!signedUrl) {
      throw err;
    }

    console.warn("[CLOUDINARY] Public URL denied; retrying with signed URL");
    return await downloadRemotePDFToTemp(signedUrl);
  }
}

exports.uploadPDF = async (req, res) => {
  let ingestionPath = null;
  let tempDownloadedFile = null;

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No PDF uploaded",
      });
    }

    // Cloudinary storage provides URL in req.file.path.
    // Ingestion pipeline needs a local filesystem path, so download when path is remote.
    const uploadedPath = req.file.path;
    const isRemotePath = typeof uploadedPath === "string" && /^https?:\/\//i.test(uploadedPath);

    if (isRemotePath) {
      tempDownloadedFile = await downloadCloudPDFToTemp(uploadedPath, req.file.filename);
      ingestionPath = tempDownloadedFile;
    } else {
      ingestionPath = uploadedPath;
    }

    // Save metadata
    const document = await Document.create({
      user: req.user?.id,
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: uploadedPath,
      size: req.file.size || req.file.bytes || 0,
      mimeType: req.file.mimetype,
    });

    // Process PDF through ingestion pipeline
    const { rawText, cleanedText, chunks, totalPages, stats } = await ingestionPipeline(
      ingestionPath,
      document._id
    );

    const textDir = path.join("uploads", "texts");
    if (!fs.existsSync(textDir)) {
      fs.mkdirSync(textDir, { recursive: true });
    }

    const textFileName = `${document._id}.txt`;
    const textFilePath = path.join(textDir, textFileName);

    // Save cleaned text to file
    fs.writeFileSync(textFilePath, cleanedText, "utf-8");

    // 🎯 CLASSIFY DOCUMENT TYPE (runs once at upload)
    let docType = "general";
    let classificationConfidence = 0.0;
    
    try {
      // Use rawText instead of cleanedText to preserve important keywords
      // Use first 1500 characters for better classification signal
      const sampleText = rawText.substring(0, 1500);
      
      console.log(`[CLASSIFICATION DEBUG] Sample text length: ${sampleText.length}`);
      console.log(`[CLASSIFICATION DEBUG] Sample preview: ${sampleText.substring(0, 200)}...`);
      
      const classifyResponse = await axios.post(process.env.CLASSIFY_URL || "http://localhost:8000/classify", {
        text: sampleText
      });
      
      docType = classifyResponse.data.doc_type || "general";
      classificationConfidence = classifyResponse.data.confidence || 0.0;
      
      console.log(`[CLASSIFICATION] Document classified as: ${docType} (confidence: ${classificationConfidence})`);
    } catch (classifyError) {
      console.error("[CLASSIFICATION ERROR]", classifyError.message);
      console.error("[CLASSIFICATION ERROR Details]", classifyError.response?.data || classifyError.message);
      // Continue with default "general" type on error
    }
  
    document.textFilePath = textFilePath;
    document.chunkCount = chunks.length;
    document.totalPages = totalPages;
    document.docType = docType;
    document.classificationConfidence = classificationConfidence;
    await document.save();

    res.status(201).json({
      success: true,
      message: "PDF uploaded & text extracted",
      documentId: document._id,
      docType: docType,
      classificationConfidence: classificationConfidence,
      totalPages,
      stats,
      textPreview: cleanedText.substring(0, 500),
    });

  } catch (error) {
    console.error("[UPLOAD ERROR]", error);
    res.status(500).json({
      success: false,
      message: "PDF upload failed",
      error: error.message,
    });
  } finally {
    if (tempDownloadedFile && fs.existsSync(tempDownloadedFile)) {
      try {
        fs.unlinkSync(tempDownloadedFile);
      } catch (cleanupErr) {
        console.warn("[UPLOAD] Temp file cleanup failed:", cleanupErr.message);
      }
    }
  }
};

exports.streamPDF = async (req, res) => {
  try {
    const { documentId } = req.params;

    const doc = await Document.findById(documentId).select("filePath fileName originalName").lean();
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    const isRemotePath = typeof doc.filePath === "string" && /^https?:\/\//i.test(doc.filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${doc.originalName}"`);
    res.setHeader("Cache-Control", "private, max-age=3600");

    if (isRemotePath) {
      let remoteUrl = doc.filePath;
      try {
        const head = await axios.get(doc.filePath, { responseType: "stream", timeout: 30000 });
        head.data.destroy?.();
      } catch (err) {
        const status = err?.response?.status;
        if ((status === 401 || status === 403) && doc.fileName) {
          const signedUrl = getSignedCloudinaryUrl(doc.fileName);
          if (signedUrl) {
            remoteUrl = signedUrl;
          }
        }
      }

      const response = await axios.get(remoteUrl, { responseType: "stream", timeout: 30000 });
      response.data.pipe(res);
      return;
    }

    const absPath = path.resolve(doc.filePath);
    if (!fs.existsSync(absPath)) {
      return res.status(404).json({ success: false, message: "PDF file not found on disk" });
    }

    fs.createReadStream(absPath).pipe(res);
  } catch (error) {
    console.error("[STREAM PDF ERROR]", error);
    return res.status(500).json({ success: false, message: "Failed to stream PDF", error: error.message });
  }
};
