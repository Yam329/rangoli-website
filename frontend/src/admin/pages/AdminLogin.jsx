import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const rawApiUrl = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).trim().replace(/\/$/, "");
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_URL}/admin/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.message || "Invalid email or password.");
        return;
      }

      localStorage.setItem("adminToken", data.token);
      localStorage.setItem(
        "adminEmail",
        data.admin?.email || email.trim()
      );

      navigate("/admin/dashboard", { replace: true });
    } catch (err) {
      console.error("ADMIN LOGIN ERROR:", err);

      setError(
        "Unable to connect to the server. Please make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-login-page {
          min-height: 100vh;
          width: 100%;
          margin: 0;
          padding: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          font-family: Inter, "Segoe UI", Arial, sans-serif;

          background:
            radial-gradient(
              circle at 10% 15%,
              rgba(37, 99, 235, 0.18),
              transparent 30%
            ),
            radial-gradient(
              circle at 90% 85%,
              rgba(124, 58, 237, 0.16),
              transparent 32%
            ),
            linear-gradient(
              135deg,
              #f8fbff 0%,
              #edf4ff 50%,
              #f8f5ff 100%
            );
        }

        .admin-bg-circle-one {
          position: absolute;
          width: 420px;
          height: 420px;
          border-radius: 50%;
          background: rgba(37, 99, 235, 0.07);
          top: -220px;
          left: -150px;
        }

        .admin-bg-circle-two {
          position: absolute;
          width: 500px;
          height: 500px;
          border-radius: 50%;
          background: rgba(124, 58, 237, 0.07);
          bottom: -280px;
          right: -180px;
        }

        .admin-login-wrapper {
          width: 100%;
          max-width: 460px;
          position: relative;
          z-index: 2;
        }

        .admin-login-card {
          width: 100%;
          padding: 44px;
          border-radius: 28px;

          background: rgba(255, 255, 255, 0.96);

          border: 1px solid rgba(255, 255, 255, 0.9);

          box-shadow:
            0 30px 80px rgba(30, 64, 175, 0.14),
            0 10px 30px rgba(15, 23, 42, 0.07);

          backdrop-filter: blur(20px);

          animation: adminAppear 0.5s ease;
        }

        @keyframes adminAppear {
          from {
            opacity: 0;
            transform: translateY(20px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .admin-brand {
          text-align: center;
          margin-bottom: 35px;
        }

        .admin-logo {
          width: 76px;
          height: 76px;
          margin: 0 auto 18px;

          display: flex;
          align-items: center;
          justify-content: center;

          border-radius: 22px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );

          color: white;

          font-size: 27px;
          font-weight: 800;

          box-shadow:
            0 14px 30px rgba(37, 99, 235, 0.28);
        }

        .admin-brand h1 {
          margin: 0;

          color: #172033;

          font-size: 31px;
          font-weight: 750;

          letter-spacing: -0.8px;
        }

        .admin-brand p {
          margin: 9px 0 0;

          color: #718096;

          font-size: 14px;
          line-height: 1.5;
        }

        .admin-secure-badge {
          display: inline-flex;
          align-items: center;
          gap: 7px;

          margin-top: 15px;
          padding: 7px 12px;

          border-radius: 50px;

          background: #eff6ff;
          color: #2563eb;

          font-size: 12px;
          font-weight: 600;
        }

        .admin-form-group {
          margin-bottom: 21px;
        }

        .admin-form-group label {
          display: block;

          margin-bottom: 8px;

          color: #253247;

          font-size: 14px;
          font-weight: 650;
        }

        .admin-input-wrapper {
          position: relative;
        }

        .admin-input-icon {
          position: absolute;
          left: 15px;
          top: 50%;

          transform: translateY(-50%);

          color: #94a3b8;

          font-size: 17px;

          pointer-events: none;
        }

        .admin-input {
          width: 100%;
          height: 52px;

          padding: 0 15px 0 45px;

          border: 1px solid #d9e2ef;
          border-radius: 13px;

          background: #ffffff;

          color: #172033;

          font-size: 14px;

          outline: none;

          transition: all 0.2s ease;
        }

        .admin-input::placeholder {
          color: #a0aec0;
        }

        .admin-input:hover {
          border-color: #b9c6d8;
        }

        .admin-input:focus {
          border-color: #2563eb;

          box-shadow:
            0 0 0 4px rgba(37, 99, 235, 0.10);
        }

        .admin-login-error {
          margin-bottom: 18px;

          padding: 12px 14px;

          border-radius: 11px;

          background: #fff1f2;

          border: 1px solid #fecdd3;

          color: #be123c;

          font-size: 13px;

          line-height: 1.45;
        }

        .admin-login-button {
          width: 100%;
          height: 53px;

          margin-top: 4px;

          border: none;
          border-radius: 13px;

          background:
            linear-gradient(
              135deg,
              #2563eb,
              #4f46e5
            );

          color: white;

          font-size: 15px;
          font-weight: 700;

          cursor: pointer;

          box-shadow:
            0 12px 25px rgba(37, 99, 235, 0.22);

          transition: all 0.2s ease;
        }

        .admin-login-button:hover:not(:disabled) {
          transform: translateY(-2px);

          box-shadow:
            0 16px 32px rgba(37, 99, 235, 0.30);
        }

        .admin-login-button:active:not(:disabled) {
          transform: translateY(0);
        }

        .admin-login-button:disabled {
          opacity: 0.65;
          cursor: not-allowed;
        }

        .admin-footer {
          text-align: center;

          margin-top: 25px;

          color: #94a3b8;

          font-size: 12px;
        }

        @media (max-width: 600px) {
          .admin-login-page {
            padding: 20px;
          }

          .admin-login-card {
            padding: 32px 24px;
            border-radius: 23px;
          }

          .admin-brand h1 {
            font-size: 27px;
          }

          .admin-logo {
            width: 66px;
            height: 66px;
            border-radius: 19px;
          }
        }
      `}</style>

      <div className="admin-login-page">

        <div className="admin-bg-circle-one"></div>
        <div className="admin-bg-circle-two"></div>

        <div className="admin-login-wrapper">

          <div className="admin-login-card">

            <div className="admin-brand">

              <div className="admin-logo">
                GL
              </div>

              <h1>Admin Login</h1>

              <p>
                Give Laurels Foundation of India
              </p>

              <div className="admin-secure-badge">
                🔒 Secure Administrator Access
              </div>

            </div>

            <form onSubmit={handleLogin}>

              <div className="admin-form-group">

                <label>
                  Email Address
                </label>

                <div className="admin-input-wrapper">

                  <span className="admin-input-icon">
                    ✉
                  </span>

                  <input
                    className="admin-input"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Enter admin email"
                    autoComplete="username"
                  />

                </div>

              </div>

              <div className="admin-form-group">

                <label>
                  Password
                </label>

                <div className="admin-input-wrapper">

                  <span className="admin-input-icon">
                    🔒
                  </span>

                  <input
                    className="admin-input"
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Enter password"
                    autoComplete="current-password"
                  />

                </div>

              </div>

              {error && (
                <div className="admin-login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="admin-login-button"
                disabled={loading}
              >
                {loading
                  ? "Signing in..."
                  : "Sign In to Admin Panel"}
              </button>

            </form>

            <div className="admin-footer">
              Authorized personnel only
            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default AdminLogin;