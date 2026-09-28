import React, { useState } from "react";
import "./ContactSection.css";
import {
  FaInstagram,
  FaFacebookF,
  FaYoutube,
  FaLinkedinIn,
  FaXTwitter,
} from "react-icons/fa6";
import {
  FiUser,
  FiPhone,
  FiList,
  FiMessageCircle,
  FiMail,
  FiMapPin,
  FiHeart,
  FiSend,
  FiLock,
  FiChevronRight,
  FiChevronDown
} from "react-icons/fi";

const GoldHeartIcon = () => (
  <svg width="20" height="18" viewBox="0 0 24 22" fill="none" className="gold-heart-icon">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="#D4AF37" strokeWidth="1.8" fill="none"/>
  </svg>
);

const CardCornerLeaf = ({ color = "#E91E63" }) => (
  <svg className="contact-card-leaf-svg" width="70" height="70" viewBox="0 0 90 90" fill="none">
    <g opacity="0.25">
      <path d="M80 80 C 50 70, 30 40, 20 10 M80 80 C 60 50, 40 30, 10 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M80 80 C 70 60, 50 50, 45 35 C 55 45, 75 55, 80 80 Z" fill={color} />
      <path d="M60 65 C 50 50, 35 45, 30 30 C 40 40, 55 45, 60 65 Z" fill={color} />
      <path d="M40 50 C 32 38, 22 35, 18 22 C 26 30, 36 34, 40 50 Z" fill={color} />
    </g>
  </svg>
);

export default function ContactSection() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    const queryData = {
      name: formData.get("name"),
      phone: formData.get("phone"),
      subject: formData.get("subject"),
      message: formData.get("message"),
    };

    try {
      const rawApiUrl = String(
        import.meta.env.VITE_API_URL || "http://localhost:5000"
      ).trim().replace(/\/$/, "");
      const API_ROOT = rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl}/api`;

      const response = await fetch(`${API_ROOT}/queries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(queryData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit query");
      }

      alert("Thank you! Your message has been received.");
      form.reset();
    } catch (error) {
      console.error("Contact form error:", error);
      alert(error.message || "Unable to submit your message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="contact" className="contact-luxury-section">
      <div className="contact-luxury-container">
        {/* Header Block */}
        <div className="contact-luxury-header">
          <div className="header-heart-top">
            <GoldHeartIcon />
          </div>

          <div className="contact-top-badge">
            <span className="badge-line"></span>
            <span className="badge-text">CONTACT US</span>
            <span className="badge-line"></span>
          </div>

          <h2 className="contact-main-title">
            Contact <span className="title-highlight">Us</span> <span className="title-heart">♡</span>
          </h2>

          <h3 className="contact-sub-title">We’d Love to Hear from You</h3>

          <p className="contact-description">
            Have a question, need more information, or want to be a part<br />
            of Rangavallika? Reach out to us — we’re here to help!
          </p>

          <div className="header-heart-bottom">
            <GoldHeartIcon />
          </div>
        </div>

        {/* Grid Content: Left 4 Info Cards, Right Contact Form */}
        <div className="contact-grid">
          {/* Left Column: 4 Info Cards */}
          <div className="contact-info-column">
            {/* Card 1: Email Us */}
            <div className="info-card info-card-pink">
              <div className="info-card-badge badge-pink">
                <FiMail />
              </div>
              <div className="info-card-body">
                <h4 className="info-card-title title-pink">Email Us</h4>
                <a href="mailto:info@givelaurelsfoundation.com">info@givelaurelsfoundation.com</a>
                <a href="mailto:support@givelaurelsfoundation.org">support@givelaurelsfoundation.org</a>
              </div>
              <span className="info-card-arrow arrow-pink"><FiChevronRight /></span>
              <CardCornerLeaf color="#E91E63" />
            </div>

            {/* Card 2: Call Us */}
            <div className="info-card info-card-teal">
              <div className="info-card-badge badge-teal">
                <FiPhone />
              </div>
              <div className="info-card-body">
                <h4 className="info-card-title title-teal">Call Us</h4>
                <a href="tel:+919347823942">+91 9347823942</a>
                <a href="tel:+919347823943">+91 9347823943</a>
                <a href="tel:+919347839434">+91 9347839434</a>
                <small className="info-card-subtext">(Mon - Sat | 9 AM - 6 PM)</small>
              </div>
              <span className="info-card-arrow arrow-teal"><FiChevronRight /></span>
              <CardCornerLeaf color="#00ACC1" />
            </div>

            {/* Card 3: Our Address */}
            <div className="info-card info-card-gold">
              <div className="info-card-badge badge-gold">
                <FiMapPin />
              </div>
              <div className="info-card-body">
                <h4 className="info-card-title title-gold">Our Address</h4>
                <p className="address-text">
                  #96, 2nd FLOOR SPACE TREE,<br />
                  UNITY MALL, RUDRA TECHNO ENCLAVE,<br />
                  BESIDE RAILINGS METRO STATION,<br />
                  HITEC CITY, Madhapur, Hyderabad,<br />
                  Telangana 500081
                </p>
              </div>
              <span className="info-card-arrow arrow-gold"><FiChevronRight /></span>
              <CardCornerLeaf color="#FFB300" />
            </div>

            {/* Card 4: Follow Us */}
            <div className="info-card info-card-purple">
              <div className="info-card-badge badge-purple">
                <FiHeart />
              </div>
              <div className="info-card-body">
                <h4 className="info-card-title title-purple">Follow Us</h4>
                <div className="contact-social-icons">
                  <a href="https://www.instagram.com/givelaurelsfoundationofindia/?hl=en" target="_blank" rel="noreferrer" aria-label="Instagram" className="soc-icon soc-ig"><FaInstagram /></a>
                  <a href="https://www.facebook.com/profile.php?id=61591867197927" target="_blank" rel="noreferrer" aria-label="Facebook" className="soc-icon soc-fb"><FaFacebookF /></a>
                  <a href="https://www.youtube.com/channel/UCpE9niJWvxJVFe-LiNH9x4g" target="_blank" rel="noreferrer" aria-label="YouTube" className="soc-icon soc-yt"><FaYoutube /></a>
                  <a href="https://www.linkedin.com/in/givelaurelsfoundation-ofindia-19185a409/" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="soc-icon soc-li"><FaLinkedinIn /></a>
                  <a href="https://x.com/givelaurels" target="_blank" rel="noreferrer" aria-label="X" className="soc-icon soc-tw"><FaXTwitter /></a>
                </div>
              </div>
              <span className="info-card-arrow arrow-purple"><FiChevronRight /></span>
              <CardCornerLeaf color="#8E24AA" />
            </div>

            {/* Bottom Cursive Quote */}
            <div className="contact-cursive-quote">
              <span className="quote-sub">Let’s Create a</span>
              <strong className="quote-main">Brighter, More Colourful World</strong>
              <span className="quote-sub">Together!</span>
              <div className="quote-heart">♡</div>
            </div>
          </div>

          {/* Right Column: Contact Form Card */}
          <div className="contact-form-column">
            <div className="contact-form-card">
              {/* Form Top Badge */}
              <div className="form-top-badge">
                <span className="badge-line"></span>
                <span className="form-badge-text"><FiSend /> SEND US A MESSAGE</span>
                <span className="badge-line"></span>
              </div>

              <h3 className="form-card-title">
                We’re Here for <span className="title-highlight">You</span> <span className="title-heart">♡</span>
              </h3>
              
              <div className="form-title-swoosh">
                <svg width="180" height="12" viewBox="0 0 180 12" fill="none">
                  <path d="M10 6 Q 90 14 170 6" stroke="#D4AF37" strokeWidth="1.5" fill="none"/>
                  <circle cx="170" cy="6" r="2" fill="#D4AF37"/>
                </svg>
              </div>

              <p className="form-intro">
                Fill out the form and our team will get back to you soon.
              </p>

              <form onSubmit={handleSubmit} className="contact-form">
                {/* Field 1: Name */}
                <div className="form-field-wrapper">
                  <span className="field-icon"><FiUser /></span>
                  <input
                    type="text"
                    name="name"
                    placeholder="Your Name *"
                    required
                    className="form-input"
                  />
                </div>

                {/* Field 2: Phone */}
                <div className="form-field-wrapper">
                  <span className="field-icon"><FiPhone /></span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Your Phone Number *"
                    required
                    className="form-input"
                  />
                </div>

                {/* Field 3: Subject Select */}
                <div className="form-field-wrapper">
                  <span className="field-icon"><FiList /></span>
                  <select
                    name="subject"
                    defaultValue=""
                    required
                    className="form-select"
                  >
                    <option value="" disabled>Select Subject *</option>
                    <option value="registration">Registration</option>
                    <option value="competition">Competition</option>
                    <option value="package">Prices</option>
                    <option value="general">General Enquiry</option>
                  </select>
                  <span className="select-arrow"><FiChevronDown /></span>
                </div>

                {/* Field 4: Message */}
                <div className="form-field-wrapper textarea-field">
                  <span className="field-icon textarea-icon"><FiMessageCircle /></span>
                  <textarea
                    name="message"
                    placeholder="Your Message *"
                    rows="2"
                    required
                    className="form-textarea"
                  ></textarea>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="contact-submit-btn"
                >
                  <FiSend className="btn-send-icon" />
                  <span>{submitting ? "Sending..." : "Send Message"}</span>
                  <span className="btn-arrow">→</span>
                </button>

                {/* Privacy Text */}
                <div className="form-privacy-note">
                  <span className="lock-icon"><FiLock /></span>
                  <span>Your information is safe with us. We respect your privacy.</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
