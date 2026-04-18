import React, { useState, useEffect, useRef } from "react";

// ── Unsplash placeholder images (fashion-themed) ──────────────────────────────
const aboutImage = "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=700&q=80";
const teamImages = [
  "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
  "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
  "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&q=80",
];

// ── Data ──────────────────────────────────────────────────────────────────────
const aboutPoints = [
  {
    number: "01",
    title: "Who We Are",
    desc: "FashNex is a team of passionate stylists and fashion enthusiasts committed to making premium style accessible to everyone — every day.",
    icon: "🌸",
  },
  {
    number: "02",
    title: "What We Do",
    desc: "We curate seasonal collections, offer AI-powered outfit recommendations, and provide a free 2-week style consultation for every member.",
    icon: "✨",
  },
  {
    number: "03",
    title: "How We Help",
    desc: "From lookbooks and styling videos to personal shopping sessions — we guide you at every step of your style journey.",
    icon: "💡",
  },
  {
    number: "04",
    title: "Your Success Story",
    desc: "With expert advice and curated picks, anyone can transform their wardrobe. Thousands of happy customers prove it every season.",
    icon: "🏆",
  },
];

const whyChooseUs = [
  {
    icon: "🎨",
    title: "Expert-Curated Style",
    desc: "Every piece in our collection is hand-picked by certified fashion stylists with 10+ years of industry experience.",
    accent: "from-pink-400 to-rose-400",
  },
  {
    icon: "🤖",
    title: "AI Outfit Engine",
    desc: "Our smart recommendation system learns your taste and suggests outfits tailored to your body type, weather, and mood.",
    accent: "from-rose-400 to-fuchsia-400",
  },
  {
    icon: "🚀",
    title: "Express Delivery",
    desc: "Get your favourite looks delivered in as little as 24 hours. Free shipping on orders above ₹999 — no fine print.",
    accent: "from-fuchsia-400 to-pink-400",
  },
  {
    icon: "♻️",
    title: "Sustainable Fashion",
    desc: "We partner with eco-conscious brands and use recyclable packaging — because great style shouldn't cost the planet.",
    accent: "from-pink-400 to-rose-500",
  },
  {
    icon: "🔄",
    title: "Hassle-Free Returns",
    desc: "Not in love? Return it within 30 days — no questions asked. Your satisfaction is our only policy.",
    accent: "from-rose-400 to-pink-400",
  },
  {
    icon: "💎",
    title: "Exclusive Member Perks",
    desc: "Early access to sales, birthday discounts, and a dedicated stylist on call — all yours when you join FashNex.",
    accent: "from-fuchsia-400 to-rose-400",
  },
];

const stats = [
  { value: "50K+", label: "Happy Customers" },
  { value: "2,400+", label: "Styles Curated" },
  { value: "120+", label: "Designer Brands" },
  { value: "4.9★", label: "Average Rating" },
];

// ── Animated counter hook ─────────────────────────────────────────────────────
function useInView(ref) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);
  return inView;
}

// ── About card component ──────────────────────────────────────────────────────
function AboutCard({ point, index }) {
  return (
    <div
      className="group relative bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-6 hover:shadow-xl hover:shadow-pink-100/60 hover:-translate-y-1.5 transition-all duration-300"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Number badge */}
      <div className="flex items-start justify-between mb-4">
        <span
          className="text-4xl font-black bg-gradient-to-br from-pink-400 to-rose-500 bg-clip-text text-transparent leading-none"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {point.number}
        </span>
        <span className="text-2xl">{point.icon}</span>
      </div>
      <h3
        className="text-gray-800 font-bold text-[17px] mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {point.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {point.desc}
      </p>

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-6 right-6 h-[2px] bg-gradient-to-r from-pink-400 to-rose-400 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}

// ── Why choose us card ────────────────────────────────────────────────────────
function WhyCard({ item, index }) {
  return (
    <div
      className="group relative bg-white/60 backdrop-blur-md border border-pink-100 rounded-3xl p-7 hover:shadow-2xl hover:shadow-pink-100/70 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
    >
      {/* Decorative blob */}
      <div className={`absolute -top-8 -right-8 w-28 h-28 bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-10 rounded-full blur-2xl transition-opacity duration-300`} />

      {/* Icon pill */}
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br ${item.accent} shadow-lg mb-5 text-2xl`}>
        {item.icon}
      </div>

      <h3
        className="text-gray-800 font-bold text-[18px] mb-2.5"
        style={{ fontFamily: "'Playfair Display', serif" }}
      >
        {item.title}
      </h3>
      <p className="text-gray-500 text-sm leading-relaxed"
        style={{ fontFamily: "'DM Sans', sans-serif" }}>
        {item.desc}
      </p>
    </div>
  );
}

// ── Main About page ───────────────────────────────────────────────────────────
export default function About() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600&display=swap');
        * { font-family: 'DM Sans', sans-serif; }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease-out forwards; }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50/60 to-fuchsia-50 relative overflow-hidden">

        {/* ── Ambient blobs ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
          <div className="absolute top-[-100px] left-[-80px] w-[450px] h-[450px] bg-pink-200/30 rounded-full blur-3xl" />
          <div className="absolute top-[40%] right-[-60px] w-[350px] h-[350px] bg-rose-200/25 rounded-full blur-3xl" />
          <div className="absolute bottom-[5%] left-[15%] w-[400px] h-[400px] bg-fuchsia-100/20 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 sm:px-8 lg:px-16 pt-28 pb-20 flex flex-col gap-24">

          {/* ══════════════════════════════════════════════
              SECTION 1 — ABOUT US
          ══════════════════════════════════════════════ */}
          <section className="flex flex-col gap-16">

            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
              <div className="flex flex-col gap-3 max-w-xl fade-up">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-400 bg-pink-100 px-4 py-1.5 rounded-full w-fit">
                  Our Story
                </span>
                <h1
                  className="text-5xl sm:text-6xl font-black text-gray-800 leading-[1.1]"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  About{" "}
                  <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                    Us
                  </span>
                </h1>
                <p className="text-gray-500 text-base leading-relaxed max-w-md">
                  Our passion for exceptional style drives us to curate the finest apparel for every occasion — effortlessly and beautifully.
                </p>
              </div>

              <a
                href="#"
                className="self-start sm:self-auto flex items-center gap-2 bg-gradient-to-r from-pink-400 to-rose-500 text-white px-7 py-3.5 rounded-full font-semibold text-sm shadow-lg shadow-pink-200 hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-300 whitespace-nowrap"
              >
                Learn More
                <span className="text-xs">→</span>
              </a>
            </div>

            {/* Content: cards left, image right */}
            <div className="flex flex-col lg:flex-row gap-10 items-start">

              {/* 2×2 cards grid */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-5">
                {aboutPoints.map((point, i) => (
                  <AboutCard key={i} point={point} index={i} />
                ))}
              </div>

              {/* Right image */}
              <div className="w-full lg:w-[42%] flex-shrink-0 relative">
                {/* Outer glow */}
                <div className="absolute -inset-3 rounded-[36px] bg-gradient-to-br from-pink-200/50 via-rose-100/30 to-fuchsia-200/30 blur-xl pointer-events-none" />

                <div className="relative rounded-[28px] overflow-hidden border border-white/70 shadow-2xl shadow-pink-200/40"
                  style={{ height: "clamp(400px, 55vw, 580px)" }}>
                  <img
                    src={aboutImage}
                    alt="FashNex style"
                    className="w-full h-full object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

                  {/* Floating glass badge — bottom */}
                  <div className="absolute bottom-4 left-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-[10px] uppercase tracking-widest font-semibold">Since 2020</p>
                      <p className="text-white font-bold text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                        Defining Modern Style
                      </p>
                    </div>
                    <span className="text-2xl">🌸</span>
                  </div>

                  {/* Floating pill — top right */}
                  <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border border-white/30 rounded-full px-4 py-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                    <span className="text-white text-xs font-semibold">Trending Now</span>
                  </div>
                </div>
               
              </div>
            </div>

            {/* Stats strip */}
            <div ref={statsRef} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className={`bg-white/60 backdrop-blur-md border border-pink-100 rounded-2xl px-6 py-5 text-center transition-all duration-500 ${statsInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <p
                    className="text-3xl font-black bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    {s.value}
                  </p>
                  <p className="text-gray-500 text-xs mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ══════════════════════════════════════════════
              SECTION 2 — WHY CHOOSE US
          ══════════════════════════════════════════════ */}
          <section className="flex flex-col gap-12">

            {/* Section header */}
            <div className="flex flex-col items-center text-center gap-4 max-w-2xl mx-auto">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-pink-400 bg-pink-100 px-4 py-1.5 rounded-full">
                The FashNex Difference
              </span>
              <h2
                className="text-4xl sm:text-5xl font-black text-gray-800 leading-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Why{" "}
                <span className="bg-gradient-to-r from-pink-400 to-rose-500 bg-clip-text text-transparent italic">
                  Choose
                </span>{" "}
                Us?
              </h2>
              <p className="text-gray-500 text-base leading-relaxed">
                We don't just sell clothes — we deliver confidence. Here's what makes FashNex unlike anything else in fashion.
              </p>
              <div className="flex items-center gap-3">
                <div className="h-[2px] w-16 bg-gradient-to-r from-transparent to-pink-300 rounded-full" />
                <span className="text-pink-300 text-lg">✦</span>
                <div className="h-[2px] w-16 bg-gradient-to-l from-transparent to-pink-300 rounded-full" />
              </div>
            </div>

            {/* 3×2 cards grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyChooseUs.map((item, i) => (
                <WhyCard key={i} item={item} index={i} />
              ))}
            </div>

            {/* Bottom CTA banner */}
            <div className="relative bg-gradient-to-r from-pink-400 via-rose-400 to-fuchsia-400 rounded-3xl p-10 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden shadow-2xl shadow-pink-200">
              {/* Background texture */}
              <div className="absolute inset-0 opacity-10"
                style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />

              <div className="relative z-10 flex flex-col gap-2 text-center sm:text-left">
                <p
                  className="text-white text-3xl font-black leading-tight"
                  style={{ fontFamily: "'Playfair Display', serif" }}
                >
                  Ready to Redefine Your Style?
                </p>
                <p className="text-white/80 text-sm">
                  Join 50,000+ fashion-forward customers already loving FashNex.
                </p>
              </div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-3 flex-shrink-0">
                <a
                  href="/recommend"
                  className="bg-white text-pink-500 font-bold px-7 py-3.5 rounded-full text-sm hover:shadow-xl hover:scale-105 active:scale-100 transition-all duration-200 whitespace-nowrap"
                >
                  ✨ Get Recommendations
                </a>
                <a
                  href="/collection"
                  className="bg-white/20 backdrop-blur-sm border border-white/40 text-white font-semibold px-7 py-3.5 rounded-full text-sm hover:bg-white/30 transition-all duration-200 whitespace-nowrap"
                >
                  Browse Collections →
                </a>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
}
