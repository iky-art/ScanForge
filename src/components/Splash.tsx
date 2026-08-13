import { useEffect, useState } from "react";

const SESSION_KEY = "scanforge_splash_shown";
const DURATION_MS = 4500;

export function useSplashGate() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const alreadyShown = sessionStorage.getItem(SESSION_KEY);
    if (!alreadyShown) {
      setShow(true);
      sessionStorage.setItem(SESSION_KEY, "1");
    }
  }, []);

  return { show, dismiss: () => setShow(false) };
}

export function Splash({ onDone }: { onDone: () => void }) {
  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const [logoIn, setLogoIn] = useState(reduceMotion);
  const [nameIn, setNameIn] = useState(reduceMotion);
  const [percent, setPercent] = useState(reduceMotion ? 100 : 0);

  useEffect(() => {
    if (reduceMotion) {
      const t = setTimeout(onDone, 500);
      return () => clearTimeout(t);
    }

    // Staggered reveal: logo first, then the wordmark shortly after.
    const logoTimer = setTimeout(() => setLogoIn(true), 150);
    const nameTimer = setTimeout(() => setNameIn(true), 650);

    // Progress counter tied to real elapsed time, not a fake instant jump —
    // it should feel like something is actually being initialized.
    const start = performance.now();
    let frame: number;
    const tick = () => {
      const elapsed = performance.now() - start;
      const t = Math.min(1, elapsed / DURATION_MS);
      // Eased curve instead of a straight line: quick at first, then it
      // visibly slows and "grinds" through the last stretch before
      // snapping to 100 — reads as something substantial finishing up,
      // not a flat progress bar.
      const eased = 1 - Math.pow(1 - t, 4);
      const pct = Math.min(100, Math.round(eased * 100));
      setPercent(pct);
      if (elapsed < DURATION_MS) {
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);

    const doneTimer = setTimeout(onDone, DURATION_MS + 500);

    return () => {
      clearTimeout(logoTimer);
      clearTimeout(nameTimer);
      clearTimeout(doneTimer);
      cancelAnimationFrame(frame);
    };
  }, [onDone, reduceMotion]);

  const ready = percent >= 100;

  return (
    <div className="fixed inset-0 z-50 bg-base-0 flex flex-col items-center justify-center px-4">
      <img
        src="/android-chrome-192x192.png"
        alt=""
        aria-hidden="true"
        className={`w-20 h-20 sm:w-24 sm:h-24 transition-all duration-700 ease-out ${
          logoIn ? "opacity-100 scale-100" : "opacity-0 scale-75"
        }`}
      />

      <div
        className={`font-mono text-center mt-5 transition-all duration-700 ease-out ${
          nameIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <div className="text-xl sm:text-2xl tracking-[0.15em]">
          SCAN<span className="text-accent">FORGE</span>
        </div>
        <div className="text-[0.65rem] text-ink-faint mt-2 tracking-[0.15em]">
          {ready ? "SYSTEM READY" : "CORE INITIALIZING..."}
        </div>
      </div>

      <div
        className={`w-40 sm:w-48 mt-6 transition-opacity duration-500 ${
          nameIn ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="h-px bg-line relative overflow-hidden">
          <div
            className="h-full bg-accent transition-[width] duration-150 ease-linear"
            style={{ width: `${percent}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 font-mono text-[0.6rem] text-ink-faint tracking-wide">
          <span>LOADING</span>
          <span>{percent}%</span>
        </div>
      </div>
    </div>
  );
}
