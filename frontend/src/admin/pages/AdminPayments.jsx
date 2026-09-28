import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin-payments.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

const PAGE_SIZE = 10;

const AdminPayments = () => {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  /* =====================================================
     STATUS NORMALIZATION
  ===================================================== */

  const normalizeStatus = (status) => {
    const value = String(status || "")
      .trim()
      .toUpperCase();

    if (
      value === "SUCCESS" ||
      value === "PAID" ||
      value === "COMPLETED"
    ) {
      return "SUCCESS";
    }

    if (
      value === "FAILED" ||
      value === "FAILURE"
    ) {
      return "FAILED";
    }

    if (
      value === "PENDING" ||
      value === "PENDING_REVIEW" ||
      value === "INITIATED"
    ) {
      return "PENDING";
    }

    return "PENDING";
  };

  /* =====================================================
     LOAD PAYMENTS
  ===================================================== */

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("adminToken");

      const response = await fetch(
        `${API_URL}/api/admin/registrations`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token
              ? {
                  Authorization: `Bearer ${token}`,
                }
              : {}),
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Unable to load payment records."
        );
      }

      const records =
        Array.isArray(result)
          ? result
          : Array.isArray(result?.registrations)
          ? result.registrations
          : Array.isArray(result?.data)
          ? result.data
          : [];

      /*
        Only show records that actually contain
        payment-related information.
      */
      const paymentRecords = records.filter(
        (item) =>
          item &&
          (
            item.utr_number ||
            item.payment_screenshot ||
            item.payment_status ||
            item.package_amount
          )
      );

      setPayments(paymentRecords);
    } catch (err) {
      console.error(
        "Admin payments loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load payment records."
      );

      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  /* =====================================================
     FORMAT DATE
  ===================================================== */

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      }
    ).format(date);
  };

  /* =====================================================
     FORMAT AMOUNT
  ===================================================== */

  const getAmount = (payment) => {
    const amount =
      payment?.package_amount ??
      payment?.amount ??
      payment?.payment_amount_detected ??
      0;

    const number = Number(amount);

    return Number.isFinite(number)
      ? number
      : 0;
  };

  /* =====================================================
     FILTERED PAYMENTS
  ===================================================== */

  const filteredPayments = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return payments.filter((payment) => {
      const status =
        normalizeStatus(
          payment?.payment_status
        );

      const matchesStatus =
        statusFilter === "all" ||
        status ===
          statusFilter.toUpperCase();

      if (!matchesStatus) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchableText = [
        payment?.registration_id,
        payment?.full_name,
        payment?.mobile,
        payment?.utr_number,
        payment?.package_name,
        payment?.state,
        payment?.district,
        status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(query);
    });
  }, [
    payments,
    search,
    statusFilter,
  ]);

  /* =====================================================
     SUMMARY
  ===================================================== */

  const summary = useMemo(() => {
    let successful = 0;
    let pending = 0;
    let failed = 0;
    let revenue = 0;

    payments.forEach((payment) => {
      const status =
        normalizeStatus(
          payment?.payment_status
        );

      if (status === "SUCCESS") {
        successful += 1;
        revenue += getAmount(payment);
      } else if (status === "FAILED") {
        failed += 1;
      } else {
        pending += 1;
      }
    });

    return {
      total: payments.length,
      successful,
      pending,
      failed,
      revenue,
    };
  }, [payments]);

  /* =====================================================
     PAGINATION
  ===================================================== */

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredPayments.length /
        PAGE_SIZE
    )
  );

  const safePage = Math.min(
    currentPage,
    totalPages
  );

  const paginatedPayments =
    filteredPayments.slice(
      (safePage - 1) * PAGE_SIZE,
      safePage * PAGE_SIZE
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  /* =====================================================
     STATUS BADGE
  ===================================================== */

  const getStatusLabel = (status) => {
    const normalized =
      normalizeStatus(status);

    if (normalized === "SUCCESS") {
      return "Successful";
    }

    if (normalized === "FAILED") {
      return "Failed";
    }

    return "Pending";
  };

  /* =====================================================
     EXPORT CSV
  ===================================================== */

  const handleExport = () => {
    if (!filteredPayments.length) {
      return;
    }

    const headers = [
      "Registration No.",
      "Name",
      "Mobile",
      "Package",
      "Amount",
      "UTR",
      "Payment Date",
      "Status",
      "OCR Status",
      "UTR Verified",
      "Duplicate UTR",
    ];

    const rows =
      filteredPayments.map(
        (payment) => [
          payment?.registration_id ||
            "",
          payment?.full_name ||
            "",
          payment?.mobile ||
            "",
          payment?.package_name ||
            "RANGAVALLIKA",
          getAmount(payment),
          payment?.utr_number ||
            "",
          payment?.payment_date_detected ||
            payment?.created_at ||
            "",
          getStatusLabel(
            payment?.payment_status
          ),
          payment?.ocr_status ||
            "",
          payment?.utr_verified === true
            ? "YES"
            : "NO",
          payment?.duplicate_utr === true
            ? "YES"
            : "NO",
        ]
      );

    const csv = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) => {
            const text =
              String(value ?? "");

            return `"${text.replace(
              /"/g,
              '""'
            )}"`;
          })
          .join(",")
      )
      .join("\n");

    const blob =
      new Blob([csv], {
        type: "text/csv;charset=utf-8;",
      });

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;

    link.download =
      "rangavallika-payments.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  /* =====================================================
     VIEW REGISTRATION
  ===================================================== */

  const handleOpenRegistration = (
    registrationId
  ) => {
    if (!registrationId) {
      return;
    }

    navigate(
      `/admin/registrations?registration=${encodeURIComponent(
        registrationId
      )}`
    );
  };

  /* =====================================================
     RENDER
  ===================================================== */

  return (
    <div className="admin-dashboard">

      {/* ================= SIDEBAR ================= */}
<aside className="admin-sidebar">

  <div className="admin-brand">

    <div className="admin-brand-logo">
      GL
    </div>

    <div className="admin-brand-text">
      <h2>Give Laurels</h2>
      <span>Admin Portal</span>
    </div>

  </div>


  <nav className="admin-nav">

    <button
      type="button"
      className="admin-nav-item"
      onClick={() =>
        navigate("/admin/dashboard")
      }
    >
      <span className="admin-nav-icon"></span>
      <span className="admin-nav-label">
        Dashboard
      </span>
    </button>


    <button
      type="button"
      className="admin-nav-item"
      onClick={() =>
        navigate("/admin/registrations")
      }
    >
      <span className="admin-nav-icon"></span>
      <span className="admin-nav-label">
        Registrations
      </span>
    </button>


    <button
      type="button"
      className="admin-nav-item active"
      onClick={() =>
        navigate("/admin/payments")
      }
    >
      <span className="admin-nav-icon"></span>
      <span className="admin-nav-label">
        Payments
      </span>
    </button>


    <button
      type="button"
      className="admin-nav-item"
      onClick={() =>
        navigate("/admin/queries")
      }
    >
      <span className="admin-nav-icon"></span>
      <span className="admin-nav-label">
        Queries
      </span>
    </button>

  </nav>


  <div className="admin-sidebar-footer">

    <strong>
      Give Laurels Foundation
    </strong>

    <small>
      Admin Panel
    </small>

  </div>

</aside>


      {/* ================= MAIN ================= */}

      <div className="admin-main">

        {/* HEADER */}

        <header className="admin-header">

          <div className="admin-search">

            <span>⌕</span>

            <input
              type="text"
              placeholder="Search payments..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />

          </div>

          <div className="admin-header-right">

            <button className="admin-notification">
              🔔
            </button>

            <div className="admin-profile">

              <div className="admin-profile-avatar">
                A
              </div>

              <div className="admin-profile-info">
                <strong>Admin</strong>
                <span>
                  Administrator
                </span>
              </div>

            </div>

          </div>

        </header>


        {/* CONTENT */}

        <main className="admin-content">

          {/* PAGE HEADING */}

          <div className="admin-page-heading">

            <div>

              <h1>Payments</h1>

              <p>
                Monitor registration
                payments and transactions.
              </p>

            </div>

            <button
              className="admin-export-btn"
              onClick={handleExport}
              disabled={
                !filteredPayments.length
              }
            >
              ↓ &nbsp; Export
            </button>

          </div>


          {/* ================= SUMMARY ================= */}

          <div className="payment-summary-grid">

            <div className="payment-summary-card">

              <span>
                Total Payments
              </span>

              <strong>
                {summary.total}
              </strong>

            </div>


            <div className="payment-summary-card success">

              <span>
                Successful
              </span>

              <strong>
                {summary.successful}
              </strong>

            </div>


            <div className="payment-summary-card pending">

              <span>
                Pending
              </span>

              <strong>
                {summary.pending}
              </strong>

            </div>


            <div className="payment-summary-card failed">

              <span>
                Failed
              </span>

              <strong>
                {summary.failed}
              </strong>

            </div>


            <div className="payment-revenue-card">

              <div>

                <span>
                  Total Revenue
                </span>

                <strong>
                  ₹
                  {summary.revenue.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

              <div className="payment-revenue-icon">
                ₹
              </div>

            </div>

          </div>


          {/* ================= TABLE ================= */}

          <section className="admin-table-panel">

            <div className="admin-table-header">

              <div>

                <h3>
                  Payment Transactions
                </h3>

                <p>
                  View and monitor submitted
                  registration payments.
                </p>

              </div>


              <div className="payment-filters">

                <div className="payment-search">

                  🔍

                  <input
                    type="text"
                    placeholder="Search transaction..."
                    value={search}
                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }
                  />

                </div>


                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value
                    )
                  }
                >

                  <option value="all">
                    All
                  </option>

                  <option value="success">
                    Successful
                  </option>

                  <option value="pending">
                    Pending
                  </option>

                  <option value="failed">
                    Failed
                  </option>

                </select>

              </div>

            </div>


            {/* ================= LOADING ================= */}

            {loading && (

              <div className="payment-empty">

                <div className="payment-empty-icon">
                  ₹
                </div>

                <h3>
                  Loading payments...
                </h3>

                <p>
                  Please wait while payment
                  records are loaded.
                </p>

              </div>

            )}


            {/* ================= ERROR ================= */}

            {!loading && error && (

              <div className="payment-empty">

                <div className="payment-empty-icon">
                  !
                </div>

                <h3>
                  Unable to load payments
                </h3>

                <p>
                  {error}
                </p>

                <button
                  className="payment-filter-btn"
                  onClick={
                    loadPayments
                  }
                >
                  Try Again
                </button>

              </div>

            )}


            {/* ================= TABLE ================= */}

            {!loading &&
              !error && (

                <div className="payment-table-wrapper">

                  <table className="payment-table">

                    <thead>

                      <tr>

                        <th>
                          UTR / Transaction ID
                        </th>

                        <th>
                          Registration No.
                        </th>

                        <th>
                          Name
                        </th>

                        <th>
                          Amount
                        </th>

                        <th>
                          Payment Date
                        </th>

                        <th>
                          Status
                        </th>

                      </tr>

                    </thead>


                    <tbody>

                      {paginatedPayments.length ===
                        0 ? (

                        <tr>

                          <td colSpan="6">

                            <div className="payment-empty">

                              <div className="payment-empty-icon">
                                ₹
                              </div>

                              <h3>
                                No payment records
                              </h3>

                              <p>
                                No payments match
                                your current
                                search or filter.
                              </p>

                            </div>

                          </td>

                        </tr>

                      ) : (

                        paginatedPayments.map(
                          (payment) => {

                            const status =
                              normalizeStatus(
                                payment?.payment_status
                              );

                            return (

                              <tr
                                key={
                                  payment?.registration_id ||
                                  payment?.utr_number ||
                                  Math.random()
                                }
                              >

                                <td>

                                  <strong>
                                    {payment?.utr_number ||
                                      "—"}
                                  </strong>

                                </td>


                                <td>

                                  <button
                                    type="button"
                                    className="payment-registration-link"
                                    onClick={() =>
                                      handleOpenRegistration(
                                        payment?.registration_id
                                      )
                                    }
                                  >
                                    {payment?.registration_id ||
                                      "—"}
                                  </button>

                                </td>


                                <td>
                                  {payment?.full_name ||
                                    "—"}
                                </td>


                                <td>

                                  <strong>
                                    ₹
                                    {getAmount(
                                      payment
                                    ).toLocaleString(
                                      "en-IN"
                                    )}
                                  </strong>

                                </td>


                                <td>

                                  {formatDate(
                                    payment?.payment_date_detected ||
                                      payment?.updated_at ||
                                      payment?.created_at
                                  )}

                                </td>


                                <td>

                                  <span
                                    className={`payment-status-badge ${status.toLowerCase()}`}
                                  >
                                    {status ===
                                    "SUCCESS"
                                      ? "Successful"
                                      : status ===
                                        "FAILED"
                                      ? "Failed"
                                      : "Pending"}
                                  </span>

                                </td>

                              </tr>

                            );
                          }
                        )

                      )}

                    </tbody>

                  </table>

                </div>

              )}


            {/* ================= PAGINATION ================= */}

            {!loading &&
              !error &&
              filteredPayments.length >
                0 && (

                <div className="payment-pagination">

                  <span>
                    Showing{" "}
                    {Math.min(
                      (safePage - 1) *
                        PAGE_SIZE +
                        1,
                      filteredPayments.length
                    )}
                    –
                    {Math.min(
                      safePage *
                        PAGE_SIZE,
                      filteredPayments.length
                    )}{" "}
                    of{" "}
                    {filteredPayments.length}
                  </span>


                  <div>

                    <button
                      disabled={
                        safePage <= 1
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.max(
                              1,
                              page - 1
                            )
                        )
                      }
                    >
                      ←
                    </button>


                    <button
                      disabled={
                        safePage >=
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          (page) =>
                            Math.min(
                              totalPages,
                              page + 1
                            )
                        )
                      }
                    >
                      →
                    </button>

                  </div>

                </div>

              )}

          </section>

        </main>


        {/* FOOTER */}

        <footer className="admin-footer">
          © 2026 Give Laurels Foundation
          of India. Admin Portal.
        </footer>

      </div>

    </div>
  );
};

export default AdminPayments;