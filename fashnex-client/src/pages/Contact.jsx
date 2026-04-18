import React, { useState } from "react";

// ── Placeholder images ────────────────────────────────────────────────────────
const storeImage = "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=800&q=80";

// ── Data ──────────────────────────────────────────────────────────────────────
const storeDetails = [
  {
    icon: "📍",
    label: "Our Address",
    lines: ["FashNex HQ, 4th Floor,", "Linking Road, Bandra West,", "Mumbai, Maharashtra — 400050"],
  },
  {
    icon: "📞",
    label: "Phone",
    lines: ["+91 80346 27054", "+1 (123) 456-7890"],
  },
  {
    icon: "✉️",
    label: "Email",
    lines: ["contact@fashnex.com", "admin@fashnex.com"],
  },
];

const openings = [
  {
    role: "Senior Fashion Stylist",
    type: "Full-time · On-site",
    location: "Mumbai, IN",
    tag: "Design",
    desc: "Lead seasonal collection curation and provide expert styling consultations to our premium clients.",
  },
  {
    role: "Frontend Engineer",
    type: "Full-time · Remote",
    location: "Remote",
    tag: "Tech",
    desc: "Build and maintain our React-based shopping platform with a focus on performance and beautiful UI.",
  },
  {
    role: "Content & Social Media Creator",
    type: "Part-time · Hybrid",
    location: "Mumbai / Remote",
    tag: "Marketing",
    desc: "Create engaging fashion content for Instagram, Pinterest & YouTube to grow the FashNex community.",
  },
  {
    role: "Supply Chain Coordinator",
    type: "Full-time · On-site",
    location: "Mumbai, IN",
    tag: "Operations",
    desc: "Manage vendor relationships, inventory flow, and logistics to ensure on-time delivery for every order.",
  },
];

const tagColors = {
  Design:     "bg-pink-100 text-pink-500",
  Tech:       "bg-fuchsia-100 text-fuchsia-500",
  Marketing:  "bg-rose-100 text-rose-500",
  Operations: "bg-purple-100 text-purple-500",
};

// ── Sub-components ────────────────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-5 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full" />
      <span
        className="text-[11px] font-bold uppercase tracking-[0.22em] text-pink-400"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {children}
      </span>
    </div>
  );
}

function CareerCard({ job }) {
  return (
    <div className="group bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-pink-100/60 hover:-translate-y-1.5 transition-all duration-300 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h3
            className="text-gray-800 font-bold text-[17px] leading-snug"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            {job.role}
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <span>📍 {job.location}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300" />
            <span>{job.type}</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${tagColors[job.tag]}`}
          style={{ fontFamily: "'DM Sans', sans-serif" }}>
          {job.tag}
        </span>
      </div>
      <p className="text-gray-500 text-sm leading-relaxed"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {job.desc}
      </p>
      <button className="self-start flex items-center gap-2 text-pink-500 text-sm font-semibold hover:gap-3 transition-all duration-200"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Apply Now <span>→</span>
      </button>
      {/* Hover accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}

// ── Main Contact Page ─────────────────────────────────────────────────────────
export default function Contact() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.65s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50 relative overflow-hidden">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute -top-24 -left-24 w-[420px] h-[420px] bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute top-[35%] right-[-60px] w-[320px] h-[320px] bg-rose-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-[8%] left-[20%] w-[380px] h-[380px] bg-fuchsia-100/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 pt-28 pb-20 flex flex-col gap-24">

          {/* ══════════════════════════════════════════════
              PAGE HEADER
          ══════════════════════════════════════════════ */}
          <div className="flex flex-col gap-3 fade-up">
            <SectionLabel>Reach Out</SectionLabel>
            <h1
              className="text-5xl sm:text-6xl font-black text-gray-800 leading-[1.1]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Contact{" "}
              <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                Us
              </span>
            </h1>
            <p className="text-gray-500 text-base max-w-md leading-relaxed">
              We'd love to hear from you — whether it's a question, collaboration, or just a hello 🌸
            </p>
          </div>

          {/* ══════════════════════════════════════════════
              SECTION 1 — OUR STORE
          ══════════════════════════════════════════════ */}
          <section className="flex flex-col gap-10">
            <SectionLabel>Our Store</SectionLabel>

            <div className="flex flex-col lg:flex-row gap-10 items-start">

              {/* Left: image */}
              <div className="w-full lg:w-[48%] flex-shrink-0 relative">
                <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-pink-200/40 via-rose-100/20 to-fuchsia-200/30 blur-xl pointer-events-none" />
                <div className="relative rounded-[28px] overflow-hidden border border-white/70 shadow-2xl shadow-pink-200/40"
                  style={{ height: "clamp(300px, 45vw, 520px)" }}>
                  <img src={storeImage} alt="FashNex Store" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                  {/* Glass badge */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">Flagship Store</p>
                      <p className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Bandra West, Mumbai
                      </p>
                    </div>
                    <span className="text-2xl">🏪</span>
                  </div>
                  {/* Open now badge */}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-white text-xs font-semibold">Open Now</span>
                  </div>
                </div>
              </div>

              {/* Right: store details */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {storeDetails.map((detail, i) => (
                  <div
                    key={i}
                    className="bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-6 hover:shadow-lg hover:shadow-pink-100/50 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{detail.icon}</span>
                      <p className="text-xs font-bold uppercase tracking-[0.15em] text-pink-400">
                        {detail.label}
                      </p>
                    </div>
                    {detail.lines.map((line, j) => (
                      <p key={j} className="text-gray-600 text-sm leading-relaxed">
                        {line}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              SECTION 2 — CAREERS
          ══════════════════════════════════════════════ */}
          <section className="flex flex-col gap-10">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex flex-col gap-3">
                <SectionLabel>We're Hiring</SectionLabel>
                <h2
                  className="text-4xl sm:text-5xl font-black text-gray-800 leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Careers at{" "}
                  <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                    FashNex
                  </span>
                </h2>
                <p className="text-gray-500 text-base max-w-lg leading-relaxed">
                  Join a team that lives and breathes fashion. We're building the future of style — and we want bold, creative people with us.
                </p>
              </div>

              <div className="flex flex-col gap-1.5 flex-shrink-0 bg-white/60 backdrop-blur-md border border-pink-100 rounded-2xl px-5 py-4 text-center">
                <p className="text-3xl font-black bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent"
                  style={{ fontFamily: "'Playfair Display', serif" }}>
                  4
                </p>
                <p className="text-xs text-gray-400 font-medium">Open Roles</p>
              </div>
            </div>

            {/* Perks strip */}
            <div className="flex flex-wrap gap-3">
              {["💸 Competitive Pay", "🏠 Remote Options", "🎓 Learning Budget", "🌸 Wellness Perks", "✈️ Team Retreats", "👗 Style Allowance"].map((perk) => (
                <span
                  key={perk}
                  className="bg-white/60 backdrop-blur-sm border border-pink-100 text-gray-600 text-xs font-semibold px-4 py-2 rounded-full"
                >
                  {perk}
                </span>
              ))}
            </div>

            {/* Job cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {openings.map((job, i) => (
                <div key={i} className="relative">
                  <CareerCard job={job} />
                </div>
              ))}
            </div>

            {/* View all CTA */}
            <div className="flex justify-center">
              <button className="flex items-center gap-2 border-2 border-pink-200 text-pink-500 font-semibold px-8 py-3.5 rounded-full text-sm hover:bg-pink-50 hover:border-pink-400 transition-all duration-200">
                View All Openings
                <span>→</span>
              </button>
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              SECTION 3 — NEWSLETTER SUBSCRIBE
          ══════════════════════════════════════════════ */}
          <section className="relative bg-white/50 backdrop-blur-xl border border-pink-100 rounded-[32px] px-8 sm:px-14 py-16 flex flex-col items-center text-center gap-8 shadow-xl shadow-pink-100/40 overflow-hidden">

            {/* Decorative blobs inside */}
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-pink-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-rose-200/30 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-fuchsia-100/20 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center gap-3">
              <span className="text-3xl">💌</span>
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-800 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Subscribe now and get{" "}
                <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent">
                  20% OFF
                </span>
              </h2>
              <p className="text-gray-400 text-sm sm:text-base max-w-xl leading-relaxed">
                Subscribe now and enjoy exclusive savings, special deals, and early access to new collections — straight to your inbox.
              </p>
            </div>

            {/* Perks row */}
            <div className="relative z-10 flex flex-wrap justify-center gap-3">
              {["🎁 Welcome Discount", "⚡ Early Access", "🛍️ Exclusive Deals", "🚫 No Spam"].map((p) => (
                <span
                  key={p}
                  className="bg-pink-50 border border-pink-100 text-pink-500 text-xs font-semibold px-4 py-1.5 rounded-full"
                >
                  {p}
                </span>
              ))}
            </div>

            {/* Input row */}
            <div className="relative z-10 w-full max-w-xl">
              {subscribed ? (
                <div className="bg-gradient-to-r from-pink-100 to-rose-100 border border-pink-200 rounded-2xl px-6 py-4 flex items-center justify-center gap-3">
                  <span className="text-2xl">🎉</span>
                  <p className="text-pink-600 font-semibold text-sm">
                    You're in! Check your inbox for your 20% OFF code.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                    placeholder="Enter Your Email"
                    className="flex-1 bg-white/80 border border-pink-100 rounded-2xl px-5 py-4 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-300 shadow-inner transition"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <button
                    onClick={handleSubscribe}
                    className="bg-gradient-to-r from-pink-400 to-rose-500 text-white font-bold px-8 py-4 rounded-2xl text-sm hover:from-pink-500 hover:to-rose-600 hover:scale-105 active:scale-100 transition-all duration-200 shadow-lg shadow-pink-200 whitespace-nowrap"
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    Subscribe ✨
                  </button>
                </div>
              )}
              <p className="text-gray-400 text-xs mt-3 text-center">
                No spam, ever. Unsubscribe at any time. 🌸
              </p>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
