import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Header } from "./components/Header";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { AddMemberPage } from "./pages/AddMemberPage";
import { BotRunDetailPage } from "./pages/BotRunDetailPage";
import { BotRunHistoryPage } from "./pages/BotRunHistoryPage";
import { HomePage } from "./pages/HomePage";
import { LeadTrackerPage } from "./pages/LeadTrackerPage";
import { LoginPage } from "./pages/LoginPage";
import { SetPasswordPage } from "./pages/SetPasswordPage";

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="app">
      <Header />
      {children}
    </main>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/invite/:token" element={<SetPasswordPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <HomePage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/tracker"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <LeadTrackerPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BotRunHistoryPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/members/add"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <AddMemberPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/runs/:id"
            element={
              <ProtectedRoute>
                <AppLayout>
                  <BotRunDetailPage />
                </AppLayout>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
