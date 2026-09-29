import React, { useEffect, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import "./Payment.css";
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

const API_ROOT = API_URL.endsWith("/api")
  ? API_URL
  : `${API_URL}/api`;
const PAYMENT_WINDOW_SECONDS = 14 * 60;

const Payment = ({
  registrationId,
  registration,
  selectedPackage,
  isExistingRegistration = false,
  onBack,
  onHome,
}) => {
  const actualRegistrationId = registrationId || registration?.registration_id || "";

  const initialStatus = String(registration?.payment_status || "INITIATED")
    .trim()
    .toUpperCase();

  const [currentRegistration, setCurrentRegistration] = useState(registration || null);
  const [paymentStatus, setPaymentStatus] = useState(initialStatus);
  const [paymentPage, setPaymentPage] = useState(
    initialStatus === "SUCCESS" || initialStatus === "FAILED" ? "result" : "pay"
  );
  const [error, setError] = useState("");
  const [initiatingPayment, setInitiatingPayment] = useState(false);
  const [paymentTxnId, setPaymentTxnId] = useState("");
  const autoInitiationAttempted = useRef(false);

  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!actualRegistrationId) return PAYMENT_WINDOW_SECONDS;
    const key = `rangavallika_payment_expires_${actualRegistrationId}`;
    const saved = Number(localStorage.getItem(key));
    if (saved && saved > Date.now()) {
      return Math.max(0, Math.ceil((saved - Date.now()) / 1000));
    }
    const expires = Date.now() + PAYMENT_WINDOW_SECONDS * 1000;
    localStorage.setItem(key, String(expires));
    return PAYMENT_WINDOW_SECONDS;
  });

  const packageName = String(
    currentRegistration?.package_name ||
      registration?.package_name ||
      selectedPackage?.package_name ||
      selectedPackage?.name ||
      "RANGAVALLIKA"
  ).toUpperCase();

  const amount = Number(
    currentRegistration?.package_amount ??
      registration?.package_amount ??
      selectedPackage?.amount ??
      selectedPackage?.package_amount ??
      0
  );

  const formatPaymentDate = (value) => {
    if (!value) return "Not available";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    }).format(date);
  };

  const formatTimer = (totalSeconds) => {
    const safe = Math.max(0, Number(totalSeconds) || 0);
    const minutes = Math.floor(safe / 60).toString().padStart(2, "0");
    const seconds = (safe % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const paymentExpired = secondsLeft <= 0;

  const [failureReason, setFailureReason] = useState("");


  // Detect return from Easebuzz. The backend verifies the gateway response
  // before redirecting back to the frontend.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gatewayResult = params.get("payment");
    const returnedRegistrationId = params.get("registration_id");
    const reasonParam = params.get("reason") || params.get("error");

    if (reasonParam) {
      setFailureReason(reasonParam);
    }

    if (
      gatewayResult === "success" ||
      gatewayResult === "failed" ||
      gatewayResult === "pending"
    ) {
      setPaymentPage("result");
      if (gatewayResult === "failed") {
        setPaymentStatus("FAILED");
      }
    }
  }, [actualRegistrationId]);

  // Countdown. It is persisted in localStorage so a page refresh does not
  // silently restart the 14-minute window.
  useEffect(() => {
    if (!actualRegistrationId || paymentStatus === "SUCCESS") return undefined;

    const key = `rangavallika_payment_expires_${actualRegistrationId}`;
    let expires = Number(localStorage.getItem(key));

    if (!expires || expires <= Date.now()) {
      expires = Date.now() + PAYMENT_WINDOW_SECONDS * 1000;
      localStorage.setItem(key, String(expires));
    }

    const updateTimer = () => {
      setSecondsLeft(Math.max(0, Math.ceil((expires - Date.now()) / 1000)));
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [actualRegistrationId, paymentStatus]);

  const initiateEasebuzzPayment = async () => {
    setError("");

    if (!actualRegistrationId) {
      setError("Registration ID is missing. Please restart registration.");
      return;
    }

    // Coupon amounts are set in the admin dashboard; ₹999 is the old (legacy) fee.
    if (!Number.isInteger(amount) || amount < 1 || amount > 999) {
      setError("Invalid registration amount.");
      return;
    }

    if (paymentExpired) {
      setError("The 14-minute payment window has expired. Please start a new payment.");
      return;
    }

    if (initiatingPayment) return;

    try {
      setInitiatingPayment(true);
      setPaymentPage("processing");

      const response = await fetch(`${API_ROOT}/payment/easebuzz/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registration_id: actualRegistrationId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success || !result.payment_url) {
        throw new Error(result.message || "Unable to start secure payment.");
      }

      setPaymentTxnId(result.txnid || "");
      setPaymentStatus("PAYMENT_INITIATED");

      if (result.expires_in) {
        const currentKey = `rangavallika_payment_expires_${actualRegistrationId}`;
        const currentExpiry = Number(localStorage.getItem(currentKey));
        if (!currentExpiry || currentExpiry <= Date.now()) {
          localStorage.setItem(
            currentKey,
            String(Date.now() + Number(result.expires_in) * 1000)
          );
        }
      }
const paymentTarget = String(result.payment_url || "").trim();

if (!paymentTarget) {
  throw new Error("Easebuzz did not return a payment access key.");
}

console.log("Easebuzz access key received.");

const checkoutUrl = paymentTarget.startsWith("http://") || paymentTarget.startsWith("https://")
  ? paymentTarget
  : `https://pay.easebuzz.in/pay/${paymentTarget}`;

console.log("Opening Easebuzz:", checkoutUrl);

window.location.assign(checkoutUrl);
    } catch (err) {
      console.error("Easebuzz initiation error:", err);
      autoInitiationAttempted.current = false;
      setError(err.message || "Unable to start payment.");
      setPaymentPage("pay");
    } finally {
      setInitiatingPayment(false);
    }
  };

  // Easebuzz is intentionally NOT opened automatically.
  // The participant first reviews the registration/payment details,
  // then clicks "Proceed to Payment".

  // Poll the backend after returning from Easebuzz. The backend is the source
  // of truth; the browser never marks a payment successful by itself.
  useEffect(() => {
    if (!actualRegistrationId) return undefined;
    if (paymentPage !== "result") return undefined;

    let cancelled = false;

    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${API_ROOT}/registration/${actualRegistrationId}/status`,
          { cache: "no-store" }
        );
        const result = await response.json();

        if (!cancelled && response.ok && result.success && result.registration) {
          const latest = result.registration;
          const latestStatus = String(latest.payment_status || "")
            .trim()
            .toUpperCase();

          setCurrentRegistration(latest);
          setPaymentStatus(latestStatus);
          setPaymentTxnId(latest.payment_id || "");

          localStorage.setItem(
            "rangavallika_registration",
            JSON.stringify(latest)
          );
        }
      } catch (err) {
        console.error("Payment status polling error:", err);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [paymentPage, actualRegistrationId]);

  const handleGoHome = () => {
    localStorage.removeItem("rangavallika_current_step");
    localStorage.removeItem("rangavallika_registration");
    if (actualRegistrationId) {
      localStorage.removeItem(`rangavallika_payment_expires_${actualRegistrationId}`);
    }
    if (onHome) onHome();
  };

  const restartPaymentWindow = () => {
    if (!actualRegistrationId) return;
    const expires = Date.now() + PAYMENT_WINDOW_SECONDS * 1000;
    localStorage.setItem(
      `rangavallika_payment_expires_${actualRegistrationId}`,
      String(expires)
    );
    setSecondsLeft(PAYMENT_WINDOW_SECONDS);
    setError("");
    setPaymentStatus("INITIATED");
    autoInitiationAttempted.current = false;
    setPaymentPage("pay");
  };

const downloadReceipt = () => {
  // Official payment receipt is available only after SUCCESS
  if (paymentStatus !== "SUCCESS") {
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");

  const r =
    currentRegistration ||
    registration ||
    {};

  const registrationId =
    r.registration_id ||
    actualRegistrationId ||
    "N/A";

  const participantName =
    r.full_name ||
    "N/A";

  const mobile =
    r.mobile ||
    "N/A";

  const district =
    r.district ||
    "N/A";

  const state =
    r.state ||
    "N/A";

  const pincode =
    r.pincode ||
    "N/A";

  const registrationName =
    r.package_name ||
    packageName ||
    "RANGAVALLIKA";

  const paymentAmount =
    Number(
      r.package_amount ??
      amount ??
      0
    );

  const utr =
    r.payment_id ||
    "N/A";

  const paymentDate =
    formatPaymentDate(
      r.payment_date_detected
    );

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  /* -------------------------------------------------
     COLOUR PALETTE
  ------------------------------------------------- */

  const teal = [42, 150, 145];

  const darkTeal = [25, 105, 102];

  const lavender = [232, 225, 248];

  const lightMint = [235, 248, 245];

  const gold = [218, 170, 72];

  const cream = [255, 252, 244];

  const darkText = [45, 55, 65];

  const mutedText = [105, 115, 125];

  const white = [255, 255, 255];

  /* -------------------------------------------------
     PAGE BACKGROUND
  ------------------------------------------------- */

  doc.setFillColor(...cream);

  doc.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    "F"
  );

  /* -------------------------------------------------
     TOP DECORATION
  ------------------------------------------------- */

  doc.setFillColor(...teal);

  doc.rect(
    0,
    0,
    pageWidth,
    10,
    "F"
  );

  doc.setFillColor(...lavender);

  doc.rect(
    0,
    10,
    pageWidth,
    5,
    "F"
  );

  /* -------------------------------------------------
     HEADER
  ------------------------------------------------- */

  doc.setFillColor(...white);

  doc.roundedRect(
    14,
    22,
    pageWidth - 28,
    45,
    6,
    6,
    "F"
  );

  doc.setFillColor(...gold);

  doc.roundedRect(
    25,
    27,
    45,
    2.5,
    1.2,
    1.2,
    "F"
  );

  doc.roundedRect(
    pageWidth - 70,
    27,
    45,
    2.5,
    1.2,
    1.2,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(23);

  doc.setTextColor(...darkTeal);

  doc.text(
    "RANGAVALLIKA",
    pageWidth / 2,
    38,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(12);

  doc.setTextColor(...darkText);

  doc.text(
    "Rangoli Competition",
    pageWidth / 2,
    46,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8.5);

  doc.setTextColor(...mutedText);

  doc.text(
    "GIVE LAURELS FOUNDATION OF INDIA",
    pageWidth / 2,
    53,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     TITLE
  ------------------------------------------------- */

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.setTextColor(...darkTeal);

  doc.text(
    "PAYMENT RECEIPT",
    pageWidth / 2,
    78,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(9);

  doc.setTextColor(...mutedText);

  doc.text(
    "Official Registration Payment Confirmation",
    pageWidth / 2,
    85,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     MAIN BOX
  ------------------------------------------------- */

  const boxX = 15;
  const boxY = 94;
  const boxW = pageWidth - 30;
  const boxH = 142;

  doc.setFillColor(
    220,
    228,
    226
  );

  doc.roundedRect(
    boxX + 1.5,
    boxY + 2,
    boxW,
    boxH,
    7,
    7,
    "F"
  );

  doc.setFillColor(...white);

  doc.setDrawColor(...lavender);

  doc.setLineWidth(0.7);

  doc.roundedRect(
    boxX,
    boxY,
    boxW,
    boxH,
    7,
    7,
    "FD"
  );

  /* -------------------------------------------------
     REGISTRATION ID
  ------------------------------------------------- */

  doc.setFillColor(...lightMint);

  doc.roundedRect(
    22,
    102,
    pageWidth - 44,
    19,
    4,
    4,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(...mutedText);

  doc.text(
    "REGISTRATION ID",
    29,
    109
  );

  doc.setFontSize(15);

  doc.setTextColor(...darkTeal);

  doc.text(
    registrationId,
    29,
    116
  );

  /* -------------------------------------------------
     DETAIL HELPER
  ------------------------------------------------- */

  const drawDetail = (
    label,
    value,
    x,
    y,
    width = 75
  ) => {
    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7.5);

    doc.setTextColor(...mutedText);

    doc.text(
      label.toUpperCase(),
      x,
      y
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9.5);

    doc.setTextColor(...darkText);

    const lines =
      doc.splitTextToSize(
        String(value ?? "N/A"),
        width
      );

    doc.text(
      lines,
      x,
      y + 6
    );
  };

  /* -------------------------------------------------
     PARTICIPANT DETAILS
  ------------------------------------------------- */

  drawDetail(
    "Participant Name",
    participantName,
    27,
    133,
    75
  );

  drawDetail(
    "Mobile Number",
    mobile,
    112,
    133,
    70
  );

  drawDetail(
    "District",
    district,
    27,
    151,
    75
  );

  drawDetail(
    "State",
    state,
    112,
    151,
    70
  );

  drawDetail(
    "Pincode",
    pincode,
    27,
    169,
    75
  );

  drawDetail(
    "Registration",
    registrationName,
    112,
    169,
    70
  );

  /* -------------------------------------------------
     PAYMENT INFORMATION
  ------------------------------------------------- */

  doc.setFillColor(...lavender);

  doc.roundedRect(
    22,
    181,
    pageWidth - 44,
    44,
    4,
    4,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(...darkTeal);

  doc.text(
    "PAYMENT INFORMATION",
    29,
    189
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7.5);

  doc.setTextColor(...mutedText);

  doc.text(
    "AMOUNT PAID",
    29,
    198
  );

  doc.setFontSize(15);

  doc.setTextColor(...darkTeal);

  doc.text(
    `Rs. ${paymentAmount}`,
    29,
    207
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7.5);

  doc.setTextColor(...mutedText);

  doc.text(
    "PAYMENT TRANSACTION ID",
    82,
    198
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8.5);

  doc.setTextColor(...darkText);

  doc.text(
    String(utr),
    82,
    207
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(7.5);

  doc.setTextColor(...mutedText);

  doc.text(
    "PAYMENT DATE",
    82,
    216
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(8.5);

  doc.setTextColor(...darkText);

  doc.text(
    String(paymentDate),
    82,
    222
  );

  /* -------------------------------------------------
     VERIFIED BADGE
  ------------------------------------------------- */

  doc.setFillColor(
    221,
    246,
    231
  );

  doc.roundedRect(
    151,
    198,
    31,
    17,
    4,
    4,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(
    34,
    120,
    72
  );

  doc.text(
    "VERIFIED",
    166.5,
    208,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     SUCCESS MESSAGE
  ------------------------------------------------- */

  doc.setFillColor(...teal);

  doc.roundedRect(
    15,
    245,
    pageWidth - 30,
    22,
    5,
    5,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(10);

  doc.setTextColor(...white);

  doc.text(
    "PAYMENT SUCCESSFULLY VERIFIED",
    pageWidth / 2,
    254,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7.5);

  doc.text(
    "Your registration payment has been confirmed by the organizers.",
    pageWidth / 2,
    261,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     IMPORTANT NOTE
  ------------------------------------------------- */

  doc.setFillColor(
    255,
    248,
    225
  );

  doc.setDrawColor(
    241,
    215,
    151
  );

  doc.roundedRect(
    15,
    276,
    pageWidth - 30,
    27,
    5,
    5,
    "FD"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(
    135,
    105,
    35
  );

  doc.text(
    "Important",
    23,
    285
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7.5);

  doc.setTextColor(...darkText);

  doc.text(
    "Please keep this receipt safely for your records.",
    23,
    293
  );

  doc.text(
    `Registration ID: ${registrationId}`,
    23,
    299
  );

  /* -------------------------------------------------
     FOOTER
  ------------------------------------------------- */

  doc.setDrawColor(...lavender);

  doc.setLineWidth(0.5);

  doc.line(
    25,
    315,
    pageWidth - 25,
    315
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(...darkTeal);

  doc.text(
    "RANGAVALLIKA RANGOLI COMPETITION",
    pageWidth / 2,
    323,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7);

  doc.setTextColor(...mutedText);

  doc.text(
    "Give Laurels Foundation of India • Hyderabad, Telangana, India",
    pageWidth / 2,
    330,
    {
      align: "center",
    }
  );

  doc.text(
    "Thank you for being a part of Rangavallika.",
    pageWidth / 2,
    337,
    {
      align: "center",
    }
  );

  doc.setFillColor(...gold);

  doc.rect(
    0,
    pageHeight - 5,
    pageWidth,
    2,
    "F"
  );

  doc.setFillColor(...teal);

  doc.rect(
    0,
    pageHeight - 3,
    pageWidth,
    3,
    "F"
  );

  doc.save(
    `${registrationId}-payment-receipt.pdf`
  );
};


/* =====================================================
   RECOVERY / REGISTRATION DETAILS PDF
===================================================== */

const downloadRegistrationDetails = () => {
  const doc = new jsPDF("p", "mm", "a4");

  const r =
    currentRegistration ||
    registration ||
    {};

  const registrationId =
    r.registration_id ||
    actualRegistrationId ||
    "N/A";

  const recoveryPin =
    r.recovery_pin ||
    "N/A";

  const participantName =
    r.full_name ||
    "N/A";

  const mobile =
    r.mobile ||
    "N/A";

  const district =
    r.district ||
    "N/A";

  const state =
    r.state ||
    "N/A";

  const pincode =
    r.pincode ||
    "N/A";

  const registrationName =
    r.package_name ||
    packageName ||
    "RANGAVALLIKA";

  const registrationAmount =
    Number(
      r.package_amount ??
      amount ??
      0
    );

  const utr =
    r.payment_id ||
    "Not available";

  const paymentDate =
    formatPaymentDate(
      r.payment_date_detected
    );

  const pageWidth =
    doc.internal.pageSize.getWidth();

  const pageHeight =
    doc.internal.pageSize.getHeight();

  /* -------------------------------------------------
     COLOUR PALETTE
  ------------------------------------------------- */

  const teal = [42, 150, 145];

  const darkTeal = [25, 105, 102];

  const lavender = [232, 225, 248];

  const lightMint = [235, 248, 245];

  const gold = [218, 170, 72];

  const cream = [255, 252, 244];

  const darkText = [45, 55, 65];

  const mutedText = [105, 115, 125];

  const white = [255, 255, 255];

  /* -------------------------------------------------
     BACKGROUND
  ------------------------------------------------- */

  doc.setFillColor(...cream);

  doc.rect(
    0,
    0,
    pageWidth,
    pageHeight,
    "F"
  );

  doc.setFillColor(...teal);

  doc.rect(
    0,
    0,
    pageWidth,
    10,
    "F"
  );

  doc.setFillColor(...lavender);

  doc.rect(
    0,
    10,
    pageWidth,
    5,
    "F"
  );

  /* -------------------------------------------------
     HEADER
  ------------------------------------------------- */

  doc.setFillColor(...white);

  doc.roundedRect(
    14,
    22,
    pageWidth - 28,
    45,
    6,
    6,
    "F"
  );

  doc.setFillColor(...gold);

  doc.roundedRect(
    25,
    27,
    45,
    2.5,
    1.2,
    1.2,
    "F"
  );

  doc.roundedRect(
    pageWidth - 70,
    27,
    45,
    2.5,
    1.2,
    1.2,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(23);

  doc.setTextColor(...darkTeal);

  doc.text(
    "RANGAVALLIKA",
    pageWidth / 2,
    38,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(12);

  doc.setTextColor(...darkText);

  doc.text(
    "Rangoli Competition",
    pageWidth / 2,
    46,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8.5);

  doc.setTextColor(...mutedText);

  doc.text(
    "GIVE LAURELS FOUNDATION OF INDIA",
    pageWidth / 2,
    53,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     TITLE
  ------------------------------------------------- */

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(18);

  doc.setTextColor(...darkTeal);

  doc.text(
    "REGISTRATION DETAILS",
    pageWidth / 2,
    78,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(9);

  doc.setTextColor(...mutedText);

  doc.text(
    "Keep this document safe for future reference",
    pageWidth / 2,
    85,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     MAIN BOX
  ------------------------------------------------- */

  const boxX = 15;
  const boxY = 94;
  const boxW = pageWidth - 30;
  const boxH = 174;

  doc.setFillColor(
    220,
    228,
    226
  );

  doc.roundedRect(
    boxX + 1.5,
    boxY + 2,
    boxW,
    boxH,
    7,
    7,
    "F"
  );

  doc.setFillColor(...white);

  doc.setDrawColor(...lavender);

  doc.setLineWidth(0.7);

  doc.roundedRect(
    boxX,
    boxY,
    boxW,
    boxH,
    7,
    7,
    "FD"
  );

  /* -------------------------------------------------
     ID + RECOVERY PIN
  ------------------------------------------------- */

  doc.setFillColor(...lightMint);

  doc.roundedRect(
    22,
    102,
    pageWidth - 44,
    38,
    5,
    5,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(...mutedText);

  doc.text(
    "REGISTRATION ID",
    30,
    110
  );

  doc.setFontSize(15);

  doc.setTextColor(...darkTeal);

  doc.text(
    registrationId,
    30,
    119
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(...mutedText);

  doc.text(
    "RECOVERY PIN",
    115,
    110
  );

  doc.setFillColor(...white);

  doc.setDrawColor(...gold);

  doc.setLineWidth(0.6);

  doc.roundedRect(
    112,
    113,
    62,
    17,
    4,
    4,
    "FD"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(15);

  doc.setTextColor(...darkTeal);

  doc.text(
    String(recoveryPin),
    143,
    124,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     DETAIL HELPER
  ------------------------------------------------- */

  const drawRecoveryDetail = (
    label,
    value,
    x,
    y,
    width = 75
  ) => {
    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(7.5);

    doc.setTextColor(...mutedText);

    doc.text(
      label.toUpperCase(),
      x,
      y
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(9.5);

    doc.setTextColor(...darkText);

    const lines =
      doc.splitTextToSize(
        String(value ?? "N/A"),
        width
      );

    doc.text(
      lines,
      x,
      y + 6
    );
  };

  /* -------------------------------------------------
     PARTICIPANT DETAILS
  ------------------------------------------------- */

  drawRecoveryDetail(
    "Participant Name",
    participantName,
    27,
    151,
    75
  );

  drawRecoveryDetail(
    "Mobile Number",
    mobile,
    112,
    151,
    70
  );

  drawRecoveryDetail(
    "District",
    district,
    27,
    169,
    75
  );

  drawRecoveryDetail(
    "State",
    state,
    112,
    169,
    70
  );

  drawRecoveryDetail(
    "Pincode",
    pincode,
    27,
    187,
    75
  );

  drawRecoveryDetail(
    "Registration",
    registrationName,
    112,
    187,
    70
  );

  /* -------------------------------------------------
     PAYMENT INFORMATION
  ------------------------------------------------- */

  doc.setFillColor(...lavender);

  doc.roundedRect(
    22,
    200,
    pageWidth - 44,
    49,
    4,
    4,
    "F"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(...darkTeal);

  doc.text(
    "PAYMENT INFORMATION",
    29,
    208
  );

  drawRecoveryDetail(
    "Registration Fee",
    `Rs. ${registrationAmount}`,
    29,
    217,
    55
  );

  drawRecoveryDetail(
    "UTR / Transaction ID",
    utr,
    92,
    217,
    85
  );

  drawRecoveryDetail(
    "Payment Date",
    paymentDate,
    29,
    235,
    65
  );

  drawRecoveryDetail(
  "Payment Status",
  paymentStatus === "SUCCESS"
    ? "PAYMENT SUCCESSFUL"
    : paymentStatus === "FAILED"
    ? "PAYMENT FAILED"
    : "PENDING",
  112,
  235
);

  /* -------------------------------------------------
     RECOVERY NOTICE
  ------------------------------------------------- */

  doc.setFillColor(
    255,
    248,
    225
  );

  doc.setDrawColor(
    241,
    215,
    151
  );

  doc.roundedRect(
    15,
    277,
    pageWidth - 30,
    34,
    5,
    5,
    "FD"
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(9);

  doc.setTextColor(
    135,
    105,
    35
  );

  doc.text(
    "IMPORTANT — KEEP YOUR RECOVERY DETAILS SAFE",
    pageWidth / 2,
    286,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7.5);

  doc.setTextColor(...darkText);

  doc.text(
    "Use your Registration ID and Recovery PIN to continue",
    pageWidth / 2,
    295,
    {
      align: "center",
    }
  );

  doc.text(
    "your registration from another device if required.",
    pageWidth / 2,
    302,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     FOOTER
  ------------------------------------------------- */

  doc.setDrawColor(...lavender);

  doc.setLineWidth(0.5);

  doc.line(
    25,
    319,
    pageWidth - 25,
    319
  );

  doc.setFont(
    "helvetica",
    "bold"
  );

  doc.setFontSize(8);

  doc.setTextColor(...darkTeal);

  doc.text(
    "RANGAVALLIKA RANGOLI COMPETITION",
    pageWidth / 2,
    327,
    {
      align: "center",
    }
  );

  doc.setFont(
    "helvetica",
    "normal"
  );

  doc.setFontSize(7);

  doc.setTextColor(...mutedText);

  doc.text(
    "Give Laurels Foundation of India • Hyderabad, Telangana, India",
    pageWidth / 2,
    334,
    {
      align: "center",
    }
  );

  doc.text(
    "Thank you for being a part of Rangavallika.",
    pageWidth / 2,
    341,
    {
      align: "center",
    }
  );

  /* -------------------------------------------------
     BOTTOM DECORATION
  ------------------------------------------------- */

  doc.setFillColor(...gold);

  doc.rect(
    0,
    pageHeight - 5,
    pageWidth,
    2,
    "F"
  );

  doc.setFillColor(...teal);

  doc.rect(
    0,
    pageHeight - 3,
    pageWidth,
    3,
    "F"
  );

  /* -------------------------------------------------
     SAVE
  ------------------------------------------------- */

  doc.save(
    `${registrationId}-registration-details.pdf`
  );
};


  if (paymentPage === "processing") {
    return (
      <div className="payment-page">
        <div className="processing-card">
          <div className="payment-brand">
            <img src="/logo.png" alt="Rangavallika" />
            <h1>RANGAVALLIKA</h1>
            <p>Rangoli Competition</p>
            <span>GIVE LAURELS FOUNDATION OF INDIA</span>
          </div>

          <div className="loading-spinner"></div>
          <h2>Opening Secure Payment</h2>
          <p>Connecting you to the Easebuzz secure payment page.</p>
          <div className="processing-list">
            <div>✓ Registration verified</div>
            <div>✓ Payment amount ₹{amount} verified</div>
            <div>✓ Creating secure transaction</div>
            <div>✓ Redirecting to Easebuzz...</div>
          </div>
          <div className="processing-warning">
            Please do not close this page while the secure payment page is opening.
          </div>
        </div>
      </div>
    );
  }

  if (paymentPage === "pay") {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <button className="payment-back" onClick={onBack}>
            ← Back
          </button>

          <div className="payment-brand">
            <img src="/logo.png" alt="Rangavallika" />
            <h1>RANGAVALLIKA</h1>
            <p>Rangoli Competition</p>
            <span>GIVE LAURELS FOUNDATION OF INDIA</span>
          </div>

          <div className="payment-title-card">
            <h2>Secure Registration Payment</h2>
            <p>
              Complete your registration payment securely through <strong>Easebuzz</strong>.
            </p>
          </div>

          <div className="payment-form-card">
            <div className="detail-row">
              <span>Registration ID</span>
              <strong>{actualRegistrationId}</strong>
            </div>

            <div className="detail-row">
              <span>Registration</span>
              <strong>{packageName}</strong>
            </div>

            <div className="detail-row">
              <span>Amount</span>
              <strong className="amount">₹{amount}</strong>
            </div>

            <div
              style={{
                marginTop: 24,
                padding: "20px",
                borderRadius: 16,
                background: "linear-gradient(135deg, #f4fbfa, #faf7ff)",
                textAlign: "center",
                border: "1px solid rgba(42,150,145,0.18)",
              }}
            >
              <div style={{ fontSize: 13, color: "#68737d", marginBottom: 8 }}>
                PAYMENT WINDOW
              </div>
              <div
                style={{
                  fontSize: 34,
                  fontWeight: 800,
                  letterSpacing: 2,
                  color: paymentExpired ? "#c62828" : "#196966",
                }}
              >
                {formatTimer(secondsLeft)}
              </div>
              <div style={{ fontSize: 12, color: "#68737d", marginTop: 6 }}>
                Complete payment before the timer expires.
              </div>
            </div>

            {error && <div className="payment-error">⚠️ {error}</div>}

            <div className="payment-notice" style={{ marginTop: 20 }}>
              🔒 Secure hosted payment by Easebuzz.
              <br />
              You will be redirected to the payment gateway to complete ₹{amount}.
              <br />
              Your payment is confirmed only after the gateway response is verified by our server.
            </div>

            <div
              className="payment-actions"
              style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}
            >
              {!paymentExpired ? (
                <>
                  <button
                    className="payment-primary-btn"
                    onClick={initiateEasebuzzPayment}
                    disabled={initiatingPayment}
                    style={{ width: "100%" }}
                  >
                    {initiatingPayment
                      ? "Opening Easebuzz..."
                      : `Proceed to Payment ₹${amount} →`}
                  </button>

                  <div
                    style={{
                      padding: "14px 18px",
                      borderRadius: 14,
                      background: "#f4fbfa",
                      border: "1px solid rgba(42,150,145,0.18)",
                      textAlign: "center",
                      color: "#196966",
                      fontWeight: 600,
                      fontSize: 13,
                    }}
                  >
                    🔒 Secure payment powered by <strong>Easebuzz</strong>
                    <div
                      style={{
                        marginTop: 6,
                        fontSize: 12,
                        fontWeight: 500,
                        color: "#68737d",
                      }}
                    >
                      You will see the Easebuzz QR / UPI payment screen after
                      clicking Proceed to Payment.
                    </div>
                  </div>
                </>
              ) : (
                <button
                  className="payment-secondary-btn"
                  onClick={() => {
                    autoInitiationAttempted.current = false;
                    restartPaymentWindow();
                  }}
                  style={{ width: "100%" }}
                >
                  Start New 14-Minute Payment Window
                </button>
              )}

              <button
                className="payment-secondary-btn"
                onClick={onBack}
                disabled={initiatingPayment}
              >
                ← Previous
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus === "SUCCESS";
  const isFailed = paymentStatus === "FAILED";
  const isPending = !isSuccess && !isFailed;
  const paymentTransactionId =
    currentRegistration?.payment_id || paymentTxnId || "Pending";
  const paymentDate = currentRegistration?.payment_date_detected;

  return (
    <div className="payment-page">
      <div className="payment-result-card">
        <div className="payment-brand">
          <img src="/logo.png" alt="Rangavallika" />
          <h1>RANGAVALLIKA</h1>
          <p>Rangoli Competition</p>
          <span>GIVE LAURELS FOUNDATION OF INDIA</span>
        </div>

        <div
          className={`result-icon ${
            isSuccess ? "success" : isFailed ? "failed" : "pending"
          }`}
        >
          {isSuccess ? "✓" : isFailed ? "!" : "✓"}
        </div>

        <h2>
          {isSuccess
            ? "Payment Successful!"
            : isFailed
            ? "Payment Failed"
            : "Payment pending"}
        </h2>

        <div className="result-message">
  {isSuccess
    ? "Your payment has been successfully verified by Easebuzz."
    : isFailed
    ? "The payment was not completed successfully."
    : "Your payment is currently pending. You can complete the payment later.Download the registration details"}
</div>
        <div className="result-details">
          <div>
            <span>Registration ID</span>
            <strong>{actualRegistrationId}</strong>
          </div>
          <div>
            <span>Participant</span>
            <strong>
              {currentRegistration?.full_name || registration?.full_name || ""}
            </strong>
          </div>
          <div>
            <span>Registration</span>
            <strong>{packageName}</strong>
          </div>
          <div>
            <span>Amount Paid</span>
            <strong>₹{amount}</strong>
          </div>
          <div>
            <span>Payment Transaction ID</span>
            <strong>{paymentTransactionId}</strong>
          </div>
          <div>
            <span>Payment Date</span>
            <strong>{formatPaymentDate(paymentDate)}</strong>
          </div>
          <div>
            <span>Payment Status</span>
            <strong
              className={
                isSuccess
                  ? "status-success"
                  : isFailed
                  ? "status-failed"
                  : "status-pending"
              }
            >
              {isSuccess ? "SUCCESS" : isFailed ? "FAILED" : "PENDING"}
            </strong>
          </div>
        </div>

        {isPending && (
          <>
            <div className="verification-notice">
              <strong>⏱ Confirming your payment</strong>
              <p>
                Please keep this page open. The final status comes from the
                payment gateway and is verified by our backend.
              </p>
            </div>
            <div className="live-status">
              <span className="live-dot"></span>
              Checking payment status...
            </div>
          </>
        )}

        {isFailed && (
          <div className="verification-notice failed-notice" style={{ background: "#fff5f5", border: "1px solid #feb2b2", borderRadius: 14, padding: "16px 20px" }}>
            <strong style={{ color: "#c53030", fontSize: 15 }}>⚠️ Payment Was Not Completed</strong>
            <p style={{ color: "#742a2a", marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>
              {failureReason ? failureReason : "The transaction was cancelled or declined by the payment gateway/bank. Don't worry, your registration details are saved."}
            </p>
            <div style={{ marginTop: 10, fontSize: 13, color: "#9b2c2c", fontWeight: 600 }}>
              💡 What you can do: Click "Try Payment Again" below to start a new payment window, or download your registration details slip.
            </div>
          </div>
        )}

        {isSuccess && (
          <div className="verification-notice success-notice">
            <strong>✓ Payment successfully verified</strong>
            <p>
              Your registration payment has been confirmed. Your official
              payment receipt is now available.
            </p>
          </div>
        )}

        <div className="result-actions">
          {isSuccess && (
            <button className="payment-secondary-btn" onClick={downloadReceipt}>
              ↓ Download Payment Receipt
            </button>
          )}

          {!isSuccess && (
            <button className="payment-secondary-btn" onClick={downloadRegistrationDetails}>
              ↓ Download Registration Details
            </button>
          )}

          {isFailed && (
            <button className="payment-primary-btn" onClick={restartPaymentWindow}>
              Start New Payment →
            </button>
          )}

          <button className="payment-primary-btn" onClick={handleGoHome}>
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
