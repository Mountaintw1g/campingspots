import { supabase } from "../lib/supabaseClient";
import { API_BASE_URL } from "../lib/api";
import type { NewPlace, Place, Report, ReportReason } from "../types/place";

const API_BASE = `${API_BASE_URL}/api/places`;

// Render (backend-hosting, gratisnivå) somnar efter inaktivitet, och kan
// avbryta anslutningen under uppstarten innan den hunnit svara - vilket
// webbläsaren visar som ett generiskt "Failed to fetch"/NetworkError.
// Försök igen ett par gånger med kort fördröjning istället för att låta
// en enskild avbruten anslutning krascha hela anropet.
async function fetchWithRetry(input: string, init?: RequestInit, attempts = 3): Promise<Response> {
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fetch(input, init);
    } catch (err) {
      if (attempt === attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
  // Ouppnåeligt (loopen returnerar eller kastar alltid), men TypeScript vill ha det.
  throw new Error("Kunde inte nå servern");
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? "Något gick fel");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

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
