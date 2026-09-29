import React, { useState } from "react";
import "./RegistrationFeeSection.css";

/* =========================================================
   GOLD LOTUS
========================================================= */

const GoldLotusIcon = () => (
  <svg
    width="65"
    height="32"
    viewBox="0 0 65 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M32.5 3C35 9 39 14 45 17C39 20 35 24 32.5 30C30 24 26 20 20 17C26 14 30 9 32.5 3Z"
      fill="#D4AF37"
    />

    <path
      d="M32.5 8C35 12 38 15 42 17C38 19 35 22 32.5 26C30 22 27 19 23 17C27 15 30 12 32.5 8Z"
      fill="#DAA520"
    />

    <path
      d="M32.5 12C34 15 36 16 38.5 17C36 18 34 20 32.5 22C31 20 29 18 26.5 17C29 16 31 15 32.5 12Z"
      fill="#FFD700"
    />

    <path
      d="M2 16H21"
      stroke="#D4AF37"
      strokeWidth="1.2"
    />

    <path
      d="M44 16H63"
      stroke="#D4AF37"
      strokeWidth="1.2"
    />

    <circle
      cx="2"
      cy="16"
      r="2"
      fill="#D4AF37"
    />

    <circle
      cx="63"
      cy="16"
      r="2"
      fill="#D4AF37"
    />
  </svg>
);


/* =========================================================
   PINK FLOWER
========================================================= */

const PinkBlossomIcon = () => (
  <svg
    width="30"
    height="30"
    viewBox="0 0 30 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M15 2C16.5 8 21 10 27 15C21 20 16.5 22 15 28C13.5 22 9 20 3 15C9 10 13.5 8 15 2Z"
      fill="#E91E63"
    />

    <path
      d="M15 7C16 11 18.5 13 23 15C18.5 17 16 19 15 23C14 19 11.5 17 7 15C11.5 13 14 11 15 7Z"
      fill="#FF80AB"
    />

    <circle
      cx="15"
      cy="15"
      r="3"
      fill="#FFE16B"
    />
  </svg>
);


/* =========================================================
   CARD DECORATION
========================================================= */

const CardCorner = ({ className }) => (
  <svg
    className={`card-corner ${className}`}
    width="120"
    height="120"
    viewBox="0 0 120 120"
    fill="none"
  >
    <path
      d="M10 10H110V110"
      stroke="#D4AF37"
      strokeWidth="1"
      strokeDasharray="4 4"
      opacity="0.25"
    />

    <path
      d="M20 20C50 20 95 65 95 95"
      stroke="#D4AF37"
      strokeWidth="1.2"
      opacity="0.35"
    />

    <path
      d="M20 20C20 50 65 95 95 95"
      stroke="#DAA520"
      strokeWidth="1"
      opacity="0.3"
    />

    <circle
      cx="20"
      cy="20"
      r="4"
      fill="#D4AF37"
      opacity="0.65"
    />
  </svg>
);


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function RegistrationFeeSection({
  goRegister
}) {

  const [couponCode, setCouponCode] = useState("");
  const [couponMessage, setCouponMessage] = useState("");


  /* =======================================================
     COUPON
  ======================================================= */

  const handleCoupon = () => {

    const code = couponCode
      .trim()
      .toUpperCase();

    if (!code) {
      setCouponMessage(
        "Please enter a coupon code."
      );
      return;
    }

    /*
      IMPORTANT:
      Existing registration/payment logic remains unchanged.
      This section only displays the coupon validation message.
    */

    if (code === "UDAYBHANU0246") {

      setCouponMessage(
        "Coupon applied successfully."
      );

    } else if (code === "GTST0246") {

      setCouponMessage(
        "Coupon applied successfully."
      );

    } else {

      setCouponMessage(
        "Invalid coupon code. Please check and try again."
      );

    }
  };


  return (

    <section
      id="awards"
      className="registration-fee-luxury-section"
    >

      <div className="registration-fee-page">

        <div className="registration-fee-wrapper">

          <div className="registration-fee-card">

            <CardCorner className="card-corner-top-left" />
            <CardCorner className="card-corner-bottom-right" />


            {/* Top symbol */}
            <div className="registration-fee-symbol">
              <PinkBlossomIcon />
            </div>


            {/* Card title */}
            <div className="registration-fee-small-title">
              REGISTRATION FEE
            </div>


            {/* Gold divider */}
            <div className="registration-fee-divider">
              <GoldLotusIcon />
            </div>


            {/* Price */}
            <div className="registration-fee-price">
              ₹799
            </div>

            <p className="registration-fee-text">
              Standard registration fee
            </p>


            {/* Coupon */}
            <div className="coupon-section">

              <label htmlFor="registration-fee-coupon">
                Have a coupon code?
              </label>

              <div className="coupon-input-row">

                <div className="coupon-input-wrapper">

                  <span className="coupon-tag-icon">
                    %
                  </span>

                  <input
                    id="registration-fee-coupon"
                    type="text"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponMessage("");
                    }}
                    placeholder="Enter coupon code"
                    maxLength={20}
                  />

                </div>

                <button
                  type="button"
                  className="coupon-apply-button"
                  onClick={handleCoupon}
                >
                  Apply
                </button>

              </div>

              {couponMessage && (
                <div
                  className={
                    couponMessage.startsWith("Coupon applied")
                      ? "coupon-success"
                      : "coupon-error"
                  }
                >
                  {couponMessage}
                </div>
              )}

            </div>


            {/* Register button */}
            <button
              type="button"
              className="registration-fee-button"
              onClick={goRegister}
            >
              <span>Register Now</span>
              <span>→</span>
            </button>

          </div>

        </div>

      </div>

    </section>

  );
}