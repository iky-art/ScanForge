import { Menu, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="h-14 border-b border-line flex items-center justify-between px-4 md:px-6 bg-base-0/90 backdrop-blur">
      <button onClick={onMenuClick} className="md:hidden text-ink-dim" aria-label="Open menu">
        <Menu size={20} />
      </button>
      <div className="hidden md:block font-mono text-xs text-ink-faint">
        {user?.email ?? "signed out"}
      </div>
      <button
        onClick={() => signOut()}
        className="flex items-center gap-2 font-mono text-xs text-ink-dim hover:text-ink transition-colors"
      >
        <LogOut size={14} /> {t("topbar.signOut")}
      </button>
    </header>
  );
}
