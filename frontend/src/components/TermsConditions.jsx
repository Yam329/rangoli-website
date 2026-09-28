import React from "react";
import "./TermsConditions.css";

function TermsConditions({ onBack }) {
  return (
    <div className="terms-page">

      {/* HEADER */}
      <header className="terms-topbar">

        <a href="/#home" className="terms-brand">
          <img
            src="/give.png"
            alt="Give Laurels Foundation of India"
          />
        </a>

        <button
          type="button"
          className="terms-back-home"
          onClick={onBack}
        >
          ← Back to Registration
        </button>

      </header>


      {/* PAGE */}
      <main className="terms-main">

        <section className="terms-card">

          {/* TITLE */}

          <div className="terms-title">

            <span>RANGAVALLIKA 2027</span>

            <h1>
              Terms &amp; Conditions
            </h1>

            <p>
              Please read the following terms carefully before
              completing your registration.
            </p>

          </div>


          {/* CONTENT */}

          <div className="terms-content">

            <section>
              <h2>1. Eligibility</h2>

              <ul>
                <li>
                  The competition is open to women participants.
                </li>

                <li>
                  Participants must provide accurate registration
                  details.
                </li>

                <li>
                  Each participant can register only once.
                </li>
              </ul>
            </section>


            <section>
              <h2>2. Registration</h2>

              <ul>
                <li>
                  Registration must be completed through the
                  official online registration form.
                </li>

                <li>
                  All required details must be entered correctly.
                </li>

                <li>
                  Participants must select the required package
                  during registration.
                </li>

                <li>
                  Registration will be confirmed after successful
                  payment.
                </li>
              </ul>
            </section>


            <section>
              <h2>3. Competition</h2>

              <ul>
                <li>
                  Participants must create their Rangoli according
                  to the theme or instructions announced by the
                  organizers.
                </li>

                <li>
                  The Rangoli must be created by the registered
                  participant.
                </li>

                

                <li>
                  The Rangoli must be completed within the allotted
                  time.
                </li>
              </ul>
            </section>


            <section>
              <h2>4. Participant Responsibility</h2>

              <ul>
                <li>
                  Participants are responsible for the accuracy
                  of the information provided during registration.
                </li>

                <li>
                  Participants should follow the instructions
                  provided by the organizers.
                </li>

                <li>
                  Participants are expected to maintain appropriate
                  conduct throughout the competition.
                </li>
              </ul>
            </section>


            <section>
              

              <ul>
                

                
              </ul>
            </section>


            <section>
              
            </section>


            <section>
              <h2>5. Organizer's Decision</h2>

              <p>
                The organizers reserve the right to make decisions
                regarding the conduct and administration of the
                competition.
              </p>
            </section>


            <section>
              <h2>6. Agreement</h2>

              <p>
                By proceeding with registration, the participant
                confirms that the information provided is correct
                and agrees to follow the applicable competition
                rules and instructions.
              </p>
            </section>

          </div>


          {/* BOTTOM */}

          <div className="terms-bottom">

            <p>
              By continuing with registration, you acknowledge
              that you have read and understood these terms.
            </p>

            <button
              type="button"
              onClick={onBack}
            >
              ← Back to Review
            </button>

          </div>

        </section>

      </main>

    </div>
  );
}

export default TermsConditions;