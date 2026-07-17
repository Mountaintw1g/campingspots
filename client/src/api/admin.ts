import { API_BASE_URL } from "../lib/api";
import { authHeaders, fetchWithRetry, handleResponse } from "../lib/http";

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
}

export async function fetchAllUsers(): Promise<AdminUser[]> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE_URL}/api/admin/users`, { headers });
  return handleResponse<AdminUser[]>(res);
}
