import clientQdrant  from "./qdrantClient.js";

export const initCollection = async () => {
  try {
    // Check if collection exists
    const collection = await clientQdrant
      .getCollection("documents")
      .catch(() => null);

    if (!collection) {
      await clientQdrant.createCollection("documents", {
        vectors: {
          size: 1536,
          distance: "Cosine",
        },
      });

      // Create payload index for fileHash
      await clientQdrant.createPayloadIndex("documents", {
        field_name: "fileHash",
        field_schema: "keyword",
      });
      console.log("Collection 'documents' created successfully.");
    } else {
      console.log("Collection 'documents' already exists, skipping creation.");
    }
  } catch (error) {
    console.error("Error creating collection:", error);
  }
};
