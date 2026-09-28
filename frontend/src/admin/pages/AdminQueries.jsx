import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/admin-queries.css";

const rawApiUrl = String(
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).trim().replace(/\/$/, "");
const API_URL = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

function AdminQueries() {
  const navigate = useNavigate();

  const [queries, setQueries] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedQuery, setSelectedQuery] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // =========================================================
  // FETCH QUERIES
  // =========================================================

  const fetchQueries = async () => {
  try {
    setLoading(true);
    setError("");

    const adminToken =
      localStorage.getItem("adminToken");

    const response = await fetch(
      `${API_URL}/admin/queries`,
      {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to fetch queries."
      );
    }

    setQueries(data.queries || []);

  } catch (error) {
    console.error(
      "FETCH QUERIES ERROR:",
      error
    );

    setError(
      error.message ||
        "Unable to load queries. Please try again."
    );

  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchQueries();
  }, []);

  // =========================================================
  // FILTER
  // =========================================================

  const filteredQueries = useMemo(() => {
    return queries.filter((query) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        String(query.name || "")
          .toLowerCase()
          .includes(searchText) ||
       
        String(query.phone || "")
          .toLowerCase()
          .includes(searchText) ||
        String(query.subject || "")
          .toLowerCase()
          .includes(searchText) ||
        String(query.message || "")
          .toLowerCase()
          .includes(searchText);

      const matchesStatus =
        statusFilter === "all" ||
        String(query.status || "").toLowerCase() ===
          statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [queries, search, statusFilter]);

  // =========================================================
  // COUNTS
  // =========================================================

  const totalQueries = queries.length;

  const unreadQueries = queries.filter(
    (query) => query.status === "unread"
  ).length;

  const resolvedQueries = queries.filter(
    (query) => query.status === "resolved"
  ).length;

  // =========================================================
  // DATE
  // =========================================================

  const formatDate = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) return "—";

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================================
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (status) => {
    if (status === "unread") {
      return "status-unread";
    }

    if (status === "read") {
      return "status-read";
    }

    if (status === "resolved") {
      return "status-resolved";
    }

    return "";
  };

  // =========================================================
  // OPEN QUERY
  // =========================================================

  const openQuery = async (query) => {
    setSelectedQuery(query);

    // Automatically change unread → read
    if (query.status === "unread") {
      await updateQueryStatus(query.id, "read");
    }
  };
const deleteQuery = async (queryId) => {
  const confirmed = window.confirm(
    "Are you sure you want to permanently delete this query?"
  );

  if (!confirmed) return;

  try {
    setUpdatingStatus(true);
    setError("");

    const adminToken =
      localStorage.getItem("adminToken");

    const response = await fetch(
      `${API_URL}/admin/queries/${queryId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Failed to delete query."
      );
    }

    // Remove from UI
    setQueries((previousQueries) =>
      previousQueries.filter(
        (query) => query.id !== queryId
      )
    );

    // Close modal
    setSelectedQuery(null);

  } catch (error) {
    console.error(
      "DELETE QUERY ERROR:",
      error
    );

    setError(
      error.message ||
        "Unable to delete query."
    );

  } finally {
    setUpdatingStatus(false);
  }
};
  // =========================================================
  // UPDATE STATUS
  // =========================================================

  const updateQueryStatus = async (
  queryId,
  newStatus
) => {
  try {
    setUpdatingStatus(true);
    setError("");

    const adminToken =
      localStorage.getItem("adminToken");

    const response = await fetch(
      `${API_URL}/admin/queries/${queryId}/status`,
      {
        method: "PATCH",
        headers: {
          Authorization:
            `Bearer ${adminToken}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "Failed to update query status."
      );
    }

    const updatedQuery = data.query;

    setQueries((previousQueries) =>
      previousQueries.map((query) =>
        query.id === queryId
          ? updatedQuery
          : query
      )
    );

    setSelectedQuery((currentQuery) =>
      currentQuery &&
      currentQuery.id === queryId
        ? updatedQuery
        : currentQuery
    );

  } catch (error) {
    console.error(
      "UPDATE QUERY STATUS ERROR:",
      error
    );

    setError(
      error.message ||
        "Unable to update query status."
    );

  } finally {
    setUpdatingStatus(false);
  }
};

  // =========================================================
  // CLOSE DETAILS
  // =========================================================

  const closeQuery = () => {
    setSelectedQuery(null);
    setError("");
  };

  return (
    <div className="admin-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="admin-sidebar">

        <div className="admin-brand">

          <div className="admin-brand-mark">
            GL
          </div>

          <div>
            <strong>Give Laurels</strong>
            <span>Admin Portal</span>
          </div>

        </div>


        <nav className="admin-nav">

          <button
            type="button"
            onClick={() =>
              navigate("/admin/dashboard")
            }
          >
            <span>▦</span>
            Dashboard
          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/admin/registrations")
            }
          >
            <span>♙</span>
            Registrations
          </button>


          <button
            type="button"
            className="active"
            onClick={() =>
              navigate("/admin/queries")
            }
          >
            <span>✉</span>
            Queries
          </button>


          <button
            type="button"
            onClick={() =>
              navigate("/admin/payments")
            }
          >
            <span>₹</span>
            Payments
          </button>

        </nav>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="admin-main">

        {/* TOP BAR */}

        <div className="admin-topbar">

          <div>
            <h1>Queries</h1>

            <p>
              Manage enquiries received through
              the public website.
            </p>
          </div>


          <button
            type="button"
            className="refresh-button"
            onClick={fetchQueries}
            disabled={loading}
          >
            {loading
              ? "Loading..."
              : "↻ Refresh"}
          </button>

        </div>


        {/* ===================================================
            SUMMARY
        =================================================== */}

        <section className="query-summary-grid">

          <div className="query-summary-card">

            <span>Total Queries</span>

            <strong>
              {loading
                ? "—"
                : totalQueries}
            </strong>

          </div>


          <div className="query-summary-card">

            <span>Unread</span>

            <strong>
              {loading
                ? "—"
                : unreadQueries}
            </strong>

          </div>


          <div className="query-summary-card">

            <span>Resolved</span>

            <strong>
              {loading
                ? "—"
                : resolvedQueries}
            </strong>

          </div>

        </section>


        {/* ===================================================
            TOOLBAR
        =================================================== */}

        <section className="query-toolbar">

          <div className="query-search">

            <span>⌕</span>

            <input
              type="text"
             placeholder="Search name, phone or message..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>


          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value)
            }
          >
            <option value="all">
              All Status
            </option>

            <option value="unread">
              Unread
            </option>

            <option value="read">
              Read
            </option>

            <option value="resolved">
              Resolved
            </option>
          </select>


          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
          >
            Clear
          </button>

        </section>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div className="query-error">
            {error}
          </div>
        )}


        {/* ===================================================
            TABLE
        =================================================== */}

        <section className="query-table-card">

          <div className="query-table-header">

            <div>

              <h2>
                Contact Queries
              </h2>

              <p>
                {loading
                  ? "Loading queries..."
                  : `${filteredQueries.length} ${
                      filteredQueries.length === 1
                        ? "query"
                        : "queries"
                    } found`}
              </p>

            </div>

          </div>


          {/* LOADING */}

          {loading ? (

            <div className="query-empty-state">

              <div className="query-empty-icon">
                ...
              </div>

              <h3>
                Loading queries
              </h3>

              <p>
                Fetching enquiries from the database.
              </p>

            </div>


          ) : filteredQueries.length === 0 ? (

            /* EMPTY */

            <div className="query-empty-state">

              <div className="query-empty-icon">
                ✉
              </div>

              <h3>
                No queries found
              </h3>

              <p>
                Contact form messages will appear here.
              </p>

            </div>


          ) : (

            /* TABLE */

            <div className="query-table-wrapper">

              <table className="query-table">

                <thead>

                  <tr>

                    <th>
                      Query ID
                    </th>

                    <th>
                      Name
                    </th>

                    

                    <th>
                      Phone
                    </th>

                    <th>
                      Subject
                    </th>

                    <th>
                      Date
                    </th>

                    <th>
                      Status
                    </th>

                    <th>
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {filteredQueries.map(
                    (query) => (

                      <tr key={query.id}>

                        <td>
                          #{query.id}
                        </td>


                        <td>
                          <strong>
                            {query.name || "—"}
                          </strong>
                        </td>



                        <td>
                          {query.phone || "—"}
                        </td>


                        <td>
                          {query.subject || "—"}
                        </td>


                        <td>
                          {formatDate(
                            query.created_at
                          )}
                        </td>


                        <td>

                          <span
                            className={`query-status ${getStatusClass(
                              query.status
                            )}`}
                          >
                            {query.status || "—"}
                          </span>

                        </td>


                        <td>

                          <button
                            type="button"
                            className="query-view-button"
                            onClick={() =>
                              openQuery(query)
                            }
                          >
                            View
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>

      </main>


      {/* =====================================================
          QUERY DETAILS MODAL
      ===================================================== */}

      {selectedQuery && (

        <div
          className="query-modal-overlay"
          onClick={closeQuery}
        >

          <div
            className="query-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* MODAL HEADER */}

            <div className="query-modal-header">

              <div>

                <span>
                  QUERY #{selectedQuery.id}
                </span>

                <h2>
                  Query Details
                </h2>

              </div>


              <button
                type="button"
                className="query-modal-close"
                onClick={closeQuery}
                aria-label="Close"
              >
                ×
              </button>

            </div>


            {/* DETAILS */}

            <div className="query-details-grid">

              <div className="query-detail-item">

                <span>
                  Name
                </span>

                <strong>
                  {selectedQuery.name || "—"}
                </strong>

              </div>


              

              <div className="query-detail-item">

                <span>
                  Phone
                </span>

                <strong>
                  {selectedQuery.phone || "—"}
                </strong>

              </div>


              <div className="query-detail-item">

                <span>
                  Subject
                </span>

                <strong>
                  {selectedQuery.subject || "—"}
                </strong>

              </div>


              <div className="query-detail-item">

                <span>
                  Submitted
                </span>

                <strong>
                  {formatDateTime(
                    selectedQuery.created_at
                  )}
                </strong>

              </div>


              <div className="query-detail-item">

                <span>
                  Current Status
                </span>

                <span
                  className={`query-status ${getStatusClass(
                    selectedQuery.status
                  )}`}
                >
                  {selectedQuery.status}
                </span>

              </div>

            </div>


            {/* MESSAGE */}

            <div className="query-message-box">

              <div className="query-message-heading">
                Message
              </div>

              <p>
                {selectedQuery.message || "—"}
              </p>

            </div>


            {/* ACTIONS */}

            <div className="query-modal-actions">

              <button
                type="button"
                className="query-action-read"
                disabled={updatingStatus}
                onClick={() =>
                  updateQueryStatus(
                    selectedQuery.id,
                    "read"
                  )
                }
              >
                {updatingStatus
                  ? "Updating..."
                  : "Mark as Read"}
              </button>


              <button
                type="button"
                className="query-action-unread"
                disabled={updatingStatus}
                onClick={() =>
                  updateQueryStatus(
                    selectedQuery.id,
                    "unread"
                  )
                }
              >
                Mark as Unread
              </button>


              <button
                type="button"
                className="query-action-resolved"
                disabled={updatingStatus}
                onClick={() =>
                  updateQueryStatus(
                    selectedQuery.id,
                    "resolved"
                  )
                }
              >
                Mark as Resolved
              </button>
              <button
  type="button"
  className="query-action-delete"
  disabled={updatingStatus}
  onClick={() =>
    deleteQuery(selectedQuery.id)
  }
>
  {updatingStatus
    ? "Deleting..."
    : "Delete Query"}
</button>
              
            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default AdminQueries;