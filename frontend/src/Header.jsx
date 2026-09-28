import React from "react";
import "./Header.css";

function Header() {
  const goRegister = () => {
    window.location.href = "/register";
  };

  const scrollToSection = (id) => {
    const section = document.getElementById(id);

    if (section) {
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });

      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <header className="home-header">
      <div className="header-box">

        {/* GIVE LAURELS LOGO */}
        <a
          href="#home"
          className="give-laurels-brand"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection("home");
          }}
        >
          <img
            src="/give.png"
            alt="Give Laurels Foundation of India"
          />
        </a>


        {/* NAVIGATION */}
        <nav className="desktop-nav">

          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("home");
            }}
          >
            Home
          </a>

          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("about");
            }}
          >
            About Us
          </a>

          <a
            href="#guidelines"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("guidelines");
            }}
          >
            Guidelines
          </a>

          <a
            href="#awards"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("awards");
            }}
          >
            Awards
          </a>

          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection("contact");
            }}
          >
            Contact
          </a>

        </nav>


        {/* REGISTER */}
        <button
          className="header-register"
          onClick={goRegister}
        >
          Register Now
          <span>→</span>
        </button>


        {/* MOBILE */}
        <button
          className="mobile-menu"
          aria-label="Menu"
        >
          ☰
        </button>

      </div>
    </header>
  );
}

export default Header;