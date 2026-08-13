import { Link } from "react-router-dom";
import { ScanForgeCore } from "@/three/ScanForgeCore";

export function NotFound() {
  return (
    <div className="min-h-screen bg-base-0 text-ink flex flex-col items-center justify-center text-center px-4">
      <div className="w-48 h-48 sm:w-56 sm:h-56">
        <ScanForgeCore state="error" className="w-full h-full" />
      </div>
      <p className="font-mono text-xs text-sev-critical tracking-[0.15em] -mt-4">
        404 · NOT FOUND
      </p>
      <h1 className="text-xl font-semibold mt-2">This route doesn't exist.</h1>
      <p className="text-sm text-ink-dim mt-2 max-w-xs">
        The page you're looking for isn't part of ScanForge, or the link is
        broken.
      </p>
      <Link
        to="/"
        className="mt-6 font-mono text-sm px-5 py-2.5 border border-line-strong hover:border-accent transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
