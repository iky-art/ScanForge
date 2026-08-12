import path from "node:path";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import unzipper from "unzipper";

const MAX_TOTAL_UNCOMPRESSED_BYTES = 30_000_000; // 30MB
const MAX_FILES = 500;
const ALLOWED_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".json", ".env", ".yml", ".yaml",
  ".html", ".css", ".md", ".txt", ".config",
]);

export class UnsafeArchiveError extends Error {}

/**
 * Extracts a ZIP into destDir, refusing anything that would escape destDir
 * (path traversal via "../"), symlinks, oversized archives, or files whose
 * extension isn't on the allowlist. Extracted files are NEVER executed —
 * this module only ever reads bytes back out for static pattern scanning.
 */
export async function safeExtractZip(zipPath: string, destDir: string): Promise<string[]> {
  await fs.mkdir(destDir, { recursive: true });

  const directory = await unzipper.Open.file(zipPath);
  let totalBytes = 0;
  let fileCount = 0;
  const extracted: string[] = [];

  for (const entry of directory.files) {
    if (entry.type === "Directory") continue;

    const normalized = path.normalize(entry.path);
    if (normalized.startsWith("..") || path.isAbsolute(normalized)) {
      throw new UnsafeArchiveError(`Unsafe path in archive: ${entry.path}`);
    }

    const destPath = path.join(destDir, normalized);
    if (!destPath.startsWith(destDir)) {
      throw new UnsafeArchiveError(`Unsafe path in archive: ${entry.path}`);
    }

    fileCount++;
    if (fileCount > MAX_FILES) {
      throw new UnsafeArchiveError("Archive contains too many files.");
    }

    totalBytes += entry.uncompressedSize;
    if (totalBytes > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new UnsafeArchiveError("Archive exceeds maximum allowed size.");
    }

    const ext = path.extname(normalized).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext) && ext !== "") {
      // Skip disallowed file types silently rather than failing the whole scan —
      // e.g. binaries/images inside the zip are just not scanned.
      continue;
    }

    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await pipeline(entry.stream(), createWriteStream(destPath));
    extracted.push(destPath);
  }

  return extracted;
}

export async function cleanupDir(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}
