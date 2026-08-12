import { useEffect, useState } from "react";
import { ScanForgeCore } from "@/three/ScanForgeCore";

const SESSION_KEY = "scanforge_splash_shown";

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
  const [phase, setPhase] = useState<"init" | "ready">("init");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("ready"), 900);
    const t2 = setTimeout(() => onDone(), 1700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 bg-base-0 flex flex-col items-center justify-center">
      <div className="w-40 h-40 sm:w-56 sm:h-56">
        <ScanForgeCore state={phase === "init" ? "scanning" : "complete"} className="w-full h-full" />
      </div>
      <div className="font-mono text-center mt-4">
        <div className="text-lg tracking-[0.15em]">
          SCAN<span className="text-accent">FORGE</span>
        </div>
        <div className="text-xs text-ink-faint mt-2 tracking-[0.1em]">
          {phase === "init" ? "CORE INITIALIZING..." : "SYSTEM READY"}
        </div>
      </div>
    </div>
  );
}
