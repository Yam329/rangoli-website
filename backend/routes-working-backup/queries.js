const express = require("express");

const router = express.Router();

// =========================================================
// CREATE QUERY
// POST /api/queries
// PUBLIC ROUTE
// =========================================================

router.post("/", async (req, res) => {
  try {
    const {
      name,
      phone,
      subject,
      message,
    } = req.body;

    // -----------------------------------------------------
    // VALIDATION
    // -----------------------------------------------------

    if (!name || !phone || !subject || !message) {
      return res.status(400).json({
        success: false,
        message:
          "Name, phone, subject and message are required.",
      });
    }

    // -----------------------------------------------------
    // INSERT INTO SUPABASE
    // -----------------------------------------------------

    const { data, error } = await req.supabase
      .from("queries")
      .insert([
        {
          name: String(name).trim(),
          phone: String(phone).trim(),
          subject: String(subject).trim(),
          message: String(message).trim(),
          status: "unread",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("QUERY INSERT ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Failed to save your query.",
      });
    }

    return res.status(201).json({
      success: true,
      message:
        "Your query has been submitted successfully.",
      query: data,
    });

  } catch (error) {
    console.error("QUERY API ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while submitting your query.",
    });
  }
});

module.exports = router;