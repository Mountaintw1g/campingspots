import { API_BASE_URL } from "../lib/api";
import { authHeaders, fetchWithRetry, handleResponse } from "../lib/http";
import type { NewPlace, Place, Report, ReportReason } from "../types/place";

const API_BASE = `${API_BASE_URL}/api/places`;

export async function fetchPlaces(): Promise<Place[]> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(API_BASE, { headers });
  return handleResponse<Place[]>(res);
}

export async function createPlace(place: NewPlace): Promise<Place> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(place),
  });
  return handleResponse<Place>(res);
}

export async function updatePlace(id: string, place: NewPlace): Promise<Place> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(place),
  });
  return handleResponse<Place>(res);
}

export async function deletePlace(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${id}`, { method: "DELETE", headers });
  return handleResponse<void>(res);
}

export async function savePlaceForMe(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${id}/save`, { method: "POST", headers });
  return handleResponse<void>(res);
}

export async function unsavePlaceForMe(id: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${id}/save`, { method: "DELETE", headers });
  return handleResponse<void>(res);
}

export async function fetchMyReport(placeId: string): Promise<Report | null> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${placeId}/reports/mine`, { headers });
  if (res.status === 404) return null;
  return handleResponse<Report>(res);
}

export async function reportPlace(id: string, reason: ReportReason, comment?: string): Promise<Report> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${id}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ reason, comment }),
  });
  return handleResponse<Report>(res);
}

export async function deleteReport(placeId: string, reportId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/${placeId}/reports/${reportId}`, { method: "DELETE", headers });
  return handleResponse<void>(res);
}
