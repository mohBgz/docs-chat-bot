export const TypingIndicator = () => {
  return (
    <div className="flex gap-2">
      <span
        className="size-2 bg-gray-300 rounded-full animate-bounce"
        style={{ animationDelay: "0s" }}
      ></span>
      <span
        className="size-2 bg-gray-300 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></span>
      <span
        className="size-2 bg-gray-300 rounded-full animate-bounce"
        style={{ animationDelay: "0.4s" }}
      ></span>
    </div>
  );
};
