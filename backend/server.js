/* =========================================================
   ENVIRONMENT MUST LOAD FIRST
   (routes/adminAuth.js reads ADMIN_EMAIL / ADMIN_PASSWORD
   from process.env when it is required)
========================================================= */

const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
const multer = require("multer");
const Tesseract = require("tesseract.js");
const crypto = require("crypto");

const adminQueriesRouter = require("./routes/adminQueries");
const adminAuthRouter = require("./routes/adminAuth");
const adminRegistrationsRouter = require("./routes/adminRegistrations");
const queriesRouter = require("./routes/queries");
const {
  createAdminRouter: createAdminCouponsRouter,
  createPublicRouter: createPublicCouponsRouter,
  resolveCoupon,
} = require("./routes/coupons");

const app = express();

const PORT = process.env.PORT || 5000;

/* =========================================================
   ENVIRONMENT CHECK
========================================================= */

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SECRET_KEY) {
  console.error("ERROR: Supabase environment variables are missing.");
  process.exit(1);
}

console.log("");
console.log("================================");
console.log("Starting Rangavallika Backend");
console.log("================================");
console.log("Supabase URL:", process.env.SUPABASE_URL);
console.log("Supabase secret key loaded:", !!process.env.SUPABASE_SECRET_KEY);
console.log("Admin credentials loaded:", !!process.env.ADMIN_EMAIL && !!process.env.ADMIN_PASSWORD);

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================================================
   SUPABASE
========================================================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

/* =========================================================
   MULTER (JPG / PNG / WEBP, max 5 MB)
========================================================= */

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only JPG, PNG and WEBP images are allowed."));
    }
    cb(null, true);
  },
});

/* =========================================================
   REGISTRATION AMOUNTS / COUPONS
========================================================= */

const BASE_REGISTRATION_FEE = 799;

// Old fee (base 999) — registrations saved before the price change
// can still be paid at the amount they were created with.
const LEGACY_BASE_REGISTRATION_FEE = 999;

// Coupons live in the "coupons" table (managed in the admin dashboard).
// Any stored registration amount between ₹1 and the legacy fee is payable.
function isPayableAmount(amount) {
  return Number.isInteger(amount) && amount >= 1 && amount <= LEGACY_BASE_REGISTRATION_FEE;
}

/* =========================================================
   HELPERS
========================================================= */

function normalizePackageName(value) {
  return String(value || "").trim().toUpperCase();
}

function generateRecoveryPin() {
  return String(crypto.randomInt(100000, 1000000));
}

function getExtension(mimetype) {
  if (mimetype === "image/png") return "png";
  if (mimetype === "image/webp") return "webp";
  return "jpg";
}

// Coupon applied to a saved registration. Uses the stored coupon_code;
// very old rows without one are matched by amount.
function couponForRegistration(row) {
  if (row.coupon_code) {
    return { code: row.coupon_code, type: row.coupon_type || row.coupon_code };
  }
  const amount = Number(row.package_amount);
  if (amount === 899) return { code: "UDAYBHANU0246", type: "UDAYBHANU" }; // legacy ₹999 fee
  if (amount === 799 && Number(row.base_amount) === LEGACY_BASE_REGISTRATION_FEE) {
    return { code: "GTST0246", type: "GTST" }; // legacy ₹999 fee
  }
  return { code: null, type: null };
}

function baseFeeForAmount(amount) {
  return amount > BASE_REGISTRATION_FEE
    ? LEGACY_BASE_REGISTRATION_FEE
    : BASE_REGISTRATION_FEE;
}
function getBackendBaseUrl(req) {
  if (req) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    if (
      host &&
      !host.includes("rangoli-backend.vercel.app") &&
      !host.includes("rangoli-frontend.vercel.app")
    ) {
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }
  const envUrl = (process.env.BACKEND_URL || "").trim().replace(/\/$/, "");
  if (
    envUrl &&
    !envUrl.includes("rangoli-backend.vercel.app") &&
    !envUrl.includes("rangoli-frontend.vercel.app")
  ) {
    return envUrl;
  }
  return "https://rangoli3.vercel.app";
}

function getFrontendBaseUrl(req) {
  const envUrl = (process.env.FRONTEND_URL || "").trim().replace(/\/$/, "");
  if (
    envUrl &&
    !envUrl.includes("rangoli-frontend.vercel.app") &&
    !envUrl.includes("rangoli-backend.vercel.app")
  ) {
    return envUrl;
  }
  if (req) {
    const proto = req.headers["x-forwarded-proto"] || req.protocol || "https";
    const host = req.headers["x-forwarded-host"] || req.headers.host;
    if (
      host &&
      !host.includes("rangoli2.vercel.app") &&
      !host.includes("rangoli-frontend.vercel.app") &&
      !host.includes("rangoli-backend.vercel.app")
    ) {
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }
  return "https://rangoli3.vercel.app";
}

function getEasebuzzBaseUrl() {
  const env = String(process.env.EASEBUZZ_ENV || "test")
    .trim()
    .toLowerCase();

  return env === "prod" ||
    env === "production" ||
    env === "live"
    ? "https://pay.easebuzz.in"
    : "https://testpay.easebuzz.in";
}

function generateEasebuzzHash({
  key,
  txnid,
  amount,
  productinfo,
  firstname,
  email,
  udf1 = "",
  udf2 = "",
  udf3 = "",
  udf4 = "",
  udf5 = "",
  udf6 = "",
  udf7 = "",
  udf8 = "",
  udf9 = "",
  udf10 = "",
  salt,
}) {
  const hashString = [
    key,
    txnid,
    amount,
    productinfo,
    firstname,
    email,
    udf1,
    udf2,
    udf3,
    udf4,
    udf5,
    udf6,
    udf7,
    udf8,
    udf9,
    udf10,
    salt,
  ].join("|");

  return crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex");
}

function generateEasebuzzResponseHash(data) {
  const salt = process.env.EASEBUZZ_SALT || "";

  const hashString = [
    salt,
    data.status || "",
    data.udf10 || "",
    data.udf9 || "",
    data.udf8 || "",
    data.udf7 || "",
    data.udf6 || "",
    data.udf5 || "",
    data.udf4 || "",
    data.udf3 || "",
    data.udf2 || "",
    data.udf1 || "",
    data.email || "",
    data.firstname || "",
    data.productinfo || "",
    data.amount || "",
    data.txnid || "",
    data.key || "",
  ].join("|");

  return crypto
    .createHash("sha512")
    .update(hashString)
    .digest("hex");
}

/* =========================================================
   SEQUENTIAL REGISTRATION ID

   Format: GLF001, GLF002, GLF003 ...

   - Only IDs matching exactly GLF + digits are considered.
   - Old RNG-... IDs and GLFRV.. IDs are ignored / untouched.
   - Highest existing number + 1, padded to 3 digits.
========================================================= */

async function generateRegistrationId() {
  let highest = 0;
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("rangavallika_registrations")
      .select("registration_id")
      .like("registration_id", "GLF%")
      .range(from, from + pageSize - 1);

    if (error) {
      console.error("REGISTRATION ID LOOKUP ERROR:", error);
      throw new Error("Unable to generate registration ID.");
    }

    for (const row of data || []) {
      const match = String(row.registration_id || "")
        .trim()
        .toUpperCase()
        .match(/^GLF(\d+)$/);

      if (match) {
        const n = Number(match[1]);
        if (Number.isInteger(n) && n > highest) {
          highest = n;
        }
      }
    }

    if (!data || data.length < pageSize) break;
    from += pageSize;
  }

  return `GLF${String(highest + 1).padStart(3, "0")}`;
}

/* =========================================================
   OCR TEXT NORMALIZATION
========================================================= */

function normalizeOcrText(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .trim();
}

/* =========================================================
   OCR — PAYMENT AMOUNT  (restored from working version)
========================================================= */

function extractPaymentAmount(text, expectedAmount) {
  const cleanText = normalizeOcrText(text);

  console.log("AMOUNT OCR SEARCH TEXT:");
  console.log(cleanText);

  /* 1. Normal rupee / Rs / INR formats */

  const currencyPatterns = [
    /\u20b9\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /(?:rs\.?|inr)\s*[:.]?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
    /(?:amount|paid|total|debited|received)\s*[:\-]?\s*(?:\u20b9|rs\.?|inr)?\s*([0-9][0-9,]*(?:\.[0-9]{1,2})?)/i,
  ];

  for (const pattern of currencyPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const amount = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(amount)) {
        console.log("AMOUNT DETECTED USING CURRENCY PATTERN:", amount);
        return amount;
      }
    }
  }

  /* 2. OCR often converts the rupee sign into & = @ # * */

  const ocrCurrencyPatterns = [
    /[\u20b9&=@#*]\s*([0-9]{2,6})(?:\.00)?\b/i,
    /[\u20b9&=@#*]\s*([0-9]{2,6})\b/i,
    /(?:paid\s*to|debited\s*from|total|amount)\s*.*?[\u20b9&=@#*]\s*([0-9]{2,6})\b/i,
  ];

  for (const pattern of ocrCurrencyPatterns) {
    const match = cleanText.match(pattern);
    if (match) {
      const amount = Number(match[1].replace(/,/g, ""));
      if (Number.isFinite(amount)) {
        console.log("AMOUNT DETECTED USING OCR CURRENCY SYMBOL:", amount);
        return amount;
      }
    }
  }

  /* 3. Line-by-line fallback */

  const lines = cleanText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const symbolMatch = line.match(
      /[\u20b9&=@#*]\s*([0-9]{2,6})(?:\.00)?\b/i
    );

    if (symbolMatch) {
      const amount = Number(symbolMatch[1].replace(/,/g, ""));
      if (Number.isFinite(amount)) {
        console.log("AMOUNT DETECTED FROM LINE:", line);
        console.log("DETECTED AMOUNT:", amount);
        return amount;
      }
    }

    if (/paid\s*to/i.test(line)) {
      const endAmount = line.match(/([0-9]{2,6})(?:\.00)?\s*$/i);
      if (endAmount) {
        const amount = Number(endAmount[1]);
        if (Number.isFinite(amount)) {
          console.log("AMOUNT DETECTED FROM PAID-TO LINE:", amount);
          return amount;
        }
      }
    }

    if (/debited\s*from/i.test(line)) {
      const endAmount = line.match(/([0-9]{2,6})(?:\.00)?\s*$/i);
      if (endAmount) {
        const amount = Number(endAmount[1]);
        if (Number.isFinite(amount)) {
          console.log("AMOUNT DETECTED FROM DEBITED-FROM LINE:", amount);
          return amount;
        }
      }
    }
  }

  /* 4. Final fallback: known registration amounts only */

  const knownAmounts = [BASE_REGISTRATION_FEE, LEGACY_BASE_REGISTRATION_FEE, 899, expectedAmount]
    .filter((a) => Number.isFinite(a))
    .join("|");
  const commonAmounts = cleanText.match(new RegExp(`\\b(${knownAmounts})\\b`, "g"));

  if (commonAmounts && commonAmounts.length > 0) {
    const detected = Number(commonAmounts[commonAmounts.length - 1]);
    console.log("AMOUNT DETECTED FROM KNOWN REGISTRATION AMOUNT:", detected);
    return detected;
  }

  console.log("PAYMENT AMOUNT COULD NOT BE DETECTED.");
  return null;
}

/* =========================================================
   OCR — PAYMENT DATE
========================================================= */

function extractPaymentDate(text) {
  const cleanText = normalizeOcrText(text);

  const monthMap = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  const pad = (n) => String(n).padStart(2, "0");

  /* Example: 03:23 PM on 18 Sep 2026 */

  const dateTimeMatch = cleanText.match(
    /(\d{1,2}):(\d{2})\s*(AM|PM)\s*(?:on\s*)?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i
  );

  if (dateTimeMatch) {
    let hour = Number(dateTimeMatch[1]);
    const minute = Number(dateTimeMatch[2]);
    const ampm = dateTimeMatch[3].toUpperCase();
    const day = Number(dateTimeMatch[4]);
    const month = monthMap[dateTimeMatch[5].toLowerCase()];
    const year = Number(dateTimeMatch[6]);

    if (
      month !== undefined &&
      day >= 1 && day <= 31 &&
      minute >= 0 && minute <= 59
    ) {
      if (ampm === "PM" && hour !== 12) hour += 12;
      if (ampm === "AM" && hour === 12) hour = 0;

      const iso = `${year}-${pad(month + 1)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`;
      const date = new Date(iso);

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }

  /* Fallback: 18 Sep 2026 */

  const dateMatch = cleanText.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/i);

  if (dateMatch) {
    const day = Number(dateMatch[1]);
    const month = monthMap[dateMatch[2].toLowerCase()];
    const year = Number(dateMatch[3]);

    if (month !== undefined && day >= 1 && day <= 31) {
      const iso = `${year}-${pad(month + 1)}-${pad(day)}T00:00:00+05:30`;
      const date = new Date(iso);

      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }

  return null;
}

/* =========================================================
   OCR — UTR
========================================================= */

function verifyUtrFromOcr(text, submittedUtr) {
  const normalizedText = String(text || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  const normalizedUtr = String(submittedUtr || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");

  return (
    normalizedUtr.length >= 6 &&
    normalizedText.includes(normalizedUtr)
  );
}

/* =========================================================
   OCR — PAYMENT WORDS
========================================================= */

function hasPaymentInformation(text) {
  const upper = String(text || "").toUpperCase();

  return (
    /\bPAYMENT\b/.test(upper) ||
    /\bSUCCESSFUL\b/.test(upper) ||
    /\bSUCCESS\b/.test(upper) ||
    /\bTRANSACTION\b/.test(upper) ||
    /\bUTR\b/.test(upper) ||
    /\bUPI\b/.test(upper)
  );
}

/* =========================================================
   RUN OCR
========================================================= */

async function runPaymentOcr(buffer, expectedAmount) {
  const result = await Tesseract.recognize(buffer, "eng");

  const text = normalizeOcrText(result?.data?.text || "");

  return {
    text,
    amount: extractPaymentAmount(text, expectedAmount),
    date: extractPaymentDate(text),
  };
}

/* =========================================================
   ROOT / HEALTH
========================================================= */

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Rangavallika Backend Running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend is healthy",
    timestamp: new Date().toISOString(),
  });
});

/* =========================================================
   CREATE REGISTRATION
========================================================= */

app.post(
  "/api/registration/create",

  upload.single("participant_photo"),

  async (req, res) => {
    try {
      const {
  full_name,
  age,
  guardian_name,
  mobile,
  address,
  district,
  state,
  pincode,
  package_name,
  package_amount,
  coupon_code,
  coupon_type,
  base_amount,
} = req.body;
      /* REQUIRED FIELDS */

      if (
        !full_name ||
        !age ||
        !guardian_name ||
        !mobile ||
        !address ||
        !district ||
        !state ||
        !pincode ||
        !package_name ||
        package_amount === undefined
      ) {
        return res.status(400).json({
          success: false,
          message: "All registration fields are required.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Participant photo is required.",
        });
      }

      const cleanMobile = String(mobile).replace(/\D/g, "");

      if (!/^\d{10}$/.test(cleanMobile)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid 10-digit mobile number.",
        });
      }

      const cleanPincode = String(pincode).trim();

      if (!/^\d{6}$/.test(cleanPincode)) {
        return res.status(400).json({
          success: false,
          message: "Pincode must be exactly 6 digits.",
        });
      }

      const cleanAge = Number(String(age).trim());

      if (!Number.isInteger(cleanAge) || cleanAge < 3 || cleanAge > 100) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid age.",
        });
      }

      const cleanGuardianName = String(guardian_name).trim();

      if (!cleanGuardianName) {
        return res.status(400).json({
          success: false,
          message: "Guardian name is required.",
        });
      }

      /* REGISTRATION FEE */
const packageName = normalizePackageName(package_name);
const packageAmount = Number(package_amount);
const couponCode = String(coupon_code || "").trim().toUpperCase();
const couponType = String(coupon_type || "").trim().toUpperCase();

console.log("COUPON DEBUG:", {
  coupon_code,
  coupon_type,
  base_amount,
  couponCode,
  couponType,
});

      console.log("");
      console.log("================================");
      console.log("NEW REGISTRATION");
      console.log("Registration Name:", packageName);
      console.log("Registration Amount:", packageAmount);
      console.log("Coupon Code:", couponCode || "NONE");
      console.log("Coupon Type:", couponType || "NONE");
      console.log("================================");

      if (packageName !== "RANGAVALLIKA") {
        return res.status(400).json({
          success: false,
          message: "Invalid registration selected.",
        });
      }

      /* COUPON VALIDATION (coupons table) */

      let expectedAmount = BASE_REGISTRATION_FEE;

      if (couponCode) {
        const result = await resolveCoupon(supabase, couponCode, BASE_REGISTRATION_FEE);

        if (result.error) {
          return res.status(400).json({
            success: false,
            message: result.error,
          });
        }

        expectedAmount = result.amount;
      }

      if (packageAmount !== expectedAmount) {
        return res.status(400).json({
          success: false,
          message: couponCode
            ? "Coupon amount does not match. Please re-apply the coupon."
            : "Invalid registration amount.",
        });
      }

      /* RECOVERY PIN / PHOTO */

      const recoveryPin = generateRecoveryPin();
      const extension = getExtension(req.file.mimetype);

      /*
         REGISTRATION ID + PHOTO UPLOAD + INSERT
         Retries with a fresh ID if two registrations race
         for the same number (unique violation).
      */

      let data = null;
      let registrationId = null;
      let lastError = null;
      const MAX_ATTEMPTS = 5;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        registrationId = await generateRegistrationId();

        const photoPath = `${registrationId}/participant-${Date.now()}.${extension}`;

        const { data: photoData, error: photoError } = await supabase.storage
          .from("participant-photos")
          .upload(photoPath, req.file.buffer, {
            contentType: req.file.mimetype,
            upsert: false,
          });

        if (photoError) {
          console.error("PHOTO UPLOAD ERROR:", photoError);

          return res.status(500).json({
            success: false,
            message: "Unable to upload participant photo.",
            details: photoError.message,
          });
        }

        const registrationData = {

  registration_id: registrationId,

  full_name: String(full_name).trim(),

  mobile: cleanMobile,

  age: cleanAge,

  guardian_name: cleanGuardianName,

  address: String(address).trim(),

  district: String(district).trim(),

  state: String(state).trim(),

  pincode: cleanPincode,

  participant_photo: photoData.path,

  package_name: packageName,

  package_amount: packageAmount,

  // Coupon information
  base_amount: BASE_REGISTRATION_FEE,

  coupon_code: coupon_code
    ? String(coupon_code).trim().toUpperCase()
    : null,

  coupon_type: coupon_type
    ? String(coupon_type).trim().toUpperCase()
    : null,

  payment_status: "INITIATED",

  payment_id: null,

  payment_screenshot: null,

  utr_number: null,

  payment_amount_detected: null,

  payment_date_detected: null,

  ocr_status: "PENDING",

  utr_verified: false,

  duplicate_utr: false,

  recovery_pin: recoveryPin,

  updated_at: new Date().toISOString(),

};
        const { data: inserted, error } = await supabase
          .from("rangavallika_registrations")
          .insert([registrationData])
          .select()
          .single();

        if (!error) {
          data = inserted;
          break;
        }

        /* remove the orphan photo for this attempt */
        await supabase.storage
          .from("participant-photos")
          .remove([photoData.path]);

        lastError = error;

        const isDuplicate =
          error.code === "23505" ||
          /duplicate key/i.test(error.message || "");

        console.error("SUPABASE INSERT ERROR:", error);

        if (!isDuplicate) break;

        console.log(
          `Registration ID ${registrationId} already taken. Retrying (${attempt}/${MAX_ATTEMPTS})...`
        );
      }

      if (!data) {
        return res.status(500).json({
          success: false,
          message: "Failed to save registration.",
          details: lastError?.message,
        });
      }

      const responseRegistration = {
        ...data,
        amount: packageAmount,
        base_amount: BASE_REGISTRATION_FEE,
        coupon_code: couponCode || null,
        coupon_type: couponType || null,
      };

      console.log("Registration created:", data.registration_id);
      console.log("Registration amount:", data.package_amount);

      return res.status(201).json({
        success: true,
        message: "Registration created successfully.",
        registration: responseRegistration,
      });
    } catch (error) {
  console.error("================================");
  console.error("EASEBUZZ INITIATE ERROR");
  console.error("Message:", error?.message);
  console.error("Name:", error?.name);
  console.error("Stack:", error?.stack);
  console.error("================================");

  return res.status(500).json({
    success: false,
    message: "Failed to initiate payment",
    error: error?.message || "Unknown error",
  });
}
  }
);

/* =========================================================
   RECOVER EXISTING REGISTRATION
========================================================= */

app.post("/api/registration/recover", async (req, res) => {
  try {
    const { registration_id, recovery_pin } = req.body || {};

    if (!registration_id || !recovery_pin) {
      return res.status(400).json({
        success: false,
        message: "Registration ID and Recovery PIN are required.",
      });
    }

    const registrationId = String(registration_id).trim().toUpperCase();
    const recoveryPin = String(recovery_pin).trim();

    if (!/^\d{6}$/.test(recoveryPin)) {
      return res.status(400).json({
        success: false,
        message: "Recovery PIN must be a 6-digit number.",
      });
    }

    const { data, error } = await supabase
      .from("rangavallika_registrations")
      .select(`
        registration_id,
        recovery_pin,
        full_name,
        mobile,
        dob,
        age,
        guardian_name,
        address,
        district,
        state,
        pincode,
        participant_photo,
        package_name,
        package_amount,
        base_amount,
        coupon_code,
        coupon_type,
        payment_status,
        payment_id,
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
      .eq("registration_id", registrationId)
      .eq("recovery_pin", recoveryPin)
      .maybeSingle();

    if (error) {
      console.error("RECOVERY ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to recover registration.",
      });
    }

    if (!data) {
      return res.status(401).json({
        success: false,
        message: "Invalid Registration ID or Recovery PIN.",
      });
    }

    const recoveredAmount = Number(data.package_amount);
    const coupon = couponForRegistration(data);

    return res.json({
      success: true,
      message: "Registration recovered successfully.",
      registration: {
        ...data,
        amount: recoveredAmount,
        base_amount: baseFeeForAmount(recoveredAmount),
        coupon_code: coupon.code,
        coupon_type: coupon.type,
      },
    });
  } catch (error) {
    console.error("RECOVERY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to recover registration.",
    });
  }
});

/* =========================================================
   PAYMENT SCREENSHOT + UTR + OCR
   OCR is evidence only: a pass sets PENDING_REVIEW.
   Only the admin can set SUCCESS.
========================================================= */

app.post(
  "/api/registration/:registrationId/payment-screenshot",

  upload.single("payment_screenshot"),

  async (req, res) => {
    try {
      const registrationId = String(req.params.registrationId || "")
        .trim()
        .toUpperCase();

      const utr = String(req.body?.utr_number || req.body?.utr || "")
        .trim()
        .toUpperCase();

      if (!registrationId) {
        return res.status(400).json({
          success: false,
          message: "Registration ID is required.",
        });
      }

      if (!utr) {
        return res.status(400).json({
          success: false,
          message: "UTR / Transaction ID is required.",
        });
      }

      if (!/^[A-Z0-9-]{6,40}$/.test(utr)) {
        return res.status(400).json({
          success: false,
          message: "Please enter a valid UTR / Transaction ID.",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Payment screenshot is required.",
        });
      }

      /* FIND REGISTRATION */

      const { data: registration, error: registrationError } = await supabase
        .from("rangavallika_registrations")
        .select(`
          registration_id,
          package_name,
          package_amount,
          payment_status
        `)
        .eq("registration_id", registrationId)
        .maybeSingle();

      if (registrationError) {
        console.error("PAYMENT REGISTRATION ERROR:", registrationError);

        return res.status(500).json({
          success: false,
          message: "Unable to load registration.",
        });
      }

      if (!registration) {
        return res.status(404).json({
          success: false,
          message: "Registration not found.",
        });
      }

      /* ALREADY SUCCESS */

      if (
        String(registration.payment_status || "").trim().toUpperCase() ===
        "SUCCESS"
      ) {
        return res.status(400).json({
          success: false,
          message: "This payment has already been verified.",
        });
      }

      /* EXPECTED AMOUNT */

      const expectedAmount = Number(registration.package_amount);

      if (!Number.isFinite(expectedAmount)) {
        return res.status(500).json({
          success: false,
          message: "Unable to determine registration amount.",
        });
      }

      console.log("");
      console.log("================================");
      console.log("PAYMENT OCR");
      console.log("Registration:", registrationId);
      console.log("Expected Amount:", expectedAmount);
      console.log("Submitted UTR:", utr);
      console.log("================================");

      /* DUPLICATE UTR */

      const { data: duplicateUtr, error: duplicateError } = await supabase
        .from("rangavallika_registrations")
        .select("registration_id")
        .eq("utr_number", utr)
        .neq("registration_id", registrationId)
        .limit(1)
        .maybeSingle();

      if (duplicateError) {
        console.error("UTR CHECK ERROR:", duplicateError);

        return res.status(500).json({
          success: false,
          message: "Unable to check UTR.",
        });
      }

      if (duplicateUtr) {
        await supabase
          .from("rangavallika_registrations")
          .update({
            duplicate_utr: true,
            ocr_status: "DUPLICATE_UTR",
            updated_at: new Date().toISOString(),
          })
          .eq("registration_id", registrationId);

        return res.status(409).json({
          success: false,
          duplicate_utr: true,
          message: "This UTR / Transaction ID has already been submitted.",
        });
      }

      /* RUN SERVER-SIDE OCR */

      let ocr;

      try {
        console.log("Starting OCR...");

        ocr = await runPaymentOcr(req.file.buffer, expectedAmount);

        console.log("OCR completed.");
        console.log("OCR TEXT:", ocr.text);
        console.log("Detected Amount:", ocr.amount);
        console.log("Detected Date:", ocr.date);
      } catch (ocrError) {
        console.error("OCR ERROR:", ocrError);

        return res.status(422).json({
          success: false,
          ocr_status: "OCR_FAILED",
          message:
            "Unable to read the payment receipt. Please upload a clear payment screenshot.",
        });
      }

      /* OCR VALIDATION */

      const utrVerified = verifyUtrFromOcr(ocr.text, utr);
      const paymentWordsFound = hasPaymentInformation(ocr.text);

      let ocrStatus = "VERIFIED";

      if (ocr.amount === null) {
        ocrStatus = "AMOUNT_NOT_DETECTED";
      } else if (Number(ocr.amount) !== expectedAmount) {
        ocrStatus = "AMOUNT_MISMATCH";
      } else if (!utrVerified) {
        ocrStatus = "UTR_NOT_FOUND";
      } else if (!paymentWordsFound) {
        ocrStatus = "PAYMENT_TEXT_NOT_FOUND";
      }

      console.log("OCR STATUS:", ocrStatus);

      /* UPLOAD SCREENSHOT */

      const extension = getExtension(req.file.mimetype);
      const filePath = `${registrationId}/payment-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-screenshots")
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false,
        });

      if (uploadError) {
        console.error("PAYMENT SCREENSHOT UPLOAD ERROR:", uploadError);

        return res.status(500).json({
          success: false,
          message: "Failed to upload payment screenshot.",
          details: uploadError.message,
        });
      }

      /* OCR FAILED / MISMATCH */

      if (ocrStatus !== "VERIFIED") {
        await supabase
          .from("rangavallika_registrations")
          .update({
            utr_number: utr,
            payment_screenshot: filePath,
            payment_amount_detected: ocr.amount,
            payment_date_detected: ocr.date,
            ocr_status: ocrStatus,
            utr_verified: utrVerified,
            duplicate_utr: false,
            payment_status: "FAILED",
            updated_at: new Date().toISOString(),
          })
          .eq("registration_id", registrationId);

        let message = "Payment receipt could not be validated.";

        if (ocrStatus === "AMOUNT_MISMATCH") {
          message = `Payment amount does not match. Registration requires \u20b9${expectedAmount}, but the receipt shows \u20b9${ocr.amount}.`;
        } else if (ocrStatus === "AMOUNT_NOT_DETECTED") {
          message =
            "Payment amount could not be detected. Please upload a clear payment receipt showing the amount.";
        } else if (ocrStatus === "UTR_NOT_FOUND") {
          message =
            "The submitted UTR was not found in the uploaded payment receipt.";
        } else if (ocrStatus === "PAYMENT_TEXT_NOT_FOUND") {
          message =
            "The uploaded image does not contain recognizable payment information.";
        }

        return res.status(400).json({
          success: false,
          message,
          expected_amount: expectedAmount,
          payment_amount_detected: ocr.amount,
          payment_date_detected: ocr.date,
          utr_verified: utrVerified,
          duplicate_utr: false,
          ocr_status: ocrStatus,
        });
      }

      /* OCR PASSED -> PENDING_REVIEW (never SUCCESS) */

      const { data: updatedRegistration, error: updateError } = await supabase
        .from("rangavallika_registrations")
        .update({
          utr_number: utr,
          payment_screenshot: filePath,
          payment_amount_detected: ocr.amount,
          payment_date_detected: ocr.date,
          ocr_status: "VERIFIED",
          utr_verified: true,
          duplicate_utr: false,
          payment_status: "PENDING_REVIEW",
          updated_at: new Date().toISOString(),
        })
        .eq("registration_id", registrationId)
        .select()
        .single();

      if (updateError) {
        await supabase.storage
          .from("payment-screenshots")
          .remove([filePath]);

        console.error("PAYMENT UPDATE ERROR:", updateError);

        return res.status(500).json({
          success: false,
          message: "Failed to save payment details.",
          details: updateError.message,
        });
      }

      console.log("");
      console.log("================================");
      console.log("OCR PAYMENT VALIDATION PASSED");
      console.log("Expected Amount:", expectedAmount);
      console.log("Detected Amount:", ocr.amount);
      console.log("Payment Date:", ocr.date);
      console.log("UTR Verified:", true);
      console.log("Payment Status: PENDING_REVIEW");
      console.log("================================");

      return res.status(200).json({
        success: true,
        message:
          "Payment receipt validated successfully. Your payment is now under manual review.",
        registration: updatedRegistration,
        verification: {
          expected_amount: expectedAmount,
          payment_amount_detected: ocr.amount,
          payment_date_detected: ocr.date,
          utr_verified: true,
          duplicate_utr: false,
          ocr_status: "VERIFIED",
        },
      });
    } catch (error) {
      console.error("PAYMENT OCR SUBMISSION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Payment submission failed.",
      });
    }
  }
);

/* =========================================================
   REGISTRATION STATUS
========================================================= */

app.get("/api/registration/:registrationId/status", async (req, res) => {
  try {
    const registrationId = String(req.params.registrationId || "")
      .trim()
      .toUpperCase();

    if (!registrationId) {
      return res.status(400).json({
        success: false,
        message: "Registration ID is required.",
      });
    }

    const { data, error } = await supabase
      .from("rangavallika_registrations")
      .select(`
        registration_id,
        recovery_pin,
        full_name,
        mobile,
        dob,
        age,
        guardian_name,
        address,
        district,
        state,
        pincode,
        participant_photo,
        package_name,
        package_amount,
        base_amount,
        coupon_code,
        coupon_type,
        payment_status,
        payment_id,
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
      .eq("registration_id", registrationId)
      .maybeSingle();

    if (error) {
      console.error("STATUS ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Unable to load registration status.",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    const amount = Number(data.package_amount);
    const coupon = couponForRegistration(data);

    return res.json({
      success: true,
      registration: {
        ...data,
        amount,
        base_amount: baseFeeForAmount(amount),
        coupon_code: coupon.code,
        coupon_type: coupon.type,
      },
    });
  } catch (error) {
    console.error("STATUS ROUTE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load registration status.",
    });
  }
});

/* =========================================================
   SIGNED IMAGE URL (payment screenshot / participant photo)

   - <img src>, browser navigation  -> 302 redirect to image
   - fetch / axios / curl           -> { success, url } JSON
========================================================= */

function wantsImageRedirect(req) {
  const accept = String(req.headers.accept || "").toLowerCase();
  return accept.includes("image/") || accept.includes("text/html");
}

async function sendSignedImage(req, res, { column, bucket, label }) {
  try {
    const registrationId = String(req.params.registrationId || "")
      .trim()
      .toUpperCase();

    const { data, error } = await supabase
      .from("rangavallika_registrations")
      .select(column)
      .eq("registration_id", registrationId)
      .maybeSingle();

    if (error) {
      console.error(`${label.toUpperCase()} LOOKUP ERROR:`, error);

      return res.status(500).json({
        success: false,
        message: `Unable to load ${label}.`,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Registration not found.",
      });
    }

    if (!data[column]) {
      return res.status(404).json({
        success: false,
        message: `${label.charAt(0).toUpperCase() + label.slice(1)} not found.`,
      });
    }

    const { data: signed, error: signedError } = await supabase.storage
      .from(bucket)
      .createSignedUrl(data[column], 3600);

    if (signedError || !signed?.signedUrl) {
      console.error(`${label.toUpperCase()} SIGNED URL ERROR:`, signedError);

      return res.status(500).json({
        success: false,
        message: `Unable to generate ${label} URL.`,
      });
    }

    if (wantsImageRedirect(req)) {
      return res.redirect(signed.signedUrl);
    }

    return res.status(200).json({
      success: true,
      url: signed.signedUrl,
    });
  } catch (error) {
    console.error(`${label.toUpperCase()} ROUTE ERROR:`, error);

    return res.status(500).json({
      success: false,
      message: `Unable to load ${label}.`,
    });
  }
}

app.get("/api/registration/:registrationId/payment-screenshot", (req, res) =>
  sendSignedImage(req, res, {
    column: "payment_screenshot",
    bucket: "payment-screenshots",
    label: "payment screenshot",
  })
);

app.get("/api/registration/:registrationId/participant-photo", (req, res) =>
  sendSignedImage(req, res, {
    column: "participant_photo",
    bucket: "participant-photos",
    label: "participant photo",
  })
);

/* =========================================================
   ADMIN AUTH
========================================================= */

app.use(
  "/api/admin",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  adminAuthRouter
);

/* =========================================================
   ADMIN REGISTRATIONS
========================================================= */

app.use(
  "/api/admin/registrations",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  adminAuthRouter.requireAdmin,
  adminRegistrationsRouter
);

/* =========================================================
   ADMIN QUERIES
========================================================= */

app.use(
  "/api/admin/queries",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  adminAuthRouter.requireAdmin,
  adminQueriesRouter
);

/* =========================================================
   ADMIN COUPONS
========================================================= */

app.use(
  "/api/admin/coupons",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  adminAuthRouter.requireAdmin,
  createAdminCouponsRouter({ baseFee: BASE_REGISTRATION_FEE })
);

/* =========================================================
   PUBLIC COUPONS (validate a code)
========================================================= */

app.use(
  "/api/coupons",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  createPublicCouponsRouter({ baseFee: BASE_REGISTRATION_FEE })
);

/* =========================================================
   PUBLIC QUERIES
========================================================= */

app.use(
  "/api/queries",
  (req, res, next) => {
    req.supabase = supabase;
    next();
  },
  queriesRouter
);

/* =========================================================
   ERROR HANDLER
========================================================= */

app.use((err, req, res, next) => {
  console.error("GLOBAL ERROR:", err);

  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "File size must be 5 MB or less.",
      });
    }

    return res.status(400).json({
      success: false,
      message: err.message || "File upload error.",
    });
  }

  if (err && err.message === "Only JPG, PNG and WEBP images are allowed.") {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: err?.message || "Internal server error.",
  });
});
app.post("/api/payment/easebuzz/initiate", async (req, res) => {
  try {
    const { registration_id } = req.body;

    if (!registration_id) {
      return res.status(400).json({
        success: false,
        message: "Registration ID is required",
      });
    }

    const key = process.env.EASEBUZZ_KEY;
    const salt = process.env.EASEBUZZ_SALT;

    if (!key || !salt ||
        key === "YOUR_EASEBUZZ_KEY" ||
        salt === "YOUR_EASEBUZZ_SALT") {
      return res.status(500).json({
        success: false,
        message: "Easebuzz credentials are not configured",
      });
    }

    // Get registration
    const { data: registration, error } = await supabase
      .from("rangavallika_registrations")
      .select("*")
      .eq("registration_id", registration_id)
      .single();

    if (error || !registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Already paid
    if (registration.payment_status === "SUCCESS") {
      return res.status(400).json({
        success: false,
        message: "This registration is already paid",
      });
    }

    const amount = Number(
      registration.package_amount ||
      registration.payment_amount ||
      BASE_REGISTRATION_FEE
    );

    if (!isPayableAmount(amount)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration amount",
      });
    }

    // Unique Easebuzz transaction ID
    const txnid = `GLF_${registration_id}_${Date.now()}`;

    const firstname =
      String(registration.full_name || "Participant").trim();

    const phone =
      String(registration.mobile || "").trim();

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Mobile number is missing",
      });
    }

    /*
      Your registration form currently does not collect email.
      Easebuzz requires an email field, so we generate
      an internal email identifier for this transaction.
    */
    const email =
      `${registration_id.toLowerCase()}@givelaurelsfoundation.com`;

    const productinfo = "Rangavallika Competition Registration";

    const udf1 = registration_id;

    const backendBase = getBackendBaseUrl(req);

    const surl =
      `${backendBase}/api/payment/easebuzz/callback`;

    const furl =
      `${backendBase}/api/payment/easebuzz/callback`;

    const hash = generateEasebuzzHash({
      key,
      txnid,
      amount: amount.toFixed(2),
      productinfo,
      firstname,
      email,
      udf1,
      salt,
    });

    const params = new URLSearchParams();

    params.append("key", key);
    params.append("txnid", txnid);
    params.append("amount", amount.toFixed(2));
    params.append("productinfo", productinfo);
    params.append("firstname", firstname);
    params.append("phone", phone);
    params.append("email", email);

    params.append("surl", surl);
    params.append("furl", furl);

    params.append("udf1", udf1);

    params.append("hash", hash);

    const easebuzzUrl =
      `${getEasebuzzBaseUrl()}/payment/initiateLink`;

    const response = await fetch(easebuzzUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const result = await response.json();

    console.log("Easebuzz initiate response:", result);

    if (
      String(result.status) !== "1" ||
      !result.data
    ) {
      return res.status(502).json({
        success: false,
        message: "Unable to create Easebuzz payment",
        easebuzz_response: result,
      });
    }

    // Save transaction ID in our database
    const { error: updateError } = await supabase
      .from("rangavallika_registrations")
      .update({
        payment_status: "PAYMENT_INITIATED",
        payment_id: txnid,
        updated_at: new Date().toISOString(),
      })
      .eq("registration_id", registration_id);

    if (updateError) {
      console.error(
        "Failed to update payment transaction:",
        updateError
      );

      return res.status(500).json({
        success: false,
        message: "Payment created but registration could not be updated",
      });
    }

    return res.json({
      success: true,
      payment_url: result.data,
      txnid,
      registration_id,
      amount,
      expires_in: 840,
    });

  } catch (error) {
    console.error("Easebuzz initiate error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to initiate payment",
    });
  }
});
function respondWithRedirect(res, targetUrl) {
  const safeUrl = String(targetUrl).replace(/"/g, "&quot;");
  return res.status(200).send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=${safeUrl}">
  <title>Redirecting to Rangavallika...</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #faf7ff;
      color: #196966;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
      text-align: center;
    }
    .card {
      background: #ffffff;
      padding: 36px 28px;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      max-width: 440px;
      width: 100%;
      border: 1px solid rgba(42, 150, 145, 0.15);
    }
    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid rgba(42, 150, 145, 0.18);
      border-top-color: #2a9691;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    h2 {
      margin: 0 0 10px 0;
      color: #196966;
      font-size: 22px;
      font-weight: 700;
    }
    p {
      margin: 0 0 20px 0;
      color: #68737d;
      font-size: 14px;
      line-height: 1.5;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background: #2a9691;
      color: #ffffff;
      font-weight: 600;
      font-size: 14px;
      border-radius: 12px;
      text-decoration: none;
      transition: background 0.2s ease;
    }
    .btn:hover {
      background: #196966;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Completing Your Registration...</h2>
    <p>Please wait while we transfer you back to the receipt page.</p>
    <a href="${safeUrl}" class="btn">Click Here if Not Redirected →</a>
  </div>
  <script>
    setTimeout(function() {
      window.location.href = "${safeUrl}";
    }, 50);
  </script>
</body>
</html>
  `);
}

app.all("/api/payment/easebuzz/callback", async (req, res) => {
  try {
    console.log("================================");
    console.log("Easebuzz callback received");
    console.log("Method:", req.method);
    console.log("Query:", req.query);
    console.log("Body:", req.body);
    console.log("================================");

    const data = { ...(req.query || {}), ...(req.body || {}) };

    const txnid = String(data.txnid || "").trim();
    const status = String(data.status || "").trim().toLowerCase();
    const receivedHash = String(data.hash || "").trim().toLowerCase();
    const errorMsg = String(data.error_Message || data.error || "").trim();

    // Determine target frontend URL for redirection
    let frontendBaseUrl = getFrontendBaseUrl(req);

    if (!txnid) {
      return respondWithRedirect(
        res,
        `${frontendBaseUrl}/?payment=failed&error=${encodeURIComponent("Invalid payment response from gateway.")}`
      );
    }

    // Verify Easebuzz response hash
    const calculatedHash = generateEasebuzzResponseHash(data).toLowerCase();

    if (!receivedHash || receivedHash !== calculatedHash) {
      console.error("Easebuzz hash verification failed", { receivedHash, calculatedHash });

      // Find registration if txnid exists to give context
      const { data: reg } = await supabase
        .from("rangavallika_registrations")
        .select("registration_id")
        .eq("payment_id", txnid)
        .maybeSingle();

      const regId = reg?.registration_id || data.udf1 || "";

      return respondWithRedirect(
        res,
        `${frontendBaseUrl}/?payment=failed&registration_id=${encodeURIComponent(regId)}&error=${encodeURIComponent("Payment signature verification failed.")}`
      );
    }

    // Find our registration using transaction ID or udf1
    const targetId = data.udf1 || txnid;
    const { data: registration, error: registrationError } = await supabase
      .from("rangavallika_registrations")
      .select("*")
      .or(`payment_id.eq.${txnid},registration_id.eq.${targetId}`)
      .maybeSingle();

    if (registrationError || !registration) {
      console.error("Registration not found for transaction:", txnid);

      return respondWithRedirect(
        res,
        `${frontendBaseUrl}/?payment=failed&error=${encodeURIComponent("Registration record not found.")}`
      );
    }

    const regId = registration.registration_id;

    // Verify amount
    const gatewayAmount = Number(data.amount);
    const registeredAmount = Number(
      registration.package_amount || registration.payment_amount
    );

    if (!Number.isFinite(gatewayAmount) || gatewayAmount !== registeredAmount) {
      console.error("Payment amount mismatch", { txnid, gatewayAmount, registeredAmount });

      return respondWithRedirect(
        res,
        `${frontendBaseUrl}/?payment=failed&registration_id=${encodeURIComponent(regId)}&error=${encodeURIComponent("Payment amount mismatch detected.")}`
      );
    }

    // Successful payment
    if (status === "success") {
      const { error: updateError } = await supabase
        .from("rangavallika_registrations")
        .update({
          payment_status: "SUCCESS",
          payment_id: txnid,
          payment_amount_detected: gatewayAmount,
          payment_date_detected: data.addedon || new Date().toISOString(),
          ocr_status: "EASEBUZZ_VERIFIED",
          updated_at: new Date().toISOString(),
        })
        .eq("registration_id", regId);

      if (updateError) {
        console.error("Failed to update successful payment:", updateError);

        return respondWithRedirect(
          res,
          `${frontendBaseUrl}/?payment=failed&registration_id=${encodeURIComponent(regId)}&error=${encodeURIComponent("Database status update failed.")}`
        );
      }

      console.log(`Payment SUCCESS: ${regId}`);

      return respondWithRedirect(
        res,
        `${frontendBaseUrl}/?payment=success&registration_id=${encodeURIComponent(regId)}`
      );
    }

    // Failed / cancelled payment
   const pendingStatuses = [
  "dropped",
  "failure",
  "failed",
  "usercancelled",
  "cancelled",
  "cancel",
  "pending",
  "processing",
];
    

    if (pendingStatuses.includes(status)) {

  const { error: pendingUpdateError } = await supabase
    .from("rangavallika_registrations")
    .update({
      payment_status: "PENDING",
      updated_at: new Date().toISOString(),
    })
    .eq("registration_id", regId);

  if (pendingUpdateError) {
    console.error(
      "Failed to update pending payment:",
      pendingUpdateError
    );
  }

  console.log(
    `Payment PENDING: ${regId} | Easebuzz status: ${status}`
  );

  return res.redirect(
    `${process.env.FRONTEND_URL}/?payment=pending&registration_id=${encodeURIComponent(
      regId
    )}`
  );
}

    // Any other gateway status (pending, processing)
    console.log(`Easebuzz returned status "${status}" for ${regId}`);

    return respondWithRedirect(
      res,
      `${frontendBaseUrl}/?payment=pending&registration_id=${encodeURIComponent(regId)}`
    );

  } catch (error) {
    console.error("Easebuzz callback error:", error);

    const fallbackUrl = process.env.FRONTEND_URL || "https://rangoli3.vercel.app";

    return respondWithRedirect(
      res,
      `${fallbackUrl.replace(/\/$/, "")}/?payment=failed&error=${encodeURIComponent("An error occurred during payment processing.")}`
    );
  }
});
/* =========================================================
   LOCAL PAYMENT SUCCESS TEST
   TEMPORARY - REMOVE BEFORE PRODUCTION
========================================================= */

app.post("/api/dev/test-payment-success", async (req, res) => {
  try {
    // Safety: this route is allowed only on localhost
    const host = String(req.hostname || "").toLowerCase();

    if (host !== "localhost" && host !== "127.0.0.1") {
      return res.status(403).json({
        success: false,
        message: "Local development only."
      });
    }

    const registrationId = String(
      req.body?.registration_id || ""
    ).trim().toUpperCase();

    if (!registrationId) {
      return res.status(400).json({
        success: false,
        message: "Registration ID is required."
      });
    }

    const { data: registration, error: findError } = await supabase
      .from("rangavallika_registrations")
      .select("*")
      .eq("registration_id", registrationId)
      .single();

    if (findError || !registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found."
      });
    }

    const testTransactionId =
      registration.payment_id ||
      `TEST_${registrationId}_${Date.now()}`;

    const { data: updated, error: updateError } = await supabase
      .from("rangavallika_registrations")
      .update({
        payment_status: "SUCCESS",
        payment_id: testTransactionId,
        payment_amount_detected: Number(registration.package_amount),
        payment_date_detected: new Date().toISOString(),
        ocr_status: "EASEBUZZ_VERIFIED",
        updated_at: new Date().toISOString()
      })
      .eq("registration_id", registrationId)
      .select()
      .single();

    if (updateError) {
      console.error("LOCAL TEST PAYMENT UPDATE ERROR:", updateError);

      return res.status(500).json({
        success: false,
        message: "Unable to update test payment."
      });
    }

    return res.json({
      success: true,
      message: "LOCAL TEST: Payment marked as SUCCESS.",
      registration: updated
    });

  } catch (error) {
    console.error("LOCAL TEST PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Local payment test failed."
    });
  }
});
/* =========================================================
   SERVER START
========================================================= */

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log("");
    console.log("================================");
    console.log("Rangavallika Backend Running");
    console.log(`Server: http://localhost:${PORT}`);
    console.log("Registration Fees: ₹799 / ₹699 / ₹599");
    console.log("Registration IDs: GLF001, GLF002, GLF003...");
    console.log("Server-side OCR: ENABLED");
    console.log("================================");
    console.log("");
  });
}

module.exports = app;