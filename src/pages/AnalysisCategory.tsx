import { useParams, Link } from "react-router-dom";

const CATEGORY_INFO: Record<string, { title: string; desc: string; items: string[] }> = {
  security: {
    title: "Security",
    desc: "Defensive configuration checks — nothing here attempts exploitation.",
    items: ["HTTPS", "HSTS", "Content-Security-Policy", "Cookie flags", "Mixed content", "Exposed server info"],
  },
  web: {
    title: "Web Quality",
    desc: "Structural and metadata checks against the page's real HTML.",
    items: ["Title / meta description", "Canonical", "Viewport", "Favicon", "Open Graph", "robots.txt / sitemap.xml"],
  },
  performance: {
    title: "Performance",
    desc: "Metrics measured directly from the response — never estimated.",
    items: ["Response time", "Document size", "Compression", "Cache-Control", "Render-blocking scripts", "Lazy-loading"],
  },
  accessibility: {
    title: "Accessibility",
    desc: "Heuristic checks — flagged as potential issues where certainty is limited.",
    items: ["Image alt text", "Form labels", "Heading hierarchy", "Button names", "Document language", "iframe titles"],
  },
  seo: {
    title: "SEO",
    desc: "Signals that affect how search engines can index the page.",
    items: ["Title length", "Meta description length", "Robots meta", "Structured data", "Internal links"],
  },
  source: {
    title: "Source Code",
    desc: "Static pattern scanning of uploaded archives — nothing is ever executed.",
    items: ["Secret patterns", "Hardcoded credentials", "Insecure URLs", "Dangerous JS patterns", "Malformed JSON"],
  },
};

export function AnalysisCategory() {
  const { category } = useParams();
  const info = category ? CATEGORY_INFO[category] : undefined;

  if (!info) {
    return <p className="text-sm text-ink-dim">Unknown category.</p>;
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-1">{info.title}</h1>
      <p className="text-sm text-ink-dim mb-6 max-w-lg">{info.desc}</p>
      <ul className="border border-line divide-y divide-line mb-8">
        {info.items.map((i) => (
          <li key={i} className="px-4 py-3 text-sm font-mono text-ink-dim">{i}</li>
        ))}
      </ul>
      <Link to="/scanner" className="font-mono text-sm text-accent hover:underline">
        Run a scan to see live results →
      </Link>
    </div>
  );
}
