import { BubbleChat } from './components/BubbleChat'
import './App.css'
import { Toaster } from "react-hot-toast";

function App() {
 

  return <div className='flex justify-center items-center min-h-screen'>
     <Toaster position="top-right" reverseOrder={false} />
    <BubbleChat/>
    </div>
}

export default App
