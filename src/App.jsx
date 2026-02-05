// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import RaceSummaryDetail from "./pages/RaceSummaryDetail";
import Users from './pages/Users';
import RaceSummaryPage from './pages/RaceSummaryPage';
import PerformancePage from './pages/PerformancePage';
import { PerformanceProvider } from './context/PerformanceContext';
import RankingPage from './pages/RankingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />

        {/* Konsisten: single route untuk race detail */}
        <Route path="/race-summary" element={<RaceSummaryPage />} />

        {/* Jika RaceSummaryDetail tetap diperlukan, beri path unik */}
        <Route path="/race/:raceId/summary" element={<RaceSummaryDetail />} />

        <Route path="/ranking" element={<RankingPage />} />

        <Route path="/performance" element={<PerformancePage />} />
        
      </Routes>
    </BrowserRouter>
  );
}



export default App;
