import { Routes, Route } from "react-router-dom";

import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/layout/ErrorBoundary";
import { RequireAuth } from "@/components/layout/RequireAuth";
import { Home } from "@/pages/Home";
import { Auth } from "@/pages/Auth";
import { Gestao } from "@/pages/Gestao";
import { NotFound } from "@/pages/NotFound";

export function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/gestao"
          element={
            <RequireAuth>
              <Gestao />
            </RequireAuth>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" richColors />
    </ErrorBoundary>
  );
}
