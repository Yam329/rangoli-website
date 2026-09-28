const express = require("express");

const router = express.Router();

/* =========================================================
   GET ALL REGISTRATIONS
   GET /api/admin/registrations
========================================================= */

router.get("/", async (req, res) => {
  try {
    if (!req.supabase) {
      return res.status(500).json({
        success: false,
        message: "Supabase connection unavailable.",
      });
    }

    const { data, error } = await req.supabase
      .from("rangavallika_registrations")
      .select(`
        registration_id,
        recovery_pin,
        full_name,
        mobile,
        dob,
        address,
        district,
        state,
        pincode,
        participant_photo,
        package_name,
        package_amount,
        payment_status,
        payment_screenshot,
        utr_number,
        payment_amount_detected,
        payment_date_detected,
        ocr_status,
        utr_verified,
        duplicate_utr,
        created_at,
        updated_at
      `)
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(
        "ADMIN REGISTRATIONS LIST ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to load registrations.",
        details: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      registrations: data || [],
    });
  } catch (error) {
    console.error(
      "ADMIN REGISTRATIONS LIST ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to load registrations.",
    });
  }
});


/* =========================================================
   GET SINGLE REGISTRATION
   GET /api/admin/registrations/:registrationId
========================================================= */

router.get(
  "/:registrationId",
  async (req, res) => {
    try {
      if (!req.supabase) {
        return res.status(500).json({
          success: false,
          message: "Supabase connection unavailable.",
        });
      }

      const { registrationId } = req.params;

      const { data, error } = await req.supabase
        .from("rangavallika_registrations")
        .select(`
          registration_id,
          recovery_pin,
          full_name,
          mobile,
          dob,
          address,
          district,
          state,
          pincode,
          participant_photo,
          package_name,
          package_amount,
          payment_status,
          payment_screenshot,
          utr_number,
          payment_amount_detected,
          payment_date_detected,
          ocr_status,
          utr_verified,
          duplicate_utr,
          created_at,
          updated_at
        `)
        .eq(
          "registration_id",
          registrationId
        )
        .single();

      if (error || !data) {
        console.error(
          "ADMIN REGISTRATION DETAILS ERROR:",
          error
        );

        return res.status(404).json({
          success: false,
          message: "Registration details not found.",
        });
      }

      /* =====================================================
         PARTICIPANT PHOTO SIGNED URL
      ===================================================== */

      let participantPhotoUrl = null;

      if (data.participant_photo) {
        const { data: photoUrlData } =
          await req.supabase.storage
            .from("participant-photos")
            .createSignedUrl(
              data.participant_photo,
              3600
            );

        if (!photoUrlData?.signedUrl) {
          console.warn(
            "Unable to create participant photo URL."
          );
        }

        participantPhotoUrl =
          photoUrlData?.signedUrl || null;
      }

      /* =====================================================
         PAYMENT SCREENSHOT SIGNED URL
      ===================================================== */

      let paymentScreenshotUrl = null;

      if (data.payment_screenshot) {
        const { data: screenshotUrlData } =
          await req.supabase.storage
            .from("payment-screenshots")
            .createSignedUrl(
              data.payment_screenshot,
              3600
            );

        if (!screenshotUrlData?.signedUrl) {
          console.warn(
            "Unable to create payment screenshot URL."
          );
        }

        paymentScreenshotUrl =
          screenshotUrlData?.signedUrl || null;
      }

      return res.status(200).json({
        success: true,
        registration: {
          ...data,
          participant_photo_url:
            participantPhotoUrl,
          payment_screenshot_url:
            paymentScreenshotUrl,
        },
      });
    } catch (error) {
      console.error(
        "ADMIN REGISTRATION DETAILS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to load registration details.",
      });
    }
  }
);


/* =========================================================
   UPDATE REGISTRATION
   PUT /api/admin/registrations/:registrationId
========================================================= */

router.put(
  "/:registrationId",
  async (req, res) => {
    try {
      if (!req.supabase) {
        return res.status(500).json({
          success: false,
          message: "Supabase connection unavailable.",
        });
      }

      const { registrationId } = req.params;

      const {
        full_name,
        mobile,
        dob,
        address,
        district,
        state,
        pincode,
        package_name,
        package_amount,
        utr_number,
        payment_status,
        payment_amount_detected,
        payment_date_detected,
        ocr_status,
        utr_verified,
        duplicate_utr,
      } = req.body;

      const updateData = {
        updated_at:
          new Date().toISOString(),
      };

      if (full_name !== undefined) {
        updateData.full_name =
          String(full_name).trim();
      }

      if (mobile !== undefined) {
        updateData.mobile =
          String(mobile).trim();
      }

      if (dob !== undefined) {
        updateData.dob = dob;
      }

      if (address !== undefined) {
        updateData.address =
          String(address).trim();
      }

      if (district !== undefined) {
        updateData.district =
          String(district).trim();
      }

      if (state !== undefined) {
        updateData.state =
          String(state).trim();
      }

      if (pincode !== undefined) {
        updateData.pincode =
          String(pincode).trim();
      }

      if (package_name !== undefined) {
        updateData.package_name =
          package_name;
      }

      if (package_amount !== undefined) {
        updateData.package_amount =
          package_amount;
      }

      if (utr_number !== undefined) {
        updateData.utr_number =
          utr_number
            ? String(utr_number).trim()
            : null;
      }

      if (payment_status !== undefined) {
        updateData.payment_status =
          payment_status;
      }

      if (
        payment_amount_detected !==
        undefined
      ) {
        updateData.payment_amount_detected =
          payment_amount_detected;
      }

      if (
        payment_date_detected !==
        undefined
      ) {
        updateData.payment_date_detected =
          payment_date_detected;
      }

      if (ocr_status !== undefined) {
        updateData.ocr_status =
          ocr_status;
      }

      if (utr_verified !== undefined) {
        updateData.utr_verified =
          utr_verified;
      }

      if (duplicate_utr !== undefined) {
        updateData.duplicate_utr =
          duplicate_utr;
      }

      const { data, error } =
        await req.supabase
          .from(
            "rangavallika_registrations"
          )
          .update(updateData)
          .eq(
            "registration_id",
            registrationId
          )
          .select()
          .single();

      if (error) {
        console.error(
          "ADMIN REGISTRATION UPDATE ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to update registration.",
          details: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Registration updated successfully.",
        registration: data,
      });
    } catch (error) {
      console.error(
        "ADMIN REGISTRATION UPDATE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to update registration.",
      });
    }
  }
);


/* =========================================================
   MARK AS PAID
   PATCH /api/admin/registrations/:registrationId/mark-paid
========================================================= */

router.patch(
  "/:registrationId/mark-paid",
  async (req, res) => {
    try {
      if (!req.supabase) {
        return res.status(500).json({
          success: false,
          message: "Supabase connection unavailable.",
        });
      }

      const { registrationId } = req.params;

      const { data, error } =
        await req.supabase
          .from(
            "rangavallika_registrations"
          )
          .update({
            payment_status: "SUCCESS",
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            "registration_id",
            registrationId
          )
          .select()
          .single();

      if (error) {
        console.error(
          "ADMIN MARK PAID ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to mark registration as paid.",
          details: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Registration marked as paid successfully.",
        registration: data,
      });
    } catch (error) {
      console.error(
        "ADMIN MARK PAID ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to mark registration as paid.",
      });
    }
  }
);


/* =========================================================
   DELETE REGISTRATION
   DELETE /api/admin/registrations/:registrationId
========================================================= */

router.delete(
  "/:registrationId",
  async (req, res) => {
    try {
      if (!req.supabase) {
        return res.status(500).json({
          success: false,
          message: "Supabase connection unavailable.",
        });
      }

      const { registrationId } = req.params;

      const { error } =
        await req.supabase
          .from(
            "rangavallika_registrations"
          )
          .delete()
          .eq(
            "registration_id",
            registrationId
          );

      if (error) {
        console.error(
          "ADMIN REGISTRATION DELETE ERROR:",
          error
        );

        return res.status(500).json({
          success: false,
          message:
            "Failed to delete registration.",
          details: error.message,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          "Registration deleted successfully.",
      });
    } catch (error) {
      console.error(
        "ADMIN REGISTRATION DELETE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete registration.",
      });
    }
  }
);


/* =========================================================
   EXPORT
========================================================= */

module.exports = router;