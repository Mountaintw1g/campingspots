import { API_BASE_URL } from "../lib/api";
import { authHeaders, fetchWithRetry, handleResponse } from "../lib/http";

export async function deleteAccount(): Promise<void> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE_URL}/api/account`, { method: "DELETE", headers });
  return handleResponse<void>(res);
}
