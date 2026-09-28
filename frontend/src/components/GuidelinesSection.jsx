import React from "react";
import "./GuidelinesSection.css";

// Decorative SVG Components
const LotusIcon = () => (
  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C13.5 5 16 8 19 9.5C16 11 14 13.5 12 16.5C10 13.5 8 11 5 9.5C8 8 10.5 5 12 2Z" fill="#D4AF37" stroke="#B8860B" strokeWidth="0.8"/>
    <path d="M12 5C14 7.5 17 9.5 21 10C17.5 12 15 14.5 12 17.5C9 14.5 6.5 12 3 10C7 9.5 10 7.5 12 5Z" fill="#DAA520" opacity="0.8"/>
    <path d="M12 8C13.2 10 15 11.5 17.5 12C15 13 13.5 14.5 12 16C10.5 14.5 9 13 6.5 12C9 11.5 10.8 10 12 8Z" fill="#FFD700"/>
  </svg>
);

const HeaderSwooshHeart = () => (
  <svg className="header-swoosh" viewBox="0 0 320 28" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 14 C 70 24, 130 24, 150 16" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
    <path d="M170 16 C 190 24, 250 24, 310 14" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
    <path d="M160 10 C 157 5, 150 7, 153 12 L 160 19 L 167 12 C 170 7, 163 5, 160 10 Z" fill="#D81B60" />
    <circle cx="10" cy="14" r="2.5" fill="#D4AF37" />
    <circle cx="310" cy="14" r="2.5" fill="#D4AF37" />
  </svg>
);

const FooterFlourish = () => (
  <div className="footer-flourish-container">
    <svg width="60" height="16" viewBox="0 0 60 16" fill="none">
      <path d="M5 8 Q 30 18 55 8" stroke="#D4AF37" strokeWidth="1.5" fill="none"/>
      <circle cx="5" cy="8" r="2" fill="#D4AF37"/>
    </svg>
    <span className="footer-flourish-text">Art connects hearts <span className="heart-icon">♥</span></span>
    <svg width="60" height="16" viewBox="0 0 60 16" fill="none">
      <path d="M5 8 Q 30 18 55 8" stroke="#D4AF37" strokeWidth="1.5" fill="none"/>
      <circle cx="55" cy="8" r="2" fill="#D4AF37"/>
    </svg>
  </div>
);

// Marigold Toran & Garland SVG (Top Corners)
const TopGarlandCorner = ({ position = "left" }) => {
  const isLeft = position === "left";
  return (
    <div className={`garland-corner garland-${position}`}>
      <svg width="220" height="280" viewBox="0 0 220 280" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform={isLeft ? "" : "translate(220, 0) scale(-1, 1)"}>
          {/* Main Toran Curve String */}
          <path d="M-20 10 Q 60 40 140 10 Q 180 -5 220 -10" stroke="#8B5A2B" strokeWidth="2" fill="none"/>
          
          {/* Hanging Marigold String 1 */}
          <line x1="30" y1="28" x2="30" y2="180" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="2 3"/>
          {[40, 65, 90, 115, 140, 165].map((y, i) => (
            <g key={`s1-${i}`} transform={`translate(30, ${y})`}>
              <circle r="9" fill={i % 2 === 0 ? "#FF9800" : "#FFC107"} />
              <circle r="6" fill={i % 2 === 0 ? "#E65100" : "#FFA000"} />
              <circle r="3" fill="#FFF3E0" />
            </g>
          ))}

          {/* Hanging Marigold String 2 */}
          <line x1="80" y1="35" x2="80" y2="240" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="2 3"/>
          {[45, 75, 105, 135, 165, 195, 225].map((y, i) => (
            <g key={`s2-${i}`} transform={`translate(80, ${y})`}>
              <circle r="10" fill={i % 2 === 0 ? "#FFC107" : "#FF9800"} />
              <circle r="7" fill={i % 2 === 0 ? "#FFA000" : "#E65100"} />
              <circle r="3.5" fill="#FFF" />
            </g>
          ))}

          {/* Hanging Marigold String 3 */}
          <line x1="130" y1="25" x2="130" y2="150" stroke="#4CAF50" strokeWidth="1.5" strokeDasharray="2 3"/>
          {[35, 60, 85, 110, 135].map((y, i) => (
            <g key={`s3-${i}`} transform={`translate(130, ${y})`}>
              <circle r="8" fill={i % 2 === 0 ? "#FF9800" : "#FFC107"} />
              <circle r="5" fill={i % 2 === 0 ? "#E65100" : "#FFA000"} />
            </g>
          ))}

          {/* Corner Floral Cluster (Roses & Mango Leaves) */}
          <g transform="translate(10, 10)">
            {/* Mango Leaves */}
            <path d="M-10 10 C 20 -20 50 -10 60 20 C 30 30 0 20 -10 10 Z" fill="#2E7D32" opacity="0.9"/>
            <path d="M15 5 C 45 -25 75 -5 80 25 C 50 35 20 20 15 5 Z" fill="#388E3C" opacity="0.85"/>
            <path d="M-20 30 C 10 5 30 40 40 60 C 10 60 -10 50 -20 30 Z" fill="#1B5E20" opacity="0.9"/>

            {/* Pink Roses */}
            <circle cx="15" cy="20" r="16" fill="#F48FB1"/>
            <circle cx="15" cy="20" r="12" fill="#F06292"/>
            <circle cx="15" cy="20" r="8" fill="#EC407A"/>
            <circle cx="15" cy="20" r="4" fill="#AD1457"/>

            <circle cx="45" cy="12" r="13" fill="#F8BBD0"/>
            <circle cx="45" cy="12" r="9" fill="#F48FB1"/>
            <circle cx="45" cy="12" r="5" fill="#E91E63"/>

            {/* Marigold Accent */}
            <circle cx="35" cy="38" r="11" fill="#FFB300"/>
            <circle cx="35" cy="38" r="7" fill="#FB8C00"/>
          </g>
        </g>
      </svg>
    </div>
  );
};

// Mandala Watermark Background Component
const MandalaWatermark = ({ position = "left" }) => (
  <div className={`mandala-bg mandala-${position}`}>
    <svg width="340" height="340" viewBox="0 0 200 200" fill="none" opacity="0.16">
      <circle cx="100" cy="100" r="95" stroke="#C5A059" strokeWidth="1" strokeDasharray="3 3"/>
      <circle cx="100" cy="100" r="85" stroke="#D4AF37" strokeWidth="1"/>
      <circle cx="100" cy="100" r="70" stroke="#C5A059" strokeWidth="0.8"/>
      <circle cx="100" cy="100" r="50" stroke="#D4AF37" strokeWidth="1"/>
      <circle cx="100" cy="100" r="30" stroke="#C5A059" strokeWidth="0.8"/>
      <circle cx="100" cy="100" r="12" stroke="#D4AF37" strokeWidth="1"/>
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <g key={i} transform={`rotate(${deg} 100 100)`}>
          <path d="M100 15 C105 35 115 45 100 70 C85 45 95 35 100 15Z" stroke="#D4AF37" strokeWidth="0.8" fill="none"/>
          <path d="M100 30 C108 50 118 60 100 85 C82 60 92 50 100 30Z" stroke="#C5A059" strokeWidth="0.5" fill="none"/>
          <circle cx="100" cy="20" r="2" fill="#D4AF37"/>
        </g>
      ))}
    </svg>
  </div>
);

// Bottom Left Rangoli & Diya SVG Component
const BottomRangoliDiya = () => (
  <div className="bottom-rangoli-corner">
    <svg width="260" height="240" viewBox="0 0 260 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Floor Rangoli Mandala Pattern */}
      <g transform="translate(10, 80)">
        <circle cx="90" cy="90" r="85" fill="url(#rg-grad-outer)" opacity="0.85"/>
        <circle cx="90" cy="90" r="70" fill="url(#rg-grad-mid)"/>
        <circle cx="90" cy="90" r="50" fill="#E91E63"/>
        <circle cx="90" cy="90" r="32" fill="#FFC107"/>

        {/* Rangoli Petals Geometry */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
          <g key={i} transform={`rotate(${deg} 90 90)`}>
            <path d="M90 10 C102 40 115 50 90 80 C65 50 78 40 90 10Z" fill={i % 2 === 0 ? "#FFEB3B" : "#00BCD4"} opacity="0.9"/>
            <circle cx="90" cy="25" r="4" fill="#FFF"/>
          </g>
        ))}
        <circle cx="90" cy="90" r="15" fill="#9C27B0"/>
        <circle cx="90" cy="90" r="7" fill="#FFF"/>
      </g>

      {/* Lit Brass Diya (Oil Lamp with Flame) */}
      <g transform="translate(100, 110)">
        {/* Glow behind flame */}
        <circle cx="40" cy="-10" r="28" fill="url(#flame-glow)" opacity="0.8"/>

        {/* Diya Brass Base */}
        <path d="M10 25 C 10 50, 70 50, 70 25 C 75 20, 85 15, 80 10 C 60 15, 20 15, 0 10 C -5 15, 5 20, 10 25 Z" fill="url(#diya-gold)"/>
        <path d="M15 25 C 20 40, 60 40, 65 25 Z" fill="#B78103"/>

        {/* Flame */}
        <path d="M40 12 C 30 -5, 36 -25, 40 -32 C 44 -25, 50 -5, 40 12 Z" fill="url(#flame-grad)"/>
        <path d="M40 8 C 35 -3, 38 -18, 40 -23 C 42 -18, 45 -3, 40 8 Z" fill="#FFF7C2"/>
      </g>

      {/* Scattered Petals */}
      <g opacity="0.85">
        <path d="M180 180 C185 170 195 172 192 182 C188 190 178 188 180 180Z" fill="#FFC107"/>
        <path d="M210 160 C215 150 225 152 222 162 C218 170 208 168 210 160Z" fill="#E91E63"/>
        <path d="M195 210 C200 200 210 202 207 212 C203 220 193 218 195 210Z" fill="#FF9800"/>
      </g>

      {/* Gradients */}
      <defs>
        <radialGradient id="rg-grad-outer" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#00ACC1"/>
          <stop offset="60%" stopColor="#1E88E5"/>
          <stop offset="100%" stopColor="#3949AB"/>
        </radialGradient>
        <radialGradient id="rg-grad-mid" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFB300"/>
          <stop offset="70%" stopColor="#FB8C00"/>
          <stop offset="100%" stopColor="#F4511E"/>
        </radialGradient>
        <radialGradient id="flame-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFEB3B" stopOpacity="0.9"/>
          <stop offset="50%" stopColor="#FF9800" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#FF5722" stopOpacity="0"/>
        </radialGradient>
        <linearGradient id="diya-gold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082"/>
          <stop offset="50%" stopColor="#FFB300"/>
          <stop offset="100%" stopColor="#E65100"/>
        </linearGradient>
        <linearGradient id="flame-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#D84315"/>
          <stop offset="30%" stopColor="#FF8F00"/>
          <stop offset="70%" stopColor="#FFD54F"/>
          <stop offset="100%" stopColor="#FFF9C4"/>
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// Bottom Right Lotus Corner SVG Component
const BottomLotusCorner = () => (
  <div className="bottom-lotus-corner">
    <svg width="240" height="240" viewBox="0 0 240 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g transform="translate(40, 40)">
        {/* Lotus Leaves (Pads) */}
        <path d="M-10 120 C 30 80, 110 80, 150 130 C 100 160, 20 160, -10 120 Z" fill="#2E7D32" opacity="0.8"/>
        <path d="M60 130 C 100 90, 170 100, 190 145 C 140 170, 70 165, 60 130 Z" fill="#388E3C" opacity="0.75"/>

        {/* Outer Lotus Petals */}
        <path d="M70 110 C 20 70, 30 30, 70 50 C 60 80, 65 100, 70 110 Z" fill="#F48FB1"/>
        <path d="M70 110 C 120 70, 110 30, 70 50 C 80 80, 75 100, 70 110 Z" fill="#F48FB1"/>
        
        <path d="M70 110 C 10 80, 10 40, 50 30 C 55 60, 65 90, 70 110 Z" fill="#F06292"/>
        <path d="M70 110 C 130 80, 130 40, 90 30 C 85 60, 75 90, 70 110 Z" fill="#F06292"/>

        {/* Inner Main Lotus Petals */}
        <path d="M70 110 C 30 60, 40 10, 70 0 C 100 10, 110 60, 70 110 Z" fill="url(#lotus-inner-grad)"/>
        <path d="M70 110 C 45 70, 50 25, 70 10 C 90 25, 95 70, 70 110 Z" fill="url(#lotus-core-grad)"/>

        {/* Floating Petals */}
        <path d="M140 60 C150 50 165 55 160 70 C150 80 135 75 140 60Z" fill="#F48FB1" opacity="0.85"/>
        <path d="M165 100 C175 90 190 95 185 110 C175 120 160 115 165 100Z" fill="#EC407A" opacity="0.8"/>
      </g>

      <defs>
        <linearGradient id="lotus-inner-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#C2185B"/>
          <stop offset="50%" stopColor="#E91E63"/>
          <stop offset="100%" stopColor="#F8BBD0"/>
        </linearGradient>
        <linearGradient id="lotus-core-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#880E4F"/>
          <stop offset="60%" stopColor="#D81B60"/>
          <stop offset="100%" stopColor="#FFEB3B"/>
        </linearGradient>
      </defs>
    </svg>
  </div>
);

// Card Corner Leaf SVG
const CardCornerLeaf = ({ color = "#E91E63" }) => (
  <svg className="card-corner-leaf-svg" width="90" height="90" viewBox="0 0 90 90" fill="none">
    <g opacity="0.28">
      <path d="M80 80 C 50 70, 30 40, 20 10 M80 80 C 60 50, 40 30, 10 20" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <path d="M80 80 C 70 60, 50 50, 45 35 C 55 45, 75 55, 80 80 Z" fill={color} />
      <path d="M60 65 C 50 50, 35 45, 30 30 C 40 40, 55 45, 60 65 Z" fill={color} />
      <path d="M40 50 C 32 38, 22 35, 18 22 C 26 30, 36 34, 40 50 Z" fill={color} />
    </g>
  </svg>
);

// Icon Components for the 6 Cards
const CardIcons = {
  Eligibility: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 16L3 5l5.5 5L12 4l3.5 6L21 5l-2 11H5z" />
      <path d="M12 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    </svg>
  ),
  Registration: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  ),
  Rangoli: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
      <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  Rules: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
      <path d="M9 12l2 2 4-4" />
      <path d="M9 17h6" />
    </svg>
  ),
  Prizes: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2z" />
      <polygon points="12 4 13.09 6.26 15.54 6.62 13.77 8.35 14.19 10.8 12 9.65 9.81 10.8 10.23 8.35 8.46 6.62 10.91 6.26 12 4" fill="currentColor"/>
    </svg>
  ),
  Instructions: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M11 7h2v4h-2z" />
      <path d="M12 14h.01" />
    </svg>
  ),
};

const guidelinesData = [
  {
    id: "01",
    title: "Eligibility",
    themeClass: "card-theme-pink",
    leafColor: "#E91E63",
    Icon: CardIcons.Eligibility,
    items: [
      "Open to women participants.",
      "Participants must provide accurate registration details.",
      "Each participant can register only once."
    ]
  },
  {
    id: "02",
    title: "Registration",
    themeClass: "card-theme-teal",
    leafColor: "#00ACC1",
    Icon: CardIcons.Registration,
    items: [
      "Registration must be completed through the official online registration form.",
      "All required details must be entered correctly.",
      "Select the required package during registration.",
      "Registration will be confirmed after successful payment."
    ]
  },
  {
    id: "03",
    title: "Rangoli Competition",
    themeClass: "card-theme-gold",
    leafColor: "#FFB300",
    Icon: CardIcons.Rangoli,
    items: [
      "Create the Rangoli according to the theme or instructions announced by the organizers.",
      "The Rangoli should be created by the registered participant.",
      "Participants should bring the required Rangoli materials.",
      "The Rangoli must be completed within the allotted time."
    ]
  },
  {
    id: "04",
    title: "Competition Rules",
    themeClass: "card-theme-green",
    leafColor: "#2E7D32",
    Icon: CardIcons.Rules,
    items: [
      "Participants must follow all instructions given by the organizers.",
      "Maintain cleanliness and discipline at the venue.",
      "Unfair practices or copying may result in disqualification.",
      "The organizer's decision will be final."
    ]
  },
  {
    id: "05",
    title: "Prizes & Awards",
    themeClass: "card-theme-purple",
    leafColor: "#8E24AA",
    Icon: CardIcons.Prizes,
    items: [
      "Winners will receive prizes or awards according to the event arrangements.",
      "Certificates will be provided as specified by the organizers.",
      "Prize details will be announced by the organizers."
    ]
  },
  {
    id: "06",
    title: "Important Instructions",
    themeClass: "card-theme-coral",
    leafColor: "#E91E63",
    Icon: CardIcons.Instructions,
    items: [
      "Keep your registration confirmation safely.",
      "Follow the reporting time communicated by the organizers.",
      "Necessary changes to event arrangements may be made by the organizers.",
      "Participants are expected to cooperate with the organizing team."
    ]
  }
];

export default function GuidelinesSection() {
  return (
    <section id="guidelines" className="guidelines-luxury-section">
      {/* Background Decorative Art */}
      <TopGarlandCorner position="left" />
      <TopGarlandCorner position="right" />
      <MandalaWatermark position="left" />
      <MandalaWatermark position="right" />
      <BottomRangoliDiya />
      <BottomLotusCorner />

      <div className="guidelines-luxury-container">
        {/* Header Block */}
        <div className="guidelines-luxury-header">
          <div className="guidelines-top-badge">
            <span className="badge-line"></span>
            <LotusIcon />
            <span className="badge-text">GUIDELINES</span>
            <LotusIcon />
            <span className="badge-line"></span>
          </div>

          <h2 className="guidelines-main-title">
            Everything <span className="title-highlight">You Need to Know</span>
          </h2>

          <HeaderSwooshHeart />

          <p className="guidelines-sub-title">
            Please read the guidelines carefully before participating.
          </p>
          
          <div className="guidelines-header-lotus-bottom">
            <LotusIcon />
          </div>
        </div>

        {/* 6 Cards Grid (2 Cols x 3 Rows) */}
        <div className="guidelines-cards-grid">
          {guidelinesData.map((card) => {
            const { Icon } = card;
            return (
              <div key={card.id} className={`guideline-luxury-card ${card.themeClass}`}>
                {/* Left Badges Group */}
                <div className="card-badges-group">
                  <div className="card-number-badge">
                    <span>{card.id}</span>
                  </div>
                  <div className="card-icon-badge">
                    <Icon />
                  </div>
                </div>

                {/* Content Section */}
                <div className="card-content-body">
                  <h3 className="card-title">{card.title}</h3>
                  <ul className="card-bullet-list">
                    {card.items.map((item, idx) => (
                      <li key={idx}>
                        <span className="bullet-dot"></span>
                        <span className="bullet-text">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Right Corner Leaf Watermark */}
                <CardCornerLeaf color={card.leafColor} />
              </div>
            );
          })}
        </div>

        {/* Bottom Banner Flourish */}
        <FooterFlourish />
      </div>
    </section>
  );
}
