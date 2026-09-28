import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Register from "./Register";
import Payment from "./components/Payment";
import Header from "./components/Header";
import GuidelinesSection from "./components/GuidelinesSection";
import ContactSection from "./components/ContactSection";

import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import AdminRegistrations from "./admin/pages/AdminRegistrations";
import AdminPayments from "./admin/pages/AdminPayments";
import AdminQueries from "./admin/pages/AdminQueries";
import ProtectedAdminRoute from "./admin/components/ProtectedAdminRoute";

import "./App.css";

import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";

import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiHeart,
  FiUser,
  FiMessageCircle,
  FiList,
} from "react-icons/fi";

function PaymentReturnPage() {
  const params = new URLSearchParams(window.location.search);

  const payment = params.get("payment");
  const registrationId = params.get("registration_id");

  if (
    !registrationId ||
    !["success", "failed", "pending"].includes(payment)
  ) {
    return <HomePage />;
  }

  return (
    <Payment
      registrationId={registrationId}
      registration={{
        registration_id: registrationId,
        payment_status:
          payment === "success"
            ? "SUCCESS"
            : payment === "failed"
            ? "FAILED"
            : "PAYMENT_INITIATED",
      }}
      onBack={() => {
        window.location.href = "/";
      }}
      onHome={() => {
        window.location.href = "/";
      }}
    />
  );
}
function App() {
  return (
<BrowserRouter>
  <Routes>

    {/* PUBLIC RANGOLI WEBSITE */}
   <Route path="/" element={<PaymentReturnPage />} />

    {/* REGISTRATION */}
    <Route path="/register" element={<Register />} />

    {/* ADMIN LOGIN */}
    <Route path="/admin" element={<AdminLogin />} />
    <Route
  path="/admin/dashboard"
  element={
    <ProtectedAdminRoute>
      <AdminDashboard />
    </ProtectedAdminRoute>
  }
/>
<Route
  path="/admin/registrations"
  element={
    <ProtectedAdminRoute>
      <AdminRegistrations />
    </ProtectedAdminRoute>
  }
/>
<Route
  path="/admin/payments"
  element={
    <ProtectedAdminRoute>
      <AdminPayments />
    </ProtectedAdminRoute>
  }
/>
<Route
  path="/admin/queries"
  element={
    <ProtectedAdminRoute>
      <AdminQueries />
    </ProtectedAdminRoute>
  }
/>


    {/* Unknown URL */}
    <Route
      path="*"
      element={<Navigate to="/" replace />}
    />

  </Routes>
</BrowserRouter>
  );
}


/* =====================================================
   HOME PAGE
===================================================== */

function HomePage() {
  useEffect(() => {
    if (window.location.pathname === "/about") {
      window.history.replaceState(null, "", "/#about");

      setTimeout(() => {
        const aboutSection = document.getElementById("about");

        if (aboutSection) {
          aboutSection.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
      }, 100);
    }
  }, []);


  const goRegister = () => {
    window.location.href = "/register";
  };


  return (
    <div className="home-page">

      <Header />


      {/* =================================================
          HERO / HOME
      ================================================= */}

      {/* =================================================
          HERO / HOME
      ================================================= */}

      <section id="home" className="hero-section">

        <div className="hero-container">

          <div className="hero-content">

            <div className="hero-eyebrow">
              <span className="eyebrow-flower">❀</span>
              <span className="eyebrow-text">LET CREATIVITY BLOSSOM</span>
              <span className="eyebrow-flower">❀</span>
            </div>

            <div className="hero-title-wrap">
              <h1 className="main-script-title">
                Rangavalika <span className="title-flower-emoji">🌸</span>
              </h1>
              <h2 className="main-serif-subtitle">RANGOLI FEST</h2>
            </div>

            <p className="hero-script-tagline">
              Draw your imagination.
              <br />
              <span className="tagline-sub">Color the world. ♡</span>
            </p>

            {/* BADGES ROW */}
            <div className="hero-badges-row">

              <div className="badge-card">
                <div className="badge-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
                <div className="badge-text-box">
                  <span className="badge-label">DATE</span>
                  <strong className="badge-value">14th January 2027</strong>
                </div>
              </div>

              <div className="badge-card">
                <div className="badge-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                  </svg>
                </div>
                <div className="badge-text-box">
                  <span className="badge-label">CATEGORY</span>
                  <strong className="badge-value">Rangoli Competition</strong>
                </div>
              </div>

              <div className="badge-card">
                <div className="badge-icon-wrapper">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </div>
                <div className="badge-text-box">
                  <span className="badge-label">MODE</span>
                  <strong className="badge-value">Online Registration</strong>
                </div>
              </div>

            </div>

            {/* BUTTONS & LINKS */}
            <div className="hero-buttons-row">
              <button
                className="hero-primary-btn"
                onClick={goRegister}
              >
                <span className="btn-doc-icon">📄</span>
                Register Now
                <span className="btn-arrow">→</span>
              </button>

              <a
                href="#guidelines"
                className="hero-secondary-btn"
              >
                <span className="btn-doc-icon">📋</span>
                View Guidelines
              </a>

              <div className="hero-continue-reg-block">
                <button
                  type="button"
                  className="existing-registration-text-btn"
                  onClick={() => {
                    window.location.href = "/register?continue=existing";
                  }}
                >
                  <span className="cont-top">Already registered?</span>
                  <span className="cont-bottom">Continue Existing Registration → ♡</span>
                </button>
              </div>
            </div>

          </div>


          <div className="hero-art">
            <div className="rotating-rangoli-container">
              
            </div>
            
          </div>

        </div>

      </section>


      {/* =================================================
          MOVING INFORMATION BAR
      ================================================= */}

      <div className="home-marquee">

        <div className="marquee-track">

          <span>
            ✦ Rangavallika — Where tradition meets creativity
          </span>

          <span>
            ✦ 14th January 2027 — Save the date and get ready to create
          </span>

          <span>
            ✦ Give Laurels Foundation of India — Creating opportunities and empowering communities
          </span>

          <span>
            ✦ Celebrate Indian culture through the timeless art of Rangoli
          </span>

          <span>
            ✦ Rangavallika — Where tradition meets creativity
          </span>

          <span>
            ✦ 14th January 2027 — Save the date and get ready to create
          </span>

          <span>
            ✦ Give Laurels Foundation of India — Creating opportunities and empowering communities
          </span>

          <span>
            ✦ Celebrate Indian culture through the timeless art of Rangoli
          </span>

        </div>

      </div>


      {/* =================================================
          ABOUT US
      ================================================= */}

      {/* =================================================
          ABOUT US
      ================================================= */}

      <section id="about" className="about-section">

        <div className="about-container">

          {/* Left Spacer so background woman image shows clearly on far left */}
          <div className="about-spacer-left"></div>

          <div className="about-content">

            {/* Top Eyebrow with Lotus Emblem */}
            <div className="about-eyebrow-wrapper">
              <svg width="28" height="18" viewBox="0 0 32 20" fill="none" className="eyebrow-lotus">
                <path d="M16 2C13 7 9 10 4 11C9 13 13 16 16 19C19 16 23 13 28 11C23 10 19 7 16 2Z" fill="#D4AF37"/>
                <path d="M16 5C14 9 11 11 7 12C11 13 14 15 16 18C18 15 21 13 25 12C21 11 18 9 16 5Z" fill="#F3E5AB"/>
              </svg>
              <div className="about-eyebrow">
                <span className="eyebrow-line">─────</span>
                <span className="eyebrow-text">ABOUT US</span>
                <span className="eyebrow-line">─────</span>
              </div>
            </div>

            <h2 className="about-heading">
              About <span className="about-title-script">Rangavalika <span className="title-flower-emoji">🌸</span></span>
            </h2>

            <h3 className="about-subheading">
              Celebrating creativity,<br />
              tradition & expression.
              <span className="subheading-heart">💕</span>
            </h3>

            <div className="lotus-divider-wrap">
              <span className="lotus-line"></span>
              <span className="lotus-icon">🪷</span>
              <span className="lotus-line"></span>
            </div>

            <p className="about-paragraph">
              Rangavallika Rangoli Fest is a celebration of creativity, Indian tradition
              and women's artistic expression, organized by{" "}
              <strong>Give Laurels Foundation of India.</strong>
            </p>

            <p className="about-paragraph">
              The event brings together women from different walks of life to showcase
              their talent, preserve our cultural heritage and share the beauty of Rangoli art.
            </p>

            <p className="about-paragraph">
              Through Rangavallika, Give Laurels Foundation of India continues its mission
              of creating opportunities, encouraging creativity and empowering women
              to contribute to a more inclusive and vibrant community.
            </p>

            <div className="about-signature-block">
              <span className="signature-text">Art connects hearts 💕</span>
              <div className="signature-flourish"></div>
            </div>

          </div>


          <div className="about-values-grid">

            {/* CARD 1 - PINK */}
            <div className="value-card card-pink">
              <div className="card-icon-circle icon-pink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"></path>
                  <path d="M12 6v12M6 12h12"></path>
                </svg>
              </div>
              <strong className="card-title title-pink">
                Celebrating<br />Tradition
              </strong>
              <div className="card-title-line line-pink"></div>
              <p className="card-desc">
                Honouring India's rich cultural heritage through the timeless art of Rangoli.
              </p>
              <div className="card-corner-leaf leaf-pink">
                <svg width="54" height="54" viewBox="0 0 50 50" fill="none">
                  <path d="M45 50C45 28 28 12 8 18C22 30 36 42 45 50Z" fill="#d91c78" opacity="0.30"/>
                  <path d="M48 42C38 24 24 18 12 22C24 30 38 38 48 42Z" fill="#d91c78" opacity="0.22"/>
                  <path d="M32 48C28 38 18 32 12 35C18 42 26 46 32 48Z" fill="#d91c78" opacity="0.18"/>
                </svg>
              </div>
            </div>


            {/* CARD 2 - TEAL */}
            <div className="value-card card-teal">
              <div className="card-icon-circle icon-teal">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18h6M10 22h4M15 9A3 3 0 0 0 9 9c0 2 1 3.5 2 4.5V15h2v-1.5c1-1 2-2.5 2-4.5z"></path>
                </svg>
              </div>
              <strong className="card-title title-teal">
                Encouraging<br />Creativity
              </strong>
              <div className="card-title-line line-teal"></div>
              <p className="card-desc">
                Providing women with a platform to express their imagination, creativity and talent.
              </p>
              <div className="card-corner-leaf leaf-teal">
                <svg width="54" height="54" viewBox="0 0 50 50" fill="none">
                  <path d="M45 50C45 28 28 12 8 18C22 30 36 42 45 50Z" fill="#087e96" opacity="0.32"/>
                  <path d="M48 42C38 24 24 18 12 22C24 30 38 38 48 42Z" fill="#087e96" opacity="0.24"/>
                  <path d="M32 48C28 38 18 32 12 35C18 42 26 46 32 48Z" fill="#087e96" opacity="0.18"/>
                </svg>
              </div>
            </div>


            {/* CARD 3 - GOLD */}
            <div className="value-card card-gold">
              <div className="card-icon-circle icon-gold">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                  <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
              </div>
              <strong className="card-title title-gold">
                Empowering<br />Women
              </strong>
              <div className="card-title-line line-gold"></div>
              <p className="card-desc">
                Creating opportunities for women to showcase their skills and celebrate their achievements.
              </p>
              <div className="card-corner-leaf leaf-gold">
                <svg width="54" height="54" viewBox="0 0 50 50" fill="none">
                  <path d="M45 50C45 28 28 12 8 18C22 30 36 42 45 50Z" fill="#b87e14" opacity="0.32"/>
                  <path d="M48 42C38 24 24 18 12 22C24 30 38 38 48 42Z" fill="#b87e14" opacity="0.24"/>
                  <path d="M32 48C28 38 18 32 12 35C18 42 26 46 32 48Z" fill="#b87e14" opacity="0.18"/>
                </svg>
              </div>
            </div>


            {/* CARD 4 - GREEN */}
            <div className="value-card card-green">
              <div className="card-icon-circle icon-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <strong className="card-title title-green">
                Building<br />Community
              </strong>
              <div className="card-title-line line-green"></div>
              <p className="card-desc">
                Bringing people together through art, culture, creativity and shared experiences.
              </p>
              <div className="card-corner-leaf leaf-green">
                <svg width="54" height="54" viewBox="0 0 50 50" fill="none">
                  <path d="M45 50C45 28 28 12 8 18C22 30 36 42 45 50Z" fill="#207c4d" opacity="0.32"/>
                  <path d="M48 42C38 24 24 18 12 22C24 30 38 38 48 42Z" fill="#207c4d" opacity="0.24"/>
                  <path d="M32 48C28 38 18 32 12 35C18 42 26 46 32 48Z" fill="#207c4d" opacity="0.18"/>
                </svg>
              </div>
            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          GUIDELINES
      ================================================= */}

      <GuidelinesSection />


      {/* =================================================
          REGISTRATION FEE
      ================================================= */}
{/* =================================================
    REGISTRATION FEE / AWARDS
================================================= */}

<section id="awards" className="awards-section">

  <div className="awards-heading">

    {/* Small top label */}
    <div className="awards-label">
      <span></span>
      REGISTRATION
      <span></span>
    </div>

    {/* Main heading */}
    <h2>
      Registration <em>Fee</em>
    </h2>

    {/* Subtitle */}
    <h3>
      Be a Part of Rangavallika
    </h3>

    {/* Description */}
    <p>
      Register for Rangavallika Rangoli Fest
      <br />
      and showcase your creativity.
    </p>

  </div>


  {/* ================================
      REGISTRATION FEE CARD
  ================================= */}

  <div className="registration-fee-wrapper">

    <div className="registration-fee-card">

      {/* Top circular symbol */}
      <div className="registration-fee-symbol">
        ✦
      </div>


      {/* Card title */}
      <div className="registration-fee-small-title">
        REGISTRATION FEE
      </div>


      {/* Gold divider */}
      <div className="registration-fee-divider">
        <span></span>
        <b>✦</b>
        <span></span>
      </div>


      {/* Price */}
      <div className="registration-fee-price">
        ₹999
      </div>


      {/* CHANGED:
          Old text:
          Register now and be a part of
          Rangavallika Rangoli Fest.

          New text:
          Standard registration fee
      */}

      <p className="registration-fee-text">
        Standard registration fee
      </p>


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


  {/* Bottom decorative text */}
  <div className="awards-subline">
    CREATE&nbsp;&nbsp; • &nbsp;&nbsp;
    PARTICIPATE&nbsp;&nbsp; • &nbsp;&nbsp;
    SHINE
  </div>

</section>


      {/* =================================================
          CONTACT
      ================================================= */}

      <ContactSection />

    </div>
  );
}


export default App;
