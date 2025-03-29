import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import ControlBar from './components/ControlBar';
import Settings from './pages/Settings';
import Home from './pages/Home';
import './App.css';

export default function App() {
  return (
    <Router>
      <div className="app-container">
        <div className="app-content">
          <ControlBar />
          <div className="content-wrapper">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </div>
        </div>
      </div>
    </Router>
  );
}
