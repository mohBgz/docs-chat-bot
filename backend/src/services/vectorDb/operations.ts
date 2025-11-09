// services/vectorDb/operations.ts

import  clientQdrant  from "./qdrantClient.js";
import crypto from "crypto";

export const insertDocument = async (
  vectors: number[][],
  texts: string[],
  fileHash: string, 
  
  //source : "cms" | "docs",
) => {
  const points = vectors.map((vector, i) => {
    // Use chunk text only for deterministic ID
    const hash = crypto.createHash("sha256").update(texts[i]!.trim().toLowerCase()).digest("hex");
    const pointID = [hash.slice(0,8), hash.slice(8,12), hash.slice(12,16), hash.slice(16,20), hash.slice(20,32)].join("-");

    return {
      id: pointID,
      vector,
      payload: { text: texts[i], fileHash, order : i },
    };
  });

  try {
    await clientQdrant.upsert("documents", { points });
    console.log("Documents inserted/updated successfully");
  } catch (err) {
    console.error("Error inserting documents:", err);
  }
};


export const deleteFileVectors = async (fileHash: string) => {
  try {
    await clientQdrant.delete("documents", {
      filter: {
        must: [
          { key: "fileHash", match: { value: fileHash } }
        ]
      }
    });
    console.log(`Deleted vectors for fileHash: ${fileHash}`);
  } catch (err) {
    console.error("Error deleting vectors:", err);
  }
};