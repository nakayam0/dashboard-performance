// src/pages/RaceSummaryPage.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';

import { getRaceTableList, getRaceMembersStatus } from '../services/performanceApi';
import '../styles/RaceSummaryPage.css';

export default function RaceSummaryPage() {
  const navigate = useNavigate();

  const [races, setRaces] = useState([]);
  const [selectedRaceId, setSelectedRaceId] = useState(null);
  const [members, setMembers] = useState([]);

  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [error, setError] = useState(null);

  // load races
  useEffect(() => {
    async function load() {
      setLoadingRaces(true);
      try {
        const res = await getRaceTableList();
        const arr = Array.isArray(res) ? res : (res?.items || res?.data || Object.values(res || {}));
        setRaces(arr);
        if (arr.length > 0) {
          const id = arr[0].raceId ?? arr[0].race_id ?? arr[0].id ?? null;
          setSelectedRaceId(Number(id));
        }
      } catch (e) {
        console.error(e);
        setError('Gagal memuat daftar race');
      } finally {
        setLoadingRaces(false);
      }
    }
    load();
  }, []);

  // load members for selected race
  useEffect(() => {
    if (!selectedRaceId) {
      setMembers([]);
      return;
    }
    let mounted = true;
    async function loadMembers() {
      setLoadingMembers(true);
      try {
        const res = await getRaceMembersStatus(selectedRaceId);
        const arr = Array.isArray(res) ? res : (res?.members || res?.users || []);
        if (mounted) setMembers(arr);
      } catch (e) {
        console.error(e);
        if (mounted) setMembers([]);
      } finally {
        if (mounted) setLoadingMembers(false);
      }
    }
    loadMembers();
    return () => { mounted = false; };
  }, [selectedRaceId]);

const chartData = useMemo(() => {
  if (!members || members.length === 0) return [];

  return members
    .map(m => {
      const fullName = m.userName || m.user_name || 'Unassigned';

      // ⬇️ AMBIL MAKSIMAL 2 KATA
      const shortName = fullName
        .split(' ')
        .slice(0, 2)
        .join(' ');

      return {
        name: shortName,
        initiated: m.initiated || 0,
        todo: m.todo || 0,
        active: m.active || 0,
        hold: m.hold || 0,
        achieved: m.achieved || 0,
        failed: m.failed || 0,
        canceled: m.canceled || 0,
        finished: m.finished || 0,
      };
    })
    .sort((a, b) => {
      const totalA =
        a.initiated + a.todo + a.active + a.hold +
        a.achieved + a.failed + a.canceled + a.finished;
      const totalB =
        b.initiated + b.todo + b.active + b.hold +
        b.achieved + b.failed + b.canceled + b.finished;
      return totalB - totalA;
    })
    .slice(0, 10); // biar tidak terlalu padat
}, [members]);


  if (loadingRaces) {
    return (
      <div className="race-summary-page">
<div className="header">
  <div style={{ fontWeight: 700, fontSize: 20 }}>
    TRACKER PERFORMANCE ANALYSIS DASHBOARD — Race Summary
  </div>

  <div style={{ display: 'flex', gap: 8 }}>
    <button className="refresh-btn">⟳</button>
    <button className="refresh-btn" onClick={() => navigate(-1)}>back</button>
  </div>
</div>

        <div className="page-empty">Memuat daftar race…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="race-summary-page">
        <div className="race-summary-header">TRACKER PERFORMANCE ANALYSIS DASHBOARD — Race Summary</div>
        <div className="page-empty">{error}</div>
      </div>
    );
  }

  return (
    <div className="race-summary-page">
      {/* Header pill */}
      <div className="race-summary-header">
        <div>TRACKER PERFORMANCE ANALYSIS DASHBOARD — Race Summary</div>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => { /* refresh all */ window.location.reload(); }} title="Refresh">↻</button>
          <button className="icon-btn" onClick={() => navigate(-1)} title="Back">⇐</button>
        </div>
      </div>

      <div className="race-summary-grid">
        {/* LEFT: TABLE CARD */}
        <div className="race-summary-card card-left">
          <div className="card-heading">
            <h3>Race Summary</h3>
          </div>

          <div className="table-wrapper">
            <table className="race-summary-table">
              <thead>
                <tr>
                  <th className="col-id">Id</th>
                  <th>Race Name</th>
                  <th>Project Name</th>
                  <th>Total Issue</th>
                  <th>Total Checklist</th>
                  <th>Complete Checklist</th>
                </tr>
              </thead>
              <tbody>
                {races.map((r, idx) => {
                  const id = r.raceId ?? r.race_id ?? r.id ?? idx;
                  const isSelected = Number(id) === Number(selectedRaceId);
                  return (
                    <tr
                      key={id}
                      className={isSelected ? 'selected-row' : ''}
                      onClick={() => setSelectedRaceId(Number(id))}
                    >
                      <td className="col-id-cell">{id}</td>
                      <td>{r.raceName ?? r.race_name ?? '-'}</td>
                      <td>{r.projectName ?? r.project_name ?? '-'}</td>
                      <td>{r.totalIssues ?? r.total_issues ?? '-'}</td>
                      <td>{r.totalChecklist ?? r.total_checklist ?? '-'}</td>
                      <td>{r.completeChecklist ?? r.completedChecklist ?? r.complete_checklist ?? '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: CHART CARD */}
        <div className="race-summary-card card-right">
          <div className="chart-header">
            <div>
              <div className="chart-title">Member Status (Stacked)</div>
              <div className="chart-subtitle">{ /* show selected race name if available */ 
                (() => {
                  const found = races.find(r => Number(r.raceId ?? r.race_id ?? r.id) === Number(selectedRaceId));
                  return found ? (found.raceName ?? found.race_name ?? '') : '';
                })()
              }</div>
            </div>

            <div className="chart-controls">
            </div>
          </div>

          {/* legend centered */}
          <div className="chart-legend">
            <div className="legend-row">
              <div className="legend-item"><span className="legend-dot legend-initiated" /> initiated</div>
              <div className="legend-item"><span className="legend-dot legend-todo" /> to do</div>
              <div className="legend-item"><span className="legend-dot legend-hold" /> hold</div>
              <div className="legend-item"><span className="legend-dot legend-achieved" /> achieved</div>
              <div className="legend-item"><span className="legend-dot legend-finished" /> finished</div>
              <div className="legend-item"><span className="legend-dot legend-failed" /> failed</div>
              <div className="legend-item"><span className="legend-dot legend-canceled" /> cancelled</div>
            </div>
          </div>

          <div className="chart-area">
            {loadingMembers ? (
              <div className="chart-loading">Loading chart…</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 16, right: 40, left: 8, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-30} textAnchor="end" interval={0} height={60} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="initiated" stackId="a" fill="#bfdbfe" />
                  <Bar dataKey="todo" stackId="a" fill="#60a5fa" />
                  <Bar dataKey="active" stackId="a" fill="#93c5fd" />
                  <Bar dataKey="hold" stackId="a" fill="#fb923c" />
                  <Bar dataKey="finished" stackId="a" fill="#d5e030" />
                  <Bar dataKey="achieved" stackId="a" fill="#10b981" />
                  <Bar dataKey="failed" stackId="a" fill="#ef4444" />
                  <Bar dataKey="canceled" stackId="a" fill="#d1d5db" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="chart-footer">
            Showing members for race id: <strong>{selectedRaceId ?? '-'}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
