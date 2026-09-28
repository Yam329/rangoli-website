import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const rawApiUrl = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).trim().replace(/\/$/, "");
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

function ProtectedAdminRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const verifyAdmin = async () => {
      const token = localStorage.getItem("adminToken");

      if (!token) {
        setChecking(false);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/admin/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setAuthenticated(true);
        } else {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminEmail");
        }
      } catch (error) {
        console.error("ADMIN AUTH CHECK ERROR:", error);
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminEmail");
      } finally {
        setChecking(false);
      }
    };

    verifyAdmin();
  }, []);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          color: "#172033",
          background: "#f7f9fc",
        }}
      >
        Checking admin access...
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;
