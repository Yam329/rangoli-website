import React, { useEffect, useMemo, useState } from "react";
import AdminRegistrationDetails from "../components/AdminRegistrationDetails";

const rawApiUrl = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).trim().replace(/\/$/, "");
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

function AdminRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedRegistration, setSelectedRegistration] = useState(null);

  const token = localStorage.getItem("adminToken");

  const loadRegistrations = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/admin/registrations`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load registrations."
        );
      }

      setRegistrations(data.registrations || []);
    } catch (err) {
      console.error("ADMIN REGISTRATIONS ERROR:", err);
      setError(err.message || "Unable to load registrations.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistrations();
  }, []);

  const filteredRegistrations = useMemo(() => {
    const query = search.trim().toLowerCase();

    return registrations.filter((registration) => {
      const matchesSearch =
        !query ||
        String(registration.registration_id || "")
          .toLowerCase()
          .includes(query) ||
        String(registration.full_name || "")
          .toLowerCase()
          .includes(query) ||
        String(registration.mobile || "")
          .toLowerCase()
          .includes(query) ||
        String(registration.utr_number || "")
          .toLowerCase()
          .includes(query);

      const status = String(
        registration.payment_status || "PENDING"
      ).toUpperCase();

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [registrations, search, statusFilter]);

  const totalCount = registrations.length;

  const pendingCount = registrations.filter(
    (item) =>
      String(item.payment_status || "PENDING").toUpperCase() ===
      "PENDING"
  ).length;

  const successCount = registrations.filter(
    (item) =>
      String(item.payment_status || "").toUpperCase() ===
      "SUCCESS"
  ).length;

  const failedCount = registrations.filter(
    (item) =>
      String(item.payment_status || "").toUpperCase() ===
      "FAILED"
  ).length;

  const getStatusClass = (status) => {
    const value = String(status || "PENDING").toUpperCase();

    if (value === "SUCCESS") return "success";
    if (value === "FAILED") return "failed";

    return "pending";
  };

  const formatDate = (date) => {
    if (!date) return "—";

    try {
      return new Date(date).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return date;
    }
  };

  const exportCSV = () => {
    if (!registrations.length) {
      alert("No registrations available to export.");
      return;
    }

    const headers = [
      "Registration ID",
      "Full Name",
      "Mobile",
      "DOB",
      "State",
      "District",
      "Pincode",
      "Package",
      "Package Amount",
      "Payment Status",
      "UTR",
      "OCR Amount",
      "OCR Status",
      "UTR Verified",
      "Duplicate UTR",
      "Created At",
    ];

    const rows = registrations.map((item) => [
      item.registration_id,
      item.full_name,
      item.mobile,
      item.dob,
      item.state,
      item.district,
      item.pincode,
      item.package_name,
      item.package_amount,
      item.payment_status,
      item.utr_number,
      item.payment_amount_detected,
      item.ocr_status,
      item.utr_verified,
      item.duplicate_utr,
      item.created_at,
    ]);

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text = value == null ? "" : String(value);
            return `"${text.replace(/"/g, '""')}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `rangavallika-registrations-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  const handleUpdated = (updatedRegistration) => {
    setRegistrations((current) =>
      current.map((item) =>
        item.registration_id ===
        updatedRegistration.registration_id
          ? {
              ...item,
              ...updatedRegistration,
            }
          : item
      )
    );

    setSelectedRegistration(null);
  };

  const handleDeleted = (registrationId) => {
    setRegistrations((current) =>
      current.filter(
        (item) => item.registration_id !== registrationId
      )
    );

    setSelectedRegistration(null);
  };

  return (
    <div className="admin-registrations-page">
      <style>{`
        .admin-registrations-page {
          min-height: 100vh;
          background: #f5f7fb;
          padding: 32px;
          font-family: Arial, sans-serif;
          color: #172033;
        }

        .admin-page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
        }

        .admin-title {
          margin: 0;
          font-size: 30px;
          font-weight: 800;
        }

        .admin-subtitle {
          margin: 7px 0 0;
          color: #667085;
          font-size: 14px;
        }

        .admin-header-actions {
          display: flex;
          gap: 10px;
        }

        .admin-action-btn {
          border: 0;
          border-radius: 10px;
          padding: 11px 16px;
          cursor: pointer;
          font-weight: 700;
          background: #172033;
          color: white;
        }

        .admin-action-btn.secondary {
          background: white;
          color: #172033;
          border: 1px solid #dfe3eb;
        }

        .admin-summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .admin-summary-card {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(23, 32, 51, 0.04);
        }

        .admin-summary-label {
          color: #667085;
          font-size: 13px;
          margin-bottom: 9px;
        }

        .admin-summary-number {
          font-size: 28px;
          font-weight: 800;
        }

        .admin-toolbar {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 16px;
          padding: 16px;
          display: flex;
          gap: 12px;
          margin-bottom: 18px;
        }

        .admin-search {
          flex: 1;
          min-width: 200px;
          border: 1px solid #dfe3eb;
          border-radius: 10px;
          padding: 12px 14px;
          outline: none;
          font-size: 14px;
        }

        .admin-filter {
          border: 1px solid #dfe3eb;
          border-radius: 10px;
          padding: 12px 14px;
          background: white;
          min-width: 160px;
        }

        .admin-table-wrapper {
          background: white;
          border: 1px solid #e7eaf0;
          border-radius: 16px;
          overflow-x: auto;
          box-shadow: 0 4px 15px rgba(23, 32, 51, 0.04);
        }

        .admin-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1050px;
        }

        .admin-table th {
          background: #f8f9fc;
          color: #667085;
          font-size: 12px;
          text-align: left;
          padding: 14px 16px;
          border-bottom: 1px solid #e7eaf0;
          white-space: nowrap;
        }

        .admin-table td {
          padding: 15px 16px;
          border-bottom: 1px solid #eef0f4;
          font-size: 13px;
          white-space: nowrap;
        }

        .admin-table tr:last-child td {
          border-bottom: 0;
        }

        .registration-id {
          font-weight: 800;
          color: #2855d9;
        }

        .participant-name {
          font-weight: 700;
        }

        .status-badge {
          display: inline-flex;
          padding: 6px 10px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 800;
        }

        .status-badge.success {
          background: #e9f8ef;
          color: #15803d;
        }

        .status-badge.pending {
          background: #fff5d9;
          color: #a16207;
        }

        .status-badge.failed {
          background: #feecec;
          color: #c62828;
        }

        .view-btn {
          border: 0;
          background: #2855d9;
          color: white;
          border-radius: 8px;
          padding: 8px 13px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .admin-empty {
          text-align: center;
          padding: 55px 20px;
          color: #667085;
        }

        .admin-loading {
          padding: 60px;
          text-align: center;
          color: #667085;
        }

        .admin-error {
          background: #fff0f0;
          color: #c62828;
          border: 1px solid #ffd1d1;
          border-radius: 12px;
          padding: 15px;
          margin-bottom: 18px;
        }

        @media (max-width: 900px) {
          .admin-registrations-page {
            padding: 18px;
          }

          .admin-summary-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .admin-page-header {
            align-items: flex-start;
            flex-direction: column;
          }

          .admin-toolbar {
            flex-direction: column;
          }
        }

        @media (max-width: 520px) {
          .admin-summary-grid {
            grid-template-columns: 1fr;
          }

          .admin-title {
            font-size: 24px;
          }

          .admin-header-actions {
            width: 100%;
          }

          .admin-action-btn {
            flex: 1;
          }
        }
      `}</style>

      <div className="admin-page-header">
        <div>
          <h1 className="admin-title">Registrations</h1>
          <p className="admin-subtitle">
            Manage Rangavallika competition registrations and
            payment verification.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            className="admin-action-btn secondary"
            onClick={loadRegistrations}
          >
            ↻ Refresh
          </button>

          <button
            className="admin-action-btn"
            onClick={exportCSV}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <div className="admin-summary-label">
            Total Registrations
          </div>
          <div className="admin-summary-number">
            {totalCount}
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-label">
            Pending Verification
          </div>
          <div className="admin-summary-number">
            {pendingCount}
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-label">
            Successful
          </div>
          <div className="admin-summary-number">
            {successCount}
          </div>
        </div>

        <div className="admin-summary-card">
          <div className="admin-summary-label">
            Failed
          </div>
          <div className="admin-summary-number">
            {failedCount}
          </div>
        </div>
      </div>

      {error && (
        <div className="admin-error">
          {error}
        </div>
      )}

      <div className="admin-toolbar">
        <input
          className="admin-search"
          type="text"
          placeholder="Search registration ID, name, mobile or UTR..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="admin-filter"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <div className="admin-loading">
            Loading registrations...
          </div>
        ) : filteredRegistrations.length === 0 ? (
          <div className="admin-empty">
            <h3>No registrations found</h3>
            <p>
              No registrations match your current search or filter.
            </p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Registration ID</th>
                <th>Participant</th>
                <th>Mobile</th>
                <th>District</th>
                <th>Package</th>
                <th>Amount</th>
                <th>UTR</th>
                <th>Payment Status</th>
                <th>Registered On</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredRegistrations.map((registration) => (
                <tr
                  key={registration.registration_id}
                >
                  <td>
                    <span className="registration-id">
                      {registration.registration_id}
                    </span>
                  </td>

                  <td>
                    <span className="participant-name">
                      {registration.full_name || "—"}
                    </span>
                  </td>

                  <td>
                    {registration.mobile || "—"}
                  </td>

                  <td>
                    {registration.district || "—"}
                  </td>

                  <td>
                    {registration.package_name || "—"}
                  </td>

                  <td>
                    ₹
                    {registration.package_amount ??
                      registration.payment_amount_detected ??
                      "—"}
                  </td>

                  <td>
                    {registration.utr_number || "—"}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${getStatusClass(
                        registration.payment_status
                      )}`}
                    >
                      {String(
                        registration.payment_status ||
                          "PENDING"
                      ).toUpperCase()}
                    </span>
                  </td>

                  <td>
                    {formatDate(registration.created_at)}
                  </td>

                  <td>
                    <button
                      className="view-btn"
                      onClick={() =>
                        setSelectedRegistration(
                          registration.registration_id
                        )
                      }
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selectedRegistration && (
  <AdminRegistrationDetails
    registration={
      typeof selectedRegistration === "object"
        ? selectedRegistration
        : registrations.find(
            (item) =>
              item.registration_id ===
              selectedRegistration
          )
    }
    onClose={() =>
      setSelectedRegistration(null)
    }
    onUpdated={handleUpdated}
    onDeleted={handleDeleted}
  />
)}
    </div>
  );
}

export default AdminRegistrations;