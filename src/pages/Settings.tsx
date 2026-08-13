import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export function Settings() {
  const { user, signOut } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        setDisplayName(data?.display_name ?? "");
        setLoading(false);
      });
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) setError(error.message);
    else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  const provider = user?.app_metadata?.provider ?? "email";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "–";

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Settings</h1>

      <div className="border border-line p-5 mb-6">
        <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-accent mb-4">
          Profile
        </h2>
        <form onSubmit={handleSave} className="space-y-3 max-w-sm">
          <div>
            <label className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">
              Display name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={loading}
              placeholder="How you'd like to be addressed"
              className="w-full mt-1 bg-panel border border-line px-3 py-2 text-sm focus:border-accent outline-none disabled:opacity-50"
            />
          </div>
          {error && <p className="text-sm text-sev-critical">{error}</p>}
          <button
            type="submit"
            disabled={saving || loading}
            className="font-mono text-xs px-4 py-2 border border-line-strong hover:border-accent transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : saved ? "Saved ✓" : "Save changes"}
          </button>
        </form>
      </div>

      <div className="border border-line p-5 mb-6">
        <h2 className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-accent mb-4">
          Account
        </h2>
        <dl className="space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-faint">Email</dt>
            <dd>{user?.email}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-faint">Sign-in method</dt>
            <dd className="capitalize">{provider}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-faint">Member since</dt>
            <dd>{memberSince}</dd>
          </div>
        </dl>
      </div>

      <button
        onClick={() => signOut()}
        className="font-mono text-sm border border-line-strong px-4 py-2 hover:border-sev-critical hover:text-sev-critical transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
