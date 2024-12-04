import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from './component/home';
import JoinRoome from './component/joinRooms';
import PlayGround from './component/playGround';
import BullBullGame from './component/BullBullGame';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/verify-mail" element={<Home />} />
        {/* Add other routes here */}
        {/* <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} /> */}
        <Route path="/" element={<JoinRoome />} />
        <Route path="/play-ground" element={<PlayGround />} />
        <Route path="/bullbullgame" element={<BullBullGame />} />
      </Routes>
    </Router>
  );
}

export default App;
