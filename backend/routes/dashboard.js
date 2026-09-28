const express = require("express");

const router = express.Router();

/*
  GET /api/admin/dashboard/stats
*/

router.get("/stats", async (req, res) => {
  try {
    // Check admin authentication
    const authHeader =
      req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const token =
      authHeader.substring(7).trim();

    const adminSessions =
      req.adminSessions;

    if (!adminSessions) {
      return res.status(500).json({
        success: false,
        message:
          "Admin session system unavailable.",
      });
    }

    const session =
      adminSessions.get(token);

    if (!session) {
      return res.status(401).json({
        success: false,
        message:
          "Session expired or invalid.",
      });
    }

    const supabase =
      req.supabase;

    if (!supabase) {
      return res.status(500).json({
        success: false,
        message:
          "Supabase connection unavailable.",
      });
    }

    /* =========================================
       REGISTRATIONS
    ========================================= */

    const {
      data: registrations,
      error: registrationsError,
    } = await supabase
      .from(
        "rangavallika_registrations"
      )
      .select(
        "registration_id, package_amount, payment_status, created_at"
      );

    if (registrationsError) {
      console.error(
        "DASHBOARD REGISTRATION ERROR:",
        registrationsError
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load registrations.",
      });
    }

    const rows =
      registrations || [];

    /* =========================================
       TOTAL
    ========================================= */

    const totalRegistrations =
      rows.length;

    /* =========================================
       PAID
    ========================================= */

    const paidRegistrations =
      rows.filter(
        (row) =>
          String(
            row.payment_status || ""
          ).toUpperCase() ===
          "SUCCESS"
      ).length;

    /* =========================================
       PENDING
    ========================================= */

    const pendingPayments =
      rows.filter((row) => {
        const status =
          String(
            row.payment_status || ""
          ).toUpperCase();

        return (
          status === "INITIATED" ||
          status === "PENDING_REVIEW"
        );
      }).length;

    /* =========================================
       REVENUE
    ========================================= */

    const revenue =
      rows
        .filter(
          (row) =>
            String(
              row.payment_status || ""
            ).toUpperCase() ===
            "SUCCESS"
        )
        .reduce(
          (total, row) => {
            const amount =
              Number(
                row.package_amount || 0
              );

            return (
              total +
              (
                Number.isFinite(amount)
                  ? amount
                  : 0
              )
            );
          },
          0
        );

    /* =========================================
       LAST 7 DAYS
    ========================================= */

    const today =
      new Date();

    const last7Days = [];

    for (
      let i = 6;
      i >= 0;
      i--
    ) {
      const date =
        new Date(today);

      date.setHours(
        0,
        0,
        0,
        0
      );

      date.setDate(
        today.getDate() - i
      );

      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          date.getDate()
        ).padStart(2, "0");

      last7Days.push({
        date:
          `${year}-${month}-${day}`,

        label:
          `${month}-${day}`,

        count: 0,
      });
    }

    rows.forEach((row) => {
      if (!row.created_at) {
        return;
      }

      const date =
        new Date(
          row.created_at
        );

      if (
        Number.isNaN(
          date.getTime()
        )
      ) {
        return;
      }

      const year =
        date.getFullYear();

      const month =
        String(
          date.getMonth() + 1
        ).padStart(2, "0");

      const day =
        String(
          date.getDate()
        ).padStart(2, "0");

      const dateKey =
        `${year}-${month}-${day}`;

      const item =
        last7Days.find(
          (x) =>
            x.date ===
            dateKey
        );

      if (item) {
        item.count += 1;
      }
    });

    /* =========================================
       QUERIES
    ========================================= */

    const {
      count: unreadQueries,
      error: queryError,
    } = await supabase
      .from("queries")
      .select(
        "id",
        {
          count: "exact",
          head: true,
        }
      )
      .eq(
        "status",
        "unread"
      );

    if (queryError) {
      console.error(
        "DASHBOARD QUERY ERROR:",
        queryError
      );
    }

    /* =========================================
       RESPONSE
    ========================================= */

    return res.status(200).json({
      success: true,

      stats: {
        revenue,
        totalRegistrations,
        paidRegistrations,
        pendingPayments,
        newQueries:
          unreadQueries || 0,
        last7Days,
      },
    });

  } catch (error) {
    console.error(
      "DASHBOARD STATS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load dashboard statistics.",
    });
  }
});

module.exports = router;