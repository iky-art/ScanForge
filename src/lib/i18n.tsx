import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "id";

const STORAGE_KEY = "scanforge_lang";

const translations = {
  en: {
    "nav.dashboard": "Dashboard",
    "nav.scanner": "Scanner",
    "nav.standardScanner": "Standard Scanner",
    "nav.aiScanner": "AI Scanner",
    "nav.analysis": "Analysis",
    "nav.security": "Security",
    "nav.web": "Web Quality",
    "nav.performance": "Performance",
    "nav.accessibility": "Accessibility",
    "nav.seo": "SEO",
    "nav.source": "Source Code",
    "nav.records": "Records",
    "nav.reports": "Reports",
    "nav.history": "Scan History",
    "nav.account": "Account",
    "nav.settings": "Settings",
    "nav.comingSoon": "SOON",
    "nav.version": "ScanForge v1.0.0 · Core Scanner",

    "topbar.signOut": "Sign out",

    "splash.initializing": "CORE INITIALIZING...",
    "splash.ready": "SYSTEM READY",
    "splash.loading": "LOADING",

    "landing.tag": "v1.0.0 — Core Scanner",
    "landing.title1": "Scan. Understand.",
    "landing.title2": "Improve.",
    "landing.subtitle": "Analyze websites, discover configuration issues, understand the risks, and get practical remediation guidance.",
    "landing.getStarted": "Get Started",
    "landing.howItWorks": "How It Works",
    "landing.dashboard": "Dashboard",
    "landing.signIn": "Sign In",
    "landing.howHeading": "How ScanForge Works",
    "landing.checksHeading": "What ScanForge Checks",
    "landing.securityHeading": "Security Approach",
    "landing.securityTitle": "Security Hardening:",
    "landing.securityStrong": "Strong",
    "landing.securityBody": "We won't claim a percentage — security isn't a score. ScanForge itself is built with SSRF protection, strict input validation, rate limiting, and least-privilege access to your data via Supabase Row Level Security.",
    "landing.roadmapHeading": "Version Roadmap",
    "landing.ctaHeading": "Start your first scan.",
    "landing.footerTag": "Scan. Understand. Improve.",

    "auth.signIn": "Sign in",
    "auth.createAccount": "Create account",
    "auth.resetPassword": "Reset password",
    "auth.welcomeBack": "Welcome back.",
    "auth.startScanning": "Start scanning in a couple of minutes.",
    "auth.sendResetLink": "We'll send you a reset link.",
    "auth.githubSignIn": "Sign in with GitHub",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.confirmPassword": "Confirm password",
    "auth.forgotPassword": "Forgot password",
    "auth.backToSignIn": "Back to sign in",
    "auth.sendResetLinkBtn": "Send reset link",

    "dashboard.welcome": "Good to see you again.",
    "dashboard.subtitle": "Here's where things stand.",
    "dashboard.startScan": "Start New Scan",
    "dashboard.totalScans": "Total Scans",
    "dashboard.criticalFindings": "Critical Findings",
    "dashboard.highFindings": "High Findings",
    "dashboard.avgScore": "Avg. Security Score",
    "dashboard.recentScans": "Recent Scans",
    "dashboard.noScans": "No scans yet. Run your first one to see results here.",

    "scanner.title": "Standard Scanner",
    "scanner.subtitle": "Analyze a website or uploaded project.",
    "scanner.website": "Website",
    "scanner.source": "Source Code",
    "scanner.startScan": "Start Scan",
    "scanner.uploadZip": "Click to upload a .zip archive",
    "scanner.scanning": "Scanning archive...",

    "settings.title": "Settings",
    "settings.profile": "Profile",
    "settings.displayName": "Display name",
    "settings.displayNamePlaceholder": "How you'd like to be addressed",
    "settings.save": "Save changes",
    "settings.saving": "Saving...",
    "settings.saved": "Saved ✓",
    "settings.account": "Account",
    "settings.email": "Email",
    "settings.signInMethod": "Sign-in method",
    "settings.memberSince": "Member since",
    "settings.language": "Language",
    "settings.languageDesc": "Applies across the app immediately.",
    "settings.signOut": "Sign out",

    "aiScanner.badge": "SCANFORGE INTELLIGENCE",
    "aiScanner.title": "AI Scanner",
    "aiScanner.comingSoon": "COMING SOON — AVAILABLE IN v2.0.0",
    "aiScanner.body": "AI-assisted analysis, contextual explanations, intelligent remediation, and deeper security insights are being prepared for the next major release.",
    "aiScanner.back": "Back to Scanner",
  },
  id: {
    "nav.dashboard": "Dasbor",
    "nav.scanner": "Scanner",
    "nav.standardScanner": "Scanner Standar",
    "nav.aiScanner": "AI Scanner",
    "nav.analysis": "Analisis",
    "nav.security": "Keamanan",
    "nav.web": "Kualitas Web",
    "nav.performance": "Performa",
    "nav.accessibility": "Aksesibilitas",
    "nav.seo": "SEO",
    "nav.source": "Kode Sumber",
    "nav.records": "Catatan",
    "nav.reports": "Laporan",
    "nav.history": "Riwayat Scan",
    "nav.account": "Akun",
    "nav.settings": "Pengaturan",
    "nav.comingSoon": "SEGERA",
    "nav.version": "ScanForge v1.0.0 · Core Scanner",

    "topbar.signOut": "Keluar",

    "splash.initializing": "MEMUAT INTI SISTEM...",
    "splash.ready": "SISTEM SIAP",
    "splash.loading": "MEMUAT",

    "landing.tag": "v1.0.0 — Core Scanner",
    "landing.title1": "Scan. Pahami.",
    "landing.title2": "Tingkatkan.",
    "landing.subtitle": "Analisis website, temukan masalah konfigurasi, pahami risikonya, dan dapatkan panduan perbaikan yang praktis.",
    "landing.getStarted": "Mulai Sekarang",
    "landing.howItWorks": "Cara Kerja",
    "landing.dashboard": "Dasbor",
    "landing.signIn": "Masuk",
    "landing.howHeading": "Cara Kerja ScanForge",
    "landing.checksHeading": "Apa yang Diperiksa ScanForge",
    "landing.securityHeading": "Pendekatan Keamanan",
    "landing.securityTitle": "Penguatan Keamanan:",
    "landing.securityStrong": "Kuat",
    "landing.securityBody": "Kami tidak akan mengklaim persentase — keamanan bukan sekadar skor. ScanForge sendiri dibangun dengan proteksi SSRF, validasi input yang ketat, rate limiting, dan akses data berbasis least-privilege lewat Supabase Row Level Security.",
    "landing.roadmapHeading": "Roadmap Versi",
    "landing.ctaHeading": "Mulai scan pertamamu.",
    "landing.footerTag": "Scan. Pahami. Tingkatkan.",

    "auth.signIn": "Masuk",
    "auth.createAccount": "Buat akun",
    "auth.resetPassword": "Atur ulang kata sandi",
    "auth.welcomeBack": "Selamat datang kembali.",
    "auth.startScanning": "Mulai scan dalam beberapa menit.",
    "auth.sendResetLink": "Kami akan kirim link atur ulang.",
    "auth.githubSignIn": "Masuk dengan GitHub",
    "auth.email": "Email",
    "auth.password": "Kata Sandi",
    "auth.confirmPassword": "Konfirmasi kata sandi",
    "auth.forgotPassword": "Lupa kata sandi",
    "auth.backToSignIn": "Kembali ke halaman masuk",
    "auth.sendResetLinkBtn": "Kirim link atur ulang",

    "dashboard.welcome": "Senang melihatmu lagi.",
    "dashboard.subtitle": "Berikut ringkasan kondisi saat ini.",
    "dashboard.startScan": "Mulai Scan Baru",
    "dashboard.totalScans": "Total Scan",
    "dashboard.criticalFindings": "Temuan Critical",
    "dashboard.highFindings": "Temuan High",
    "dashboard.avgScore": "Rata-rata Skor Keamanan",
    "dashboard.recentScans": "Scan Terbaru",
    "dashboard.noScans": "Belum ada scan. Jalankan yang pertama untuk melihat hasilnya di sini.",

    "scanner.title": "Scanner Standar",
    "scanner.subtitle": "Analisis website atau proyek yang diunggah.",
    "scanner.website": "Website",
    "scanner.source": "Kode Sumber",
    "scanner.startScan": "Mulai Scan",
    "scanner.uploadZip": "Ketuk untuk unggah arsip .zip",
    "scanner.scanning": "Memindai arsip...",

    "settings.title": "Pengaturan",
    "settings.profile": "Profil",
    "settings.displayName": "Nama tampilan",
    "settings.displayNamePlaceholder": "Bagaimana kamu ingin disapa",
    "settings.save": "Simpan perubahan",
    "settings.saving": "Menyimpan...",
    "settings.saved": "Tersimpan ✓",
    "settings.account": "Akun",
    "settings.email": "Email",
    "settings.signInMethod": "Metode masuk",
    "settings.memberSince": "Bergabung sejak",
    "settings.language": "Bahasa",
    "settings.languageDesc": "Langsung berlaku di seluruh aplikasi.",
    "settings.signOut": "Keluar",

    "aiScanner.badge": "SCANFORGE INTELLIGENCE",
    "aiScanner.title": "AI Scanner",
    "aiScanner.comingSoon": "SEGERA HADIR — TERSEDIA DI v2.0.0",
    "aiScanner.body": "Analisis berbasis AI, penjelasan kontekstual, remediasi cerdas, dan wawasan keamanan yang lebih dalam sedang disiapkan untuk rilis besar berikutnya.",
    "aiScanner.back": "Kembali ke Scanner",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function detectDefaultLang(): Lang {
  if (typeof navigator === "undefined") return "en";
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === "en" || stored === "id" ? stored : detectDefaultLang();
  });

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = (next: Lang) => {
    setLangState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  const t = (key: TranslationKey): string => translations[lang][key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useTranslation must be used within LanguageProvider");
  return ctx;
}
