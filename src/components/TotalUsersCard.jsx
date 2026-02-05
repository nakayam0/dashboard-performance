import { FiRefreshCw } from 'react-icons/fi';
import userGroupIcon from '../assets/user-group.png';

export default function TotalUsersCard({
  totalUsers,
  onDetail,
  onRefresh,
  loading
}) {
  return (
    <div
      className="card total-users clickable"
      onClick={onDetail}
    >
      <div className="card-header">
        <span>Total Users</span>

        <button
          className="refresh-btn"
          onClick={(e) => {
            e.stopPropagation(); // ⬅️ PENTING: biar ga ikut navigate
            onRefresh();
          }}
        >
          <FiRefreshCw className={loading ? 'spin' : ''} />
        </button>
      </div>

      <div className="users-main">
        <div className="users-number">
          {loading ? '...' : totalUsers}
          <span className="users-text">users</span>
        </div>
      </div>

      <div className="users-icon">
        <img src={userGroupIcon} alt="users icon" />
      </div>
    </div>
  );
}
