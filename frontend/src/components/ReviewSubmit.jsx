import React, { useState } from "react";
import "./ReviewSubmit.css";
import TermsConditions from "./TermsConditions";

function ReviewSubmit({
  participant,
  selectedPackage,
  onPrevious,
  onEditParticipant,
  onEditPackage,
  onPayment,
}) {
  const [agreed, setAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  /* =====================================================
     TERMS & CONDITIONS PAGE
  ===================================================== */

  if (showTerms) {
    return (
      <TermsConditions
        onBack={() => setShowTerms(false)}
      />
    );
  }


  /* =====================================================
     DEBUG
  ===================================================== */

  console.log(
    "REVIEW PARTICIPANT:",
    participant
  );

  console.log(
    "REVIEW REGISTRATION FEE:",
    selectedPackage
  );


  /* =====================================================
     REGISTRATION DATA
  ===================================================== */

  const registrationData = selectedPackage;

  const registrationAmount = Number(
    registrationData?.amount ||
    registrationData?.package_amount ||
    799
  );


  const couponCode =
    registrationData?.coupon_code ||
    null;


  const baseAmount = Number(
    registrationData?.base_amount ||
    799
  );


  const savings =
    couponCode
      ? baseAmount - registrationAmount
      : 0;


  return (
    <div className="review-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="review-topbar">

        <a
          href="/#home"
          className="review-brand"
        >
          <img
            src="/give.png"
            alt="Give Laurels Foundation of India"
          />
        </a>


        <a
          href="/#home"
          className="review-home-button"
        >
          <span>←</span>
          Back to Home
        </a>

      </header>



      {/* =====================================================
          TITLE
      ===================================================== */}




      {/* =====================================================
          PROGRESS
      ===================================================== */}

      <section className="review-progress">


        {/* STEP 1 */}






        {/* STEP 3 */}


      </section>



      {/* =====================================================
          MAIN CARD
      ===================================================== */}

      <main className="review-card">


        {/* =====================================================
            HEADING
        ===================================================== */}

        <div className="review-heading">

          <div>

            <h2>
              Review &amp; Submit
            </h2>

            <p>
              Please review your details before proceeding to payment.
            </p>

          </div>

          <span>
            Make sure all the information is correct.
          </span>

        </div>



        {/* =====================================================
            REVIEW COLUMNS
        ===================================================== */}

        <div className="review-columns">


          {/* =================================================
              PARTICIPANT DETAILS
          ================================================= */}

          <section className="review-section participant-review">

            <div className="review-section-header">

              <div>

                <h3>
                  Participant Details
                </h3>

                <p>
                  Your registration information
                </p>

              </div>


              <button
                type="button"
                onClick={onEditParticipant}
              >
                Edit
              </button>

            </div>



            <div className="participant-data">


              {/* FULL NAME */}

              <div className="data-row">

                <span>
                  Full Name
                </span>

                <strong>
                  {participant?.fullName ||
                    "Not provided"}
                </strong>

              </div>



              {/* AGE */}

              <div className="data-row">

                <span>
                  Age
                </span>

                <strong>
                  {participant?.age ||
                    "Not provided"}
                </strong>

              </div>



              {/* GUARDIAN NAME */}

              <div className="data-row">

                <span>
                  Guardian Name
                </span>

                <strong>
                  {participant?.guardianName ||
                    "Not provided"}
                </strong>

              </div>



              {/* MOBILE */}

              <div className="data-row">

                <span>
                  Mobile Number
                </span>

                <strong>
                  {participant?.mobile ||
                    "Not provided"}
                </strong>

              </div>



              {/* STATE */}

              <div className="data-row">

                <span>
                  State
                </span>

                <strong>
                  {participant?.state ||
                    "Not provided"}
                </strong>

              </div>



              {/* DISTRICT */}

              <div className="data-row">

                <span>
                  District
                </span>

                <strong>
                  {participant?.district ||
                    "Not provided"}
                </strong>

              </div>



              {/* PINCODE */}

              <div className="data-row">

                <span>
                  Pincode
                </span>

                <strong>
                  {participant?.pincode ||
                    "Not provided"}
                </strong>

              </div>



              {/* COMPLETE ADDRESS */}

              <div className="data-row address-row">

                <span>
                  Complete Address
                </span>

                <strong>
                  {participant?.address ||
                    "Not provided"}
                </strong>

              </div>

            </div>

          </section>



          {/* =================================================
              REGISTRATION FEE
          ================================================= */}

          <section className="review-section package-review">


            {/* HEADER */}

            <div className="review-section-header">

              <div>

                <h3>
                  Registration Fee
                </h3>

                <p>
                  Your selected registration amount
                </p>

              </div>


              <button
                type="button"
                onClick={onEditPackage}
              >
                Edit
              </button>

            </div>



            {/* FEE CARD */}

            <div className="selected-registration-fee">


              {/* Decorative symbol */}

              


              {/* Registration */}

              <div className="registration-review-info">

                <span>
                  Rangavallika Rangoli Fest
                </span>

                <strong>
                  Registration
                </strong>

              </div>


              {/* Amount */}

              <div className="registration-review-price">

                {couponCode && (
                  <small>
                    ₹{baseAmount.toLocaleString("en-IN")}
                  </small>
                )}

                <strong>
                  ₹
                  {registrationAmount.toLocaleString(
                    "en-IN"
                  )}
                </strong>

              </div>

            </div>



            {/* COUPON */}

            {couponCode && (
              <div className="review-coupon-box">


                <div className="review-coupon-left">

                  <div className="review-coupon-icon">
                    ✓
                  </div>


                  <div>

                    <span>
                      Offer Applied
                    </span>

                    <strong>
                      {couponCode}
                    </strong>

                  </div>

                </div>


                <div className="review-coupon-saving">

                  <small>
                    YOU SAVE
                  </small>

                  <strong>
                    ₹
                    {savings.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                </div>

              </div>
            )}



            {/* FINAL AMOUNT */}

            <div className="review-total-row">

              <span>
                Amount to Pay
              </span>

              <strong>
                ₹
                {registrationAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>

            </div>

          </section>

        </div>



        {/* =====================================================
            TERMS & CONDITIONS
        ===================================================== */}

        {/* =====================================================
    TERMS & CONDITIONS
===================================================== */}

<div className={`terms-box ${agreed ? "terms-accepted" : ""}`}>

  <label className="terms-label">

    <input
      type="checkbox"
      checked={agreed}
      onChange={(e) => setAgreed(e.target.checked)}
    />

    <span className="custom-check">
      {agreed && "✓"}
    </span>

    <div className="terms-content">
      <h3>
        Terms and Conditions
      </h3>

      <p>
        I confirm that all the information provided
        is correct. I have read and agree to the Terms
        and Conditions of Rangavallika Rangoli Competition
        conducted by Give Laurels Foundation of India.
      </p>
    </div>

  </label>

  <button
    type="button"
    className="terms-link"
    onClick={() => setShowTerms(true)}
  >
    View Terms &amp; Conditions →
  </button>

</div>

        {/* =====================================================
            ACTIONS
        ===================================================== */}

        <div className="review-actions">


          {/* PREVIOUS */}

          <button
            type="button"
            className="review-back"
            onClick={onPrevious}
          >

            <span>
              ←
            </span>

            Previous Step

          </button>



          {/* PAYMENT */}

          <button
            type="button"
            className="payment-button"
            disabled={!agreed}
            onClick={onPayment}
          >

            Proceed to Payment

            <span>
              →
            </span>

          </button>

        </div>

      </main>

    </div>
  );
}

export default ReviewSubmit;