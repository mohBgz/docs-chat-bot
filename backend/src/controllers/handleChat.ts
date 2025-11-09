import type { Request, Response } from "express";
import { ragChat } from "../services/LLM/ragChat.js";


export const handleChat = async (req: Request, res: Response) => {
  const { question, mode, selectedFileId, selectedFilename} = req.body;
  if (!question) return res.status(400).json({ error: "No question provided" });
 // console.log("working");

  try {
    // Ask LLM
    const answer = await ragChat(question, mode, selectedFileId, selectedFilename);

    res.status(200).json({ answer });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
