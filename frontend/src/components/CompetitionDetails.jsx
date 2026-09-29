import React, { useState } from "react";
import "./CompetitionDetails.css";

const BASE_FEE = 799;

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/$/, "");

const API_ROOT = API_URL.endsWith("/api") ? API_URL : `${API_URL}/api`;

function CompetitionDetails({ onPrevious, onContinue }) {
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const finalAmount = appliedCoupon?.amount || BASE_FEE;

  const handleCouponChange = (e) => {
    setCouponCode(e.target.value.toUpperCase());
    setCouponError("");
  };

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();

    if (!code) {
      setAppliedCoupon(null);
      setCouponError("Please enter a coupon code.");
      return;
    }

    try {
      setCheckingCoupon(true);
      setCouponError("");

      const response = await fetch(`${API_ROOT}/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        setAppliedCoupon(null);
        setCouponError(data.message || "Invalid coupon code. Please check and try again.");
        return;
      }

      setAppliedCoupon(data.coupon);
    } catch (error) {
      console.error("COUPON VALIDATE ERROR:", error);
      setAppliedCoupon(null);
      setCouponError("Unable to check coupon right now. Please try again.");
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleProceed = () => {
    onContinue({
      name: "RANGAVALLIKA",
      package_name: "RANGAVALLIKA",
      amount: finalAmount,
      package_amount: finalAmount,
      coupon_code: appliedCoupon?.code || null,
      coupon_type: appliedCoupon?.type || null,
      base_amount: BASE_FEE,
    });
  };

  return (
    <div className="competition-page-new">

      {/* Decorative background */}

      <div className="competition-decoration competition-decoration-left">
        ✦
      </div>

      <div className="competition-decoration competition-decoration-right">
        ✦
      </div>


      {/* Heading */}

      <div className="competition-new-heading">

        <div className="competition-new-label">
          <span></span>
          REGISTRATION
          <span></span>
        </div>

        <h1>
          Registration <em>Fee</em>
        </h1>

        <h2>
          Be a Part of Rangavallika
        </h2>

        <p>
          Complete your registration and proceed to secure payment.
        </p>

      </div>


      {/* Main layout */}

      <div className="registration-payment-layout">


        {/* =========================
            MAIN FEE CARD
        ========================== */}

        <div className="registration-fee-main-card">

         

          <div className="fee-card-label">
            REGISTRATION FEE
          </div>


          {/* Price */}

          <div className="fee-price-box">

            {appliedCoupon && (
              <span className="fee-original-price">
                ₹{BASE_FEE}
              </span>
            )}

            <strong>
              ₹{finalAmount}
            </strong>

          </div>


          {appliedCoupon ? (
            <div className="coupon-success">

              <span className="coupon-success-icon">
                ✓
              </span>

              <div>
                <strong>
                  Coupon Applied Successfully!
                </strong>

                <small>
                  {appliedCoupon.code} applied
                </small>
              </div>

            </div>
          ) : (
            <p className="fee-default-text">
              Standard registration fee
            </p>
          )}


          {/* Coupon */}

          <div className="coupon-section">

            <label>
              Have a coupon code?
            </label>

            <div className="coupon-input-row">

              <div className="coupon-input-wrapper">

                <span className="coupon-tag-icon">
                  %
                </span>

                <input
                  type="text"
                  value={couponCode}
                  onChange={handleCouponChange}
                  placeholder="Enter coupon code"
                  maxLength={20}
                  disabled={!!appliedCoupon}
                />

              </div>


              {!appliedCoupon ? (
                <button
                  type="button"
                  className="coupon-apply-button"
                  onClick={handleApplyCoupon}
                  disabled={checkingCoupon}
                >
                  {checkingCoupon ? "Checking..." : "Apply"}
                </button>
              ) : (
                <button
                  type="button"
                  className="coupon-remove-button"
                  onClick={() => {
                    setAppliedCoupon(null);
                    setCouponCode("");
                    setCouponError("");
                  }}
                >
                  Remove
                </button>
              )}

            </div>


            {couponError && (
              <div className="coupon-error">
                {couponError}
              </div>
            )}


            {!couponError && !appliedCoupon && (
              <div className="coupon-info">
                <span>i</span>
                Enter a valid coupon code to receive an offer.
              </div>
            )}

          </div>


          {/* Applied offer */}

          {appliedCoupon && (
            <div
              className={`applied-offer ${
                String(appliedCoupon.code).startsWith("GTST")
                  ? "gtst-offer"
                  : "UDAYBHANU-offer"
              }`}
            >

              <div className="offer-icon">
                {String(appliedCoupon.code).startsWith("GTST")
                  ? "🎓"
                  : "✦"}
              </div>

              <div className="offer-content">

                <strong>
                  {appliedCoupon.title}
                </strong>

                <span>
                  {appliedCoupon.description}
                </span>

                <div className="offer-code">
                  <small>Coupon Code</small>
                  <b>{appliedCoupon.code}</b>
                </div>

              </div>

              <div className="offer-saving">
                <small>YOU SAVE</small>

                <strong>
                  ₹{BASE_FEE - appliedCoupon.amount}
                </strong>

              </div>

            </div>
          )}


          {/* Payment button */}

          <button
            type="button"
            className="proceed-payment-button"
            onClick={handleProceed}
          >

            <span>
              Proceed to Payment
            </span>

            <b>
              →
            </b>

          </button>


          <div className="secure-payment-note">
            <span>🔒</span>
            Secure and Safe Payment
          </div>

        </div>


    

      </div>


      {/* Navigation */}

      <div className="competition-bottom-actions">

        <button
          type="button"
          className="competition-back-button"
          onClick={onPrevious}
        >
          ← Previous Step
        </button>

        <div className="current-fee-display">
          Amount to Pay:
          <strong>
            ₹{finalAmount}
          </strong>
        </div>

      </div>

    </div>
  );
}

export default CompetitionDetails;