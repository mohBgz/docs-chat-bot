import type { Mode } from "../types/Types.js";
export const generateGreeting = (mode: Mode, fileName?:string | null): string => {
  // Chat mode greetings
  const greetingsChatMode: string[] = [
    "Hello! How are you today?",
    "Hi there! What's up?",
    "Hey! How's it going?",
    "Good day! How can I help you?",
    "Hi! Nice to see you.",
    "Hello! What can I do for you today?",
    "Hey there! How's your day going?",
    "Hi! Ready to chat?",
    "Hello! How's everything?",
    "Hey! How are you feeling today?",
    "Hi! What’s on your mind?",
    "Hello! Hope you're having a great day.",
    "Hey there! How can I assist you?",
    "Hi! It's nice to meet you.",
    "Hello! How can I make your day better?",
    // ultra-short friendly versions
    "Hey! 👋 Ready to chat?",
    "Hi! 😊 What’s up?",
    "Hello! Ready for a quick chat?",
    "Hey there! How’s your day?",
  ];

  // Document mode greetings
 const greetingsDocMode: string[] = fileName
    ? [
        `📄 You're now looking at "${fileName}". Ask me anything! 💬`,
        `Hey! 👋 "${fileName}" is ready. You can also pick another file 📂`,
        `Ready to explore "${fileName}"? 🔍 You can switch files anytime! 🔄`,
        `✨ Info from "${fileName}" is ready. Ask away or choose another file 📝`,
        `📌 Working with "${fileName}". Need something else? Just pick another file! 😎`,
        `💡 "${fileName}" is ready to be explored. Or try another file! 📂`,
        `Hey there! "${fileName}" is loaded. Ask questions or switch files 🗂️`,
        `👀 Checking "${fileName}"? You can also pick a new document! 📄`,
        `🎯 "${fileName}" is ready. Ask anything or select another file!`,
        `🚀 "${fileName}" loaded! You can explore it or choose another one.`,
      ]
    : [];

  switch (mode) {
    case "chat":
      return greetingsChatMode[
        Math.floor(Math.random() * greetingsChatMode.length)
      ]!;
    case "docs":
      return greetingsDocMode[
        Math.floor(Math.random() * greetingsDocMode.length)
      ]!;
    default: {
      return "";
    }
  }
};
