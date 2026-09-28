import React, { useEffect, useState } from "react";

const rawApiUrl = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).trim().replace(/\/$/, "");
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

function AdminRegistrationDetails({
  registration,
  onClose,
  onUpdated,
  onDeleted,
}) {
  const [details, setDetails] = useState(
    registration || null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editMode, setEditMode] = useState(false);

  /* =====================================================
     LOAD DETAILS
  ===================================================== */

  useEffect(() => {
    if (!registration) {
      setDetails(null);
      setLoading(false);
      return;
    }

    setDetails(registration);

    if (!registration.registration_id) {
      setLoading(false);
      return;
    }

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const token =
          localStorage.getItem("adminToken");

        const response = await fetch(
          `${API_URL}/admin/registrations/${registration.registration_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        console.log(
          "REGISTRATION DETAILS API:",
          data
        );

        if (!response.ok || !data.success) {
          throw new Error(
            data.message ||
              "Unable to load registration details."
          );
        }

        const loaded =
          data.registration ||
          data.data ||
          data.result ||
          registration;

        setDetails(loaded);
      } catch (err) {
        console.error(
          "REGISTRATION DETAILS ERROR:",
          err
        );

        /*
         * Keep the data from the registrations list
         * available even if the detailed API fails.
         */
        setDetails(registration);

        setError(
          err.message ||
            "Unable to load complete registration details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDetails();
  }, [registration]);

  /* =====================================================
     UPDATE FIELD
  ===================================================== */

  const updateField = (field, value) => {
    setDetails((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  /* =====================================================
     SAVE
  ===================================================== */

  const handleSave = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/admin/registrations/${details.registration_id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: details.full_name,
            mobile: details.mobile,
            dob: details.dob,
            state: details.state,
            district: details.district,
            pincode: details.pincode,
            address: details.address,
            utr_number: details.utr_number,
            package_amount: details.package_amount,
            payment_status: details.payment_status,
            payment_amount_detected:
              details.payment_amount_detected,
            payment_date_detected:
              details.payment_date_detected,
            ocr_status: details.ocr_status,
            utr_verified: details.utr_verified,
            duplicate_utr: details.duplicate_utr,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to save changes."
        );
      }

      const updated =
        data.registration ||
        data.data ||
        details;

      setDetails(updated);
      setEditMode(false);
      setSuccess(
        "Registration updated successfully."
      );

      if (onUpdated) {
        onUpdated(updated);
      }
    } catch (err) {
      console.error(
        "SAVE REGISTRATION ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to save changes."
      );
    } finally {
      setSaving(false);
    }
  };

  /* =====================================================
     MARK AS PAID
  ===================================================== */

  const handleMarkPaid = async () => {
    if (
      !window.confirm(
        "Are you sure you want to mark this registration as PAID?"
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");
      setSuccess("");

      const token =
        localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/admin/registrations/${details.registration_id}/mark-paid`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to mark registration as paid."
        );
      }

      const updated =
        data.registration ||
        data.data ||
        {
          ...details,
          payment_status: "SUCCESS",
        };

      setDetails(updated);

      setSuccess(
        "Registration marked as PAID."
      );

      if (onUpdated) {
        onUpdated(updated);
      }
    } catch (err) {
      console.error(
        "MARK PAID ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to mark as paid."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = async () => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this registration?"
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      setError("");

      const token =
        localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/admin/registrations/${details.registration_id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to delete registration."
        );
      }

      if (onDeleted) {
        onDeleted(
          details.registration_id
        );
      }
    } catch (err) {
      console.error(
        "DELETE REGISTRATION ERROR:",
        err
      );

      setError(
        err.message ||
          "Unable to delete registration."
      );
    } finally {
      setActionLoading(false);
    }
  };

  /* =====================================================
     STATUS
  ===================================================== */

  const paymentStatus =
    String(
      details?.payment_status || ""
    )
      .trim()
      .toUpperCase();

  const statusConfig =
    paymentStatus === "SUCCESS"
      ? {
          text: "PAID",
          background: "#dcfce7",
          color: "#15803d",
        }
      : paymentStatus === "FAILED"
      ? {
          text: "FAILED",
          background: "#fee2e2",
          color: "#b91c1c",
        }
      : {
          text: "PENDING",
          background: "#fff7ed",
          color: "#c2410c",
        };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loading) {
    return (
      <Modal>
        <div
          style={{
            padding: "70px 30px",
            textAlign: "center",
            color: "#6076a7",
          }}
        >
          Loading registration details...
        </div>
      </Modal>
    );
  }

  /* =====================================================
     NO DATA
  ===================================================== */

  if (!details) {
    return (
      <Modal>
        <div
          style={{
            padding: "60px",
            textAlign: "center",
          }}
        >
          <h3
            style={{
              color: "#172b5f",
            }}
          >
            Unable to load registration
          </h3>

          <p
            style={{
              color: "#c2410c",
            }}
          >
            {error ||
              "Registration details not found."}
          </p>

          <button
            onClick={onClose}
            style={primaryButton}
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  /* =====================================================
     IMAGE URLS
  ===================================================== */

  const participantPhoto =
    details.participant_photo_url ||
    details.participant_photo_signed_url ||
    details.participant_photo;

  const paymentScreenshot =
    details.payment_screenshot_url ||
    details.payment_screenshot_signed_url ||
    details.payment_screenshot;

  return (
    <Modal>
      {/* HEADER */}

      <div
        style={{
          padding: "22px 28px",
          borderBottom:
            "1px solid #e7edf6",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "20px",
        }}
      >
        <div>
          <div
            style={{
              fontSize: "11px",
              color: "#7184ad",
              textTransform:
                "uppercase",
              letterSpacing: "1px",
              fontWeight: 800,
            }}
          >
            Registration Details
          </div>

          <h2
            style={{
              margin: "5px 0 0",
              color: "#10245a",
              fontSize: "25px",
            }}
          >
            {details.registration_id}
          </h2>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span
            style={{
              padding: "8px 13px",
              borderRadius: "999px",
              background:
                statusConfig.background,
              color:
                statusConfig.color,
              fontSize: "12px",
              fontWeight: 800,
            }}
          >
            {statusConfig.text}
          </span>

          <button
            onClick={onClose}
            style={{
              width: "38px",
              height: "38px",
              border: "none",
              borderRadius: "10px",
              background: "#f2f5fa",
              color: "#43587f",
              fontSize: "22px",
              cursor: "pointer",
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* BODY */}

      <div
        style={{
          padding: "24px 28px",
          overflowY: "auto",
          maxHeight:
            "calc(100vh - 185px)",
        }}
      >
        {error && (
          <div
            style={{
              background: "#fff1f2",
              color: "#b91c1c",
              padding: "12px 15px",
              borderRadius: "10px",
              marginBottom: "15px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              background: "#ecfdf5",
              color: "#15803d",
              padding: "12px 15px",
              borderRadius: "10px",
              marginBottom: "15px",
              fontSize: "13px",
            }}
          >
            {success}
          </div>
        )}

        {/* PERSONAL */}

        <SectionTitle>
          Personal Details
        </SectionTitle>

        <div style={gridStyle}>
          <Field
            label="Full Name"
            value={details.full_name}
            editable={editMode}
            onChange={(value) =>
              updateField(
                "full_name",
                value
              )
            }
          />

          <Field
            label="Date of Birth"
            value={details.dob}
            editable={editMode}
            onChange={(value) =>
              updateField(
                "dob",
                value
              )
            }
          />

          <Field
            label="Mobile Number"
            value={details.mobile}
            editable={editMode}
            onChange={(value) =>
              updateField(
                "mobile",
                value
              )
            }
          />

          <Field
            label="Recovery PIN"
            value={
              details.recovery_pin ||
              "—"
            }
            editable={false}
          />
        </div>

        {/* ADDRESS */}

        <SectionTitle>
          Address
        </SectionTitle>

        <div style={gridStyle}>
          <Field
            label="State"
            value={details.state}
            editable={editMode}
            onChange={(value) =>
              updateField(
                "state",
                value
              )
            }
          />

          <Field
            label="District"
            value={details.district}
            editable={editMode}
            onChange={(value) =>
              updateField(
                "district",
                value
              )
            }
          />

          <Field
            label="Pincode"
            value={details.pincode}
            editable={editMode}
            onChange={(value) =>
              updateField(
                "pincode",
                value
              )
            }
          />

          <Field
            label="Complete Address"
            value={details.address}
            editable={editMode}
            fullWidth
            onChange={(value) =>
              updateField(
                "address",
                value
              )
            }
          />
        </div>

        {/* PARTICIPANT PHOTO */}

        <SectionTitle>
          Participant Photo
        </SectionTitle>

        <div
          style={{
            background: "#f7f9fd",
            borderRadius: "16px",
            padding: "20px",
            border:
              "1px solid #e6ebf4",
            textAlign: "center",
          }}
        >
          {participantPhoto ? (
            <img
              src={participantPhoto}
              alt="Participant"
              style={{
                width: "180px",
                height: "220px",
                objectFit: "cover",
                borderRadius: "14px",
                border:
                  "1px solid #dce4f2",
              }}
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <div
              style={{
                padding: "45px",
                color: "#8192b6",
              }}
            >
              Participant photo unavailable
            </div>
          )}
        </div>

        {/* PAYMENT */}

        <SectionTitle>
          Payment Details
        </SectionTitle>

        <div style={gridStyle}>
          <Field
            label="Package Amount"
            value={
              details.package_amount !==
                null &&
              details.package_amount !==
                undefined
                ? `₹${Number(
                    details.package_amount
                  ).toLocaleString(
                    "en-IN"
                  )}`
                : "—"
            }
            editable={false}
          />

          <Field
            label="Payment Status"
            value={
              details.payment_status ||
              "—"
            }
            editable={editMode}
            onChange={(value) =>
              updateField(
                "payment_status",
                value
              )
            }
          />

          <Field
            label="UTR Number"
            value={
              details.utr_number ||
              "—"
            }
            editable={editMode}
            onChange={(value) =>
              updateField(
                "utr_number",
                value
              )
            }
          />

          <Field
            label="Payment Date"
            value={
              details.payment_date_detected ||
              "—"
            }
            editable={editMode}
            onChange={(value) =>
              updateField(
                "payment_date_detected",
                value
              )
            }
          />

          <Field
            label="OCR Detected Amount"
            value={
              details.payment_amount_detected !==
                null &&
              details.payment_amount_detected !==
                undefined
                ? `₹${details.payment_amount_detected}`
                : "—"
            }
            editable={editMode}
            onChange={(value) =>
              updateField(
                "payment_amount_detected",
                value
              )
            }
          />

          <Field
            label="OCR Status"
            value={
              details.ocr_status ||
              "—"
            }
            editable={editMode}
            onChange={(value) =>
              updateField(
                "ocr_status",
                value
              )
            }
          />

          <Field
            label="UTR Verified"
            value={
              details.utr_verified
                ? "YES"
                : "NO"
            }
            editable={false}
          />

          <Field
            label="Duplicate UTR"
            value={
              details.duplicate_utr
                ? "YES"
                : "NO"
            }
            editable={false}
          />
        </div>

        {/* PAYMENT SCREENSHOT */}

        <SectionTitle>
          Payment Screenshot
        </SectionTitle>

        <div
          style={{
            background: "#f7f9fd",
            borderRadius: "16px",
            padding: "20px",
            border:
              "1px solid #e6ebf4",
            textAlign: "center",
          }}
        >
          {paymentScreenshot ? (
            <img
              src={paymentScreenshot}
              alt="Payment Screenshot"
              style={{
                maxWidth: "100%",
                maxHeight: "500px",
                objectFit: "contain",
                borderRadius: "12px",
                border:
                  "1px solid #dce4f2",
              }}
              onError={(event) => {
                event.currentTarget.style.display =
                  "none";
              }}
            />
          ) : (
            <div
              style={{
                padding: "45px",
                color: "#8192b6",
              }}
            >
              Payment screenshot unavailable
            </div>
          )}
        </div>

        {/* INFORMATION */}

        <SectionTitle>
          Registration Information
        </SectionTitle>

        <div style={gridStyle}>
          <Field
            label="Created At"
            value={
              details.created_at
                ? new Date(
                    details.created_at
                  ).toLocaleString(
                    "en-IN"
                  )
                : "—"
            }
            editable={false}
          />

          <Field
            label="Updated At"
            value={
              details.updated_at
                ? new Date(
                    details.updated_at
                  ).toLocaleString(
                    "en-IN"
                  )
                : "—"
            }
            editable={false}
          />
        </div>
      </div>

      {/* FOOTER */}

      <div
        style={{
          padding: "17px 28px",
          borderTop:
            "1px solid #e7edf6",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
          gap: "10px",
          flexWrap: "wrap",
          background: "#fbfcff",
        }}
      >
        <button
          onClick={handleDelete}
          disabled={
            actionLoading || saving
          }
          style={{
            ...dangerButton,
            opacity:
              actionLoading || saving
                ? 0.6
                : 1,
          }}
        >
          Delete
        </button>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={onClose}
            style={secondaryButton}
          >
            Close
          </button>

          {!editMode ? (
            <button
              onClick={() => {
                setError("");
                setSuccess("");
                setEditMode(true);
              }}
              style={secondaryButton}
            >
              Edit
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                ...primaryButton,
                opacity: saving
                  ? 0.6
                  : 1,
              }}
            >
              {saving
                ? "Saving..."
                : "Save Changes"}
            </button>
          )}

          {paymentStatus !==
            "SUCCESS" && (
            <button
              onClick={handleMarkPaid}
              disabled={
                actionLoading || saving
              }
              style={{
                ...paidButton,
                opacity:
                  actionLoading || saving
                    ? 0.6
                    : 1,
              }}
            >
              {actionLoading
                ? "Processing..."
                : "Mark as Paid"}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* =====================================================
   MODAL
===================================================== */

function Modal({ children }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background:
          "rgba(10,25,55,.58)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "min(1050px, 100%)",
          maxHeight:
            "calc(100vh - 48px)",
          background: "#ffffff",
          borderRadius: "22px",
          boxShadow:
            "0 25px 80px rgba(8,25,60,.25)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </div>
    </div>
  );
}

/* =====================================================
   SECTION TITLE
===================================================== */

function SectionTitle({ children }) {
  return (
    <h3
      style={{
        margin: "26px 0 14px",
        color: "#18366f",
        fontSize: "17px",
        fontWeight: 800,
      }}
    >
      {children}
    </h3>
  );
}

/* =====================================================
   FIELD
===================================================== */

function Field({
  label,
  value,
  editable,
  onChange,
  fullWidth,
}) {
  return (
    <div
      style={{
        gridColumn:
          fullWidth
            ? "1 / -1"
            : "auto",
      }}
    >
      <label
        style={{
          display: "block",
          fontSize: "12px",
          color: "#7184ad",
          fontWeight: 700,
          marginBottom: "6px",
        }}
      >
        {label}
      </label>

      {editable ? (
        <input
          value={
            value === "—" ||
            value === null ||
            value === undefined
              ? ""
              : value
          }
          onChange={(event) =>
            onChange &&
            onChange(
              event.target.value
            )
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "11px 12px",
            border:
              "1px solid #d7e0ef",
            borderRadius: "10px",
            outline: "none",
            color: "#172b5f",
            fontSize: "13px",
            background: "#ffffff",
          }}
        />
      ) : (
        <div
          style={{
            minHeight: "42px",
            boxSizing: "border-box",
            padding: "11px 12px",
            border:
              "1px solid #e8edf5",
            borderRadius: "10px",
            background: "#f8faff",
            color: "#263b68",
            fontSize: "13px",
            display: "flex",
            alignItems: "center",
            wordBreak: "break-word",
          }}
        >
          {value === null ||
          value === undefined ||
          value === ""
            ? "—"
            : String(value)}
        </div>
      )}
    </div>
  );
}

/* =====================================================
   STYLES
===================================================== */

const primaryButton = {
  border: "none",
  background: "#315bc6",
  color: "#ffffff",
  padding: "11px 17px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const secondaryButton = {
  border: "1px solid #d6dfef",
  background: "#ffffff",
  color: "#31529c",
  padding: "11px 17px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const paidButton = {
  border: "none",
  background: "#16a36a",
  color: "#ffffff",
  padding: "11px 17px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const dangerButton = {
  border: "1px solid #fecaca",
  background: "#fff5f5",
  color: "#c62828",
  padding: "11px 17px",
  borderRadius: "10px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(2,minmax(0,1fr))",
  gap: "16px",
};

export default AdminRegistrationDetails;