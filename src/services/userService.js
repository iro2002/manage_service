import { fetchApi } from './api';

// ─── Fetch all users ────────────────────────────────────────────────────────
export async function fetchUsers() {
  return fetchApi('/users');
}

// ─── Create a new user ──────────────────────────────────────────────────────
export async function createUser(data) {
  return fetchApi('/users', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

// ─── Update user details ────────────────────────────────────────────────────
export async function updateUser(id, data) {
  return fetchApi(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

// ─── Reset user password ────────────────────────────────────────────────────
export async function resetUserPassword(id, password) {
  return fetchApi(`/users/${id}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ password })
  });
}

// ─── Delete a user ──────────────────────────────────────────────────────────
export async function deleteUser(id) {
  return fetchApi(`/users/${id}`, {
    method: 'DELETE'
  });
}
