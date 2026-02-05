// src/pages/Users.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userTwoIcon from '../assets/user-two.png';

import '../styles/dashboard.css';
import '../styles/users.css';

import Header from '../components/Header';
import { getUsers } from '../services/userApi';

export default function Users() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [status, setStatus] = useState(''); // 'active' | 'inactive' | ''
  const [createdAt, setCreatedAt] = useState(''); // YYYY-MM
  const [error, setError] = useState(null);

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    try {
      const data = await getUsers({ name: name || undefined, status: status || undefined, createdAt: createdAt || undefined });
      setUsers(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleApplyFilters(e) {
    e?.preventDefault();
    fetchUsers();
  }

  function handleClear() {
    setName('');
    setStatus('');
    setCreatedAt('');
    fetchUsers();
  }

  return (
    <div className="users-page">
      <Header />

      <div className="card" style={{ borderRadius: 16 }}>
        <div className="users-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="users-title">
  <img src={userTwoIcon} alt="users" className="users-title-icon" />
  <h2>Users</h2>
</div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <form onSubmit={handleApplyFilters} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input
                className="users-filter"
                placeholder="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <select
                className="users-filter"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">status</option>
                <option value="active">active</option>
                <option value="inactive">inactive</option>
              </select>

              {/* month picker */}
              <input
                className="users-filter"
                type="month"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                title="create at (month)"
              />

              <button type="submit" className="filter-apply">apply</button>
              <button type="button" className="filter-clear" onClick={handleClear}>clear</button>
            </form>

            <button className="back-btn" onClick={() => navigate(-1)}>back</button>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div className="users-table-wrapper">
            {loading ? (
              <div style={{ padding: 20 }}>Loading...</div>
            ) : error ? (
              <div style={{ padding: 20, color: 'red' }}>{error}</div>
            ) : (
              <table className="users-table">
                <thead>
                  <tr>
                    <th style={{ width: 48 }}>NO</th>
                    <th>NAMA</th>
                    <th>ROLE</th>
                    <th>STATUS</th>
                    <th>CREATE AT</th>
                  </tr>
                </thead>

                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: 20, textAlign: 'center' }}>No data</td>
                    </tr>
                  ) : users.map((u, idx) => (
                    <tr key={u.id}>
                      <td>{idx + 1}</td>
                      <td>{u.name}</td>
                      <td>{u.role}</td>
                      <td style={{ textTransform: 'capitalize' }}>{u.status}</td>
                      <td>{u.createdAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
