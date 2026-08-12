import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Splash, useSplashGate } from "@/components/Splash";
import { AppShell } from "@/layouts/AppShell";

import { Landing } from "@/pages/Landing";
import { Auth } from "@/pages/Auth";
import { Dashboard } from "@/pages/Dashboard";
import { Scanner } from "@/pages/Scanner";
import { AIScannerComingSoon } from "@/pages/AIScannerComingSoon";
import { AnalysisCategory } from "@/pages/AnalysisCategory";
import { ScanHistory } from "@/pages/ScanHistory";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import { NotFound } from "@/pages/NotFound";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth" element={<Auth />} />

      <Route
        element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/scanner" element={<Scanner />} />
        <Route path="/ai-scanner" element={<AIScannerComingSoon />} />
        <Route path="/analysis/:category" element={<AnalysisCategory />} />
        <Route path="/history" element={<ScanHistory />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  const { show, dismiss } = useSplashGate();

  return (
    <AuthProvider>
      <BrowserRouter>
        {show && <Splash onDone={dismiss} />}
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
