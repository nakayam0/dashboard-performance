import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import '../styles/dashboard.css';

import Header from '../components/Header';
import TotalUsersCard from '../components/TotalUsersCard';
import RaceSummaryCard from '../components/RaceSummaryCard';
import RankingPerformance from '../components/RankingPerformance';
// import StatusSummary from '../components/StatusSummary'; // <- dihapus
import DailyPerformance from '../components/DailyPerformance';
import SummaryBox from '../components/SummaryBox';

// 🔽 SERVICE API
import { getTotalUsers } from '../services/userApi';
import { getRaceSummary } from '../services/performanceApi';

export default function Dashboard() {
  const navigate = useNavigate();

  /* =============================================================
     STATE: RACE SUMMARY
  ============================================================= */
  const [races, setRaces] = useState([]);
  const [loadingRaces, setLoadingRaces] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState(null);


  async function fetchRaces() {
    setLoadingRaces(true);
    try {
      const data = await getRaceSummary();
      setRaces(data);
    } catch (err) {
      console.error('Race summary error:', err);
    } finally {
      setLoadingRaces(false);
    }
  }

  useEffect(() => {
    fetchRaces();
  }, []);

  /* =============================================================
     STATE: TOTAL USERS
  ============================================================= */
  const [totalUsers, setTotalUsers] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);

  async function fetchTotalUsers() {
    setLoadingUsers(true);
    try {
      const total = await getTotalUsers();
      setTotalUsers(total);
    } catch (err) {
      console.error('Fetch total users failed:', err);
    } finally {
      setLoadingUsers(false);
    }
  }

  useEffect(() => {
    fetchTotalUsers();
  }, []);

  /* =============================================================
     HANDLER
  ============================================================= */
  function handleRaceClick(raceId) {
    navigate(`/race/${raceId}`);
  }

  function handleUsersClick() {
    navigate('/users');
  }

function handleDailyPerformanceClick() {
  const id = selectedUserId ?? 48;
  navigate(`/performance?userId=${id}`);
}




  return (
    <div className="dashboard-page">
      <Header />

      {/* TOP GRID */}
      <div className="dashboard-grid-top">
        <TotalUsersCard
          totalUsers={totalUsers}
          loading={loadingUsers}
          onRefresh={fetchTotalUsers}
        
        />

        <RaceSummaryCard
          races={races}
          onCardClick={() => navigate('/race-summary')}
          onRefresh={fetchRaces}
          loading={loadingRaces}
        />
      </div>

      {/* BOTTOM GRID: sekarang 2 kolom 50% / 50% */}
      <div className="dashboard-grid-bottom">
        {/* Kiri: Ranking Performance */}
        <RankingPerformance
          data={[
            { name: 'Arginda', totalIssue: 17, loggedHour: 25.23, tus: 30.96, wps: 92.4 },
            { name: 'Budi', totalIssue: 14, loggedHour: 22.5, tus: 28.1, wps: 88.2 },
            { name: 'Sinta', totalIssue: 12, loggedHour: 20.3, tus: 25.7, wps: 81.6 },
            { name: 'Mechika', totalIssue: 12, loggedHour: 20.3, tus: 25.7, wps: 85.6 },
            { name: 'Atika', totalIssue: 12, loggedHour: 20.3, tus: 25.7, wps: 90.6 }
          ]}
        />

        {/* Kanan: Daily Performance */}
        {/* Pastikan komponen DailyPerformance menerima prop onClick seperti sebelumnya */}
<div className="card daily-performance-card">
  <DailyPerformance onUserChange={setSelectedUserId} />


  <div className="daily-detail-action">
    <button
      className="btn-open-detail"
      onClick={handleDailyPerformanceClick}
    >
      Open Detail →
    </button>
  </div>
</div>



      </div>
    </div>
  );
}
