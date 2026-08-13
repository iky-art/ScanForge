// Same-origin: frontend and API functions deploy together on Vercel, so
// these are plain relative paths — no separate API base URL needed.

export async function scanSourceUpload(file: File) {
  const form = new FormData();
  form.append("archive", file);
  const res = await fetch("/api/scan-source", {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Source scan failed.");
  }
  return res.json();
}
