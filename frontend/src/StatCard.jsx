import React from "react";

const StatCard = ({
  title,
  icon,
  type
}) => {

  const icons = {
    users: "♟",
    payment: "₹",
    revenue: "▥",
    failed: "!"
  };

  return (
    <div className={`admin-stat-card ${type}`}>

      <div className="admin-stat-top">

        <div className="admin-stat-icon">
          {icons[icon]}
        </div>

        <div className="admin-stat-title">
          {title}
        </div>

      </div>

      <div className="admin-stat-value">
        —
      </div>

      <div className="admin-stat-bottom">
        Data will appear here
      </div>

    </div>
  );
};

export default StatCard;