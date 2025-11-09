export const chunkText = (text: string, chunkSize = 50, overlap = 10): string[] => {
  const cleaned = text.replace(/\s+/g, " ").trim();
  const words = cleaned.split(" ");
  const chunks: string[] = [];

  for (let i = 0; i < words.length; i += (chunkSize - overlap)) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    chunks.push(chunk);
  }

  return chunks;
};


