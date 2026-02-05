// src/components/DailyPerformance.jsx

import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

import '../styles/DailyPerformanceCard.css';
import ModernSelect from "./ModernSelect";

const API = 'http://localhost:5098';

const COLORS = [
  '#cfe9ff',
  '#1f3b7a',
  '#2f4b8f',
  '#f87171',
  '#60a5fa',
  '#94a3b8'
];

/* ================================
   Helper Format
================================ */
function formatHoursDecimal(dec) {
  if (!dec && dec !== 0) return '0 jam 0 menit';

  const hours = Math.floor(dec);
  const minutes = Math.round((dec - hours) * 60);

  return `${hours} jam ${minutes} menit`;
}

function toPercent(n, total) {
  if (!total) return 0;
  return Math.round((n / total) * 100);
}

export default function DailyPerformance({ onUserChange }) {

  const [assignees, setAssignees] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [races, setRaces] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState(null);

  const [daily, setDaily] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /* =============================
     FETCH ASSIGNEES
  ==============================*/
  useEffect(() => {
    fetch(`${API}/api/users/assignees`)
      .then((res) => {
        if (!res.ok)
          throw new Error('Gagal memuat assignees');
        return res.json();
      })
      .then((data) => {
        setAssignees(data || []);

        if (data?.length) {
          setSelectedUserId(prev =>
            prev || data[0].userId
          );
        }
      })
      .catch((e) => {
        console.error("Assignee load error:", e);
        setAssignees([]);
      });
  }, []);

  /* =============================
     FETCH RACE USER
  ==============================*/
  useEffect(() => {
    if (!selectedUserId) return;

    setLoading(true);
    setError(null);

    fetch(
      `${API}/api/performance/race-table?userId=${selectedUserId}`
    )
      .then((res) => {
        if (!res.ok)
          throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const arr = data || [];

        setRaces(arr);

        if (arr.length) {
          setSelectedRaceId(prev =>
            prev || arr[0].raceId
          );
        }
      })
      .catch((e) => {
        console.error(e);
        setError('Gagal memuat races');
        setRaces([]);
      })
      .finally(() => setLoading(false));
  }, [selectedUserId]);

  /* =============================
     FETCH DAILY DATA
  ==============================*/
  useEffect(() => {
    if (!selectedUserId || !selectedRaceId) {
      setDaily([]);
      return;
    }

    setLoading(true);
    setError(null);

    fetch(
      `${API}/api/performance/daily?userId=${selectedUserId}&raceId=${selectedRaceId}`
    )
      .then((res) => {
        if (!res.ok)
          throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const arr = Array.isArray(data.daily)
          ? data.daily
          : Array.isArray(data)
          ? data
          : data.daily || [];

        setDaily(arr);
      })
      .catch((e) => {
        console.error(e);
        setError('Gagal memuat daily');
      })
      .finally(() => setLoading(false));
  }, [selectedUserId, selectedRaceId]);

  /* =============================
     SUMMARY DATA (RACE TOTAL)
  ==============================*/

  // Gabungkan aktivitas seluruh tanggal
  const aggregatedActivities = (daily || []).reduce(
    (acc, day) => {
      const acts = day.activities || [];

      acts.forEach(a => {
        const name = a.activity || 'Unknown';
        const hours = Number(a.hours) || 0;

        if (!acc[name]) acc[name] = 0;
        acc[name] += hours;
      });

      return acc;
    },
    {}
  );

  const donutData = Object.entries(
    aggregatedActivities
  ).map(([name, value]) => ({
    name,
    value
  }));

  // Total logged hours seluruh race
  const totalHours = donutData.reduce(
    (s, d) => s + d.value,
    0
  );

  const selectedRace =
    races.find(
      r => r.raceId === selectedRaceId
    ) || {};

  const idealHoursDecimal =
    Number(selectedRace.idealHours) || 0;

  const utilizationPct = idealHoursDecimal
    ? Math.round(
        (totalHours / idealHoursDecimal) * 100
      )
    : 0;

  const legendItems = donutData.map(
    (d, i) => ({
      name: d.name,
      color: COLORS[i % COLORS.length],
      value: d.value,
      pct: toPercent(d.value, totalHours)
    })
  );

  const labelRenderer = (entry) => {
    if (!entry || !entry.percent) return null;
    const pct = Math.round(entry.percent * 100);
    return `${pct}%`;
  };

  /* =============================
     RENDER
  ==============================*/
  return (
    <div className="daily-card">
      <h3 className="daily-title">
        Daily Performance
      </h3>

      <div className="daily-filters">

        {/* USER SELECT */}
        <div className="filter-item">
          <ModernSelect
            options={assignees.map(a => ({
              value: a.userId,
              label: a.username
            }))}
            value={selectedUserId}
            onChange={(id) => {
              setSelectedUserId(id);
              if (onUserChange) {
                onUserChange(id);
              }
            }}
          />
        </div>

        {/* RACE SELECT */}
        <div className="filter-item">
          <ModernSelect
            options={races.map(r => {
              const raceName =
                r.raceName ?? r.name ?? "";

              const projectName =
                r.projectName ??
                r.project ??
                "";

              return {
                value: r.raceId,
                label: projectName
                  ? `${raceName} — ${projectName}`
                  : raceName
              };
            })}
            value={selectedRaceId}
            onChange={(id) =>
              setSelectedRaceId(id)
            }
          />
        </div>
      </div>

      <div className="daily-body">

        {/* DONUT */}
        <div className="donut-area">
          {donutData.length > 0 ? (
            <ResponsiveContainer
              width="100%"
              height={220}
            >
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  label={labelRenderer}
                  labelLine={false}
                >
                  {donutData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={
                        COLORS[
                          i % COLORS.length
                        ]
                      }
                    />
                  ))}
                </Pie>

                <Tooltip
                  formatter={(v) =>
                    `${v} jam`
                  }
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="donut-placeholder">
              {loading
                ? 'Memuat...'
                : 'Belum ada aktivitas'}
            </div>
          )}
        </div>

        {/* UTILIZATION */}
        <div className="utilization-area">
          <div className="utilization-header">
            <div className="utilization-label">
              Time Utilization
            </div>
          </div>

          <div className="utilization-values">
            <div className="util-pill">
              <div className="pill-number">
                {formatHoursDecimal(
                  totalHours
                )}
              </div>

              <div className="pill-sub">
                of
              </div>

              <div className="pill-number">
                {formatHoursDecimal(
                  idealHoursDecimal
                )}
              </div>

              <div className="pill-sub">
                : {utilizationPct} %
              </div>
            </div>
          </div>

          <div className="legend-row">
            {legendItems
              .slice(0, 4)
              .map((l, i) => (
                <div
                  key={i}
                  className="legend-item"
                >
                  <span
                    className="legend-swatch"
                    style={{
                      background:
                        l.color
                    }}
                  />

                  <div className="legend-text">
                    <div className="legend-name">
                      {l.name}
                    </div>

                    <div className="legend-sub">
                      {l.pct}% •{" "}
                      {l.value} jam
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {error && selectedRaceId && (
        <div className="daily-error">
          {error}
        </div>
      )}
    </div>
  );
}
