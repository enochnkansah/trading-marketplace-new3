const configuredApiUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://127.0.0.1:8000/api/v1"
).trim();

export const API_BASE_URL =
  configuredApiUrl.replace(/\/+$/, "");

export const API_ORIGIN = API_BASE_URL.replace(
  /\/api\/v1\/?$/,
  ""
);
