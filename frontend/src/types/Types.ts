import { v4 as uuidv4 } from "uuid";

export class Message {
  id: string;
  from: "user" | "bot";
  text: string;
  displayedText: string;
  timestamp: string;
  isThinking?: boolean;
  isTyping?: boolean;

  constructor(
    from: "user" | "bot",
    text: string = "",
    isThinking: boolean = false,
    isTyping: boolean = false
  ) {
    this.id = uuidv4();
    this.from = from;
    this.text = text;
    this.displayedText = "";
    this.timestamp = new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    this.isThinking = isThinking;
    this.isTyping = isTyping;
  }
}

export type Mode = "chat" | "docs" | "cms";

export type UploadedFile = {
  id: string;
  filename: string;
  type: string;
  size: number;
  session_id: string;
  uploaded_at: string;
};

export type MessagesByMode = {
  chat: Message[];
  docs: Message[];
  cms: Message[];
};
