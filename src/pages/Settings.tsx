import { useAuth } from "@/hooks/useAuth";

export function Settings() {
  const { user, signOut } = useAuth();
  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Settings</h1>
      <div className="border border-line p-4 mb-6">
        <div className="font-mono text-[0.65rem] uppercase tracking-wide text-ink-faint">Email</div>
        <div className="text-sm mt-1">{user?.email}</div>
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
