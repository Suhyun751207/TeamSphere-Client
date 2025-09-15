import Router from "./router/route";
import './App.css';

export default function App() {
  console.log("Clinet Start")
  return (
    <div className="app">
      <div className="app-content">
        <Router />
      </div>
    </div>
  )
}