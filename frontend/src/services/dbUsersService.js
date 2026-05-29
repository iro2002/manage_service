import { fetchApi } from './api';

export async function fetchDbUsers(credentials = {}) {
  return fetchApi('/db-users', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}
