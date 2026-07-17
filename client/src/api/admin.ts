import { API_BASE_URL } from "../lib/api";
import { authHeaders, fetchWithRetry, handleResponse } from "../lib/http";
import type { PlaceType, ReportReason } from "../types/place";

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

export interface AdminReport {
  id: string;
  reason: ReportReason;
  comment: string | null;
  createdAt: string;
  reporterUsername: string | null;
}

export interface AdminReportedPlace {
  id: string;
  name: string;
  type: PlaceType;
  latitude: number;
  longitude: number;
  ownerUsername: string | null;
  reports: AdminReport[];
}

export async function fetchReportedPlaces(): Promise<AdminReportedPlace[]> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE_URL}/api/admin/reports`, { headers });
  return handleResponse<AdminReportedPlace[]>(res);
}

export async function dismissReports(placeId: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetchWithRetry(`${API_BASE_URL}/api/admin/reports/${placeId}`, {
    method: "DELETE",
    headers,
  });
  return handleResponse<void>(res);
}
