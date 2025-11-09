import { BotMessageSquare, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { TypingIndicator } from "./TypingIndicator";
import type {Mode, MessagesByMode} from "../types/Types.js";



export const ChatSection = ({
  className,
  messagesByMode,
  chatContainerRef,
  mode,

}: {
  className: string,
  messagesByMode: MessagesByMode,
  chatContainerRef: React.RefObject<HTMLDivElement | null>;
  mode : Mode
}) => {
  const markdownComponents = {
    // Ordered lists (numbered)
    ol: ({ node, ...props }: any) => (
      <ol
        className="list-decimal list-outside ml-6 space-y-2 mb-4"
        {...props}
      />
    ),
    // Unordered lists (bullet points)
    ul: ({ node, ...props }: any) => (
      <ul className="list-disc list-outside ml-6 space-y-2 mb-4" {...props} />
    ),
    // List items
    li: ({ node, ...props }: any) => (
      <li className="leading-relaxed text-gray-300 mb-1" {...props} />
    ),
    // Strong/bold text
    strong: ({ node, ...props }: any) => (
      <strong className="font-semibold text-gray-100" {...props} />
    ),
    // Paragraphs
    p: ({ node, ...props }: any) => (
      <p className="mb-3 leading-relaxed text-gray-300" {...props} />
    ),
    // Headers
    h1: ({ node, ...props }: any) => (
      <h1 className="text-xl font-bold text-gray-100 mb-3" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <h2 className="text-lg font-bold text-gray-100 mb-2" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <h3 className="text-md font-semibold text-gray-100 mb-2" {...props} />
    ),
    // Code blocks
    code: ({ node, inline, ...props }: any) =>
      inline ? (
        <code
          className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded text-sm"
          {...props}
        />
      ) : (
        <code
          className="block bg-gray-800 text-gray-200 p-3 rounded-lg text-sm overflow-x-auto"
          {...props}
        />
      ),
    // Blockquotes
    blockquote: ({ node, ...props }: any) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-4 italic text-gray-400 my-3"
        {...props}
      />
    ),
  };
  return (
    <div
      className={className}
      ref={chatContainerRef}
    >
      {messagesByMode[mode].map((msg) => (
        <div
          key={msg.id}
          className={`flex ${
            msg.from === "user" ? "justify-end " : "justify-start"
          } gap-3 mt-5 `}
        >
          {msg.from === "bot" && (
            <div className="bg-gray-600 flex items-center justify-center rounded-full size-8 shrink-0">
              <BotMessageSquare size={20} />
            </div>
          )}
          <div
            className={` ${
              msg.from === "user"
                ? `bg-gradient-to-bl from-blue-600 to-blue-900 rounded-tr-xs`
                : `bg-gray-900 rounded-tl-xs border`
            } px-4 space-y-2 border-gray-700 h-fit  py-3 rounded-xl  mt-2`}
          >
            <div className=" text-gray-300 leading-relaxed">
              {msg.from === "bot" && msg.isThinking ? (
                <TypingIndicator />
              ) : (
                <ReactMarkdown
                  rehypePlugins={[rehypeSanitize]}
                  components={markdownComponents}
                >
                  {msg.displayedText}
                </ReactMarkdown>
              )}
            </div>
            {msg.from == "user" && (
              <div className="text-sm text-gray-400">{msg.timestamp}</div>
            )}
          </div>
          {msg.from === "user" && (
            <div className="bg-blue-600 flex items-center justify-center rounded-full size-8 shrink-0">
              <User size={20} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
