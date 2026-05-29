import { fetchApi } from './api';

export async function fetchSavedDbConfigs() {
  return fetchApi('/db-configs');
}

export async function saveDbConfig(config) {
  return fetchApi('/db-configs', {
    method: 'POST',
    body: JSON.stringify(config)
  });
}

export async function deleteDbConfig(id) {
  return fetchApi(`/db-configs/${id}`, {
    method: 'DELETE'
  });
}
