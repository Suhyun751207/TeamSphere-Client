import Router from "./router/route";
import './App.css';
import ChatModal from './components/ChatModal';

export default function App() {
  return (
    <div className="app">
      <div className="app-content">
        <Router />
      </div>
      <ChatModal />
    </div>
  )
}