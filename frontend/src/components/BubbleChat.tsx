import { useRef, useState, useEffect, type SetStateAction } from "react";
import axios from "axios";
import { capitalizeFirstLetter } from "../utils/capitalize.js";
import csvIcon from "../assets/csv.png";
import pdfIcon from "../assets/pdf.png";
import wordIcon from "../assets/docs.png";
import { motion, AnimatePresence } from "motion/react";
import toast from "react-hot-toast";
import {
  BotMessageSquare,
  X,
  Send,
  Minimize2,
  MessageCircleMore,
  File,
  FileUp,
  Square,
  Braces,
  ChevronDown,
  ChevronUp,
  Files,
  Upload,
  Trash,
  LoaderCircle,
  CheckLine,
} from "lucide-react";

import { generateGreeting } from "../utils/greetingsGenerator.js";
import { Message } from "../types/Types.js";
import type { Mode, MessagesByMode, UploadedFile } from "../types/Types.js";
import { ChatSection } from "./ChatSection.js";
import { bytesToKb } from "../utils/bytesToKb.js";
import { formatTimestamp } from "../utils/dateFormat.js";
import { displayName } from "../utils/displayName.js";

export const BubbleChat = () => {
  const handleRagChatAfterUpload = async (file: UploadedFile) => {
    try {
      const payload = {
        question: "Hi", // empty question triggers the greeting/summary from ragChat
        mode: mode,
        selectedFileId: file.id,
        selectedFilename: file.filename,
      };

      const response = await axios.post(`${apiUrl}/chat`, payload);
      console.log("hello : ", response.data.answer);

      const answerMessage = new Message(
        "bot",
        response.data.answer,
        false,
        true
      );
      answerMessage.displayedText = answerMessage.text;

      setMessagesByMode((prev) => ({
        ...prev,
        [mode]: [...prev[mode], answerMessage],
      }));
    } catch (err) {
      console.error("Error fetching initial ragChat response:", err);
    }
  };

  const apiUrl = import.meta.env.VITE_API_URL;

  const parentVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
        delayChildren: 0.2,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { duration: 0.3 },
    },
  } as const;

  const inputRef = useRef<HTMLInputElement>(null);
  const inputFileRef = useRef<HTMLInputElement>(null);
  const inputFileSectionRef = useRef<HTMLInputElement>(null);
  const intervalRef = useRef<number | undefined>(undefined);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [inputs, setInputs] = useState({
    chat: "",
    docs: "",
    cms: "",
  });

  const [mode, setMode] = useState<Mode>("chat");

  const fileAccept = mode === "cms" ? ".json" : ".pdf,.docx,.csv";

  const [error, setError] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<{
    docs: UploadedFile[];
    cms: UploadedFile[];
  }>({
    docs: [],
    cms: [],
  });

  //const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [selectedFilesByMode, setSelectedFilesByMode] = useState<{
    chat: null;
    docs: UploadedFile | null;
    cms: UploadedFile | null;
  }>({
    chat: null,
    docs: null,
    cms: null,
  });

  const [isPanelOpen, setIsPanelOpen] = useState<boolean>(false);

 
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const [isDragging, setIsDragging] = useState<boolean>(false);

  const greetingMessage = new Message("bot", generateGreeting("chat"));
  greetingMessage.displayedText = greetingMessage.text;

  const [messagesByMode, setMessagesByMode] = useState<MessagesByMode>({
    chat: [
      (() => {
        const msg = new Message("bot", generateGreeting("chat"));
        msg.displayedText = msg.text;
        return msg;
      })(),
    ],
    docs: [],
    cms: [],
  });

useEffect(() => {
  const fetchFiles = async () => {
    try {
      const fetchUrl = mode === "docs" ? `${apiUrl}/docs` : `${apiUrl}/cms`;
      const response = await axios.get(fetchUrl, { withCredentials: true });
      const files: UploadedFile[] = response.data.files || [];

      setUploadedFiles((prev) => ({
        ...prev,
        [mode]: files,
      }));

      // Auto-select first file if none is selected
      if (mode !== "chat" && !selectedFilesByMode[mode] && files.length > 0) {
        setSelectedFilesByMode((prev) => ({
          ...prev,
          [mode]: files[0],
        }));
        setIsPanelOpen(true);
      }
    } catch (error: any) {
      console.error("Error fetching files:", error.response?.data || error.message);
    }
  };

  fetchFiles();
}, [mode]);

  useEffect(() => {
    if (isTyping) {
      console.log("Typing started!");
    } else {
      console.log("Typing ended!");
      clearInterval(intervalRef.current);
      intervalRef.current = undefined;
    }
  }, [isTyping]);

  //const [hasSentGreeting, setHasSentGreeting] = useState(false);

  useEffect(() => {
    if (
      ((mode === "docs" && messagesByMode.docs.length === 0) ||
        (mode === "cms" && messagesByMode.cms.length === 0)) &&
      selectedFilesByMode[mode]
    ) {
      handleRagChatAfterUpload(selectedFilesByMode[mode]);
    }
  }, [selectedFilesByMode, mode, messagesByMode]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    const lastUserMsg = Array.from(
      chatContainer.querySelectorAll(".justify-start")
    ).pop() as HTMLElement | undefined;

    if (lastUserMsg) {
      lastUserMsg.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [messagesByMode]);

  // Reusable upload function for both drag-drop and file input
  const uploadDocs = async (files: FileList) => {
    if (mode === "docs" || mode === "cms") {
      let toastId;
      const uploadUrl =
        mode === "docs" ? `${apiUrl}/docs/upload` : `${apiUrl}/cms/upload`;
      try {
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append("files", file));

        setIsUploading(true);
        setUploadProgress(0);

        // Show a loading toast
        toastId = toast.loading("Uploading files...", { duration: Infinity });

        await axios.post(uploadUrl, formData, {
          headers: { "Content-type": "multipart/form-data" },
          withCredentials: true,
          onUploadProgress: (ProgressEvent) => {
            const percentCompleted = Math.round(
              (ProgressEvent.loaded * 100) / (ProgressEvent.total || 1)
            );
            setUploadProgress(percentCompleted);
          },
        });

        // Fetch updated files

        const response = await axios.get(`${apiUrl}/${mode}`, {
          withCredentials: true,
        });

        setUploadedFiles((prev) => ({
          ...prev,
          [mode]: [...response.data.files],
        }));
        setIsUploading(false);
        setError("");

        setIsPanelOpen(true);

        // Remove loading toast and show success
        toast.dismiss(toastId);
        toast.success("Files uploaded successfully!", { duration: 3000 });

        setError("");

        // Auto-select first file if none selected
      } catch (error: any) {
        console.error("Upload error:", error.response.data.message);
        setError(error.response.data.message);
        //duplicate key value violates unique constraint "documents_pkey"
        toast.error("Failed to upload files. Please try again.", {
          duration: 3000,
        });
        setUploadProgress(0);
        setIsUploading(false);
        toast.dismiss(toastId);
      }
    }
  };

  //handles dropped files
  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      await uploadDocs(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleUploadClick = () => {
    inputFileRef.current?.click();
  };

  // ✅ UPDATED: Now uses the uploadDocs function
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    await uploadDocs(e.target.files);

    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!inputs[mode].trim()) return;

    // ✅ ADDED: Validation for docs mode
    if (
      (mode === "docs" || mode === "cms") &&
      (!uploadedFiles || uploadedFiles[mode].length === 0)
    ) {
      alert("Please upload a document first");
      return;
    }

    const newUserMessage = new Message("user", inputs[mode]);
    newUserMessage.displayedText = inputs[mode];
    console.log(newUserMessage.displayedText);

    setMessagesByMode((prev) => ({
      ...prev,
      [mode]: [...prev[mode], newUserMessage],
    }));

    try {
      const thinkingMessage = new Message("bot", "", true);
      setMessagesByMode((prev) => ({
        ...prev,
        [mode]: [...prev[mode], thinkingMessage],
      }));

      const inputCopy = inputs[mode];
      setInputs((prev) => ({ ...prev, [mode]: "" }));

      // ✅ ADDED: Include selected file in payload
      const payload: any = {
        question: inputCopy,
        mode: mode,
      };

      if ((mode === "docs" || mode === "cms") && selectedFilesByMode[mode]) {
        (payload.selectedFileId = selectedFilesByMode[mode].id),
          (payload.selectedFilename = selectedFilesByMode[mode].filename);
      }

      console.log("fileeee", "--- ", selectedFilesByMode[mode]?.filename);

      const answer = await axios.post(`${apiUrl}/chat`, payload);
      console.log(answer.data.answer);

      const answerMessage = new Message("bot", answer.data.answer, false, true);

      setMessagesByMode((prev) => ({
        ...prev,
        [mode]: prev[mode].map((msg) => (msg.isThinking ? answerMessage : msg)),
      }));

      console.log(messagesByMode[mode]);
      let index = 0;

      if (answerMessage.text.length > 5) {
        setIsTyping(true);
      }

      intervalRef.current = window.setInterval(() => {
        setMessagesByMode((prev) => {
          const lastIndex = prev[mode].length - 1;
          const updated = { ...prev };
          const msg = updated[mode][lastIndex];

          if (index >= msg.text.length) {
            setIsTyping(false);
            return updated;
          }

          msg.displayedText += msg.text[index];
          index++;

          return updated;
        });
      }, 30);
    } catch (error) {
      console.error(error);
      // ✅ ADDED: Remove thinking message on error
      setMessagesByMode((prev) => ({
        ...prev,
        [mode]: prev[mode].filter((msg) => !msg.isThinking),
      }));
      //alert("Failed to send message. Please try again.");
    }
  };

  return (
    <div className="w-xl min-h-[600px] rounded-xl flex flex-col justify-between overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-800 w-full py-4 px-3 gap-3 flex flex-col">
        <div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2 items-center">
              <div className="bg-blue-800 flex items-center justify-center rounded-full size-10">
                <BotMessageSquare color="white" />
              </div>

              <div className="text-lg flex-col gap-1">
                <div className="font-semibold text-gray-50">Echo Bot</div>
                <div className="text-sm text-gray-200">
                  {capitalizeFirstLetter(mode) + " Mode"}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button>
                <Minimize2 size={20} className="text-gray-100" />
              </button>
              <button>
                <X size={20} className="text-gray-100" />
              </button>
            </div>
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center w-full flex-col items-center">
          <div className="flex bg-blue-900 rounded-md w-1/2 justify-between overflow-hidden">
            {["chat", "docs", "cms"].map((option) => (
              <button
                key={option}
                onClick={() => {
                  setMode(option as SetStateAction<Mode>);
                }}
                className={`flex items-center gap-2 transition-colors py-2 px-4 duration-200
                ${
                  option === mode
                    ? "bg-blue-950 font-medium text-gray-100"
                    : "text-gray-300"
                }`}
              >
                {option === "chat" && <MessageCircleMore size={18} />}
                {option === "docs" && <File size={18} />}
                {option === "cms" && <Braces size={18} />}

                {capitalizeFirstLetter(option)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Uploaded Documents section */}
      {mode !== "chat" && uploadedFiles && uploadedFiles[mode].length > 0 && (
        <div
          className="z-50 shadow-md shadow-black bg-gray-900 flex justify-between p-4 gap-2 font-semibold hover:cursor-pointer"
          onClick={() => {
            setIsPanelOpen(!isPanelOpen);
            
          }}
        >
          <div className="flex items-center gap-4">
            <div className="relative inline-flex items-center">
              <Files className="size-6 text-blue-500 drop-shadow-sm" />
              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-semibold flex items-center justify-center w-5 h-5 rounded-full shadow-md">
                {uploadedFiles[mode].length}
              </div>
            </div>

            <span className="text-gray-300 select-none text-md font-medium tracking-wide">
              Uploaded Documents
            </span>
          </div>

          <div className="flex gap-5">
            {/* Show selected file */}
            {selectedFilesByMode[mode] && (
              <div
                className={`select-none ${
                  !isPanelOpen ? "text-cyan-500" : "text-gray-300"
                }  text-sm hover:drop-shadow-md hover:drop-shadow-gray-800 flex items-center gap-2`}
              >
                {selectedFilesByMode[mode] && <CheckLine />}

                {displayName(selectedFilesByMode[mode].filename)}
              </div>
            )}

            {isPanelOpen ? (
              <ChevronUp color="white" />
            ) : (
              <ChevronDown color="white" />
            )}
          </div>
        </div>
      )}

      <div className="relative flex flex-1">
        {mode !== "chat" && uploadedFiles && uploadedFiles[mode].length > 0 && (
          <AnimatePresence>
            {isPanelOpen && uploadedFiles && (
              <motion.div
                key="file-panel"
                variants={parentVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                //transition={{ duration: 0.19, ease: "easeInOut" }}
                className="bg-gradient-to-b from-gray-900 to-blue-950 absolute top-0 right-0 left-0 bottom-0 h-full flex flex-col p-6 gap-3 overflow-hidden"
                onClick={() => setIsPanelOpen(false)}
              >
                {uploadedFiles[mode].map((file, index) => (
                  <motion.div
                    variants={childVariants}
                    key={file.id + index}
                    className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:cursor-pointer transition-all duration-150 select-none 
                    ${
                      selectedFilesByMode[mode]
                        ? selectedFilesByMode[mode].id === file.id
                          ? "shadow-sm shadow-black bg-blue-900 scale-[1.01]"
                          : "bg-gray-950 scale-100 brightness-[0.6]"
                        : "bg-gray-950 scale-100 brightness-100"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFilesByMode((prev) => ({
                        ...prev,
                        [mode]: file,
                      }));

                     // setIsPanelOpen(false); // Close panel after selection
                    }}
                  >
                    <div className="flex gap-2 items-center">
                      {file.type === "pdf" && (
                        <img className="size-6" src={pdfIcon} alt="PDF Icon" />
                      )}
                      {file.type === "csv" && (
                        <img className="size-6" src={csvIcon} alt="CSV Icon" />
                      )}
                      {file.type ===
                        "vnd.openxmlformats-officedocument.wordprocessingml.document" && (
                        <img
                          className="size-6"
                          src={wordIcon}
                          alt="Word Icon"
                        />
                      )}

                      {/* 
                      {mode === "cms" &&  <img
                          className="size-6"
                          src={jsonIcon}
                          alt="Json Icon"
                        />}

                         */}
                      {mode === "cms" && <Braces className="text-gray-300" />}

                      <div className="flex-col justify-center">
                        <div className="text-white font-semibold">
                          {capitalizeFirstLetter(file.filename)}
                        </div>
                        <div className="text-white/60">
                          {bytesToKb(file.size)} KB
                        </div>
                      </div>
                    </div>

                    {selectedFilesByMode[mode] &&
                      selectedFilesByMode[mode].id === file.id && (
                        <div className="mt-1.5 text-sm text-gray-300 flex items-center gap-2">
                          <span className="bg-gray-800/50 px-2 py-0.5 rounded-full text-xs text-blue-400">
                            {formatTimestamp(
                              selectedFilesByMode[mode].uploaded_at
                            )}
                          </span>
                          <span className="text-gray-400 text-xs select-none">
                            uploaded
                          </span>
                        </div>
                      )}

                    {/* remove icon */}
                    {!isDeleting ? (
                      <div className="relative group">
                        {/* Tooltip */}
                        <div
                          className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1
                          px-2 py-1 text-xs bg-gray-800 text-white rounded
                          opacity-0 transition duration-200
                          whitespace-nowrap ${
                            selectedFilesByMode[mode] &&
                            selectedFilesByMode[mode].id === file.id &&
                            `group-hover:opacity-100`
                          }`}
                        >
                          Remove file
                        </div>
                        {selectedFilesByMode[mode] &&
                          selectedFilesByMode[mode].id === file.id && (
                            <div
                              onClick={async () => {
                                setIsDeleting(true);
                                try {
                                  const toastId = toast.loading(
                                    "deleting file...",
                                    { duration: Infinity }
                                  );
                                  await axios.delete(
                                    `${apiUrl}/${mode}/${file.id}`,
                                    { withCredentials: true }
                                  );
                                  toast.dismiss(toastId);
                                  setIsDeleting(false);
                                  toast.success("file deleted successfully", {
                                    duration: 3000,
                                  });
                                  setUploadedFiles((prev) => ({
                                    ...prev,
                                    [mode]: prev[mode].filter(
                                      (uploadedFile) =>
                                        uploadedFile.id !== file.id
                                    ),
                                  }));
                                } catch (error) {
                                  toast.error(
                                    "error deleting file, try again..."
                                  );
                                  setIsDeleting(false);
                                }
                              }}
                            >
                              <Trash className="text-red-600/70" />
                            </div>
                          )}
                      </div>
                    ) : selectedFilesByMode[mode]?.id === file.id ? (
                      <LoaderCircle className="animate-spin text-red-600" />
                    ) : null}
                  </motion.div>
                ))}

                {error && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-gray-900 text-white px-8 py-6 rounded-2xl shadow-lg text-center">
                      <div className="text-2xl font-semibold mb-3">Oops!</div>
                      <div className="text-gray-300 mb-4">{error}</div>
                      <button
                        onClick={() => setError("")}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/*  Show upload zone only when no files qre uploaded */}

        {mode !== "chat" &&
        (!uploadedFiles || uploadedFiles[mode].length === 0) ? (
          <div
            onClick={() => {
              inputFileSectionRef.current?.click();
            }}
            className="relative bg-gray-950 flex-1 flex-col flex justify-center items-center gap-8 p-8"
          >
            {error && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-gray-900 text-white px-8 py-6 rounded-2xl shadow-lg text-center">
                  <div className="text-2xl font-semibold mb-3">Oops!</div>
                  <div className="text-gray-300 mb-4">{error}</div>
                  <button
                    onClick={() => setError("")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            <input
              type="file"
              multiple
              className="hidden"
              ref={inputFileSectionRef}
              onChange={handleFileUpload}
              accept={fileAccept}
            />
            <div className="text-white text-4xl font-bold tracking-tight">
              {mode === "docs"
                ? "Document Upload"
                : mode === "cms"
                ? "CMS Upload"
                : ""}
            </div>

            <div
              className={`${
                isDragging
                  ? "border-blue-500 bg-blue-950/30"
                  : "border-gray-700"
              } bg-gray-900/50 flex flex-col justify-center items-center border-2 hover:border-gray-600 px-12 py-12 border-dashed rounded-xl transition-all duration-300 hover:bg-gray-900/70 cursor-pointer group min-w-[500px]`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div
                className={`bg-gray-800/50 p-4 rounded-full mb-4 transition-colors 
    ${
      isUploading
        ? "border-2 border-blue-600"
        : "group-hover:bg-gray-700/50 bg-gray-200"
    }`}
              >
                {isUploading ? (
                  <div className="text-blue-400 font-semibold text-2xl">
                    {uploadProgress} %
                  </div>
                ) : (
                  <Upload
                    size={40}
                    className="text-gray-400 group-hover:text-gray-300 transition-colors"
                  />
                )}
              </div>

              <div className="text-gray-100 text-2xl font-semibold mb-2 text-center">
                {mode === "cms"
                  ? "Drag & drop CMS JSON file here"
                  : "Drag & drop files here"}
              </div>

              <div className="text-gray-400 text-base mb-6">
                or click to browse from your computer
              </div>

              <div className="text-gray-500 text-sm bg-gray-800/50 px-4 py-2 rounded-full">
                {mode === "docs"
                  ? "Supported: PDF, DOCX, CSV"
                  : "Supported: JSON"}
              </div>
            </div>
          </div>
        ) : (
          <ChatSection
            key="chat-section"
            className="bg-gray-950 flex-1 py-8 px-8 overflow-y-auto"
            mode={mode}
            messagesByMode={messagesByMode}
            chatContainerRef={chatContainerRef}
          />
        )}
      </div>

      {/* message + Send */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-5 bg-black border-t w-full px-4 py-4 items-center"
      >
        <div className="relative flex flex-1 items-center bg-gray-100 rounded-full border border-gray-300 focus-within:ring-1 focus-within:ring-gray-400">
          {/* File Upload only for docs mode with files */}

          <input
            className="px-6 disabled:cursor-not-allowed text-gray-800 font-semibold disabled:bg-black/25  placeholder:text-gray-600 placeholder:font-semibold disabled:opacity-50 flex-1 outline-none py-2"
            type="text"
            placeholder={`${
              mode === "chat"
                ? "Ask anything"
                : mode === "docs"
                ? !uploadedFiles || uploadedFiles["docs"].length === 0
                  ? "Upload a document to start"
                  : `Ask me about: ${selectedFilesByMode[mode]?.filename || ""}`
                : mode === "cms"
                ? !uploadedFiles || uploadedFiles["cms"].length === 0
                  ? "Upload a CMS file to start"
                  : `Ask me about CMS content: ${
                      selectedFilesByMode[mode]?.filename || ""
                    }`
                : ""
            }`}
            ref={inputRef}
            value={inputs[mode]}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setInputs((prev) => ({ ...prev, [mode]: e.target.value }));
            }}
            disabled={
              mode !== "chat" &&
              (!uploadedFiles || uploadedFiles[mode].length === 0)
            }
            onClick={() => {
              if (mode !== "chat") {
                setIsPanelOpen(false);
              }
            }}
          />
        </div>

        <div className="size-9 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition active:scale-[0.95]">
          <button
            type="submit"
            onClick={(e) => {
              if (isTyping) {
                e.preventDefault();
                setIsTyping(false);
              }
            }}
            className="size-9 rounded-full bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition active:scale-[0.95]"
          >
            {isTyping ? (
              <Square className="text-white animate-pulse" />
            ) : mode === "docs" && isPanelOpen ? (
              <div onClick={handleUploadClick}>
                <FileUp />

                <input
                  type="file"
                  ref={inputFileRef}
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".pdf,.csv,.docx"
                />
              </div>
            ) : (
              <Send />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
