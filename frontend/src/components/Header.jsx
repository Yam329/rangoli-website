import React, { useState } from "react";
import "./Header.css";

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const goRegister = () => {
    setMobileMenuOpen(false);
    window.location.href = "/register";
  };

  const goToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);

    if (!element) {
      console.log(`Section #${id} not found`);
      return;
    }

    element.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <header className="home-header">
      <div className="header-box">

        {/* GIVE LAURELS LOGO */}
        <button
          type="button"
          className="give-laurels-brand"
          onClick={() => goToSection("home")}
        >
          <img
            src="/give.png"
            alt="Give Laurels Foundation of India"
          />
        </button>

        {/* NAVIGATION */}
        <nav className="desktop-nav">

          <button
            type="button"
            onClick={() => goToSection("home")}
          >
            Home
          </button>

          <button
            type="button"
            onClick={() => goToSection("about")}
          >
            About Us
          </button>

          <button
            type="button"
            onClick={() => goToSection("guidelines")}
          >
            Guidelines
          </button>

          <button
            type="button"
            onClick={() => goToSection("awards")}
          >
            Awards
          </button>

          <button
            type="button"
            onClick={() => goToSection("contact")}
          >
            Contact
          </button>

        </nav>

        {/* REGISTER */}
        <button
          type="button"
          className="header-register"
          onClick={goRegister}
        >
          Register Now
          <span>→</span>
        </button>

        {/* MOBILE MENU TOGGLE BUTTON */}
        <button
          type="button"
          className="mobile-menu"
          aria-label="Toggle Navigation Menu"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? "✕" : "☰"}
        </button>

      </div>

      {/* MOBILE DROPDOWN DRAWER */}
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="mobile-nav-drawer" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="mobile-nav-item" onClick={() => goToSection("home")}>
              Home
            </button>
            <button type="button" className="mobile-nav-item" onClick={() => goToSection("about")}>
              About Us
            </button>
            <button type="button" className="mobile-nav-item" onClick={() => goToSection("guidelines")}>
              Guidelines
            </button>
            <button type="button" className="mobile-nav-item" onClick={() => goToSection("awards")}>
              Awards
            </button>
            <button type="button" className="mobile-nav-item" onClick={() => goToSection("contact")}>
              Contact
            </button>

            <button type="button" className="mobile-nav-register-btn" onClick={goRegister}>
              Register Now <span>→</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;