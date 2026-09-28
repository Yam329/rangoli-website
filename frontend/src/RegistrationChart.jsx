import React from "react";

const RegistrationChart = () => {

  return (
    <div className="admin-dashboard-card registration-chart-card">

      <div className="admin-card-header">

        <div className="admin-card-title">

          <span className="card-title-icon blue">
            ▥
          </span>

          <h2>
            Last 7 Days — Registrations
          </h2>

        </div>

      </div>


      <div className="registration-chart">

        <div className="chart-y-axis">

          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>

        </div>

        <div className="chart-area">

          <div className="chart-grid-line"></div>
          <div className="chart-grid-line"></div>
          <div className="chart-grid-line"></div>
          <div className="chart-grid-line"></div>
          <div className="chart-grid-line"></div>

          <div className="chart-empty">

            <div className="chart-empty-icon">
              ▥
            </div>

            <p>
              Registration data will appear here
            </p>

          </div>

          <div className="chart-days">

            <span>Day 1</span>
            <span>Day 2</span>
            <span>Day 3</span>
            <span>Day 4</span>
            <span>Day 5</span>
            <span>Day 6</span>
            <span>Day 7</span>

          </div>

        </div>

      </div>

    </div>
  );
};

export default RegistrationChart;