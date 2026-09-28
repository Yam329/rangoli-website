import React from "react";

const RegistrationStatus = () => {

  return (
    <div className="admin-dashboard-card registration-status-card">

      <div className="admin-card-header">

        <div className="admin-card-title">

          <span className="card-title-icon purple">
            ◉
          </span>

          <h2>
            Registration Status
          </h2>

        </div>

      </div>


      <div className="registration-status-content">

        <div className="status-donut">

          <div className="status-donut-inner">
            <strong>—</strong>
            <span>Total</span>
          </div>

        </div>


        <div className="status-list">

          <div className="status-row">

            <span className="status-dot paid"></span>

            <span>
              Paid
            </span>

            <strong>
              —
            </strong>

          </div>


          <div className="status-row">

            <span className="status-dot pending"></span>

            <span>
              Pending
            </span>

            <strong>
              —
            </strong>

          </div>


          <div className="status-row">

            <span className="status-dot incomplete"></span>

            <span>
              Incomplete
            </span>

            <strong>
              —
            </strong>

          </div>

        </div>

      </div>

    </div>
  );
};

export default RegistrationStatus;