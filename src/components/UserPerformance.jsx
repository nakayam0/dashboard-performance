// src/components/UserPerformance.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

import '../styles/UserPerformance.css';
import ModernSelect from "../components/ModernSelect";

const ACTIVITY_COLORS = [
  '#5eead4',
  '#4f6f9f',
  '#1e3a8a',
  '#7c6aa6',
  '#60a5fa',
  '#94a3b8'
];

const UNUTIL_COLOR = '#ef4444';

function formatHoursLabel(hours) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export default function UserPerformance({ userId: propUserId }) {
  const navigate = useNavigate();
  const API = 'http://localhost:5098';

  /* =========================
     ASSIGNEE
  ========================= */
  const [assignees, setAssignees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(
    propUserId ? Number(propUserId) : null
  );

  /* =========================
     DATA STATE
  ========================= */
  const [daily, setDaily] = useState([]);
  const [dayIndex, setDayIndex] = useState(0);

  const [races, setRaces] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState(null);

  const [loadingRaces, setLoadingRaces] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [error, setError] = useState(null);

  /* =========================
     REFRESH
  ========================= */
  function handleRefresh() {
    if (!selectedUserId) return;
    loadRaces(selectedUserId);
  }

  /* =========================
     LOAD ASSIGNEES
  ========================= */
  useEffect(() => {
    fetch(`${API}/api/users/assignees`)
      .then(res => res.json())
      .then(data => {
        
        setAssignees(data || []);
        if ((data?.length) && !propUserId) {
          setSelectedUserId(prev => prev || data[0].userId);
        }
      })
      .catch(() => setError('Gagal memuat assignee'));
  }, [propUserId]);

  /* =========================
     LOAD RACES
  ========================= */
  function loadRaces(userId) {
    setLoadingRaces(true);
    setError(null);

    fetch(`${API}/api/performance/race-table?userId=${userId}`)
      .then(res => res.json())
      .then(data => {
        const arr = data || [];
        setRaces(arr);

        if (arr.length > 0) {
          setSelectedRaceId(arr[0].raceId);
        }

        setDaily([]);
      })
      .catch(() => setError('Gagal memuat race'))
      .finally(() => setLoadingRaces(false));
  }

  useEffect(() => {
    if (!selectedUserId) return;
    loadRaces(selectedUserId);
  }, [selectedUserId]);

  /* =========================
     LOAD DAILY
  ========================= */
  function loadDaily(userId, raceId) {
    setLoadingDaily(true);

    fetch(`${API}/api/performance/daily?userId=${userId}&raceId=${raceId}`)
      .then(res => res.json())
      .then(data => {
        const arr = data.daily || [];
        setDaily(arr);
        setDayIndex(0);
      })
      .finally(() => setLoadingDaily(false));
  }

  useEffect(() => {
    if (!selectedUserId || !selectedRaceId) return;
    loadDaily(selectedUserId, selectedRaceId);
  }, [selectedUserId, selectedRaceId]);


  const selectedDay = daily[dayIndex] || null;

  /* =========================
     DONUT SUMMARY
  ========================= */
  const { donutData, legendPayload } = useMemo(() => {
    if (!selectedDay?.activities?.length)
      return { donutData: [], legendPayload: [] };

    const agg = {};

    selectedDay.activities.forEach(a => {
      const name = (a.activity || 'Other').trim();
      const hours = Number(a.hours) || 0;
      if (!agg[name]) agg[name] = 0;
      agg[name] += hours;
    });

    const ideal = Number(selectedDay.idealDailyHours) || 0;

    const activities = Object.entries(agg).map(([name, hours], idx) => {
      const percentage = ideal > 0 ? (hours / ideal) * 100 : 0;
      return {
        name,
        hours,
        percentage,
        color: ACTIVITY_COLORS[idx % ACTIVITY_COLORS.length]
      };
    });

    const sumPercent =
      activities.reduce((s, a) => s + a.percentage, 0);

    const unutilPercent = Math.max(0, 100 - sumPercent);
    const unutilHours =
      ideal > 0 ? (unutilPercent / 100) * ideal : 0;

    const dd = activities.map(a => ({
      name: a.name,
      value: a.percentage,
      hours: a.hours,
      percentage: a.percentage,
      color: a.color
    }));

    if (unutilPercent > 0.01) {
      dd.push({
        name: 'Unutilization',
        value: unutilPercent,
        hours: unutilHours,
        percentage: unutilPercent,
        color: UNUTIL_COLOR
      });
    }

    const legend = dd.map(d => ({
      id: d.name,
      value:
        `${d.name} : ${formatHoursLabel(d.hours)} | ${d.percentage.toFixed(2)}%`,
      type: 'square',
      color: d.color
    }));

    return { donutData: dd, legendPayload: legend };
  }, [selectedDay]);

  /* =========================
     CENTER LABEL
  ========================= */
  const renderCenterLabel = ({ viewBox }) => {
    if (!viewBox || !selectedDay) return null;

    const { cx, cy } = viewBox;

    return (
      <text x={cx} y={cy} textAnchor="middle">
        <tspan x={cx} dy="-6" fontSize="14" fill="#6b7280">
          Total
        </tspan>
        <tspan
          x={cx}
          dy="18"
          fontSize="20"
          fontWeight="700"
          fill="#111827"
        >
          {selectedDay.totalHours} Jam
        </tspan>
      </text>
    );
  };

  /* =========================
     FORMAT DISPLAY DATE (TAMBAH NAMA HARI)
  ========================= */
  const displayDate = (() => {
    if (!selectedDay?.date) return '';
    try {
      // expected ISO yyyy-MM-dd; create Date safely
      const parts = selectedDay.date.split('-').map(n => Number(n));
      // parts: [yyyy, mm, dd]
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return selectedDay.date;
    }
  })();

  /* =========================
     RENDER
  ========================= */
  return (
    <div className="dashboard-root">
      <div className="dashboard-container">

        <div className="dashboard-header">
          <div className="dashboard-title">
            TRACKER PERFORMANCE ANALYSIS DASHBOARD - User Performance
          </div>

          <div className="header-actions">
            <button className="btn-refresh" onClick={handleRefresh}>
              ↻
            </button>

            <button
              className="btn-back"
              onClick={() => navigate(-1)}
            >
              back
            </button>
          </div>
        </div>

        <div className="dashboard-grid">

          {/* LEFT PANEL */}
          <div className="card left-panel">
            <h2>User Performance</h2>

            <ModernSelect
              options={assignees.map(a => ({
                value: a.userId,
                label: a.username
              }))}
              value={selectedUserId}
              onChange={(id) => {
                setSelectedUserId(id);
                setSelectedRaceId(null);
                setDaily([]);
              }}
            />

            {loadingRaces && <div className="small-info">Memuat race...</div>}
            {error && <div className="error-info">{error}</div>}

            <div className="table-wrapper">
              <table className="performance-table">
                <thead>
                  <tr>
                    <th className="col-id">Id</th>
                    <th>Race Name</th>
                    <th>Project Name</th>
                    <th>Race Start</th>
                    <th>Race Due</th>
                    <th>Logged hours</th>
                    <th>Ideal Hours</th>
                    <th>Time Utilization %</th>
                  </tr>
                </thead>

                <tbody>
                  {races.map((r, i) => (
                    <tr
                      key={r.raceId}
                      className={
                        r.raceId === selectedRaceId ? 'active' : ''
                      }
                      onClick={() => {
                        setSelectedRaceId(r.raceId);
                        loadDaily(selectedUserId, r.raceId);
                      }}
                    >
                      <td className="col-id">{i + 1}</td>
                      <td>{r.raceName}</td>
                      <td>{r.projectName ?? '-'}</td>
                      <td>{new Date(r.raceStart).toLocaleDateString()}</td>
                      <td>
                        {r.raceDue
                            ? new Date(r.raceDue).toLocaleDateString()
                            : 'NULL'}
                      </td>
                      <td>{Number(r.loggedHours).toFixed(2)}</td>
                      <td>{r.idealHours}</td>
                      <td>
                        {Number(
                          r.timeUtilizationPercentage
                        ).toFixed(2)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* RIGHT PANEL */}
          <div className="card right-panel">

            <div className="right-panel-header">
              <div className="daily-title">Daily</div>
            </div>

            <div className="donut-container">

              <div className="donut-wrapper">
                {donutData.length ? (
                  <ResponsiveContainer width="100%" height={340}>
                    <PieChart>
                      <Legend
                        payload={legendPayload}
                        layout="horizontal"
                        verticalAlign="top"
                        align="center"
                      />

                      <Pie
                        data={donutData}
                        dataKey="value"
                        nameKey="name"
                        innerRadius={70}
                        outerRadius={100}
                        labelLine={false}
                        label={renderCenterLabel}
                        isAnimationActive
                        animationDuration={600}
                        animationEasing="ease-out"
                      >
                        {donutData.map((entry, i) => (
                          <Cell
                            key={`cell-${i}`}
                            fill={entry.color}
                          />
                        ))}
                      </Pie>

                      <Tooltip
                        formatter={(v, name) => {
                          const item = donutData.find(
                            d => d.name === name
                          );
                          return `${formatHoursLabel(
                            item?.hours || 0
                          )} (${Number(v).toFixed(2)}%)`;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="small-info">
                    Pilih race untuk melihat daily
                  </div>
                )}
              </div>

              {/* DETAIL */}
              <div className="detail-box">

                {loadingDaily && (
                  <div className="small-info">
                    Memuat daily...
                  </div>
                )}

                {selectedDay && (
                  <>
<div className="detail-header">
  <div className="detail-left">
    Total Hours: {selectedDay.totalHours} Jam
  </div>
  <div className="detail-date">
    {displayDate}
  </div>
</div>

                    <div className="detail-content">
                      {selectedDay.activities.map((a, i) => (
                        <div key={i} className="activity-item">
                          <div className="activity-title">
                            {a.issueSubject}
                          </div>

                          <div className="activity-meta">
                            activity: {a.activity} | hours: {a.hours}
                          </div>

                          <div className="activity-comment">
                            {a.comment}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="day-nav">
                      <button
                        onClick={() =>
                          setDayIndex(Math.max(0, dayIndex - 1))
                        }
                      >
                        ◀
                      </button>

                      <div>
                        {dayIndex + 1} / {daily.length}
                      </div>

                      <button
                        onClick={() =>
                          setDayIndex(
                            Math.min(daily.length - 1, dayIndex + 1)
                          )
                        }
                      >
                        ▶
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
