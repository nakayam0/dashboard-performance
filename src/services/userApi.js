import axios from 'axios';

const API_BASE = 'http://localhost:5098/api';

export async function getTotalUsers() {
  const res = await axios.get(`${API_BASE}/users/total`);
  return res.data.totalUsers;
}

export async function getUsers({ name, status, createdAt } = {}) {
  const res = await axios.get(`${API_BASE}/users`, {
    params: {
      name,
      status,
      createdAt
    }
  });

  return res.data;
}
