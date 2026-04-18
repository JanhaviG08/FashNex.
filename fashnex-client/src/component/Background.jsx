import React from "react";
import back1 from "../assets/header1.jpeg";
import back2 from "../assets/poster.jpg";
import back3 from "../assets/back1.jpeg";
import back4 from "../assets/accessories.jpeg";
import back5 from "../assets/outfit.jpeg";

const images = [back1, back2, back3, back4, back5];

const captions = [
  { label: "New Season",   sub: "SS 2025 Collection" },
  { label: "Flash Sale",   sub: "Ends Tonight"       },
  { label: "Bestsellers",  sub: "Shop the Look"      },
  { label: "Accessories",  sub: "Complete the Fit"   },
  { label: "Vibe Drop",    sub: "Pick Your Aesthetic" },
];

function Background({ heroCount, startAnim }) {
  return (
    <>
      <style>{`
        @keyframes imgFadeIn {
          from { opacity: 0; transform: scale(1.04); }
          to   { opacity: 1; transform: scale(1);    }
        }
        .img-active { animation: imgFadeIn 0.7s cubic-bezier(0.22,1,0.36,1) forwards; }

        @keyframes floatBadge {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-7px); }
        }
        .badge-float { animation: floatBadge 3.2s ease-in-out infinite; }

        @keyframes scanLine {
          0%   { transform: translateY(-100%); }
          100% { transform: translateY(500%);  }
        }
        .scan-line { animation: scanLine 5s linear infinite; }
      `}</style>

      <div
        className={`relative w-full max-w-[640px] mx-auto transition-all duration-1000
          ${startAnim ? "translate-x-0 opacity-100" : "translate-x-[200px] opacity-0"}`}
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        {/* Outer glow */}
        <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-pink-200/40 via-rose-100/20 to-fuchsia-200/30 blur-2xl scale-[1.06] pointer-events-none" />

        {/* ── Main image frame ── */}
        <div className="relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[570px] rounded-[28px] overflow-hidden border border-white/60 shadow-2xl shadow-pink-300/30">

          {images.map((img, index) => (
            <img
              key={index}
              src={img}
              alt={captions[index].label}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700
                ${heroCount === index ? "opacity-100 img-active" : "opacity-0"}`}
            />
          ))}

          {/* Bottom gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent pointer-events-none" />

          {/* Scan shimmer */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.07]">
            <div className="scan-line absolute left-0 right-0 h-20 bg-gradient-to-b from-transparent via-white/50 to-transparent" />
          </div>

          {/* Bottom caption */}
          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 flex items-end justify-between">
            <div>
              <span className="block text-white/60 text-[10px] uppercase tracking-[0.22em] font-semibold mb-1">
                FashNex — {captions[heroCount].sub}
              </span>
              <span
                className="block text-white font-black text-xl sm:text-2xl"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                {captions[heroCount].label}
              </span>
            </div>

            {/* Mini dot indicator */}
            <div className="flex gap-1.5 items-center mb-1">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`rounded-full transition-all duration-300 ${
                    heroCount === i ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/35"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── AI badge (top-right) ── */}
        <div className="badge-float absolute -top-4 -right-2 sm:-right-5 z-20 bg-white/70 backdrop-blur-md border border-pink-100 shadow-xl shadow-pink-200/40 rounded-2xl px-4 py-2.5 flex flex-col items-center">
          <span className="text-[9px] text-pink-400 font-semibold uppercase tracking-widest">Styled by</span>
          <span className="text-gray-800 font-black text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
            AI ✨
          </span>
        </div>

        {/* ── Rating card (bottom-left) ── */}
        <div className="absolute -bottom-4 -left-2 sm:-left-5 z-20 bg-white/70 backdrop-blur-md border border-pink-100 shadow-xl shadow-pink-200/40 rounded-2xl px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-xs font-black shadow-md shadow-pink-300/50">
            4.9
          </div>
          <div>
            <p className="text-gray-800 text-xs font-bold leading-none mb-0.5">Top Rated</p>
            <p className="text-gray-400 text-[10px] font-medium">by 12k+ users</p>
          </div>
        </div>

      </div>
    </>
  );
}

export default Background;
