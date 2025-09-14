import Router from "./router/route";
import './App.css';

export default function App() {
  console.log(process.env.REACT_APP_SERVER_URL)
  return (
    <div className="app">
      <div className="app-content">
        <Router />
      </div>
    </div>
  )
}