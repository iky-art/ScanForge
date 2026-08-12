import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="min-h-screen bg-base-0 text-ink flex flex-col items-center justify-center text-center px-4">
      <p className="font-mono text-xs text-ink-faint">404</p>
      <h1 className="text-xl font-semibold mt-2">Route not found</h1>
      <Link to="/" className="mt-6 font-mono text-sm text-accent hover:underline">
        Back to home
      </Link>
    </div>
  );
}
