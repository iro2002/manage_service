import { fetchApi } from './api';

export async function fetchDbEmployeeProfiles() {
  return fetchApi('/db-employee-profiles');
}

export async function createDbEmployeeProfile(profile) {
  return fetchApi('/db-employee-profiles', {
    method: 'POST',
    body: JSON.stringify(profile)
  });
}

export async function deleteDbEmployeeProfile(id) {
  return fetchApi(`/db-employee-profiles/${id}`, {
    method: 'DELETE'
  });
}
