// src/pages/RankingPage.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/rankingpage.css";

import {
  getRaceSummary,
  getRankingByRace,
  getRaceTrend,
} from "../services/performanceApi";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const MONTHS = [
  { id: 1, name: "Januari" },
  { id: 2, name: "Februari" },
  { id: 3, name: "Maret" },
  { id: 4, name: "April" },
  { id: 5, name: "Mei" },
  { id: 6, name: "Juni" },
  { id: 7, name: "Juli" },
  { id: 8, name: "Agustus" },
  { id: 9, name: "September" },
  { id: 10, name: "Oktober" },
  { id: 11, name: "November" },
  { id: 12, name: "Desember" },
];

function formatNumber(n) {
  if (n === null || n === undefined) return "-";
  if (typeof n === "number" && !Number.isInteger(n)) return n.toFixed(2);
  return n;
}

/* ===== Custom dot for performance: show big dot + trophy at maxIndex ===== */
function CustomPerformanceDot({ cx, cy, index, payload, maxIndex }) {
  if (cx == null || cy == null) return null;
  // not the max => small dot
  if (index !== maxIndex) {
    return (
      <circle cx={cx} cy={cy} r={3} fill="#0ea5a3" stroke="#ffffff" strokeWidth={0.6} />
    );
  }

  // maxIndex => big highlight + trophy + value
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="#ff6b6b" stroke="#fff" strokeWidth={2} />
      <text
        x={cx}
        y={cy - 18}
        textAnchor="middle"
        fontSize={12}
        fontWeight={700}
        fill="#111"
      >
        🏆
      </text>
      <text
        x={cx}
        y={cy - 28}
        textAnchor="middle"
        fontSize={11}
        fill="#111"
      >
        {Number(payload.performance).toFixed(2)}
      </text>
    </g>
  );
}

export default function RankingPage() {
  const navigate = useNavigate();
  const q = useQuery();
  const initialRaceId = q.get("raceId") ? Number(q.get("raceId")) : null;

  const [races, setRaces] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState(initialRaceId);
  const [ranking, setRanking] = useState([]);
  const [trend, setTrend] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const chartWrapperRef = useRef(null);

  /* visibleLines controls which lines are shown: default all true */
  const [visibleLines, setVisibleLines] = useState({
    rqs: true,
    tus: true,
    performance: true,
  });

  useEffect(() => {
    async function loadRaces() {
      try {
        const r = await getRaceSummary();
        setRaces(Array.isArray(r) ? r : []);
        if (!selectedRaceId) {
          const first = r?.[0]?.id ?? r?.[0]?.raceId ?? null;
          setSelectedRaceId(first);
        }
      } catch (err) {
        console.error("loadRaces err", err);
        setRaces([]);
      }
    }
  loadRaces().finally(() => setIsRefreshing(false));
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedRaceId) {
      setRanking([]);
      return;
    }
    getRankingByRace(selectedRaceId)
      .then((d) => {
        const arr = Array.isArray(d) ? d : [];
        const normalized = arr.map((x) => ({
          userName:
            x.userName ??
            x.fullname ??
            `${x.firstname ?? ""} ${x.lastname ?? ""}`.trim(),
          totalIssues: x.totalIssues ?? x.total_issues ?? x.totalIssue ?? 0,
          rqs: Number(x.rqs ?? x.resultQualityScore ?? 0),
          wps: Number(x.wps ?? x.workProgressScore ?? 0),
          fps: Number(x.fps ?? x.failurePenaltyScore ?? 0),
          tus: Number(x.tus ?? x.timeUtilizationScore ?? 0),
          performance: Number(
            x.performance ?? x.performanceScore ?? x.performanceKinerja ?? 0
          ),
        }));
        normalized.sort((a, b) => b.performance - a.performance);
        setRanking(normalized);
      })
      .catch((err) => {
        console.error("getRankingByRace err", err);
        setRanking([]);
      });
  }, [selectedRaceId, refreshKey]);

  useEffect(() => {
    async function loadTrend() {
      try {
        const serverTrend = await getRaceTrend(year, month);
        if (Array.isArray(serverTrend)) {
          const dat = serverTrend.map((r) => ({
            raceName: r.raceName ?? r.name ?? r.version_name ?? r.race ?? "Race",
            rqs: Number(r.rqs ?? r.resultQualityAvg ?? 0),
            tus: Number(r.tus ?? r.timeUtilizationAvg ?? 0),
            performance: Number(
              r.performance ?? r.performanceScore ?? r.performanceKinerja ?? 0
            ),
          }));
          setTrend(dat);
        } else {
          setTrend([]);
        }
      } catch (err) {
        console.error("getRaceTrend err", err);
        setTrend([]);
      }
    }
    loadTrend();
  }, [year, month, refreshKey]);

  /* ===== compute maxIndex of trend.performance ===== */
  const maxIndex = useMemo(() => {
    if (!trend || trend.length === 0) return -1;
    let max = -Infinity;
    let idx = -1;
    trend.forEach((t, i) => {
      const v = Number(t.performance ?? -Infinity);
      if (!isNaN(v) && v > max) {
        max = v;
        idx = i;
      }
    });
    return idx;
  }, [trend]);

  const chartInnerWidth = Math.max((trend?.length || 1) * 140, 600);

  /* ===== legend click behaviour:
     - click a key => if currently only that key is visible => restore all
     - else => show only that key
  */
function handleLegendClick(key) {
  setVisibleLines((prev) => {
    const updated = {
      ...prev,
      [key]: !prev[key],
    };

    // pastikan minimal satu garis tetap aktif
    const anyActive = Object.values(updated).some(Boolean);
    if (!anyActive) return prev;

    return updated;
  });
}

  return (
    <div className="ranking-page">
      {/* Banner */}
      <div className="ranking-page__banner">
        <div className="ranking-page__title">TRACKER PERFORMANCE ANALYSIS DASHBOARD - Rangking Performance</div>

        <div className="ranking-page__banner-actions">
<button
  className="icon-btn"
  title="Refresh"
  onClick={() => {
    // kosongkan data dulu agar terlihat reload
    setRanking([]);
    setTrend([]);

    // trigger load ulang
    setRefreshKey((k) => k + 1);
  }}
>
  ↻
</button>


          <button className="icon-btn icon-btn--filled" title="Back" onClick={() => navigate(-1)}>⇐</button>
        </div>
      </div>

      <div className="ranking-page__grid">
        {/* LEFT */}
        <div className="ranking-page__card ranking-page__card--left">
          <div className="ranking-page__card-header">
            <div className="card-title">Ranking User Performance</div>
            <div className="card-controls">
              <div className="pill-select">
                <select
                  value={selectedRaceId ?? ""}
                  onChange={(e) => setSelectedRaceId(Number(e.target.value))}
                >
                  <option value="">Race name - project name</option>
                  {races.map((r) => {
                    const label =
                      (r.raceName ?? r.name ?? r.version_name ?? r.race ?? "") +
                      (r.projectName ? ` — ${r.projectName}` : "");
                    return (
                      <option key={r.id} value={r.id}>
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          </div>

          <div className="ranking-page__table-wrap">
            <div className="table-grid-bg">
              <table className="ranking-full-table" role="table">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Name</th>
                    <th className="col-center">Total Issue</th>
                    <th className="col-center">RQS</th>
                    <th className="col-center">WPS</th>
                    <th className="col-center">FPS</th>
                    <th className="col-center">TUS</th>
                    <th className="col-center">Performance Score</th>
                  </tr>
                </thead>
<tbody>
  {ranking.length === 0
    ? Array.from({ length: 12 }).map((_, i) => (
        <tr key={i}>
          <td className="td-id">{i + 1}</td>
          <td className="td-name">&nbsp;</td>
          <td className="col-center">&nbsp;</td>
          <td className="col-center">&nbsp;</td>
          <td className="col-center">&nbsp;</td>
          <td className="col-center">&nbsp;</td>
          <td className="col-center">&nbsp;</td>
          <td className="col-center score">&nbsp;</td>
        </tr>
      ))
    : ranking.map((r, i) => (
        <tr key={i}>
          <td className="td-id">{i + 1}</td>
          <td className="td-name">{r.userName}</td>
          <td className="col-center">{r.totalIssues}</td>
          <td className="col-center">{formatNumber(r.rqs)}%</td>
          <td className="col-center">{formatNumber(r.wps)}%</td>
          <td className="col-center">{formatNumber(r.fps)}%</td>
          <td className="col-center">{formatNumber(r.tus)}%</td>

          {/* PERFORMANCE SCORE */}
          <td
            className="col-center score"
            style={{
              color: r.tus > 100 ? "#dc2626" : "#047857",
              fontWeight: 700
            }}
          >
            {formatNumber(r.performance)}
          </td>
        </tr>
      ))}
</tbody>

              </table>
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div className="ranking-page__card ranking-page__card--right">
          <div className="ranking-page__card-header">
            <div className="small-controls">
              <select
                className="small-select"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
              >
                {MONTHS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>

              <select
                className="small-select"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
              >
                {[year - 2, year - 1, year, year + 1].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="legend" aria-hidden>
            <div
              className={`legend-item ${!visibleLines.rqs ? "legend-item--muted" : ""}`}
              onClick={() => handleLegendClick("rqs")}
              role="button"
            >
              <span className="legend-dot legend-dot--rqs"></span> RQS
            </div>

            <div
              className={`legend-item ${!visibleLines.tus ? "legend-item--muted" : ""}`}
              onClick={() => handleLegendClick("tus")}
              role="button"
            >
              <span className="legend-dot legend-dot--tus"></span> TUS
            </div>

            <div
              className={`legend-item ${!visibleLines.performance ? "legend-item--muted" : ""}`}
              onClick={() => handleLegendClick("performance")}
              role="button"
            >
              <span className="legend-dot legend-dot--perf"></span> Performance Score
            </div>
          </div>

          <div className="chart-container">
            <div style={{ width: chartInnerWidth, minHeight: 320 }}>
              <ResponsiveContainer width="100%" height={340}>
                <LineChart data={trend} margin={{ top: 8, right: 12, left: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="raceName" angle={-35} textAnchor="end" interval={0} height={70} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(v) => `${v}`} />

                  {visibleLines.rqs && (
                    <Line type="monotone" dataKey="rqs" stroke="#06b6d4" strokeWidth={3} dot={{ r: 3 }} />
                  )}

                  {visibleLines.tus && (
                    <Line type="monotone" dataKey="tus" stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
                  )}

                  {visibleLines.performance && (
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="#0ea5a3"
                      strokeWidth={3}
                      dot={(props) => (
                        <CustomPerformanceDot {...props} maxIndex={maxIndex} />
                      )}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
