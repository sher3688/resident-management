import express, { Router, type Request, type Response } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const router = Router();

// 配置 multer 用於記憶體存儲
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    // 允許的檔案類型
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("只支援 PDF 和 Word 檔案"));
    }
  },
});

// 上傳檔案端點
router.post("/upload", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "沒有選擇檔案" });
    }

    // 使用檔案原始名稱作為 S3 key
    let fileName = req.file.originalname;
    const fileBuffer = req.file.buffer;
    const contentType = req.file.mimetype;

    // 將檔案名稱轉換為 ASCII 兼容格式（移除非 ASCII 字符）
    fileName = fileName.replace(/[^\x00-\x7F]/g, "").replace(/\s+/g, "_");
    if (!fileName) {
      fileName = `file_${Date.now()}`;
    }

    // 上傳到 S3
    const { key, url } = await storagePut(
      `resource-library/${Date.now()}-${fileName}`,
      fileBuffer,
      contentType
    );

    res.json({
      success: true,
      url,
      key,
      size: req.file.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({
      error: error.message || "檔案上傳失敗",
    });
  }
});

export default router;
