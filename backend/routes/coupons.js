const express = require("express");

// =========================================================
// COUPONS
// Stored in the "coupons" table and managed from the admin
// dashboard. See migrations/2026-09-29-coupons.sql
// =========================================================

const DISCOUNT_TYPES = ["fixed_price", "flat", "percent"];

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

// Final amount the participant pays with this coupon.
function computeCouponAmount(coupon, baseFee) {
  const value = Number(coupon.discount_value);
  let amount = baseFee;

  if (coupon.discount_type === "fixed_price") amount = value;
  if (coupon.discount_type === "flat") amount = baseFee - value;
  if (coupon.discount_type === "percent") amount = baseFee - (baseFee * value) / 100;

  return Math.max(1, Math.min(baseFee, Math.round(amount)));
}

async function countCouponUses(supabase, code) {
  const { count, error } = await supabase
    .from("rangavallika_registrations")
    .select("registration_id", { count: "exact", head: true })
    .eq("coupon_code", code)
    .eq("payment_status", "SUCCESS");

  if (error) throw error;
  return count || 0;
}

// Returns { coupon, amount } or { error } with a participant-facing message.
async function resolveCoupon(supabase, rawCode, baseFee) {
  const code = normalizeCode(rawCode);

  if (!code) return { error: "Please enter a coupon code." };

  const { data: coupon, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .maybeSingle();

  if (error) {
    console.error("COUPON LOOKUP ERROR:", error);
    return { error: "Unable to check coupon right now. Please try again." };
  }

  if (!coupon || !coupon.is_active) {
    return { error: "Invalid coupon code. Please check and try again." };
  }

  const now = Date.now();

  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
    return { error: "This coupon is not active yet." };
  }

  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) {
    return { error: "This coupon has expired." };
  }

  if (coupon.max_uses) {
    try {
      const used = await countCouponUses(supabase, code);
      if (used >= coupon.max_uses) {
        return { error: "This coupon has reached its usage limit." };
      }
    } catch (countError) {
      console.error("COUPON USAGE COUNT ERROR:", countError);
      return { error: "Unable to check coupon right now. Please try again." };
    }
  }

  return { coupon, amount: computeCouponAmount(coupon, baseFee) };
}

// Validates and cleans an admin create/update body.
function parseCouponInput(body, { partial = false } = {}) {
  const out = {};
  const errors = [];
  const has = (key) => body[key] !== undefined;

  if (!partial || has("code")) {
    const code = normalizeCode(body.code);
    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      errors.push("Code must be 3–40 characters: letters, numbers, - or _.");
    }
    out.code = code;
  }

  if (!partial || has("title")) out.title = String(body.title || "").trim();
  if (!partial || has("description")) out.description = String(body.description || "").trim();

  if (!partial || has("discount_type")) {
    if (!DISCOUNT_TYPES.includes(body.discount_type)) {
      errors.push("Choose a valid discount type.");
    }
    out.discount_type = body.discount_type;
  }

  if (!partial || has("discount_value")) {
    const value = Number(body.discount_value);
    if (!Number.isFinite(value) || value <= 0) {
      errors.push("Discount value must be greater than 0.");
    }
    out.discount_value = value;
  }

  const type = out.discount_type;
  if (type === "percent" && out.discount_value > 100) {
    errors.push("Percent discount cannot be more than 100.");
  }

  if (!partial || has("is_active")) out.is_active = Boolean(body.is_active);

  for (const key of ["valid_from", "valid_until"]) {
    if (!partial || has(key)) {
      if (!body[key]) {
        out[key] = null;
      } else {
        const date = new Date(body[key]);
        if (Number.isNaN(date.getTime())) errors.push(`Invalid ${key.replace("_", " ")} date.`);
        else out[key] = date.toISOString();
      }
    }
  }

  if (out.valid_from && out.valid_until && out.valid_from > out.valid_until) {
    errors.push("Valid until must be after valid from.");
  }

  if (!partial || has("max_uses")) {
    if (body.max_uses === "" || body.max_uses === null || body.max_uses === undefined) {
      out.max_uses = null;
    } else {
      const max = Number(body.max_uses);
      if (!Number.isInteger(max) || max < 1) errors.push("Usage limit must be a whole number (1 or more).");
      out.max_uses = max;
    }
  }

  return { data: out, errors };
}

// =========================================================
// ADMIN ROUTER  —  /api/admin/coupons  (requireAdmin)
// =========================================================

function createAdminRouter({ baseFee }) {
  const router = express.Router();

  router.get("/", async (req, res) => {
    try {
      const { data: coupons, error } = await req.supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Usage per coupon (all registrations + paid ones)
      const { data: usageRows, error: usageError } = await req.supabase
        .from("rangavallika_registrations")
        .select("coupon_code, payment_status")
        .not("coupon_code", "is", null);

      if (usageError) throw usageError;

      const usage = {};
      for (const row of usageRows || []) {
        const code = normalizeCode(row.coupon_code);
        usage[code] = usage[code] || { total: 0, paid: 0 };
        usage[code].total += 1;
        if (row.payment_status === "SUCCESS") usage[code].paid += 1;
      }

      return res.json({
        success: true,
        base_fee: baseFee,
        coupons: (coupons || []).map((c) => ({
          ...c,
          final_amount: computeCouponAmount(c, baseFee),
          used_total: usage[c.code]?.total || 0,
          used_paid: usage[c.code]?.paid || 0,
        })),
      });
    } catch (error) {
      console.error("ADMIN COUPONS FETCH ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch coupons." });
    }
  });

  router.post("/", async (req, res) => {
    const { data, errors } = parseCouponInput(req.body || {});
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(" ") });

    const { data: coupon, error } = await req.supabase
      .from("coupons")
      .insert(data)
      .select("*")
      .single();

    if (error) {
      console.error("ADMIN COUPON CREATE ERROR:", error);
      const message = error.code === "23505"
        ? "A coupon with this code already exists."
        : "Failed to create coupon.";
      return res.status(error.code === "23505" ? 409 : 500).json({ success: false, message });
    }

    return res.status(201).json({ success: true, coupon });
  });

  router.put("/:id", async (req, res) => {
    const { data, errors } = parseCouponInput(req.body || {}, { partial: true });
    if (errors.length) return res.status(400).json({ success: false, message: errors.join(" ") });

    const { data: coupon, error } = await req.supabase
      .from("coupons")
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("*")
      .maybeSingle();

    if (error) {
      console.error("ADMIN COUPON UPDATE ERROR:", error);
      const message = error.code === "23505"
        ? "A coupon with this code already exists."
        : "Failed to update coupon.";
      return res.status(error.code === "23505" ? 409 : 500).json({ success: false, message });
    }

    if (!coupon) return res.status(404).json({ success: false, message: "Coupon not found." });

    return res.json({ success: true, coupon });
  });

  router.delete("/:id", async (req, res) => {
    const { error } = await req.supabase
      .from("coupons")
      .delete()
      .eq("id", req.params.id);

    if (error) {
      console.error("ADMIN COUPON DELETE ERROR:", error);
      return res.status(500).json({ success: false, message: "Failed to delete coupon." });
    }

    return res.json({ success: true });
  });

  return router;
}

// =========================================================
// PUBLIC ROUTER  —  /api/coupons
// =========================================================

function createPublicRouter({ baseFee }) {
  const router = express.Router();

  // POST /api/coupons/validate  { code }
  router.post("/validate", async (req, res) => {
    const result = await resolveCoupon(req.supabase, req.body?.code, baseFee);

    if (result.error) {
      return res.status(400).json({ success: false, message: result.error });
    }

    const { coupon, amount } = result;

    return res.json({
      success: true,
      base_fee: baseFee,
      coupon: {
        code: coupon.code,
        type: coupon.code,
        title: coupon.title,
        description: coupon.description,
        amount,
      },
    });
  });

  return router;
}

module.exports = {
  createAdminRouter,
  createPublicRouter,
  resolveCoupon,
  computeCouponAmount,
};
