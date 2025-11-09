// controllers/handleDelete.ts
import { supabase } from "../utils/supabaseClient.js";
import { deleteFileVectors } from "../services/vectorDb/operations.js";

/**
 * Returns an Express handler for deleting files from a given table
 */
export const handleDelete = (tableName: string) => {
  return async (req: any, res: any) => {
    const sessionId: string = String(req.cookies.sessionId || "").trim();
    const { fileHash }: { fileHash: string } = req.params;

    if (!sessionId) return res.status(401).json({ error: "Missing cookie" });
    if (!fileHash) return res.status(400).json({ error: "Missing file Hash" });

    try {
      // Check ownership
      const { data, error } = await supabase
        .from(tableName)
        .select("id, session_id")
        .match({ session_id: sessionId, id: fileHash })
        .maybeSingle();

      if (!data) {
        return res.status(403).json({
          error: "Unauthorized or file not found",
        });
      }

      // Delete file from DB and vector store
      await supabase.from(tableName).delete().eq("id", fileHash);
      await deleteFileVectors(fileHash);

      res.status(200).json({ message: "File deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, error: err });
    }
  };
};
