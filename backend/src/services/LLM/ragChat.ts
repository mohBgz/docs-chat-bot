import { CohereClientV2 } from "cohere-ai";
import dotenv from "dotenv";
import { textToEmbeddings } from "../embeding/textToEmbedding.js";
import clientQdrant from "../vectorDb/qdrantClient.js";
import type { UploadedFile } from "../../types/types.js";

dotenv.config();

const cohere = new CohereClientV2({ token: process.env.COHERE_API_KEY });

const extractText = (response: any): string =>
  response.message?.content
    ?.filter((item: any) => item.type === "text")
    .map((item: any) => item.text)
    .join(" ") || "No response";

export const ragChat = async (
  question: string,
  mode: "chat" | "docs" | "cms",
  selectedFileId?: string,
  selectedFilename?: string
): Promise<string> => {
  try {
    if (!question) throw new Error("Question not provided");

    // 🟦 1. CHAT MODE
    if (mode === "chat") {
      const response = await cohere.chat({
        model: "command-a-03-2025",
        messages: [
          {
            role: "system",
            content: `Your name is 'Echo Bot'. You are a helpful AI assistant with three modes. ALWAYS mention all modes when asked:

**Chat Mode** (current): Answer questions, help with writing, explain concepts, translate text, brainstorm ideas, and casual conversations.

**Docs Mode**: Analyze uploaded documents and CMS content.

**CMS Mode**: Similar to Docs mode, focused on CMS content.

Always tell users they can switch modes using the toggle above.`,
          },
          { role: "user", content: question },
        ],
      });

      return extractText(response);
    }

    // 🟦 2. DOCS / CMS MODE
    if (mode === "docs" || mode === "cms") {
      if (!selectedFileId || !selectedFilename) {
        return "Error: file not provided";
      }

      const [queryVector] = await textToEmbeddings([question]);

      const searchResults = await clientQdrant.search("documents", {
        vector: queryVector!,
        limit: 20,
        filter: { must: [{ key: "fileHash", match: { value: selectedFileId } }] },
      });

      const context = searchResults
        .sort((a: any, b: any) => (a.payload.order ?? 0) - (b.payload.order ?? 0))
        .map((res: any) => res.payload.text)
        .join(" ");

      const systemPrompt = `You are 'Echo Bot'. Always greet the user and reference the selected file.
Answer questions using ONLY the content of the selected file.`;

      const userContent = `I see you’ve selected the file **${selectedFilename}**.
I can help you understand it, summarize it, or answer any questions.

File content for reference:
${context}

Question:
${question}`;

      const response = await cohere.chat({
        model: "command-a-03-2025",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
      });

      return extractText(response);
    }

    return "Invalid mode";
  } catch (error: any) {
    console.error(error);
    return `Error: ${error.message}`;
  }
};
