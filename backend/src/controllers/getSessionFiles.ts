import type { Request, Response } from "express";
import { supabase } from "../utils/supabaseClient.js";

export const getSessionFiles = (tableName: string) => async (req: Request, res: Response) => {
  const sessionId = req.cookies?.sessionId;
  try {
    if (!sessionId)
      return res.status(400).json({ state: "error", message: "No session cookie found" });

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("session_id", sessionId);

    if (error) throw error;
    res.status(200).json({ state: "success", files: data });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({ state: "error", message: err.message });
  }
};
