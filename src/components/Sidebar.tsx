import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  Sparkles,
  ShieldCheck,
  FileCode2,
  Gauge,
  Accessibility,
  Search,
  FolderCode,
  FileBarChart,
  History,
  Settings,
  X,
} from "lucide-react";

const linkBase =
  "flex items-center gap-3 px-3 py-2 text-sm rounded-none border-l-2 border-transparent text-ink-dim hover:text-ink hover:bg-white/[0.03] transition-colors";
const linkActive = "border-accent text-ink bg-white/[0.04]";

function Item({ to, icon: Icon, children, badge }: { to: string; icon: any; children: string; badge?: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
    >
      <Icon size={16} strokeWidth={1.75} />
      <span className="flex-1">{children}</span>
      {badge && (
        <span className="font-mono text-[0.6rem] tracking-wide text-sev-anomalous border border-sev-anomalous/40 px-1.5 py-0.5">
          {badge}
        </span>
      )}
    </NavLink>
  );
}

function GroupLabel({ children }: { children: string }) {
  return (
    <div className="font-mono text-[0.65rem] tracking-[0.12em] uppercase text-ink-faint px-3 mt-5 mb-1.5">
      {children}
    </div>
  );
}

export function Sidebar({ onClose }: { onClose?: () => void }) {
  return (
    <nav className="flex flex-col h-full bg-base-1 border-r border-line w-64 shrink-0">
      <div className="flex items-center justify-between px-4 h-14 border-b border-line">
        <span className="font-mono font-semibold tracking-tight text-sm">
          SCAN<span className="text-accent">FORGE</span>
        </span>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-ink-dim" aria-label="Close menu">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pb-6">
        <div className="mt-3">
          <Item to="/dashboard" icon={LayoutDashboard}>Dashboard</Item>
        </div>

        <GroupLabel>Scanner</GroupLabel>
        <Item to="/scanner" icon={ScanLine}>Standard Scanner</Item>
        <Item to="/ai-scanner" icon={Sparkles} badge="SOON">AI Scanner</Item>

        <GroupLabel>Analysis</GroupLabel>
        <Item to="/analysis/security" icon={ShieldCheck}>Security</Item>
        <Item to="/analysis/web" icon={FileCode2}>Web Quality</Item>
        <Item to="/analysis/performance" icon={Gauge}>Performance</Item>
        <Item to="/analysis/accessibility" icon={Accessibility}>Accessibility</Item>
        <Item to="/analysis/seo" icon={Search}>SEO</Item>
        <Item to="/analysis/source" icon={FolderCode}>Source Code</Item>

        <GroupLabel>Records</GroupLabel>
        <Item to="/reports" icon={FileBarChart}>Reports</Item>
        <Item to="/history" icon={History}>Scan History</Item>

        <GroupLabel>Account</GroupLabel>
        <Item to="/settings" icon={Settings}>Settings</Item>
      </div>

      <div className="px-4 py-3 border-t border-line font-mono text-[0.65rem] text-ink-faint">
        ScanForge v1.0.0 · Core Scanner
      </div>
    </nav>
  );
}
