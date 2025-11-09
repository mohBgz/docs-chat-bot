import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

export const textToEmbeddings = async (
  chunkedText: string[]
): Promise<number[][]> => {
  const openai = new OpenAI({
    baseURL: "https://api.cohere.ai/compatibility/v1",
    apiKey: process.env.COHERE_API_KEY!,
  });

  const response = await openai.embeddings.create({
    input: chunkedText,
    model: "embed-v4.0",
    encoding_format: "float",
  });

  const embeddings: number[][] = response.data.map((item) => item.embedding);
  //embeddings → number[][] array of emebeddings ( 1 embedding for each chunk);

  // console.log(embeddings)
  return embeddings;
};

// textToEmbeddings([
//   'name:Alice | age:25',
//   '| city:Paris |',
//   '456465466565'
// ])
