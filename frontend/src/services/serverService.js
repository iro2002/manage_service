const API = "/api/servers";
const USERS_API = "/api/users";

async function authFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const headers = {
    ...options.headers,
    "x-auth-token": token || "",
  };

  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(url, { ...options, headers });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Request failed (${res.status})`);
  }
  
  return res.json();
}

export async function fetchServers() {
  return authFetch(API);
}

export async function createServer(data) {
  return authFetch(API, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateServer(id, data) {
  return authFetch(`${API}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteServer(id) {
  return authFetch(`${API}/${id}`, {
    method: "DELETE",
  });
}

export async function fetchServerUpdates(id) {
  return authFetch(`${API}/${id}/updates`);
}

export async function logServerUpdate(id, data) {
  return authFetch(`${API}/${id}/updates`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function fetchAdminUsers() {
  return authFetch(USERS_API);
}
