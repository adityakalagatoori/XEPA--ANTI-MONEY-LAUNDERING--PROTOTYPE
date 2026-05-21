import { Navigate, Route, Routes } from "react-router-dom";
import AuditPage from "./pages/AuditPage";
import BankDashboard from "./pages/BankDashboard";
import CasePage from "./pages/CasePage";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import { AuthProvider, useAuth } from "./state/auth";

function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/" replace />;
  if (roles && !roles.includes(user?.role)) return <Navigate to="/bank" replace />;
  return children;
}

function HomeRedirect() {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role === "bank_user") return <Navigate to="/bank" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Analyst + Supervisor dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute roles={["analyst", "supervisor"]}>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Case pages */}
        <Route
          path="/cases/:caseId"
          element={
            <ProtectedRoute roles={["analyst", "supervisor"]}>
              <CasePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cases/:caseId/audit"
          element={
            <ProtectedRoute roles={["analyst", "supervisor"]}>
              <AuditPage />
            </ProtectedRoute>
          }
        />

        {/* Bank portal */}
        <Route
          path="/bank"
          element={
            <ProtectedRoute roles={["bank_user", "supervisor", "analyst"]}>
              <BankDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
