import { Readable } from "stream";

import csvParser from "csv-parser";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export const parseDOCX = async (buffer:Buffer): Promise<string> => {


  try {
    const { value: text } = await mammoth.extractRawText({ buffer  }); // property buffer // buffer : buffer
    return text;
  } catch (error) {
    console.log(error);
    return "";
  }
};




export const parseCSV = async (fileBuffer: Buffer): Promise<string> => {
  const results: string[] = [];

  return new Promise((resolve, reject) => {
    // Convert Buffer → Readable stream
    const stream = Readable.from(fileBuffer);

    stream
      .pipe(csvParser())
      .on("data", (row) => {
        const rowText = Object.entries(row)
          .map(([key, value]) => `${key}:${value}`)
          .join(" | ");
        results.push(rowText);
      })
      .on("end", () => {
        resolve(results.join("\n"));
      })
      .on("error", (err) => {
        reject(err);
      });
  });
};


export const parsePDF = async (buffer: Buffer): Promise<string> => {
  

  try {
    const data = await pdf(buffer);

    return data.text;
  } catch (error) {
    console.error(error);
    return "";
  }
};

export const documentParser = async (file: Express.Multer.File): Promise<string> => {
 
  const fileExt = file.mimetype.split("/")[1];
  let extractedText: string = "";

  try {
    switch (fileExt) {
      case "vnd.openxmlformats-officedocument.wordprocessingml.document":
        extractedText = await parseDOCX(file.buffer);
        break;
      case "csv":
        extractedText = await parseCSV(file.buffer);
        break;
      case "pdf":
        extractedText = await parsePDF(file.buffer);
        break;

      default:
        throw new Error("Invalid format, please upload CSV, PDF or DOCX");
    }
  } catch (error) {
    console.error(error);
    return "";
  }

  return extractedText;
};
