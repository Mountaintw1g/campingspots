import type { Report } from "../types/place";

const STORAGE_KEY = "taltkartan:my-reports";

function readAll(): Record<string, Report> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, Report>) : {};
  } catch {
    return {};
  }
}

function writeAll(reports: Record<string, Report>): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
  } catch {
    // localStorage otillgängligt (t.ex. privat läge) - gäller bara för sessionen då.
  }
}

export function getMyReports(): Map<string, Report> {
  return new Map(Object.entries(readAll()));
}

export function saveMyReport(report: Report): void {
  const all = readAll();
  all[report.placeId] = report;
  writeAll(all);
}

export function removeMyReport(placeId: string): void {
  const all = readAll();
  delete all[placeId];
  writeAll(all);
}
