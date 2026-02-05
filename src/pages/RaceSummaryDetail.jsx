// src/pages/RaceSummaryDetail.jsx
import { useParams, useEffect, useState } from "react";
import { getRaceDetail } from '../services/performanceApi'; // pastikan ini ada
import '../styles/dashboard.css';
import '../styles/RaceSummaryCard.css';

export default function RaceSummaryDetail() {
  const { raceId } = useParams();
  const [race, setRace] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!raceId) return;
    getRaceDetail(raceId)
      .then(data => setRace(data))
      .catch(e => {
        console.error(e);
        setErr(e.message || 'Failed to load race detail');
      });
  }, [raceId]);

  if (err) return <div className="card">Error: {err}</div>;
  if (!race) return <div className="card">Loading...</div>;

  return (
    <div className="page">
      <h2>{race.raceName || race.name}</h2>
      <p>{race.startDate ?? race.start_date} – {race.endDate ?? race.end_date}</p>

      <table>
        <tbody>
          <tr><td>Total Issues</td><td>{race.totalIssues ?? race.total_issues ?? 0}</td></tr>
          <tr><td>Initiated</td><td>{race.initiated ?? 0}</td></tr>
          <tr><td>Active</td><td>{race.active ?? 0}</td></tr>
          <tr><td>Finished</td><td>{race.finished ?? 0}</td></tr>
          <tr><td>Achieved</td><td>{race.achieved ?? 0}</td></tr>
          <tr><td>Failed</td><td>{race.failed ?? 0}</td></tr>
          <tr><td>Ideal Hours</td><td>{race.idealHours ?? race.ideal_hours ?? 0}</td></tr>
          <tr><td>Utilization %</td><td>{typeof race.utilizationPercent !== 'undefined' ? race.utilizationPercent : (race.utilization_percent ?? 0)}%</td></tr>
        </tbody>
      </table>
    </div>
  );
}
