import React from "react";
import { FaCircle } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";

const slideLabels = [
  "Style Guide",
  "Limited Offer 🔥",
  "Collections",
  "Accessories ✨",
  "Vibe Check 💫",
];

function Hero({ heroData, heroCount, setHeroCount, startAnim }) {
  const navigate = useNavigate();

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap');

        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-text-anim {
          animation: fadeSlideUp 0.55s cubic-bezier(0.22,1,0.36,1) both;
        }
        .hero-text-anim-delay {
          animation: fadeSlideUp 0.55s 0.1s cubic-bezier(0.22,1,0.36,1) both;
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .shimmer-btn {
          background: linear-gradient(90deg, #ff3f6c, #ff7a9e, #ff3f6c);
          background-size: 200% auto;
          animation: shimmer 3s linear infinite;
        }
        @keyframes dotPop {
          0%   { transform: scale(1); }
          50%  { transform: scale(1.35); }
          100% { transform: scale(1); }
        }
        .dot-active { animation: dotPop 0.3s ease; }
      `}</style>

      <div
        className={`w-full max-w-[520px] mx-auto transition-all duration-700 delay-300
          ${startAnim ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[40px]"}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* ── Glassmorphism Card ── */}
        <div className="relative overflow-hidden bg-white/55 backdrop-blur-xl rounded-[28px] border border-white/70 shadow-2xl shadow-pink-200/50 p-7 sm:p-9 md:p-11">

          {/* Ambient blobs */}
          <div className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 bg-pink-300/20 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 bg-rose-200/25 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-fuchsia-200/15 rounded-full blur-2xl" />

          {/* Slide chip label */}
          <div className="relative z-10 inline-flex items-center gap-2 bg-pink-50/80 border border-pink-100 text-pink-500 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-5 tracking-wide">
            <span className="w-1.5 h-1.5 bg-pink-400 rounded-full inline-block animate-pulse" />
            {slideLabels[heroCount]}
          </div>

          {/* Main heading */}
          <h1
            key={`h-${heroCount}`}
            className="hero-text-anim text-2xl sm:text-[28px] md:text-[33px] font-black leading-tight mb-3"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            <span className="bg-gradient-to-br from-[#ff3f6c] via-[#ff6080] to-[#e8315e] bg-clip-text text-transparent">
              {heroData.text1}
            </span>
          </h1>

          {/* Sub text */}
          <p
            key={`p-${heroCount}`}
            className="hero-text-anim-delay text-gray-500 text-sm sm:text-[15px] leading-relaxed"
          >
            {heroData.text2}
          </p>

          {/* CTA — slide 0 only */}
          {heroCount === 0 && (
            <button
              onClick={() => navigate("/recommend")}
              className="shimmer-btn relative z-10 mt-6 text-white px-7 py-3.5 rounded-full cursor-pointer font-bold text-xs sm:text-sm tracking-widest uppercase w-full sm:w-auto shadow-lg shadow-pink-300/50 hover:shadow-xl hover:shadow-pink-400/60 hover:scale-[1.03] active:scale-100 transition-transform duration-200"
            >
              ✨ Get Outfit Recommendations
            </button>
          )}

          {/* Thin divider */}
          <div className="mt-7 mb-5 h-px bg-gradient-to-r from-transparent via-pink-200 to-transparent " />

          {/* Dots row */}
          <div className="flex items-center gap-2.5 cursor-pointer">
            {[0, 1, 2, 3, 4].map((item) => (
              <button
                key={item}
                onClick={() => setHeroCount(item)}
                className="focus:outline-none transition-all duration-200"
                aria-label={`Slide ${item + 1}`}
              >
                {heroCount === item ? (
                  <span className="dot-active block w-7 h-2.5 bg-gradient-to-r from-[#ff3f6c] to-[#ff7a9e] rounded-full shadow shadow-pink-300/60" />
                ) : (
                  <span className="block w-2.5 h-2.5 bg-pink-200 rounded-full hover:bg-pink-300 transition-colors" />
                )}
              </button>
            ))}
            <span className="ml-auto text-[11px] text-gray-400 font-medium tabular-nums">
              {String(heroCount + 1).padStart(2, "0")} / 05
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default Hero;
