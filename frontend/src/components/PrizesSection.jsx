import React from "react";
import { FaTrophy, FaMapMarkerAlt, FaStar, FaAward } from "react-icons/fa";
import "./PrizesSection.css";

const prizes = [
  {
    key: "district",
    level: "District Level",
    icon: <FaMapMarkerAlt />,
    emblem: <FaAward />,
    caption: "Prize worth up to",
    amount: "₹25,000",
    note: "For the winner from each district",
  },
  {
    key: "state",
    level: "State Level",
    icon: <FaStar />,
    emblem: <FaTrophy />,
    caption: "Prize worth",
    amount: "₹50,000",
    note: "For the top winner at state level",
  },
];

const Laurel = ({ className }) => (
  <svg className={className} viewBox="0 0 120 120" aria-hidden="true">
    {[0, 1, 2, 3, 4, 5].map((i) => {
      // leaves run up each side, from lower-left (245deg) to upper-left (135deg)
      const angle = 245 - i * 22;
      const rad = (angle * Math.PI) / 180;
      const x = 60 + 47 * Math.cos(rad);
      const y = 60 - 47 * Math.sin(rad);
      const tilt = -angle + 25;
      return (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="4.5" ry="10" transform={`rotate(${tilt} ${x} ${y})`} />
          <ellipse cx={120 - x} cy={y} rx="4.5" ry="10" transform={`rotate(${-tilt} ${120 - x} ${y})`} />
        </g>
      );
    })}
  </svg>
);

const Divider = () => (
  <div className="prizes-divider" aria-hidden="true">
    <span></span>
    <b>❖</b>
    <span></span>
  </div>
);

export default function PrizesSection() {
  return (
    <section id="prizes" className="prizes-section">
      <div className="prizes-container">
        {/* HEADER */}
        <header className="prizes-header">
          <div className="prizes-eyebrow">
            <span className="prizes-eyebrow-line"></span>
            <span className="prizes-lotus">✿</span>
            Rangoli Competition
            <span className="prizes-lotus">✿</span>
            <span className="prizes-eyebrow-line"></span>
          </div>

          <h2 className="prizes-title">
            Awards <span className="amp">&amp;</span> <em>Prizes</em>
          </h2>

          <p className="prizes-tagline">
            Recognizing Creativity <span className="prizes-lotus">✿</span>
            Celebrating Talent <span className="prizes-lotus">✿</span>
            Encouraging Tradition
          </p>

          <Divider />
        </header>

        {/* PRIZE CARDS */}
        <div className="prizes-grid">
          {prizes.map((p) => (
            <article key={p.key} className={`prizes-card prizes-${p.key}`}>
              <div className="prizes-card-badge">{p.icon}</div>

              <h3 className="prizes-card-title">
                {p.level} <span>Prize</span>
              </h3>
              <Divider />

              <div className="prizes-emblem">
                <Laurel className="prizes-laurel" />
                <span className="prizes-emblem-icon">{p.emblem}</span>
              </div>

              <p className="prizes-caption">{p.caption}</p>
              <div className="prizes-amount">{p.amount}</div>
              <p className="prizes-note">{p.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
