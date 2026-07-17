import { API_BASE_URL } from "../lib/api";
import { authHeaders, fetchWithRetry, handleResponse } from "../lib/http";

const API_BASE = `${API_BASE_URL}/api/profile`;

export async function fetchMyProfile(): Promise<{ username: string | null }> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/me`, { headers });
  return handleResponse(res);
}

export async function checkUsernameAvailable(username: string): Promise<boolean> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE}/availability?username=${encodeURIComponent(username)}`, { headers });
  const data = await handleResponse<{ available: boolean }>(res);
  return data.available;
}

export async function setMyUsername(username: string): Promise<{ username: string }> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ username }),
  });
  return handleResponse(res);
}
