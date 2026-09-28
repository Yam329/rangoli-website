const express = require("express");

const router = express.Router();


// =========================================================
// GET ALL QUERIES
// GET /api/admin/queries
// ADMIN ONLY
// =========================================================

router.get("/", async (req, res) => {
  try {
    const { data, error } = await req.supabase
      .from("queries")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error("ADMIN QUERY FETCH ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch queries.",
      });
    }

    return res.status(200).json({
      success: true,
      queries: data || [],
    });

  } catch (error) {
    console.error("ADMIN QUERY GET ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching queries.",
    });
  }
});


// =========================================================
// GET SINGLE QUERY
// GET /api/admin/queries/:id
// ADMIN ONLY
// =========================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from("queries")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        success: false,
        message: "Query not found.",
      });
    }

    return res.status(200).json({
      success: true,
      query: data,
    });

  } catch (error) {
    console.error(
      "ADMIN QUERY FETCH ONE ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the query.",
    });
  }
});


// =========================================================
// UPDATE QUERY STATUS
// PATCH /api/admin/queries/:id/status
// ADMIN ONLY
// =========================================================

router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "unread",
      "read",
      "resolved",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid query status.",
      });
    }

    const { data, error } = await req.supabase
      .from("queries")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error(
        "ADMIN QUERY STATUS UPDATE ERROR:",
        error
      );

      return res.status(404).json({
        success: false,
        message: "Query not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Query status updated successfully.",
      query: data,
    });

  } catch (error) {
    console.error(
      "ADMIN QUERY STATUS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while updating the query.",
    });
  }
});


// =========================================================
// DELETE QUERY
// DELETE /api/admin/queries/:id
// ADMIN ONLY
// =========================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await req.supabase
      .from("queries")
      .delete()
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      console.error(
        "ADMIN QUERY DELETE ERROR:",
        error
      );

      return res.status(404).json({
        success: false,
        message: "Query not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Query deleted successfully.",
      query: data,
    });

  } catch (error) {
    console.error(
      "ADMIN QUERY DELETE API ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting the query.",
    });
  }
});


module.exports = router;