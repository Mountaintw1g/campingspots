import type { NewPlace, Place, Report, ReportReason } from "../types/place";

const API_BASE = "/api/places";

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Något gick fel");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export function fetchPlaces(): Promise<Place[]> {
  return fetch(API_BASE).then((res) => handleResponse<Place[]>(res));
}

export function createPlace(place: NewPlace): Promise<Place> {
  return fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(place),
  }).then((res) => handleResponse<Place>(res));
}

export function updatePlace(id: string, place: NewPlace): Promise<Place> {
  return fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(place),
  }).then((res) => handleResponse<Place>(res));
}

export function setPlaceSaved(id: string, saved: boolean): Promise<Place> {
  return fetch(`${API_BASE}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ saved }),
  }).then((res) => handleResponse<Place>(res));
}

export function deletePlace(id: string): Promise<void> {
  return fetch(`${API_BASE}/${id}`, { method: "DELETE" }).then((res) => handleResponse<void>(res));
}

export function reportPlace(id: string, reason: ReportReason, comment?: string): Promise<Report> {
  return fetch(`${API_BASE}/${id}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason, comment }),
  }).then((res) => handleResponse<Report>(res));
}
