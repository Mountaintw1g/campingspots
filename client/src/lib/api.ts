// .trim() skyddar mot extra radbrytning/mellanslag som lätt smyger sig med
// vid copy-paste i molnplattformars miljövariabel-fält (t.ex. Vercel).
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
