export const API_BASE_URL = '/api';

export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'x-auth-token': token } : {})
  };
}

export async function fetchApi(endpoint, options = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers
    }
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error || data?.msg || 'API Error');
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}
