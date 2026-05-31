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

// ─── Reset user password (requires admin's own password) ──────────────────────────────
export async function resetUserPassword(id, password, adminPassword) {
  return fetchApi(`/users/${id}/reset-password`, {
    method: 'PUT',
    body: JSON.stringify({ password, adminPassword })
  });
}

// ─── Update page permissions for a user ────────────────────────────────────────
export async function updatePermissions(id, page_permissions) {
  return fetchApi(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ page_permissions })
  });
}

// ─── Delete a user ──────────────────────────────────────────────────────────
export async function deleteUser(id) {
  return fetchApi(`/users/${id}`, {
    method: 'DELETE'
  });
}
