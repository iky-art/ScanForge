import { Link } from "react-router-dom";
import { ScanForgeCore } from "@/three/ScanForgeCore";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/lib/i18n";
import { ShieldCheck, FileCode2, Gauge, Accessibility, Search, FolderCode } from "lucide-react";

const STEPS = [
  {
    n: "01",
    title: "Enter target",
    body: "Provide a website you're authorized to inspect, or upload a source archive. ScanForge blocks internal/private targets automatically.",
  },
  {
    n: "02",
    title: "Start scan",
    body: "Security, web quality, performance, accessibility, SEO, and source checks run for real — nothing here is simulated.",
  },
  {
    n: "03",
    title: "Understand findings",
    body: "Each result appears as soon as it's detected, with severity, confidence, and the exact evidence the scanner saw.",
  },
  {
    n: "04",
    title: "Fix & verify",
    body: "Open a finding for fix and prevention guidance, apply the change, then re-scan to confirm it's resolved.",
  },
];

const CAPABILITIES = [
  { icon: ShieldCheck, label: "Security", items: ["HTTPS", "Security headers", "Cookies", "Mixed content"] },
  { icon: FileCode2, label: "Web Quality", items: ["HTML structure", "Links", "Metadata", "Robots / sitemap"] },
  { icon: Gauge, label: "Performance", items: ["Resources", "Response time", "Images", "JS / CSS"] },
  { icon: Accessibility, label: "Accessibility", items: ["Alt text", "Forms", "Headings", "ARIA basics"] },
  { icon: Search, label: "SEO", items: ["Metadata", "Canonical", "Open Graph", "Indexability"] },
  { icon: FolderCode, label: "Source Code", items: ["Secret patterns", "Configuration", "Insecure URLs", "Basic issues"] },
];

export function Landing() {
  const { session } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="bg-base-0 text-ink">
      <header className="border-b border-line">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-mono font-semibold text-sm">
            SCAN<span className="text-accent">FORGE</span>
          </span>
          <Link
            to={session ? "/dashboard" : "/auth"}
            className="font-mono text-xs border border-line-strong px-3 py-1.5 hover:border-accent transition-colors"
          >
            {session ? t("landing.dashboard") : t("landing.signIn")}
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="max-w-6xl mx-auto px-6 py-16 sm:py-24 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="font-mono text-xs text-accent tracking-wide">{t("landing.tag")}</p>
          <h1 className="text-4xl sm:text-5xl font-semibold mt-3 leading-tight">
            {t("landing.title1")}<br />{t("landing.title2")}
          </h1>
          <p className="text-ink-dim mt-5 max-w-md">{t("landing.subtitle")}</p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              to={session ? "/dashboard" : "/auth"}
              className="font-mono text-sm px-5 py-3 bg-accent text-base-0 font-medium hover:bg-accent/90 transition-colors"
            >
              {t("landing.getStarted")}
            </Link>
            <a
              href="#how-it-works"
              className="font-mono text-sm px-5 py-3 border border-line-strong hover:border-accent transition-colors"
            >
              {t("landing.howItWorks")}
            </a>
          </div>
        </div>
        <div className="h-64 sm:h-80">
          <ScanForgeCore state="scanning" className="w-full h-full" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-ink-faint mb-8">
            {t("landing.howHeading")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-base-0 p-6">
                <div className="font-mono text-2xl text-accent">{s.n}</div>
                <h3 className="font-semibold mt-3">{s.title}</h3>
                <p className="text-sm text-ink-dim mt-2 leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT CAN SCANFORGE CHECK */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-ink-faint mb-8">
            {t("landing.checksHeading")}
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-line border border-line">
            {CAPABILITIES.map((c) => (
              <div key={c.label} className="bg-base-0 p-6">
                <c.icon size={18} className="text-accent" strokeWidth={1.75} />
                <h3 className="font-semibold mt-3">{c.label}</h3>
                <ul className="mt-2 space-y-1">
                  {c.items.map((i) => (
                    <li key={i} className="text-sm text-ink-dim font-mono">· {i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECURITY APPROACH */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-ink-faint mb-4">
              {t("landing.securityHeading")}
            </h2>
            <p className="text-2xl font-semibold">
              {t("landing.securityTitle")} <span className="text-accent">{t("landing.securityStrong")}</span>
            </p>
            <p className="text-sm text-ink-dim mt-4 leading-relaxed max-w-md">
              {t("landing.securityBody")}
            </p>
          </div>
          <ul className="space-y-3 font-mono text-sm text-ink-dim">
            <li className="border-b border-line pb-3">Blocks scans of localhost, private, and link-local addresses</li>
            <li className="border-b border-line pb-3">Every redirect hop re-validated before it's followed</li>
            <li className="border-b border-line pb-3">Safe ZIP extraction — no path traversal, nothing executed</li>
            <li className="border-b border-line pb-3">Row Level Security — you only ever see your own data</li>
            <li>No AI, no external API calls, no fabricated results in v1</li>
          </ul>
        </div>
      </section>

      {/* ROADMAP */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="font-mono text-xs uppercase tracking-[0.12em] text-ink-faint mb-8">
            {t("landing.roadmapHeading")}
          </h2>
          <div className="grid sm:grid-cols-2 gap-px bg-line border border-line">
            <div className="bg-base-0 p-6">
              <div className="font-mono text-accent text-sm">v1.0.0</div>
              <h3 className="font-semibold mt-2">Core Scanner</h3>
              <p className="text-sm text-ink-dim mt-2">
                Security, web quality, performance, accessibility, SEO, and
                source code checks — no API key, no AI.
              </p>
            </div>
            <div className="bg-base-0 p-6">
              <div className="font-mono text-sev-anomalous text-sm">v2.0.0</div>
              <h3 className="font-semibold mt-2">ScanForge Intelligence</h3>
              <p className="text-sm text-ink-dim mt-2">
                AI-assisted briefings that explain and prioritize findings
                your scan already detected — never invents new ones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GET STARTED */}
      <section className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold">{t("landing.ctaHeading")}</h2>
          <Link
            to={session ? "/dashboard" : "/auth"}
            className="inline-block mt-6 font-mono text-sm px-6 py-3 bg-accent text-base-0 font-medium hover:bg-accent/90 transition-colors"
          >
            {t("landing.getStarted")}
          </Link>
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 font-mono text-xs text-ink-faint">
          <span>ScanForge v1.0.0 — Core Scanner</span>
          <span>{t("landing.footerTag")}</span>
        </div>
      </footer>
    </div>
  );
}
