import { fetchApi } from './api';

export const DEPARTMENTS = [
  "HR",
  "Finance",
  "Marketing",
  "BA",
  "QA",
  "Development",
  "Customer Success",
  "Manage Service",
];

// ─── Fetch all laptops ──────────────────────────────────────────────────────
export async function fetchLaptops() {
  return fetchApi('/laptops');
}

// ─── Check if a field value is unique across all laptops ─────────────────────
// Returns { unique: true } or { unique: false, field, conflictingModel }
export async function checkUnique(field, value, excludeId = null) {
  return fetchApi(`/laptops/check-unique?field=${field}&value=${encodeURIComponent(value)}&excludeId=${excludeId}`);
}

// ─── Add a brand-new laptop (status: Available) ───────────────────────────────
export async function addLaptop(data, performedBy) {
  return fetchApi('/laptops', {
    method: 'POST',
    body: JSON.stringify({ ...data, performedBy })
  });
}

// ─── Assign laptop to an employee ─────────────────────────────────────────────
export async function assignLaptop(laptop, assignData, performedBy) {
  return fetchApi(`/laptops/${laptop.id}/assign`, {
    method: 'POST',
    body: JSON.stringify({ laptop, assignData, performedBy })
  });
}

// ─── Transfer laptop between employees ────────────────────────────────────────
export async function transferLaptop(laptop, transferData, performedBy) {
  return fetchApi(`/laptops/${laptop.id}/transfer`, {
    method: 'POST',
    body: JSON.stringify({ laptop, transferData, performedBy })
  });
}

// ─── Return laptop to Manage Service ──────────────────────────────────────────
export async function returnToMS(laptop, returnData, performedBy) {
  return fetchApi(`/laptops/${laptop.id}/return-ms`, {
    method: 'POST',
    body: JSON.stringify({ laptop, returnData, performedBy })
  });
}

// ─── Return laptop to vendor ───────────────────────────────────────────────────
export async function returnToVendor(laptop, returnData, performedBy) {
  return fetchApi(`/laptops/${laptop.id}/return-vendor`, {
    method: 'POST',
    body: JSON.stringify({ laptop, returnData, performedBy })
  });
}

// ─── Get history for a specific laptop ────────────────────────────────────────
export async function getLaptopHistory(laptopId) {
  return fetchApi(`/laptops/${laptopId}/history`);
}

// ─── Update basic laptop info ─────────────────────────────────────────────────
export async function updateLaptop(laptopId, data) {
  return fetchApi(`/laptops/${laptopId}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}
