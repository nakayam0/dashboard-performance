// src/components/RankingPerformance.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  getRaceSummary,
  getRankingByRace,
} from "../services/performanceApi";

/* ===========================
   Helper: Race + Project Label
=========================== */
function formatRaceLabel(r) {
  const raceName =
    r.raceName ?? r.name ?? r.version_name ?? "";

  const projectName =
    r.projectName ??
    r.project_name ??
    r.project ??
    "";

  return projectName
    ? `${raceName} — ${projectName}`
    : raceName;
}

export default function RankingPerformance({
  races: racesProp = [],
}) {
  const navigate = useNavigate();

  const [races, setRaces] = useState([]);
  const [selectedRaceId, setSelectedRaceId] =
    useState(null);
  const [ranking, setRanking] = useState([]);
  const [open, setOpen] = useState(false);

  const dropdownRef = useRef(null);

  /* ===========================
     LOAD RACES
  ============================ */
  useEffect(() => {
    async function load() {
      try {
        let r = racesProp;

        if (!r || !r.length) {
          r = await getRaceSummary();
        }

        setRaces(r || []);

        const firstId =
          r?.[0]?.id ??
          r?.[0]?.raceId ??
          r?.[0]?.versionId ??
          null;

        // jangan override pilihan user
        setSelectedRaceId(
          (prev) => prev ?? firstId
        );
      } catch (err) {
        console.error(
          "Race load error",
          err
        );
        setRaces([]);
      }
    }

    load();
  }, [racesProp]);

  /* ===========================
     LOAD RANKING
  ============================ */
  useEffect(() => {
    if (!selectedRaceId) return;

    getRankingByRace(selectedRaceId)
      .then((d) => {
        const arr = Array.isArray(d)
          ? d
          : d
          ? [d]
          : [];

        arr.sort(
          (a, b) =>
            (b.performanceKinerja ||
              b.performance ||
              0) -
            (a.performanceKinerja ||
              a.performance ||
              0)
        );

        setRanking(arr);
      })
      .catch((err) => {
        console.error(
          "Ranking error",
          err
        );
        setRanking([]);
      });
  }, [selectedRaceId]);

  /* ===========================
     CLOSE DROPDOWN ON OUTSIDE CLICK
  ============================ */
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(
          e.target
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );
    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
  }, []);

  /* ===========================
     FIND SELECTED RACE
  ============================ */
  const selectedRace = races.find(
    (r) =>
      Number(
        r.id ??
          r.raceId ??
          r.versionId
      ) === Number(selectedRaceId)
  );

  /* ===========================
     RENDER
  ============================ */
  return (
    <div
      className="card ranking clickable"
      onClick={() =>
        navigate("/ranking")
      }
    >
      <h3>Ranking Performance</h3>

      {/* STOP propagation supaya dropdown tidak pindah halaman */}
      <div
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        {/* ===== DROPDOWN ===== */}
        <div
          className="race-dropdown"
          ref={dropdownRef}
        >
          <div
            className="race-selected"
            onClick={() =>
              setOpen(!open)
            }
          >
            {selectedRace
              ? formatRaceLabel(
                  selectedRace
                )
              : "Select race"}
            <span>▾</span>
          </div>

          {open && (
            <div className="race-menu">
              {races.map((r) => {
                const id =
                  r.id ??
                  r.raceId ??
                  r.versionId;

                return (
                  <div
                    key={id}
                    className="race-item"
                    onClick={() => {
                      setSelectedRaceId(
                        id
                      );
                      setOpen(false);
                    }}
                  >
                    {formatRaceLabel(
                      r
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ===== TABLE ===== */}
  <div className="ranking-table">
  <div className="ranking-header">
    <span>No</span>
    <span>Nama</span>
    <span>Issue</span>
    <span>Hour</span>
    <span>TUS</span>
    <span>Score</span>
  </div>

  <div className="ranking-body">
    {(ranking || []).map((item, i) => (
      <div
        key={item.userId ?? i}
        className="ranking-row"
      >
        <span>{i + 1}</span>

        <span>
          {item.userName ?? item.fullname ?? "-"}
        </span>

        <span>
          {item.totalIssues ??
            item.total_issues ??
            0}
        </span>

        <span>
          {item.loggedHours ??
            item.logged_hours ??
            0}
        </span>

        <span>
          {(item.timeUtilizationScore ??
            item.tus ??
            0).toFixed
            ? (
                item.timeUtilizationScore ??
                item.tus ??
                0
              ).toFixed(2)
            : item.timeUtilizationScore ??
              item.tus ??
              0}
          %
        </span>

        <span>
          {item.performanceKinerja ??
            item.performance ??
            0}
        </span>
      </div>
    ))}
  </div>
</div>
      </div>
    </div>
  );
}