// routes/index.js
import express from "express";
import multer from "multer";
import { handleChat } from "../controllers/handleChat.js";
import { handleCMS } from "../controllers/handleCMS.js";
import { handleUpload } from "../controllers/handleUpload.js";
import { getSessionFiles } from "../controllers/getSessionFiles.js";
import { handleDelete } from "../controllers/handleDelete.js";

const router = express.Router();

// Configure multer for upload routes
const upload = multer({ storage: multer.memoryStorage() });

// Chat routes
router.post("/chat", handleChat);

// CMS routes
router.post("/cms/upload",upload.array("files",3),  handleCMS);
router.get("/cms", getSessionFiles("cms_files"));
router.delete("/cms/:fileHash", handleDelete("cms_files"));



router.post("/docs/upload", upload.array("files", 3), handleUpload);
router.get("/docs", getSessionFiles("documents"));
router.delete("/docs/:fileHash", handleDelete("documents"));



export default router;