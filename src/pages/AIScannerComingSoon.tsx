import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function AIScannerComingSoon() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <Sparkles size={28} className="text-sev-anomalous" strokeWidth={1.5} />
      <p className="font-mono text-xs text-sev-anomalous tracking-[0.15em] mt-4">
        {t("aiScanner.badge")}
      </p>
      <h1 className="text-2xl font-semibold mt-2">{t("aiScanner.title")}</h1>
      <p className="font-mono text-xs text-ink-faint tracking-wide mt-3 border border-line px-3 py-1">
        {t("aiScanner.comingSoon")}
      </p>
      <p className="text-sm text-ink-dim max-w-md mt-6 leading-relaxed">
        {t("aiScanner.body")}
      </p>
      <Link
        to="/scanner"
        className="mt-8 font-mono text-sm px-5 py-2.5 border border-line-strong hover:border-accent transition-colors"
      >
        {t("aiScanner.back")}
      </Link>
    </div>
  );
}
