import { supabase } from "./supabaseClient";
import type { ErrorCode } from "../i18n/translations";

export class ApiError extends Error {
  code?: ErrorCode;

  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code as ErrorCode | undefined;
  }
}

// Render (backend-hosting, gratisnivå) somnar efter inaktivitet, och kan
// avbryta anslutningen under uppstarten innan den hunnit svara - vilket
// webbläsaren visar som ett generiskt "Failed to fetch"/NetworkError.
// Försök igen ett par gånger med kort fördröjning istället för att låta
// en enskild avbruten anslutning krascha hela anropet.
export async function fetchWithRetry(input: string, init?: RequestInit, attempts = 3): Promise<Response> {
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

export async function authHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText, code: undefined }));
    throw new ApiError(body.error ?? "Något gick fel", body.code);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Slår upp ett översatt felmeddelande via felkoden servern skickade, med
// serverns egna (svenska) meddelande eller en generisk text som reserv.
export function errorMessage(err: unknown, t: { errors: Record<string, string> }): string {
  if (err instanceof ApiError && err.code && t.errors[err.code]) {
    return t.errors[err.code];
  }
  if (err instanceof Error && err.message) return err.message;
  return t.errors.GENERIC;
}
