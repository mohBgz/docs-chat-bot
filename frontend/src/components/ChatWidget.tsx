import { useState, useEffect } from "react";
import { BubbleChat } from "./BubbleChat";
import { BotMessageSquare } from "lucide-react";

export function ChatWidget() {
	const [showBadge, setShowBadge] = useState(true);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setShowBadge(false), 5000); // 5 seconds
		return () => clearTimeout(timer);
	}, []);

	useEffect(() => {
		// When panel opens/closes
		window.parent.postMessage(
			{ type: "TOGGLE_CHAT_OVERLAY", isOpen: isVisible },
			"*"
		);

		// Listen to parent requests (like overlay click to close)
		window.addEventListener("message", (event) => {
			if (event.data?.type === "CLOSE_PANEL") setIsVisible(false);
		});
	}, [isVisible]);

	return (
		<>
			<button
				onClick={() => setIsVisible(!isVisible)}
				className="fixed bottom-5 right-5 group"
			>
				{/* Jumping Badge */}
				{showBadge && (
					<div className="absolute -top-3 -right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-bounce">
						Hi!
					</div>
				)}

				{/* Main Button */}
				<div className="relative bg-gradient-to-tr from-blue-600 to-blue-900 hover:from-blue-500 hover:to-blue-800 text-white p-4 rounded-full shadow-2xl transition-all transform hover:scale-110">
					<BotMessageSquare />
				</div>
			</button>

			{isVisible && (
				<>
					<div className="md:h-screen md:w-screen bg-black/50 backdrop-blur-sm"></div>
					<BubbleChat isVisible={isVisible} setIsVisible={setIsVisible} />
				</>
			)}
		</>
	);
}
