import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin-queries.css";
import "../styles/admin-coupons.css";

const rawApiUrl = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).trim().replace(/\/$/, "");
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

const DISCOUNT_TYPES = [
  { value: "fixed_price", label: "Fixed price (participant pays ₹X)" },
  { value: "flat", label: "Flat discount (₹X off)" },
  { value: "percent", label: "Percentage discount (X% off)" },
];

const EMPTY_FORM = {
  code: "",
  title: "",
  description: "",
  discount_type: "fixed_price",
  discount_value: "",
  is_active: true,
  valid_from: "",
  valid_until: "",
  max_uses: "",
};

// ISO -> value for <input type="datetime-local"> (local time)
const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const formatDateTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const computeFinalAmount = (type, value, baseFee) => {
  const v = Number(value);
  if (!Number.isFinite(v) || v <= 0) return null;
  let amount = baseFee;
  if (type === "fixed_price") amount = v;
  if (type === "flat") amount = baseFee - v;
  if (type === "percent") amount = baseFee - (baseFee * v) / 100;
  return Math.max(1, Math.min(baseFee, Math.round(amount)));
};

const describeDiscount = (coupon) => {
  const v = Number(coupon.discount_value);
  if (coupon.discount_type === "fixed_price") return `Pays ₹${v}`;
  if (coupon.discount_type === "flat") return `₹${v} off`;
  if (coupon.discount_type === "percent") return `${v}% off`;
  return "—";
};

// Active / Scheduled / Expired / Used up / Disabled
const getCouponState = (coupon) => {
  const now = Date.now();
  if (!coupon.is_active) return { label: "Disabled", className: "coupon-state-disabled" };
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
    return { label: "Scheduled", className: "coupon-state-scheduled" };
  }
  if (coupon.valid_until && new Date(coupon.valid_until).getTime() < now) {
    return { label: "Expired", className: "coupon-state-expired" };
  }
  if (coupon.max_uses && coupon.used_paid >= coupon.max_uses) {
    return { label: "Used up", className: "coupon-state-expired" };
  }
  return { label: "Active", className: "coupon-state-active" };
};

function AdminCoupons() {
  const navigate = useNavigate();

  const [coupons, setCoupons] = useState([]);
  const [baseFee, setBaseFee] = useState(799);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(null); // null | "new" | coupon id
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  });

  // =========================================================
  // FETCH
  // =========================================================

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/admin/coupons`, {
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to fetch coupons.");
      }

      setCoupons(data.coupons || []);
      if (data.base_fee) setBaseFee(data.base_fee);
    } catch (err) {
      console.error("FETCH COUPONS ERROR:", err);
      setError(err.message || "Unable to load coupons. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  // =========================================================
  // FILTER + COUNTS
  // =========================================================

  const filteredCoupons = useMemo(() => {
    const text = search.toLowerCase().trim();
    if (!text) return coupons;
    return coupons.filter((c) =>
      [c.code, c.title, c.description].some((v) =>
        String(v || "").toLowerCase().includes(text)
      )
    );
  }, [coupons, search]);

  const activeCount = coupons.filter(
    (c) => getCouponState(c).label === "Active"
  ).length;

  const totalPaidUses = coupons.reduce((sum, c) => sum + (c.used_paid || 0), 0);

  // =========================================================
  // FORM
  // =========================================================

  const openNew = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditing("new");
  };

  const openEdit = (coupon) => {
    setForm({
      code: coupon.code,
      title: coupon.title || "",
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: String(coupon.discount_value ?? ""),
      is_active: Boolean(coupon.is_active),
      valid_from: toLocalInput(coupon.valid_from),
      valid_until: toLocalInput(coupon.valid_until),
      max_uses: coupon.max_uses ? String(coupon.max_uses) : "",
    });
    setFormError("");
    setEditing(coupon.id);
  };

  const closeForm = () => {
    if (saving) return;
    setEditing(null);
    setFormError("");
  };

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFormError("");
  };

  const previewAmount = computeFinalAmount(
    form.discount_type,
    form.discount_value,
    baseFee
  );

  const saveCoupon = async (e) => {
    e.preventDefault();

    const code = form.code.trim().toUpperCase();

    if (!/^[A-Z0-9_-]{3,40}$/.test(code)) {
      setFormError("Code must be 3–40 characters: letters, numbers, - or _.");
      return;
    }
    if (!previewAmount) {
      setFormError("Enter a discount value greater than 0.");
      return;
    }
    if (form.discount_type === "percent" && Number(form.discount_value) > 100) {
      setFormError("Percent discount cannot be more than 100.");
      return;
    }
    if (form.discount_type === "fixed_price" && Number(form.discount_value) > baseFee) {
      setFormError(`Fixed price cannot be more than the registration fee (₹${baseFee}).`);
      return;
    }

    const payload = {
      ...form,
      code,
      discount_value: Number(form.discount_value),
      max_uses: form.max_uses === "" ? null : Number(form.max_uses),
      valid_from: form.valid_from ? new Date(form.valid_from).toISOString() : null,
      valid_until: form.valid_until ? new Date(form.valid_until).toISOString() : null,
    };

    try {
      setSaving(true);
      setFormError("");

      const isNew = editing === "new";
      const response = await fetch(
        isNew ? `${API_URL}/admin/coupons` : `${API_URL}/admin/coupons/${editing}`,
        {
          method: isNew ? "POST" : "PUT",
          headers: { ...authHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to save coupon.");
      }

      setEditing(null);
      await fetchCoupons();
    } catch (err) {
      console.error("SAVE COUPON ERROR:", err);
      setFormError(err.message || "Unable to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  // =========================================================
  // QUICK ACTIONS
  // =========================================================

  const toggleActive = async (coupon) => {
    try {
      setBusyId(coupon.id);
      setError("");

      const response = await fetch(`${API_URL}/admin/coupons/${coupon.id}`, {
        method: "PUT",
        headers: { ...authHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !coupon.is_active }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to update coupon.");
      }

      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, is_active: data.coupon.is_active } : c))
      );
    } catch (err) {
      console.error("TOGGLE COUPON ERROR:", err);
      setError(err.message || "Unable to update coupon.");
    } finally {
      setBusyId(null);
    }
  };

  const deleteCoupon = async (coupon) => {
    const confirmed = window.confirm(
      `Delete coupon ${coupon.code}? Participants will no longer be able to use it. ` +
        "Existing registrations keep their price."
    );
    if (!confirmed) return;

    try {
      setBusyId(coupon.id);
      setError("");

      const response = await fetch(`${API_URL}/admin/coupons/${coupon.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to delete coupon.");
      }

      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      if (editing === coupon.id) setEditing(null);
    } catch (err) {
      console.error("DELETE COUPON ERROR:", err);
      setError(err.message || "Unable to delete coupon.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="admin-sidebar">

        <div className="admin-brand">
          <div className="admin-brand-mark">GL</div>
          <div>
            <strong>Give Laurels</strong>
            <span>Admin Portal</span>
          </div>
        </div>

        <nav className="admin-nav">
          <button type="button" onClick={() => navigate("/admin/dashboard")}>
            <span>▦</span>
            Dashboard
          </button>

          <button type="button" onClick={() => navigate("/admin/registrations")}>
            <span>♙</span>
            Registrations
          </button>

          <button type="button" onClick={() => navigate("/admin/queries")}>
            <span>✉</span>
            Queries
          </button>

          <button type="button" onClick={() => navigate("/admin/payments")}>
            <span>₹</span>
            Payments
          </button>

          <button
            type="button"
            className="active"
            onClick={() => navigate("/admin/coupons")}
          >
            <span>%</span>
            Coupons
          </button>
        </nav>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="admin-main">

        <div className="admin-topbar">
          <div>
            <h1>Coupons</h1>
            <p>
              Create and manage registration coupons. Registration fee: ₹{baseFee}
            </p>
          </div>

          <div className="coupon-topbar-actions">
            <button
              type="button"
              className="refresh-button"
              onClick={fetchCoupons}
              disabled={loading}
            >
              {loading ? "Loading..." : "↻ Refresh"}
            </button>

            <button type="button" className="coupon-primary-button" onClick={openNew}>
              + New Coupon
            </button>
          </div>
        </div>


        {/* SUMMARY */}

        <section className="query-summary-grid">
          <div className="query-summary-card">
            <span>Total Coupons</span>
            <strong>{loading ? "—" : coupons.length}</strong>
          </div>

          <div className="query-summary-card">
            <span>Active Now</span>
            <strong>{loading ? "—" : activeCount}</strong>
          </div>

          <div className="query-summary-card">
            <span>Paid Registrations Using Coupons</span>
            <strong>{loading ? "—" : totalPaidUses}</strong>
          </div>
        </section>


        {/* TOOLBAR */}

        <section className="query-toolbar">
          <div className="query-search">
            <span>⌕</span>
            <input
              type="text"
              placeholder="Search code, title or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button type="button" onClick={() => setSearch("")}>
            Clear
          </button>
        </section>


        {error && <div className="query-error">{error}</div>}


        {/* TABLE */}

        <section className="query-table-card">

          <div className="query-table-header">
            <div>
              <h2>All Coupons</h2>
              <p>
                {loading
                  ? "Loading coupons..."
                  : `${filteredCoupons.length} ${
                      filteredCoupons.length === 1 ? "coupon" : "coupons"
                    } found`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="query-empty-state">
              <div className="query-empty-icon">...</div>
              <h3>Loading coupons</h3>
              <p>Fetching coupons from the database.</p>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="query-empty-state">
              <div className="query-empty-icon">%</div>
              <h3>No coupons found</h3>
              <p>Click “New Coupon” to create one.</p>
            </div>
          ) : (
            <div className="query-table-wrapper">
              <table className="query-table coupon-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Discount</th>
                    <th>Final Price</th>
                    <th>Used (paid / all)</th>
                    <th>Valid</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCoupons.map((coupon) => {
                    const state = getCouponState(coupon);
                    const busy = busyId === coupon.id;

                    return (
                      <tr key={coupon.id}>
                        <td>
                          <strong className="coupon-code">{coupon.code}</strong>
                          {coupon.title && (
                            <div className="coupon-subtext">{coupon.title}</div>
                          )}
                        </td>

                        <td>{describeDiscount(coupon)}</td>

                        <td>
                          <strong>₹{coupon.final_amount}</strong>
                        </td>

                        <td>
                          {coupon.used_paid} / {coupon.used_total}
                          <div className="coupon-subtext">
                            Limit: {coupon.max_uses || "Unlimited"}
                          </div>
                        </td>

                        <td className="coupon-dates">
                          <div>From: {formatDateTime(coupon.valid_from)}</div>
                          <div>Until: {formatDateTime(coupon.valid_until)}</div>
                        </td>

                        <td>
                          <span className={`coupon-state ${state.className}`}>
                            {state.label}
                          </span>
                        </td>

                        <td>
                          <div className="coupon-row-actions">
                            <button
                              type="button"
                              className="query-view-button"
                              onClick={() => openEdit(coupon)}
                              disabled={busy}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              className="coupon-toggle-button"
                              onClick={() => toggleActive(coupon)}
                              disabled={busy}
                            >
                              {coupon.is_active ? "Disable" : "Enable"}
                            </button>

                            <button
                              type="button"
                              className="coupon-delete-button"
                              onClick={() => deleteCoupon(coupon)}
                              disabled={busy}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </section>

      </main>


      {/* =====================================================
          CREATE / EDIT MODAL
      ===================================================== */}

      {editing !== null && (
        <div className="query-modal-overlay" onClick={closeForm}>
          <form
            className="query-modal coupon-modal"
            onClick={(e) => e.stopPropagation()}
            onSubmit={saveCoupon}
          >
            <div className="query-modal-header">
              <div>
                <span>{editing === "new" ? "NEW COUPON" : `EDIT ${form.code}`}</span>
                <h2>{editing === "new" ? "Create Coupon" : "Edit Coupon"}</h2>
              </div>

              <button
                type="button"
                className="query-modal-close"
                onClick={closeForm}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="coupon-form-grid">

              <label className="coupon-field">
                <span>Coupon Code *</span>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) =>
                    updateForm("code", e.target.value.toUpperCase().replace(/\s/g, ""))
                  }
                  placeholder="e.g. DIWALI100"
                  maxLength={40}
                  required
                />
                <small>Letters, numbers, - and _ only.</small>
              </label>

              <label className="coupon-field">
                <span>Title</span>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => updateForm("title", e.target.value)}
                  placeholder="e.g. Diwali Offer"
                  maxLength={80}
                />
                <small>Shown to participants when applied.</small>
              </label>

              <label className="coupon-field coupon-field-wide">
                <span>Description</span>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => updateForm("description", e.target.value)}
                  placeholder="e.g. Special offer for school students"
                  maxLength={160}
                />
              </label>

              <label className="coupon-field">
                <span>Discount Type *</span>
                <select
                  value={form.discount_type}
                  onChange={(e) => updateForm("discount_type", e.target.value)}
                >
                  {DISCOUNT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="coupon-field">
                <span>
                  {form.discount_type === "fixed_price" && "Price to Pay (₹) *"}
                  {form.discount_type === "flat" && "Amount Off (₹) *"}
                  {form.discount_type === "percent" && "Percent Off (%) *"}
                </span>
                <input
                  type="number"
                  min="1"
                  max={form.discount_type === "percent" ? 100 : baseFee}
                  step="1"
                  value={form.discount_value}
                  onChange={(e) => updateForm("discount_value", e.target.value)}
                  required
                />
              </label>

              <div className="coupon-preview coupon-field-wide">
                <span>Participant pays</span>
                <strong>{previewAmount ? `₹${previewAmount}` : "—"}</strong>
                {previewAmount && previewAmount < baseFee && (
                  <em>saves ₹{baseFee - previewAmount} on ₹{baseFee}</em>
                )}
              </div>

              <label className="coupon-field">
                <span>Valid From</span>
                <input
                  type="datetime-local"
                  value={form.valid_from}
                  onChange={(e) => updateForm("valid_from", e.target.value)}
                />
                <small>Leave empty to start immediately.</small>
              </label>

              <label className="coupon-field">
                <span>Valid Until</span>
                <input
                  type="datetime-local"
                  value={form.valid_until}
                  onChange={(e) => updateForm("valid_until", e.target.value)}
                />
                <small>Leave empty for no expiry.</small>
              </label>

              <label className="coupon-field">
                <span>Usage Limit</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.max_uses}
                  onChange={(e) => updateForm("max_uses", e.target.value)}
                  placeholder="Unlimited"
                />
                <small>Counts paid registrations. Empty = unlimited.</small>
              </label>

              <label className="coupon-field coupon-switch-field">
                <span>Status</span>
                <span className="coupon-switch">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => updateForm("is_active", e.target.checked)}
                  />
                  <b>{form.is_active ? "Active" : "Disabled"}</b>
                </span>
                <small>Disabled coupons cannot be applied.</small>
              </label>

            </div>

            {formError && <div className="query-error coupon-form-error">{formError}</div>}

            <div className="query-modal-actions coupon-modal-actions">
              <button
                type="button"
                className="coupon-cancel-button"
                onClick={closeForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button type="submit" className="coupon-primary-button" disabled={saving}>
                {saving ? "Saving..." : editing === "new" ? "Create Coupon" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

export default AdminCoupons;
