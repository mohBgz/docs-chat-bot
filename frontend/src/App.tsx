import { ChatWidget } from "./components/ChatWidget";
import "./App.css";
import { Toaster } from "react-hot-toast";

function App() {
	return (
		<div className="flex justify-center items-center h-full w-full ">
			<Toaster position="top-right" reverseOrder={false} />

			<ChatWidget />
		</div>
	);
}

export default App;
