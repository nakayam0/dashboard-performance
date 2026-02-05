// src/components/RaceSummaryCard.jsx
import { FiRefreshCw } from 'react-icons/fi';

export default function RaceSummaryCard({
  races = [],
  onCardClick,
  onRefresh,
  loading
}) {
  const safeRaces = Array.isArray(races) ? races : races?.items || races?.data || [];

  return (
    <div
      className="card race-summary"
      onClick={() => onCardClick && onCardClick()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onCardClick && onCardClick(); }}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-title" style={{ alignItems: 'center' }}>
        <h3 style={{ margin: 0 }}>Race Summary</h3>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="refresh-btn"
            onClick={(e) => { e.stopPropagation(); onRefresh && onRefresh(); }}
            aria-label="refresh races"
            title="Refresh"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <FiRefreshCw className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

<div className="race-list">

        {/* pointerEvents none supaya klik pada list tidak memicu interaksi,
            namun still readable. Jika mau row selectable di halaman detail, itu di-handle di halaman Race Summary */}
        {safeRaces.length === 0 ? (
          <div style={{ padding: 12, color: '#6b7280' }}>No races</div>
        ) : (
          safeRaces.map((race, idx) => {
            const raceName = race.raceName ?? race.race_name ?? 'Unnamed Race';
            const projectName = race.projectName ?? race.project_name ?? '-';
            const startDate = race.startDate ?? race.start_date ?? '';
            const endDate = race.endDate ?? race.end_date ?? null;
            const openPct = race.statusPercentage?.open ?? race.status_percentage?.open ?? 0;
            const closedPct = race.statusPercentage?.closed ?? race.status_percentage?.closed ?? 0;

            return (
              <div key={race.raceId ?? race.race_id ?? idx} className="race-item">
                <div className="race-item-header">
                  <span className="race-title">
                    <span className="race-name">{raceName}</span>
                    {' – '}
                    <span className="project-name">{projectName}</span>
                  </span>

                  <span className="race-date">
                    {startDate}{endDate ? ` — ${endDate}` : ' — ongoing'}
                  </span>
                </div>

                <div className="race-bar">
                  <div className="race-bar-open" style={{ width: `${openPct}%` }} title={`Open ${openPct}%`}>
                    <span className="race-bar-value">{openPct}%</span>
                  </div>
                  <div className="race-bar-closed" style={{ width: `${closedPct}%`, marginLeft: `-${closedPct}%` }} title={`Closed ${closedPct}%`}>
                    <span className="race-bar-value">{closedPct}%</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
