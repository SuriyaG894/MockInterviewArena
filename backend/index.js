const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Environment Configuration Startup Validation
const provider = process.env.LLM_PROVIDER;
if (!provider) {
  console.error("Initialization Error: LLM_PROVIDER is not defined in environment config.");
  process.exit(1);
}

if (provider === "groq") {
  if (!process.env.GROQ_API_KEY) {
    console.error("Initialization Error: GROQ_API_KEY is not defined in environment config for provider 'groq'.");
    process.exit(1);
  }
} else if (provider === "local") {
  if (!process.env.LOCAL_LLM_ENDPOINT) {
    console.error("Initialization Error: LOCAL_LLM_ENDPOINT is not defined in environment config for provider 'local'.");
    process.exit(1);
  }
  if (!process.env.LOCAL_MODEL_NAME) {
    console.error("Initialization Error: LOCAL_MODEL_NAME is not defined in environment config for provider 'local'.");
    process.exit(1);
  }
} else if (provider === "azure") {
  if (!process.env.AZURE_AI_AGENTS_CONNECTION_STRING) {
    console.error("Initialization Error: AZURE_AI_AGENTS_CONNECTION_STRING is not defined in environment config for provider 'azure'.");
    process.exit(1);
  }
} else {
  console.error(`Initialization Error: Unknown LLM_PROVIDER "${provider}". Supported: 'groq', 'local', 'azure'.`);
  process.exit(1);
}

const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");

const { evaluateTurn, generateChallenge, verifyAndExtractResume } = require("./agent");

const app = express();

// Configure multer memory storage with 5MB file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "The Mock Arena API" });
});

app.post("/api/resume/upload", (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "File size limit exceeded. Maximum file size is 5MB." });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: `Upload failed: ${err.message}` });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded. Please select a PDF or Word document." });
      }

      const filename = req.file.originalname.toLowerCase();
      const mimetype = req.file.mimetype;
      let extractedText = "";

      if (mimetype === "application/pdf" || filename.endsWith(".pdf")) {
        try {
          const parser = new pdfParse.PDFParse({ data: req.file.buffer });
          const parsed = await parser.getText();
          extractedText = parsed.text;
        } catch (err) {
          console.error("PDF Parsing Error:", err.message);
          return res.status(400).json({ error: "Failed to parse PDF document. Ensure the file is not corrupted." });
        }
      } else if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        filename.endsWith(".docx")
      ) {
        try {
          const parsed = await mammoth.extractRawText({ buffer: req.file.buffer });
          extractedText = parsed.value;
        } catch (err) {
          return res.status(400).json({ error: "Failed to parse Word document. Ensure the file is not corrupted." });
        }
      } else {
        return res.status(400).json({ error: "Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx)." });
      }

      const trimmedText = extractedText.trim();
      if (trimmedText.length < 100) {
        return res.status(400).json({ error: "The uploaded document is too short to be parsed as a resume." });
      }

      // Verify and extract profile summary using LLM
      const summarizedText = await verifyAndExtractResume(trimmedText);
      res.json({ text: summarizedText });
    } catch (error) {
      console.error("Resume upload error:", error.message);
      res.status(400).json({ error: error.message || "Failed to process the uploaded resume." });
    }
  });
});

app.post("/api/battle/start", async (req, res) => {
  try {
    const { bossId, difficulty, candidateProfile } = req.body;

    if (!bossId || !difficulty) {
      return res.status(400).json({
        error: "bossId and difficulty are required",
      });
    }

    const result = await generateChallenge(bossId, difficulty, candidateProfile);
    res.json(result);
  } catch (error) {
    console.error("Battle start error:", error.message);
    res.status(500).json({
      error: "Failed to generate challenge",
    });
  }
});

app.post("/api/battle/turn", async (req, res) => {
  try {
    const { bossId, userResponse, difficulty, candidateProfile } = req.body;

    if (!bossId || !userResponse) {
      return res.status(400).json({
        error: "bossId and userResponse are required",
      });
    }

    const result = await evaluateTurn(bossId, userResponse, difficulty || "medium", candidateProfile);
    res.json(result);
  } catch (error) {
    console.error("Battle turn error:", error.message);
    res.status(500).json({
      dialogue: "The arena processors falter. Try again.",
      damageTo: "none",
      damageAmount: 0,
    });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`The Mock Arena backend running on http://localhost:${PORT}`);
  });
}

module.exports = app;
