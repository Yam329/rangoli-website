const express = require("express");
const crypto = require("crypto");

const router = express.Router();

/* =========================================================
   ADMIN SESSIONS
========================================================= */

const adminSessions = new Map();

/* =========================================================
   ADMIN CREDENTIALS
========================================================= */

const ADMIN_EMAIL =
  process.env.ADMIN_EMAIL ||
  "givelaurelsfoundationofindia@gmail.com";

const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD || "";

/* =========================================================
   ADMIN LOGIN
   POST /api/admin/login
========================================================= */

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (
      String(email).trim().toLowerCase() !==
      String(ADMIN_EMAIL).trim().toLowerCase()
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    if (String(password) !== String(ADMIN_PASSWORD)) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials.",
      });
    }

    const token = crypto
      .randomBytes(32)
      .toString("hex");

    adminSessions.set(token, {
      email: ADMIN_EMAIL,
      createdAt: Date.now(),
    });

    return res.status(200).json({
      success: true,
      message: "Admin login successful.",
      token,
      email: ADMIN_EMAIL,
    });

  } catch (error) {
    console.error(
      "ADMIN LOGIN ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to login.",
    });
  }
});

/* =========================================================
   REQUIRE ADMIN
========================================================= */

function requireAdmin(req, res, next) {
  try {
    const authorization =
      req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Admin authentication required.",
      });
    }

    const token = authorization
      .replace("Bearer ", "")
      .trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid admin token.",
      });
    }

    const session =
      adminSessions.get(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message:
          "Admin session expired or invalid.",
      });
    }

    req.admin = {
      email: session.email,
    };

    next();

  } catch (error) {
    console.error(
      "ADMIN AUTH ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify admin access.",
    });
  }
}

/* =========================================================
   VERIFY ADMIN
   GET /api/admin/verify
========================================================= */

router.get(
  "/verify",
  requireAdmin,
  (req, res) => {
    return res.status(200).json({
      success: true,
      authenticated: true,
      email: req.admin.email,
    });
  }
);

/* =========================================================
   LOGOUT
   POST /api/admin/logout
========================================================= */

router.post(
  "/logout",
  requireAdmin,
  (req, res) => {
    try {
      const authorization =
        req.headers.authorization || "";

      const token = authorization
        .replace("Bearer ", "")
        .trim();

      if (token) {
        adminSessions.delete(token);
      }

      return res.status(200).json({
        success: true,
        message:
          "Admin logged out successfully.",
      });

    } catch (error) {
      console.error(
        "ADMIN LOGOUT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Unable to logout.",
      });
    }
  }
);

/* =========================================================
   DASHBOARD STATS
   GET /api/admin/dashboard/stats
========================================================= */

/* =========================================================
   DASHBOARD STATS
   GET /api/admin/dashboard/stats
========================================================= */

router.get(
  "/dashboard/stats",
  requireAdmin,
  async (req, res) => {
    try {
      if (!req.supabase) {
        return res.status(500).json({
          success: false,
          message: "Supabase connection unavailable.",
        });
      }

      /* =====================================================
         REGISTRATION DATA
      ===================================================== */

      const { data: registrations, error: registrationsError } =
        await req.supabase
          .from("rangavallika_registrations")
          .select(`
            registration_id,
            payment_status,
            package_amount,
            created_at
          `);

      if (registrationsError) {
        console.error(
          "ADMIN DASHBOARD REGISTRATION ERROR:",
          registrationsError
        );

        return res.status(500).json({
          success: false,
          message: "Failed to load registration statistics.",
          details: registrationsError.message,
        });
      }

      const registrationData = registrations || [];

      /* =====================================================
         TOTAL REGISTRATIONS
      ===================================================== */

      const totalRegistrations =
        registrationData.length;

      /* =====================================================
         PAID REGISTRATIONS
      ===================================================== */

      const paidRegistrations =
        registrationData.filter((item) => {
          const status = String(
            item.payment_status || ""
          )
            .trim()
            .toUpperCase();

          return status === "SUCCESS";
        }).length;

      /* =====================================================
         PENDING PAYMENTS
      ===================================================== */

      const pendingPayments =
        registrationData.filter((item) => {
          const status = String(
            item.payment_status || ""
          )
            .trim()
            .toUpperCase();

          return [
            "PENDING",
            "PENDING_REVIEW",
            "INITIATED",
          ].includes(status);
        }).length;

      /* =====================================================
         REVENUE
         Only successful registrations are counted.
      ===================================================== */

      const revenue =
        registrationData
          .filter((item) => {
            const status = String(
              item.payment_status || ""
            )
              .trim()
              .toUpperCase();

            return status === "SUCCESS";
          })
          .reduce((total, item) => {
            return (
              total +
              Number(item.package_amount || 0)
            );
          }, 0);

      /* =====================================================
         LAST 7 DAYS REGISTRATIONS
      ===================================================== */

      /* =====================================================
   REGISTRATION GRAPH
   Fixed period: 19 Sep 2026 → 25 Sep 2026
===================================================== */

const last7Days = [];

const graphStartDate = new Date("2026-09-19T00:00:00");

for (let i = 0; i < 7; i++) {
  const date = new Date(graphStartDate);

  date.setDate(
    graphStartDate.getDate() + i
  );

  date.setHours(0, 0, 0, 0);

  const nextDate = new Date(date);

  nextDate.setDate(
    date.getDate() + 1
  );

  const count =
    registrationData.filter((item) => {
      if (!item.created_at) {
        return false;
      }

      const createdAt =
        new Date(item.created_at);

      return (
        createdAt >= date &&
        createdAt < nextDate
      );
    }).length;

  const label =
    date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
      }
    );

  const dateKey =
    date.toISOString().split("T")[0];

  last7Days.push({
    date: dateKey,
    label,
    count,
  });
}

      /* =====================================================
         NEW QUERIES
      ===================================================== */

      let newQueries = 0;

      const {
        count: unreadQueryCount,
        error: queriesError,
      } = await req.supabase
        .from("queries")
        .select(
          "id",
          {
            count: "exact",
            head: true,
          }
        )
        .eq("status", "unread");

      if (queriesError) {
        console.error(
          "ADMIN DASHBOARD QUERY COUNT ERROR:",
          queriesError
        );

        // Keep dashboard working even if query count
        // cannot be retrieved.
        newQueries = 0;
      } else {
        newQueries =
          Number(unreadQueryCount || 0);
      }

      /* =====================================================
         RESPONSE
      ===================================================== */

      return res.status(200).json({
        success: true,

        stats: {
          revenue,
          totalRegistrations,
          paidRegistrations,
          pendingPayments,
          newQueries,
          last7Days,
        },
      });

    } catch (error) {
      console.error(
        "ADMIN DASHBOARD STATS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load dashboard statistics.",
      });
    }
  }
);
/* =========================================================
   IMPORTANT
   Expose middleware to server.js
========================================================= */

router.requireAdmin = requireAdmin;

module.exports = router;