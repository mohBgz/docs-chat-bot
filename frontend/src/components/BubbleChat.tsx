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
	Minus,
	Send,
	MessageCircleMore,
	File,
	Paperclip,
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

interface BubbleChatProps {
	isVisible: boolean;
	setIsVisible: React.Dispatch<React.SetStateAction<boolean>>;
}
export const BubbleChat: React.FC<BubbleChatProps> = ({
	isVisible,
	setIsVisible,
}) => {
	const apiUrl = import.meta.env.VITE_API_URL;

	const handleRagChatAfterUpload = async (file: UploadedFile) => {
		try {
			const payload = {
				question:
					"what this document, just its type and what it is about very briefly",
				mode: mode,
				selectedFileId: file.id,
				selectedFilename: file.filename,
			};

			// Show loading message
			const loadingMessage = new Message("bot", "", true);
			loadingMessage.displayedText = "";

			setMessagesByMode((prev) => ({
				...prev,
				[mode]: [loadingMessage],
			}));

			// Fetch response
			const response = await axios.post(`${apiUrl}/chat`, payload);

			// Create new message with response (don't mutate old one)
			const answerMessage = new Message("bot", response.data.answer, false);

			setMessagesByMode((prev) => ({
				...prev,
				[mode]: [answerMessage],
			}));

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
		} catch (err) {
			console.error("Error fetching initial ragChat response:", err);

			// Create error message
			const errorMessage = new Message(
				"bot",
				"Something went wrong, please try again later :/",
				false
			);
			errorMessage.displayedText = errorMessage.text;

			setMessagesByMode((prev) => ({
				...prev,
				[mode]: [errorMessage],
			}));
		}
	};

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
				console.error(
					"Error fetching files:",
					error.response?.data || error.message
				);
			}
		};

		fetchFiles();
	}, [selectedFilesByMode, mode]);

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
		if ((mode === "docs" || mode === "cms") && selectedFilesByMode[mode]) {
			handleRagChatAfterUpload(selectedFilesByMode[mode]);
		}
	}, [selectedFilesByMode.docs?.id, selectedFilesByMode.cms?.id]); // ✅ Clearer and more explicit

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
				setSelectedFilesByMode((prev) => ({
					...prev,
					[mode]: response.data.files[response.data.files.length - 1],
				}));

				setError("");

				setIsPanelOpen(true);

				// Remove loading toast and show success
				toast.dismiss(toastId);
				toast.success("Files uploaded successfully!", { duration: 3000 });

				setError("");
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

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		if (!e.target.files || e.target.files.length === 0) return;

		await uploadDocs(e.target.files);

		e.target.value = "";
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		if (!inputs[mode].trim()) return;

		if (
			(mode === "docs" || mode === "cms") &&
			(!uploadedFiles || uploadedFiles[mode].length === 0)
		) {
			alert("Please upload a document first");
			return;
		}

		const newUserMessage = new Message("user", inputs[mode]);
		newUserMessage.displayedText = inputs[mode];

		setMessagesByMode((prev) => ({
			...prev,
			[mode]: [...prev[mode], newUserMessage],
		}));

		try {
			const thinkingMessage = new Message("bot", "", true); // isThinking = true
			setMessagesByMode((prev) => ({
				...prev,
				[mode]: [...prev[mode], thinkingMessage],
			}));

			const inputCopy = inputs[mode];
			setInputs((prev) => ({ ...prev, [mode]: "" }));

			const payload: any = {
				question: inputCopy,
				mode: mode,
			};

			if ((mode === "docs" || mode === "cms") && selectedFilesByMode[mode]) {
				(payload.selectedFileId = selectedFilesByMode[mode].id),
					(payload.selectedFilename = selectedFilesByMode[mode].filename);
			}

			const answer = await axios.post(`${apiUrl}/chat`, payload);

			const answerMessage = new Message("bot", answer.data.answer, false, true);

			setMessagesByMode((prev) => ({
				...prev,
				[mode]: prev[mode].map((msg) => (msg.isThinking ? answerMessage : msg)), // replace the thinking message by the answer message
			}));

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

			setMessagesByMode((prev) => ({
				...prev,
				[mode]: prev[mode].filter((msg) => !msg.isThinking),
			}));
			//alert("Failed to send message. Please try again.");
		}
	};

	const handleDelete = async () => {
		setIsDeleting(true);
		if (mode === "chat" || !selectedFilesByMode[mode]) return;
		try {
			const toastId = toast.loading("deleting file...", { duration: Infinity });
			await axios.delete(`${apiUrl}/${mode}/${selectedFilesByMode[mode]!.id}`, {
				withCredentials: true,
			});
			toast.dismiss(toastId);
			setIsDeleting(false);
			toast.success("file deleted successfully", {
				duration: 3000,
			});
			setUploadedFiles((prev) => ({
				...prev,
				[mode]: prev[mode].filter(
					(uploadedFile) => uploadedFile.id !== selectedFilesByMode[mode]!.id
				),
			}));
		} catch (error) {
			toast.error("error deleting file, try again...");
			setIsDeleting(false);
		}
	};
	return (
		<div
			className="
    flex flex-col
   
    drop-shadow-xl
    md:rounded-2xl
    overflow-hidden
		w-full
		h-full
    shadow-lg
    bg-gradient-to-b from-gray-950 to-gray-900
	
    
  "
		>
			{/* Header */}
			<div className="bg-gradient-to-r from-blue-500 to-blue-900 w-full py-4 px-4 gap-6 flex flex-col sticky top-0 z-50 drop-shadow-sm drop-shadow-blue-800">
				<div>
					<div className="flex justify-between items-center">
						<div className="flex gap-2 items-center">
							<div className="bg-blue-800 flex items-center justify-center rounded-full size-10">
								<BotMessageSquare color="white" />
							</div>

							<div className="  flex-col gap-1">
								<div className=" font-semibold text-gray-50 text-xl">
									Echo Bot
								</div>
								<div className=" text-[0.9rem] text-gray-200 bg-blue-800 rounded full px-2 py-0.5 w-fit ">
									{capitalizeFirstLetter(mode) + " Mode"}
								</div>
							</div>
						</div>
						<div className="flex gap-3">
							<button
								onClick={() => {
									setIsVisible(!isVisible);
								}}
							>
								<Minus size={20} className="text-gray-100" />
							</button>{" "}
							<button
								onClick={() => {
									setIsVisible(!isVisible);
								}}
							>
								<X size={20} className="text-gray-100" />
							</button>
						</div>
					</div>
				</div>

				{/* Mode Toggle */}
				<div className="flex justify-center">
					<div className="flex w-fit items-center bg-blue-900 rounded-md overflow-auto">
						{["chat", "docs", "cms"].map((option) => (
							<button
								key={option}
								onClick={() => {
									setMode(option as SetStateAction<Mode>);
								}}
								className={`text-[1rem]  flex items-center gap-2 transition-colors py-2 px-4 duration-200 whitespace-nowrap
        ${
					option === mode
						? "bg-blue-950 font-medium text-gray-100"
						: "text-gray-300 hover:text-gray-100 hover:bg-blue-800"
				}`}
							>
								{option === "chat" && (
									<MessageCircleMore className="w-4 h-4 sm:w-5 sm:h-5" />
								)}
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

					<div className="flex gap-5 md0:gap-2 justify-between items-center">
						{/* Show selected file */}
						{selectedFilesByMode[mode] && (
							<div
								className={`select-none ${
									!isPanelOpen ? "text-cyan-500" : "text-gray-300"
								}  text-sm hover:drop-shadow-md hover:drop-shadow-gray-800 flex items-center gap-2 
								max-w-[6rem] overflow-hidden md:max-w-none md:overflow-visible`}
							>
								{selectedFilesByMode[mode] && (
									<CheckLine className="flex-shrink-0 " />
								)}

								<span className="truncate">
									{selectedFilesByMode[mode].filename}
								</span>
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

			{/* Chat Container */}
			<div className="relative flex flex-1 overflow-hidden">
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
								className="bg-gradient-to-b from-gray-900 to-blue-950 absolute top-0 right-0 left-0 bottom-0 h-full flex flex-col p-6 gap-3 overflow-y-auto"
								onClick={() => setIsPanelOpen(false)}
							>
								{uploadedFiles[mode].map((file, index) => (
									<motion.div
										variants={childVariants}
										key={file.id + index}
										className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:cursor-pointer  transition-all duration-150 select-none 
                    ${
											selectedFilesByMode[mode]
												? selectedFilesByMode[mode].id === file.id
													? "shadow-sm shadow-black bg-blue-900 scale-[1.01]"
													: "bg-gray-950 scale-100 brightness-[0.6] hover:brightness-[0.9]"
												: "bg-gray-950 scale-100 brightness-100 "
										}`}
										onClick={(e) => {
											e.stopPropagation();
											if (
												!selectedFilesByMode[mode] ||
												selectedFilesByMode[mode].id !== file.id
											) {
												setSelectedFilesByMode((prev) => ({
													...prev,
													[mode]: file,
												}));
											} // Only call handleRagChatAfterUpload if file is different

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

											<div
												className="flex-col justify-center max-w-[4rem] overflow-hidden md:max-w-[12rem]    
  md:overflow-visible md:text-clip "
											>
												<div className="text-white font-semibold truncate">
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
													<span className="bg-gray-800/50 px-1 py-0.5 rounded-full text-xs text-center text-blue-400">
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
														<div onClick={handleDelete}>
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
									<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center">
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
						className="relative bg-gray-950 flex-1  flex-col flex justify-center items-center gap-6 p-6 py-12"
					>
						{error && (
							<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center">
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
						<div className="text-white text-3xl  font-bold tracking-tight">
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
							}  bg-gray-900/50 flex flex-col justify-center items-center border-2 hover:border-gray-600 py-5 px-3 border-dashed rounded-xl transition-all duration-300 hover:bg-gray-900/70 cursor-pointer group `}
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
									<div className="text-blue-400 font-semibold">
										{uploadProgress} %
									</div>
								) : (
									<Upload
										size={30}
										className="text-gray-400 group-hover:text-gray-300 transition-colors"
									/>
								)}
							</div>

							<div className="hidden lg:block text-[clamp(6px,2vw,20px)] text-gray-300/90 text-lg font-semibold mb-2 text-center">
								{mode === "cms"
									? "Drag & drop CMS JSON file here"
									: "Drag & drop files here"}
							</div>

							<div className="  hidden lg:block text-center text-gray-400 text-lg  mb-6 ">
								Or click to browse from your computer
							</div>

							<div className="  lg:hidden text-center text-gray-300 font-semibold text-xl  mb-6">
								Click to browse from your device
							</div>

							<div className="text-gray-500 bg-gray-800/50 px-4 py-2 rounded-full">
								{mode === "docs"
									? "Supported: PDF, DOCX, CSV"
									: "Supported: JSON"}
							</div>
						</div>
					</div>
				) : !isPanelOpen ? (
					<ChatSection
						key="chat-section"
						className="bg-gradient-to-b from-gray-950 to-gray-900 flex-1 py-6 px-4 overflow-y-auto min-h-0"
						mode={mode}
						messagesByMode={messagesByMode}
						chatContainerRef={chatContainerRef}
					/>
				) : (
					""
				)}
			</div>

			{/* Input Form */}
			<form
				onSubmit={handleSubmit}
				className="flex gap-3 bg-gray-900/80 backdrop-blur border-t border-gray-800 w-full px-4 py-3 items-center"
			>
				<div className="relative flex flex-1 items-center bg-gray-800 rounded-xl border border-gray-700 focus-within:ring-1 focus-within:ring-blue-500">
					<input
						className="px-4 w-full disabled:cursor-not-allowed text-gray-100 bg-transparent font-medium disabled:bg-gray-800/25 
						placeholder:text-gray-500 placeholder:font-medium placeholder:text-lg
						
						disabled:opacity-50 flex-1 outline-none py-2.5"
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
											displayName(selectedFilesByMode[mode]?.filename!) || ""
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

				<button
					type="submit"
					onClick={(e) => {
						if (isTyping) {
							e.preventDefault();
							setIsTyping(false);
						}
					}}
					className="size-10 rounded-xl bg-blue-600 flex items-center justify-center hover:bg-blue-700 transition-all active:scale-[0.97]"
				>
					{isTyping ? (
						<Square className="text-white animate-pulse" />
					) : mode !== "chat" && isPanelOpen ? (
						<div className="group relative" onClick={handleUploadClick}>
							{/* Tooltip */}
							<div
								className="absolute bottom-[150%] left-1/2 -translate-x-1/2 mb-1
																px-2 py-1 text-sm bg-gray-800 text-white rounded
																opacity-0 transition duration-200
																whitespace-nowrap 
																	group-hover:opacity-100
																"
							>
								attach files
							</div>
							<Paperclip />

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
			</form>
		</div>
	);
};
