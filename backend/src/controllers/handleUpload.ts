import type { Request, Response } from "express";
import { documentParser } from "../services/fileParser/documentParser.js";
import { chunkText } from "../services/embeding/textToChunks.js";
import { textToEmbeddings } from "../services/embeding/textToEmbedding.js";
import { initCollection } from "../services/vectorDb/collections.js";
import { insertDocument } from "../services/vectorDb/operations.js";
import { supabase } from "../utils/supabaseClient.js";
import crypto from "crypto";
import type { UploadedFile } from "../types/types.js";
import { error } from "console";

export const handleUpload = async (req: Request, res: Response) => {
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

  if (!files || files.length === 0 || files.length > 3) {
    return res
      .status(400)
      .json({ state: "error", message: "Invalid number of files uploaded" });
  }

  try {
    await initCollection();
    let uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      const allowedTypes = [
        "pdf",
        "csv",
        "vnd.openxmlformats-officedocument.wordprocessingml.document",
      
      ];
      if (!allowedTypes.includes(file.mimetype.split("/")[1]!)) {
        return res
          .status(400)
          .json({ state: "error", message: "File type not supported :/" });
      }

      const hash = crypto
        .createHash("sha256")
        .update(file.buffer +sessionId)
        .digest("hex");
      // Insert file into Supabase
      const { error } = await supabase.from("documents").insert([
        {
          id: hash,
          filename: file.originalname,
          size: file.size,
          type: file.mimetype?.split("/")[1] || "unknown",
          session_id: sessionId,
        },
      ]);

      if (error) {
        // Handle specific cases
        if (
          error.message.includes(
            'duplicate key value violates unique constraint "documents_pkey"'
          )
        ) {
          return res.status(400).json({
            state: "error",
            message: `File already uploaded: ${file.originalname}`,
          });
        }

        // General Supabase error
        return res.status(500).json({
          state: "error",
          message: `Failed to store file ${file.originalname}, please try again.`,
        });
      } // Parse, chunk, embed, and store in vector DB
      const parsedDocText: string = await documentParser(file);
      const chunkedText: string[] = chunkText(parsedDocText, 20);
      const embeddings: number[][] = await textToEmbeddings(chunkedText);
      await insertDocument(embeddings, chunkedText, hash);

      uploadedFiles.push({
        id: hash,
        name: file.originalname,
        size: file.size,
        type: file.mimetype.split("/")[1],
      });
    }

    res.status(200).json({
      state: "success",
      uploadedFiles,
      message: "Files processed and stored in vector database",
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      state: "error",
      message: error
     // message: "Unexpected server error, please try again or contact us :)",
    });
  }
};
