// src/services/performanceApi.js
import axios from 'axios';

const API_BASE = 'http://localhost:5098/api';

/* =========================================================
   1) Card (small payload for dashboard card)
========================================================= */
export async function getRaceCardList(limit = 10) {
  const res = await axios.get(
    `${API_BASE}/race-summary/card?limit=${limit}`
  );
  return res.data;
}

/* =========================================================
   2) Table (full list for race table)
========================================================= */
export async function getRaceTableList() {
  const res = await axios.get(`${API_BASE}/race-summary`);
  return res.data;
}

/* =========================================================
   3) Generic race summary used by Dashboard
========================================================= */
export async function getRaceSummary(limit = 500) {
  try {
    const res = await axios.get(
      `${API_BASE}/race-summary/card?limit=${limit}`
    );

    let d = res.data;

    if (Array.isArray(d)) d = d;
    else if (d && Array.isArray(d.items)) d = d.items;
    else if (d && Array.isArray(d.data)) d = d.data;
    else if (d && typeof d === 'object') d = Object.values(d);
    else d = [];

    // 🔥 normalisasi field
    return d.map(r => ({
      ...r,
      id: r.id ?? r.raceId ?? r.versionId,
      raceName: r.raceName ?? r.name ?? r.version_name,
      projectName: r.projectName ?? r.project_name ?? r.project
    }));

  } catch (err) {
    try {
      const res2 = await axios.get(`${API_BASE}/race-summary`);
      let d = res2.data;

      if (Array.isArray(d)) d = d;
      else if (d && Array.isArray(d.items)) d = d.items;
      else if (d && Array.isArray(d.data)) d = d.data;
      else d = [];

      return d.map(r => ({
        ...r,
        id: r.id ?? r.raceId ?? r.versionId,
        raceName: r.raceName ?? r.name,
        projectName: r.projectName ?? r.project_name
      }));

    } catch (err2) {
      throw err2 || err;
    }
  }
}


/* =========================================================
   4) Race detail
========================================================= */
export async function getRaceDetail(raceId) {
  if (!raceId) throw new Error('raceId is required');

  const res = await axios.get(
    `${API_BASE}/race-summary/${raceId}`
  );

  return res.data;
}

/* =========================================================
   5) Members status (chart)
========================================================= */
export async function getRaceMembersStatus(raceId) {
  if (!raceId) throw new Error('raceId is required');

  const tries = [
    `${API_BASE}/race-summary/${raceId}/members-status`,
    `${API_BASE}/performance/${raceId}/members-status`,
    `${API_BASE}/race-summary/${raceId}/member-status`,
  ];

  let lastErr = null;

  for (const url of tries) {
    try {
      const res = await axios.get(url);
      return res.data;
    } catch (err) {
      lastErr = err;
      if (err.response && err.response.status === 404) continue;
    }
  }

  throw lastErr;
}

/* =========================================================
   6) Ranking Performance by Race (NEW)
========================================================= */
export async function getRankingByRace(raceId) {
  if (!raceId) throw new Error('raceId is required');

  const res = await axios.get(
    `${API_BASE}/performance/ranking`,
    {
      params: { raceId }
    }
  );

  const d = res.data;

  // Normalisasi supaya selalu array
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.items)) return d.items;
  if (d && Array.isArray(d.data)) return d.data;
  if (d && typeof d === 'object') return Object.values(d);

  return [];
}

/* =========================================================
   6) Race Trend
========================================================= */
export async function getRaceTrend(year, month) {
  try {
    const params = [];
    if (year) params.push(`year=${encodeURIComponent(year)}`);
    if (month) params.push(`month=${encodeURIComponent(month)}`);
    const url = `${API_BASE}/performance/race-trend${params.length ? "?" + params.join("&") : ""}`;
    const res = await axios.get(url);
    return res.data;
  } catch (err) {
    console.error("getRaceTrend error:", err);
    throw err;
  }
}