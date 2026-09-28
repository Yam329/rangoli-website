import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminRegistrations from "./admin/pages/AdminRegistrations";
import AdminPayments from "./admin/pages/AdminPayments";
import AdminQueries from "./admin/pages/AdminQueries";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Admin Login */}
        <Route path="/admin" element={<AdminLogin />} />

        {/* Protected Admin Area */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/registrations"
          element={
            <ProtectedAdminRoute>
              <AdminRegistrations />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/payments"
          element={
            <ProtectedAdminRoute>
              <AdminPayments />
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/queries"
          element={
            <ProtectedAdminRoute>
              <AdminQueries />
            </ProtectedAdminRoute>
          }
        />

        {/* Default */}
        <Route
          path="*"
          element={<Navigate to="/admin" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;