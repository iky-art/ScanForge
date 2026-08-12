const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8787";

export function scanWebsiteStreamUrl(target: string): string {
  return `${API_BASE}/api/scan/website?target=${encodeURIComponent(target)}`;
}

export async function scanSourceUpload(file: File) {
  const form = new FormData();
  form.append("archive", file);
  const res = await fetch(`${API_BASE}/api/scan/source`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Source scan failed.");
  }
  return res.json();
}
