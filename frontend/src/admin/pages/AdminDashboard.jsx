import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const rawApiUrl = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).trim().replace(/\/$/, "");
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

const AdminDashboard = () => {
  const navigate = useNavigate();

  // =====================================================
  // LIVE DASHBOARD DATA
  // =====================================================

  const [stats, setStats] = useState({
    revenue: 0,
    totalRegistrations: 0,
    paidRegistrations: 0,
    pendingPayments: 0,
    newQueries: 0,
    last7Days: [],
  });

  const [loading, setLoading] = useState(true);

  // =====================================================
  // LOAD LIVE DASHBOARD STATISTICS
  // =====================================================

  useEffect(() => {
    let interval;

    const loadDashboardStats = async () => {
      try {
        const token =
          localStorage.getItem("adminToken");

        if (!token) {
          navigate("/admin", {
            replace: true,
          });
          return;
        }

        const response = await fetch(
          `${API_URL}/admin/dashboard/stats`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          }
        );

        // Prevent "<!DOCTYPE" JSON error
        const contentType =
          response.headers.get("content-type") || "";

        if (!contentType.includes("application/json")) {
          const text = await response.text();

          console.error(
            "Dashboard API returned non-JSON:",
            text.substring(0, 300)
          );

          throw new Error(
            "Dashboard API returned an invalid response."
          );
        }

        const data = await response.json();

        // Session expired
        if (response.status === 401) {
          localStorage.removeItem("adminToken");
          localStorage.removeItem("adminEmail");

          navigate("/admin", {
            replace: true,
          });

          return;
        }

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Failed to load dashboard statistics."
          );
        }

        console.log(
          "LIVE DASHBOARD DATA:",
          data
        );

        // =================================================
        // UPDATE LIVE DATA
        // =================================================

        setStats({
          revenue:
            Number(data.stats?.revenue || 0),

          totalRegistrations:
            Number(
              data.stats?.totalRegistrations || 0
            ),

          paidRegistrations:
            Number(
              data.stats?.paidRegistrations || 0
            ),

          pendingPayments:
            Number(
              data.stats?.pendingPayments || 0
            ),

          newQueries:
            Number(
              data.stats?.newQueries || 0
            ),

          last7Days:
            Array.isArray(
              data.stats?.last7Days
            )
              ? data.stats.last7Days
              : [],
        });

      } catch (error) {
        console.error(
          "DASHBOARD STATS ERROR:",
          error
        );

        // Don't display the ugly API error
        // inside the dashboard.
      } finally {
        setLoading(false);
      }
    };

    // Load immediately
    loadDashboardStats();

    // Refresh every 10 seconds
    interval = setInterval(
      loadDashboardStats,
      10000
    );

    return () => {
      clearInterval(interval);
    };
  }, [navigate]);

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {
    try {
      const token =
        localStorage.getItem("adminToken");

      if (token) {
        await fetch(
          `${API_URL}/admin/logout`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }
    } catch (error) {
      console.error(
        "LOGOUT ERROR:",
        error
      );
    }

    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");

    navigate("/admin", {
      replace: true,
    });
  };

  // =====================================================
  // FORMAT REVENUE
  // =====================================================

  const formattedRevenue =
    Number(stats.revenue || 0).toLocaleString(
      "en-IN"
    );

  // =====================================================
  // GRAPH DATA
  // =====================================================

  const chartData =
    stats.last7Days || [];

  const maxCount = Math.max(
    ...chartData.map(
      (item) =>
        Number(item.count || 0)
    ),
    1
  );

  // =====================================================
  // ADMIN EMAIL
  // =====================================================

  const adminEmail =
    localStorage.getItem(
      "adminEmail"
    ) ||
    "givelaurelsfoundationofindia@gmail.com";

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f5f8ff 0%, #eef4ff 50%, #f8f9ff 100%)",
        fontFamily:
          "Inter, Arial, sans-serif",
        color: "#12245a",
        display: "flex",
      }}
    >

      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        style={{
          width: "270px",
          minHeight: "100vh",
          background:
            "linear-gradient(180deg, #17439f 0%, #123b88 50%, #102f70 100%)",
          color: "#ffffff",
          padding: "28px 16px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          position: "sticky",
          top: 0,
        }}
      >

        {/* BRAND */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding:
              "0 10px 30px",
          }}
        >
          <div
            style={{
              width: "58px",
              height: "58px",
              borderRadius: "16px",
              background:
                "linear-gradient(135deg, #507cff, #7655ef)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
              fontWeight: "800",
              boxShadow:
                "0 10px 25px rgba(0,0,0,.18)",
            }}
          >
            GL
          </div>

          <div>
            <div
              style={{
                fontSize: "19px",
                fontWeight: "800",
              }}
            >
              Give Laurels
            </div>

            <div
              style={{
                fontSize: "13px",
                opacity: 0.82,
              }}
            >
              Foundation of India
            </div>
          </div>
        </div>

        {/* ADMINISTRATION */}

        <div
          style={{
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "1.5px",
            opacity: 0.65,
            padding:
              "0 14px 12px",
          }}
        >
          Administration
        </div>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <button
          onClick={() =>
            navigate(
              "/admin/dashboard"
            )
          }
          style={{
            border: "none",
            width: "100%",
            padding:
              "15px 17px",
            borderRadius: "14px",
            background:
              "rgba(255,255,255,.18)",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            fontSize: "16px",
            fontWeight: "700",
            cursor: "pointer",
            textAlign: "left",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
            }}
          >
            ◼
          </span>

          Overview
        </button>

        {/* =================================================
            REGISTRATIONS
        ================================================= */}

        <button
          onClick={() =>
            navigate(
              "/admin/registrations"
            )
          }
          style={{
            border: "none",
            width: "100%",
            padding:
              "15px 17px",
            borderRadius: "14px",
            background:
              "transparent",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            fontSize: "16px",
            cursor: "pointer",
            textAlign: "left",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
            }}
          >
            ♙
          </span>

          Registrations
        </button>

        {/* =================================================
            PAYMENTS
        ================================================= */}

        <button
          onClick={() =>
            navigate(
              "/admin/payments"
            )
          }
          style={{
            border: "none",
            width: "100%",
            padding:
              "15px 17px",
            borderRadius: "14px",
            background:
              "transparent",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            fontSize: "16px",
            cursor: "pointer",
            textAlign: "left",
            marginBottom: "8px",
          }}
        >
          <span
            style={{
              fontSize: "20px",
            }}
          >
            ₹
          </span>

          Payments
        </button>

        {/* =================================================
            QUERIES
        ================================================= */}

        <button
          onClick={() =>
            navigate(
              "/admin/queries"
            )
          }
          style={{
            border: "none",
            width: "100%",
            padding:
              "15px 17px",
            borderRadius: "14px",
            background:
              "transparent",
            color: "#ffffff",
            display: "flex",
            alignItems: "center",
            gap: "15px",
            fontSize: "16px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <span
            style={{
              fontSize: "20px",
            }}
          >
            ✉
          </span>

          Queries
        </button>

        {/* =================================================
            SIDEBAR BOTTOM
        ================================================= */}

        <div
          style={{
            marginTop: "auto",
          }}
        >
          <div
            style={{
              height: "1px",
              background:
                "rgba(255,255,255,.22)",
              margin:
                "20px 8px 22px",
            }}
          />

          <div
            style={{
              display: "flex",
              gap: "12px",
              alignItems: "center",
              padding:
                "0 10px 18px",
            }}
          >
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background:
                  "rgba(255,255,255,.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "20px",
              }}
            >
              👤
            </div>

            <div
              style={{
                minWidth: 0,
              }}
            >
              <strong
                style={{
                  display: "block",
                  fontSize: "14px",
                }}
              >
                Administrator
              </strong>

              <span
                style={{
                  display: "block",
                  fontSize: "10px",
                  opacity: 0.8,
                  overflow: "hidden",
                  textOverflow:
                    "ellipsis",
                  whiteSpace:
                    "nowrap",
                  maxWidth:
                    "185px",
                }}
              >
                {adminEmail}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              width: "100%",
              padding: "13px",
              borderRadius: "12px",
              border:
                "1px solid rgba(255,255,255,.35)",
              background:
                "rgba(255,255,255,.06)",
              color: "#ffffff",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            ⇥ &nbsp; Logout
          </button>
        </div>
      </aside>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <main
        style={{
          flex: 1,
          minWidth: 0,
          padding:
            "32px 40px 50px",
          overflow: "auto",
        }}
      >

        {/* =================================================
            HEADER
        ================================================= */}

        <header
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            marginBottom: "38px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "38px",
                lineHeight: 1.15,
                color: "#10245a",
              }}
            >
              Admin Dashboard
            </h1>

            <p
              style={{
                margin:
                  "8px 0 0",
                fontSize: "18px",
                color: "#5570a8",
              }}
            >
              Give Laurels Foundation
              of India
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "13px",
            }}
          >
            <div
              style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg,#506bff,#5c43e8)",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "800",
                fontSize: "16px",
              }}
            >
              AD
            </div>

            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "17px",
                  color: "#14275c",
                }}
              >
                Administrator
              </strong>

              <span
                style={{
                  color: "#6076a7",
                  fontSize: "13px",
                }}
              >
                {adminEmail}
              </span>
            </div>
          </div>
        </header>

        {/* =================================================
            WELCOME
        ================================================= */}

        <section
          style={{
            marginBottom: "26px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "29px",
              color: "#10245a",
            }}
          >
            Welcome Back, Admin 👋
          </h2>

          <p
            style={{
              margin:
                "8px 0 0",
              color: "#6479a7",
              fontSize: "16px",
            }}
          >
            Here's an overview of
            your competition
            administration.
          </p>
        </section>

        {/* =================================================
            OVERVIEW
        ================================================= */}

        <section>
          <h3
            style={{
              margin:
                "0 0 18px",
              fontSize: "23px",
              color: "#10245a",
            }}
          >
            Overview
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(5, minmax(0, 1fr))",
              gap: "18px",
            }}
          >

            {/* REVENUE */}

            <StatCard
              icon="₹"
              title="Revenue"
              value={
                loading
                  ? "..."
                  : `₹${formattedRevenue}`
              }
              subtitle="All successful payments"
              iconBackground=
                "linear-gradient(135deg,#5965f5,#5140e7)"
              valueColor="#2638cf"
              background="#f6f7ff"
            />

            {/* TOTAL REGISTRATIONS */}

            <StatCard
              icon="♙"
              title="Total Registrations"
              value={
                loading
                  ? "..."
                  : stats.totalRegistrations.toLocaleString(
                      "en-IN"
                    )
              }
              subtitle="All registered participants"
              iconBackground=
                "linear-gradient(135deg,#67c7ff,#4297ed)"
              valueColor="#1551a9"
              background="#f4faff"
            />

            {/* PAID REGISTRATIONS */}

            <StatCard
              icon="✓"
              title="Paid Registrations"
              value={
                loading
                  ? "..."
                  : stats.paidRegistrations.toLocaleString(
                      "en-IN"
                    )
              }
              subtitle="Successfully paid"
              iconBackground=
                "linear-gradient(135deg,#64dfaa,#26b978)"
              valueColor="#11935c"
              background="#f3fff9"
            />

            {/* PENDING PAYMENTS */}

            <StatCard
              icon="⌛"
              title="Pending Payments"
              value={
                loading
                  ? "..."
                  : stats.pendingPayments.toLocaleString(
                      "en-IN"
                    )
              }
              subtitle="Awaiting verification"
              iconBackground=
                "linear-gradient(135deg,#ffc75e,#ff9f1c)"
              valueColor="#ed5a17"
              background="#fffaf0"
            />

            {/* NEW QUERIES */}

            <StatCard
              icon="✉"
              title="New Queries"
              value={
                loading
                  ? "..."
                  : stats.newQueries.toLocaleString(
                      "en-IN"
                    )
              }
              subtitle="Unread contact queries"
              iconBackground=
                "linear-gradient(135deg,#8d5cf6,#6838dd)"
              valueColor="#6332ce"
              background="#faf7ff"
            />

          </div>
        </section>

        {/* =================================================
            LAST 7 DAYS GRAPH
        ================================================= */}

        <section
          style={{
            marginTop: "25px",
            background: "#ffffff",
            borderRadius: "22px",
            padding:
              "28px 30px 25px",
            boxShadow:
              "0 8px 30px rgba(36,67,130,.08)",
            border:
              "1px solid #e8edf7",
          }}
        >
          <h3
            style={{
              margin:
                "0 0 25px",
              fontSize: "20px",
              color: "#10245a",
            }}
          >
            Last 7 days — registrations
          </h3>

          <div
            style={{
              height: "300px",
              display: "flex",
              alignItems: "flex-end",
              justifyContent:
                "space-around",
              gap: "18px",
              padding:
                "15px 12px 0",
              borderBottom:
                "1px solid #e3e8f2",
            }}
          >

            {chartData.length === 0 ? (

              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent:
                    "center",
                  color: "#8192b6",
                  fontSize: "14px",
                }}
              >
                {loading
                  ? "Loading registration data..."
                  : "No registration data available"}
              </div>

            ) : (

              chartData.map(
                (item) => {

                  const count =
                    Number(
                      item.count || 0
                    );

                  const barHeight =
                    count === 0
                      ? 5
                      : Math.max(
                          10,
                          Math.round(
                            (count /
                              maxCount) *
                              220
                          )
                        );

                  return (
                    <div
                      key={item.date}
                      style={{
                        flex: 1,
                        height: "100%",
                        display: "flex",
                        flexDirection:
                          "column",
                        justifyContent:
                          "flex-end",
                        alignItems:
                          "center",
                        minWidth:
                          "45px",
                      }}
                    >

                      {/* VALUE */}

                      <div
                        style={{
                          fontSize:
                            "14px",
                          fontWeight:
                            "700",
                          color:
                            "#14275c",
                          marginBottom:
                            "8px",
                        }}
                      >
                        {count}
                      </div>

                      {/* BAR */}

                      <div
                        style={{
                          width:
                            "52px",
                          maxWidth:
                            "75%",
                          height:
                            `${barHeight}px`,
                          minHeight:
                            "5px",
                          borderRadius:
                            "9px 9px 5px 5px",
                          background:
                            "linear-gradient(180deg,#4b7cf0,#2850bd)",
                          boxShadow:
                            "0 5px 12px rgba(50,94,205,.20)",
                          transition:
                            "height .4s ease",
                        }}
                      />

                      {/* DATE */}

                      <div
                        style={{
                          marginTop:
                            "12px",
                          fontSize:
                            "13px",
                          color:
                            "#7890bd",
                          whiteSpace:
                            "nowrap",
                        }}
                      >
                        {item.label}
                      </div>

                    </div>
                  );
                }
              )

            )}

          </div>
        </section>

        {/* LIVE STATUS */}

        <div
          style={{
            textAlign: "right",
            marginTop: "12px",
            color: "#8192b6",
            fontSize: "12px",
          }}
        >
          ● Live data · updates automatically
        </div>

      </main>
    </div>
  );
};


// =========================================================
// STAT CARD
// =========================================================

const StatCard = ({
  icon,
  title,
  value,
  subtitle,
  iconBackground,
  valueColor,
  background,
}) => {
  return (
    <div
      style={{
        background,
        borderRadius: "18px",
        padding:
          "22px 20px",
        minHeight: "170px",
        boxSizing: "border-box",
        border:
          "1px solid rgba(100,125,180,.12)",
        boxShadow:
          "0 7px 24px rgba(36,67,130,.07)",
      }}
    >

      <div
        style={{
          width: "50px",
          height: "50px",
          borderRadius: "15px",
          background:
            iconBackground,
          color: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "23px",
          fontWeight: "800",
          marginBottom: "15px",
        }}
      >
        {icon}
      </div>

      <div
        style={{
          fontSize: "14px",
          fontWeight: "700",
          color: "#273b6c",
          marginBottom: "7px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "28px",
          fontWeight: "800",
          color: valueColor,
          lineHeight: "1.1",
          marginBottom: "8px",
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#7184ad",
          lineHeight: "1.4",
        }}
      >
        {subtitle}
      </div>

    </div>
  );
};

export default AdminDashboard;