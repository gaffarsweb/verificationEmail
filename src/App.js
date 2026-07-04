import './App.css';
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Home from './component/home';
import JoinRoome from './component/joinRooms';
import PlayGround from './component/playGround';
import BullBullGame from './component/BullBullGame';
import Lucky6 from './component/Lucky6';
import NiuBullGame from './component/NiuBullGame';
import DuckHuntGame from './component/duckHunt/DuckHuntGame';
import CelestialGame from './component/celestial/CelestialGame';
import AgilaGame from './component/agila/AgilaGame';

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
        <Route path="/lucky-six-game" element={<Lucky6 />} />
        <Route path="/niubull-game" element={<NiuBullGame />} />
        <Route path="/duck-hunt" element={<DuckHuntGame />} />
        <Route path="/celestial-guardians" element={<CelestialGame />} />
        <Route path="/agila-uprising" element={<AgilaGame />} />
      </Routes>
    </Router>
  );
}

export default App;
