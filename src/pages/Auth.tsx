import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Github } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { ScanForgeCore, type CoreState } from "@/three/ScanForgeCore";

type Mode = "signin" | "signup" | "reset";

export function Auth() {
  const {
    session,
    isPasswordRecovery,
    signInWithGithub,
    signInWithPassword,
    signUpWithPassword,
    requestPasswordReset,
    updatePassword,
  } = useAuth();
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [focusedField, setFocusedField] = useState<"email" | "password" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // A user arriving from the password-reset email link gets a session from
  // Supabase automatically — don't bounce them to the dashboard before
  // they've actually set a new password.
  useEffect(() => {
    if (isPasswordRecovery && notice) {
      const t = setTimeout(() => window.location.assign("/dashboard"), 1200);
      return () => clearTimeout(t);
    }
  }, [isPasswordRecovery, notice]);

  if (session && !isPasswordRecovery) return <Navigate to="/dashboard" replace />;

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

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await updatePassword(password);
      if (error) setError(error);
      else setNotice("Password updated. Redirecting...");
    } finally {
      setBusy(false);
    }
  }

  // Dedicated "set new password" screen — shown only when the user arrived
  // via a valid password-recovery link.
  if (isPasswordRecovery) {
    return (
      <div className="min-h-screen bg-base-0 text-ink flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <span className="font-mono font-semibold text-sm">
              SCAN<span className="text-accent">FORGE</span>
            </span>
          </div>
          <div className="border border-line p-6">
            <h1 className="font-semibold text-lg mb-1">Set a new password</h1>
            <p className="text-sm text-ink-dim mb-5">Choose a new password for your account.</p>

            <form onSubmit={handleUpdatePassword} className="space-y-3">
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">
                  New password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none"
                />
              </div>
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">
                  {t("auth.confirmPassword")}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none"
                />
              </div>

              {error && <p className="text-sm text-sev-critical">{error}</p>}
              {notice && <p className="text-sm text-emerald-400">{notice}</p>}

              <button
                type="submit"
                disabled={busy}
                className="w-full bg-accent text-base-0 font-mono text-sm font-medium py-2.5 hover:bg-accent/90 transition-colors disabled:opacity-50"
              >
                {busy ? "Saving..." : "Update password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const coreState: CoreState = notice
    ? "complete"
    : error
      ? "error"
      : focusedField === "password"
        ? "analyzing"
        : focusedField === "email"
          ? "scanning"
          : "idle";

  const coreLabel = notice
    ? "AUTHENTICATED"
    : error
      ? "VALIDATION ERROR"
      : focusedField === "password"
        ? "PRIVACY MODE — INPUT SHIELDED"
        : focusedField === "email"
          ? "READING INPUT"
          : "STANDING BY";

  return (
    <div className="min-h-screen bg-base-0 text-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className={`w-16 h-16 mx-auto mb-3 transition-all duration-300 ${
              focusedField === "password" ? "opacity-50 blur-[1px]" : "opacity-100"
            }`}
          >
            <ScanForgeCore state={coreState} className="w-full h-full" />
          </div>
          <span className="font-mono font-semibold text-sm">
            SCAN<span className="text-accent">FORGE</span>
          </span>
          <div className="font-mono text-[0.6rem] text-ink-faint tracking-[0.12em] mt-1.5">
            {coreLabel}
          </div>
        </div>

        <div className="border border-line p-6">
          <h1 className="font-semibold text-lg mb-1">
            {mode === "signin" ? t("auth.signIn") : mode === "signup" ? t("auth.createAccount") : t("auth.resetPassword")}
          </h1>
          <p className="text-sm text-ink-dim mb-5">
            {mode === "signin" && t("auth.welcomeBack")}
            {mode === "signup" && t("auth.startScanning")}
            {mode === "reset" && t("auth.sendResetLink")}
          </p>

          {mode !== "reset" && (
            <>
              <button
                onClick={() => signInWithGithub()}
                className="w-full flex items-center justify-center gap-2 border border-line-strong py-2.5 text-sm font-medium hover:border-accent transition-colors mb-4"
              >
                <Github size={16} /> {t("auth.githubSignIn")}
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
              <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">{t("auth.email")}</label>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none"
              />
            </div>

            {mode !== "reset" && (
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">{t("auth.password")}</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
                  className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none"
                />
              </div>
            )}

            {mode === "signup" && (
              <div>
                <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">
                  {t("auth.confirmPassword")}
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField(null)}
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
              {mode === "signin" && t("auth.signIn")}
              {mode === "signup" && t("auth.createAccount")}
              {mode === "reset" && t("auth.sendResetLinkBtn")}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-between font-mono text-xs text-ink-dim">
            {mode === "signin" && (
              <>
                <button onClick={() => setMode("signup")} className="hover:text-ink">{t("auth.createAccount")}</button>
                <button onClick={() => setMode("reset")} className="hover:text-ink">{t("auth.forgotPassword")}</button>
              </>
            )}
            {mode !== "signin" && (
              <button onClick={() => setMode("signin")} className="hover:text-ink">{t("auth.backToSignIn")}</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
