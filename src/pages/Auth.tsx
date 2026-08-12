import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Github } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

type Mode = "signin" | "signup" | "reset";

export function Auth() {
  const { session, signInWithGithub, signInWithPassword, signUpWithPassword, requestPasswordReset } =
    useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (session) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await signInWithPassword(email, password);
        if (error) setError(error);
      } else if (mode === "signup") {
        if (password !== confirm) {
          setError("Passwords do not match.");
          return;
        }
        const { error } = await signUpWithPassword(email, password);
        if (error) setError(error);
        else setNotice("Account created. Check your email to verify, then sign in.");
      } else {
        const { error } = await requestPasswordReset(email);
        if (error) setError(error);
        else setNotice("Password reset email sent, if that address has an account.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-base-0 text-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="font-mono font-semibold text-sm">
            SCAN<span className="text-accent">FORGE</span>
          </span>
        </div>

        <div className="border border-line p-6">
          <h1 className="font-semibold text-lg mb-1">
            {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
          </h1>
          <p className="text-sm text-ink-dim mb-5">
            {mode === "signin" && "Welcome back."}
            {mode === "signup" && "Start scanning in a couple of minutes."}
            {mode === "reset" && "We'll send you a reset link."}
          </p>

          {mode !== "reset" && (
            <>
              <button
                onClick={() => signInWithGithub()}
                className="w-full flex items-center justify-center gap-2 border border-line-strong py-2.5 text-sm font-medium hover:border-accent transition-colors mb-4"
              >
                <Github size={16} /> Sign in with GitHub
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-px bg-line flex-1" />
                <span className="font-mono text-[0.65rem] text-ink-faint">OR</span>
                <div className="h-px bg-line flex-1" />
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none"
                />
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none"
                />
              </div>
            )}

            {error && <p className="text-sm text-sev-critical">{error}</p>}
            {notice && <p className="text-sm text-emerald-400">{notice}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-accent text-base-0 font-mono text-sm font-medium py-2.5 hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {mode === "signin" && "Sign in"}
              {mode === "signup" && "Create account"}
              {mode === "reset" && "Send reset link"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between font-mono text-xs text-ink-dim">
            {mode === "signin" && (
              <>
                <button onClick={() => setMode("signup")} className="hover:text-ink">Create account</button>
                <button onClick={() => setMode("reset")} className="hover:text-ink">Forgot password</button>
              </>
            )}
            {mode !== "signin" && (
              <button onClick={() => setMode("signin")} className="hover:text-ink">Back to sign in</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
