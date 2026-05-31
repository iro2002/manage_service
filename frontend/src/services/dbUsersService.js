import { fetchApi } from './api';

export async function fetchDbUsers(credentials = {}) {
  return fetchApi('/db-users', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
}

export async function fetchDbUsersMulti(configIds = []) {
  return fetchApi('/db-users/multi', {
    method: 'POST',
    body: JSON.stringify({ configIds })
  });
}
