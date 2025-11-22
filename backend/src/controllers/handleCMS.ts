import type { Request, Response } from "express";
import crypto from "crypto";
import { supabase } from "../utils/supabaseClient.js";
import type { UploadedFile } from "../types/types.js";
import { initCollection } from "../services/vectorDb/collections.js";
import { chunkText } from "../services/embeding/textToChunks.js";
import { textToEmbeddings } from "../services/embeding/textToEmbedding.js";
import { insertDocument } from "../services/vectorDb/operations.js";

export const handleCMS = async (req: Request, res: Response) => {
  let sessionId = req.cookies?.sessionId;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    res.cookie("sessionId", sessionId, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60, // 1 hour
      sameSite: "none",
      secure: true,
    });
  }

  const files = req.files as Express.Multer.File[] | undefined;

  if (!files || files.length === 0) {
    return res
      .status(400)
      .json({ state: "error", message: "No files uploaded" });
  }

  try {
      await initCollection();
    let uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      if (file.mimetype !== "application/json") {
        return res
          .status(400)
          .json({ state: "error", message: "Only JSON files are supported" });
      }

      const hash = crypto
        .createHash("sha256")
        .update(file.buffer + sessionId)
        .digest("hex");

      // Store file metadata in Supabase
      const { error } = await supabase.from("cms_files").insert([
        {
          id: hash,
          filename: file.originalname,
          size: file.size,
          session_id: sessionId,
          //file.buffer.toString("utf-8")
        },
      ]);

      if (error) {
        if (error.message.includes('duplicate key value violates unique constraint "cms_files_pkey"')) {
          return res.status(400).json({
            state: "error",
            message: `File already uploaded: ${file.originalname}`,
          });
        }
        return res.status(500).json({
          state: "error",
         message: `Failed to store file ${file.originalname}, please try again.`,
          
        });
      }

      const jsonContent = file.buffer.toString("utf-8");
      const chunkedText: string[] = chunkText(jsonContent, 20);
    const embeddings: number[][] = await textToEmbeddings(chunkedText);
      await insertDocument(embeddings, chunkedText, hash);
      // store jsonContent in vector DB 


      uploadedFiles.push({
        id: hash,
        name: file.originalname,
        size: file.size,
        type: "json",
      });
    }

    res.status(200).json({
      state: "success",
      uploadedFiles,
      message: "CMS files uploaded successfully",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      state: "error",
      message: "Unexpected server error",
    });
  }
};
