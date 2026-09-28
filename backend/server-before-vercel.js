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

const BASE_REGISTRATION_FEE = 999;

const VALID_REGISTRATION_AMOUNTS = [999, 899, 799];

const VALID_COUPONS = {
  UDAYBHANU0246: { type: "UDAYBHANU", amount: 899 },
  GTST0246: { type: "GTST", amount: 799 },
};

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

function couponFromAmount(amount) {
  if (amount === 899) return { code: "UDAYBHANU0246", type: "UDAYBHANU" };
  if (amount === 799) return { code: "GTST0246", type: "GTST" };
  return { code: null, type: null };
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

function extractPaymentAmount(text) {
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

  const commonAmounts = cleanText.match(/\b(999|899|799)\b/g);

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

async function runPaymentOcr(buffer) {
  const result = await Tesseract.recognize(buffer, "eng");

  const text = normalizeOcrText(result?.data?.text || "");

  return {
    text,
    amount: extractPaymentAmount(text),
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
        mobile,
        dob,
        address,
        district,
        state,
        pincode,
        package_name,
        package_amount,
        coupon_code,
        coupon_type,
      } = req.body || {};

      /* REQUIRED FIELDS */

      if (
        !full_name ||
        !mobile ||
        !dob ||
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

      const cleanDob = String(dob).trim();

      if (!cleanDob) {
        return res.status(400).json({
          success: false,
          message: "Date of birth is required.",
        });
      }

      /* REGISTRATION FEE */

      const packageName = normalizePackageName(package_name);
      const packageAmount = Number(package_amount);
      const couponCode = String(coupon_code || "").trim().toUpperCase();
      const couponType = String(coupon_type || "").trim().toUpperCase();

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

      if (!VALID_REGISTRATION_AMOUNTS.includes(packageAmount)) {
        return res.status(400).json({
          success: false,
          message: "Invalid registration amount.",
        });
      }

      /* COUPON VALIDATION */

      if (couponCode) {
        const coupon = VALID_COUPONS[couponCode];

        if (!coupon) {
          return res.status(400).json({
            success: false,
            message: "Invalid coupon code.",
          });
        }

        if (coupon.type !== couponType) {
          return res.status(400).json({
            success: false,
            message: "Invalid coupon type.",
          });
        }

        if (coupon.amount !== packageAmount) {
          return res.status(400).json({
            success: false,
            message: "Coupon amount does not match.",
          });
        }
      }

      if (packageAmount !== BASE_REGISTRATION_FEE && !couponCode) {
        return res.status(400).json({
          success: false,
          message:
            "A valid coupon is required for the selected discounted amount.",
        });
      }

      if (packageAmount === BASE_REGISTRATION_FEE && couponCode) {
        return res.status(400).json({
          success: false,
          message: "Coupon amount is invalid for \u20b9999 registration.",
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
          dob: cleanDob,
          address: String(address).trim(),
          district: String(district).trim(),
          state: String(state).trim(),
          pincode: cleanPincode,
          participant_photo: photoData.path,
          package_name: packageName,
          package_amount: packageAmount,
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
      console.error("CREATE REGISTRATION ERROR:", error);

      return res.status(500).json({
        success: false,
        message: error.message || "Registration failed.",
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
        address,
        district,
        state,
        pincode,
        participant_photo,
        package_name,
        package_amount,
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
    const coupon = couponFromAmount(recoveredAmount);

    return res.json({
      success: true,
      message: "Registration recovered successfully.",
      registration: {
        ...data,
        amount: recoveredAmount,
        base_amount: BASE_REGISTRATION_FEE,
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

        ocr = await runPaymentOcr(req.file.buffer);

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
        address,
        district,
        state,
        pincode,
        participant_photo,
        package_name,
        package_amount,
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
    const coupon = couponFromAmount(amount);

    return res.json({
      success: true,
      registration: {
        ...data,
        amount,
        base_amount: BASE_REGISTRATION_FEE,
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

/* =========================================================
   SERVER START
========================================================= */

app.listen(PORT, () => {
  console.log("");
  console.log("================================");
  console.log("Rangavallika Backend Running");
  console.log(`Server: http://localhost:${PORT}`);
  console.log("Registration Fees: \u20b9999 / \u20b9899 / \u20b9799");
  console.log("Registration IDs: GLF001, GLF002, GLF003...");
  console.log("Server-side OCR: ENABLED");
  console.log("================================");
  console.log("");
});