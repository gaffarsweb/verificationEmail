import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from './component/home';
import JoinRoome from './component/joinRooms';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/verify-mail" element={<Home />} />
        {/* Add other routes here */}
        {/* <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} /> */}
        <Route path="/" element={<JoinRoome />} />
      </Routes>
    </Router>
  );
}

export default App;
