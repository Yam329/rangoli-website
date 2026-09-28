import React from "react";
import "./Hero.css";

function Hero() {
  return (
    <main className="hero-section" id="home">

      {/* ==================================================
          HERO MAIN AREA
          ================================================== */}

      <section className="hero-main">

        {/* LEFT CONTENT */}
        <div className="hero-content">

          <div className="hero-eyebrow">
            <span>LET</span>
            <strong>CREATIVITY BLOSSOM</strong>
            <i></i>
          </div>

          <h1>
            <span className="rangoli-title">
              Rangoli
            </span>

            <span className="competition-title">
              Competition
            </span>
          </h1>

          <p className="hero-tagline">
            Draw your imagination. Color the world.
          </p>


          {/* EVENT DETAILS */}

          <div className="event-details">

            <div className="event-detail">

              <div className="event-icon">
                📅
              </div>

              <div>
                <span>EVENT DATE</span>
                <strong>
                  25th October 2026
                </strong>
              </div>

            </div>


            <div className="event-divider"></div>


            <div className="event-detail">

              <div className="event-icon">
                👩
              </div>

              <div>
                <span>OPEN FOR</span>
                <strong>
                  All Women
                </strong>
              </div>

            </div>

          </div>


          {/* BUTTONS */}

          <div className="hero-buttons">

            <a
              href="/register"
              className="primary-button"
            >
              Register Now
              <span>→</span>
            </a>

            <a
              href="#rules"
              className="secondary-button"
            >
              View Guidelines
            </a>

          </div>

        </div>


        {/* ==================================================
            RIGHT RANGOLI
            ================================================== */}

        <div className="hero-art-area">

          <div className="rangoli-circle">

            <div className="circle-ring ring-one"></div>
            <div className="circle-ring ring-two"></div>
            <div className="circle-ring ring-three"></div>

            <img
              src="/hero-rangoli.png"
              alt="Colorful Rangoli Artwork"
              className="hero-rangoli"
            />

          </div>


          {/* WORDS BESIDE RANGOLI */}

          <div className="art-words">

            <span>Art</span>
            <span>Culture</span>
            <span>Creativity</span>
            <span>Together</span>

            <div className="art-decoration">
              <i></i>
              <b>✦</b>
              <i></i>
            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          FOUR FEATURE BOXES
          ================================================== */}

      <section className="feature-strip">

        <div className="feature-item">

          <div className="feature-icon">
            🎨
          </div>

          <strong>
            Express Your Creativity
          </strong>

        </div>


        <div className="feature-line"></div>


        <div className="feature-item">

          <div className="feature-icon">
            🏆
          </div>

          <strong>
            Showcase Your Talent
          </strong>

        </div>


        <div className="feature-line"></div>


        <div className="feature-item">

          <div className="feature-icon">
            🎁
          </div>

          <strong>
            Win Exciting Prizes
          </strong>

        </div>


        <div className="feature-line"></div>


        <div className="feature-item">

          <div className="feature-icon">
            👥
          </div>

          <strong>
            Be a Part of Our Community
          </strong>

        </div>

      </section>


      {/* ==================================================
          SMALL QUOTE BOX
          ================================================== */}

      <section className="quote-box">

        <div className="quote-main">
          Creativity has no boundaries,
          <br />
          just colors.
        </div>


        <div className="quote-decoration">

          <i></i>

          <b>✦</b>

          <i></i>

        </div>


        <div className="quote-secondary">

          <em>
            “Every rangoli tells a story,
            <br />
            make yours unforgettable.”
          </em>

        </div>

      </section>

    </main>
  );
}

export default Hero;